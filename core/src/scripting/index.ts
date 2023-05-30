import fs from "fs";
import path from "path";

import { Table, createEnv } from "lua-in-js";

import { RC4 } from "../util/rc4";
import { PipelineState, PipelineInit, DataType, GlobalOptions, ArrayConnector } from "../pipeline";
import { overrideOptions } from "../pipeline/options";
import { getSuites, getSuite } from "../stages";
import { println, luascript } from "../util";
import { tf } from "../transform";

interface ScriptedPipeline {
    name: string;
    stages: [string, () => unknown][];
    pendingFlush: boolean;
    source: string;
}

function setupLua() {
    const env = createEnv();
    function sload(script: string) {
        return fs.readFileSync(luascript(script)).toString();
    }
    function sinclude(script: string) {
        env.parse(sload(script)).exec();
    }

    const header = sload("autorun/local");

    function load(script: string) {
        const main = fs.readFileSync(script).toString();
        return `local _PATH="${script}"\n${header}\n${main}`;
    }
    function include(script: string, base: string = null) {
        if (base != null) {
            script = path.resolve(base, "..", script);
        }
        env.parse(load(script)).exec();
    }

    env.loadLib("sys", new Table({
        include, sinclude,
        println
    }));

    return {
        env,
        sload, sinclude,
        load, include
    };
}

export async function executeLuaScript(path: string,
    init: PipelineInit, ...minits: PipelineInit[]) {

    println(4, "initial states:", init, minits);

    var globalopts: GlobalOptions = overrideOptions(init.globalOptions);
    var initseed: string = init.seed;

    function seed(str: string) {
        initseed = str;
    }

    function blank(): PipelineState {
        return {
            globalOptions: Object.assign({}, globalopts),
            buffer: Buffer.alloc(1024 * 1024 * 3), previousBuffer: null,
            type: DataType.Binary, initialType: DataType.Binary,
            iterations: 0,
            history: [],
            rng: new RC4(initseed)
        };
    }

    var pipelines: { [key: string]: () => ArrayConnector | Promise<ArrayConnector> } = {};
    var currentPipeline: ScriptedPipeline;
    function resetPipeline() {
        currentPipeline = {
            name: null,
            stages: [],
            pendingFlush: false,
            source: null
        };
    }
    resetPipeline();

    function from(source: string): void {
        currentPipeline.source = source;
    }

    function push(source: string): void {
        if (source == null) {
            throw new Error("push source must be string");
        }
        currentPipeline.pendingFlush = true;
        currentPipeline.stages.push(["internal.stackpush", async () => {
            if (typeof source !== "string") {
                throw new Error("invalid push");
            }
            if (!(source in pipelines)) {
                throw new Error("attempt to reference undefined pipeline " + source);
            }
            //println(4, source, pipelines[source]);
            return { pipeline: await pipelines[source]() };
        }]);
    }

    function flush() {
        if (currentPipeline.pendingFlush) {
            currentPipeline.stages.push(["internal.stackflush", null]);
            currentPipeline.pendingFlush = false;
        }
    }

    function seal() {
        currentPipeline.stages.push(["util.seal", null]);
    }

    function start(name: string): void {
        if (currentPipeline.name != null)
            throw new Error("attempt to begin new pipeline before terminating old one!");
        if (typeof name !== "string")
            throw new Error("pipeline name must be string");
        currentPipeline.name = name;
        println(4, "pipeline compile beginning", name);
    }

    function stop(): void {
        const pipeline = currentPipeline;
        if (pipeline.name == null)
            throw new Error("attempt to terminate an unnamed pipeline?");
        flush();
        println(4, "pipeline compile ending", pipeline);
        pipelines[pipeline.name] = async () => {
            println(4, "setting up pipeline", pipeline.name);
            var result: PipelineState;
            if (pipeline.source != null) {
                if (!(pipeline.source in pipelines)) {
                    throw new Error("attempt to reference undefined pipeline " + pipeline.source);
                }
                result = await (await pipelines[pipeline.source]()).iterateToEnd();
            }
            else { result = blank(); }
            println(4, pipeline.stages, globalopts);
            const connector = new ArrayConnector(
                {
                    globalOptions: Object.assign({}, globalopts),
                    seed: initseed,
                    buffer: result.buffer, type: result.type
                },
                await Promise.all<any>(pipeline.stages.map(async x => {
                    const [addr, ctor] = x;
                    var args = null;
                    if (ctor != null) {
                        args = await ctor();
                    }
                    return [addr, args];
                }))
            );
            pipelines[pipeline.name] = () => connector;
            return connector;
        };
        resetPipeline();
    }

    // generate stage functions
    const stage: { [key: string]: Table } = {};
    for (const suite of getSuites()) {
        const obj: { [key: string]: (args: any) => void } = {};
        const stages = getSuite(suite);
        for (const name in stages) {
            obj[name] = (oargs: Table = new Table()) => {
                const rargs: Record<string, any> = oargs.toObject();
                println(4, "push", name, rargs);
                currentPipeline.stages.push([suite + "." + name, () => rargs]);
                // automatically seal type if the pipeline is empty and there's no source
                if (currentPipeline.stages.length === 1 && currentPipeline.source == null) {
                    seal();
                }
                flush();
            };
        }
        stage[suite] = new Table(obj);
    }

    const lua = setupLua();
    const env = lua.env;

    env.loadLib("cherenkov", new Table({
        start, stop, from, push, seed,
        options: new Table(globalopts)
    }));
    env.loadLib("stage", new Table(stage));

    lua.sinclude("autorun/global");
    lua.include(path);
    lua.sinclude("job/post");

    const overrides = {
        seed: initseed,
        globalOptions: Object.assign({}, globalopts)
    };
    const pinit = new ArrayConnector(Object.assign({}, init, overrides), []);
    pipelines["@input"] = () => pinit;
    for (var i = 0; i < minits.length; i++) {
        const minit = minits[i];
        const pminit = new ArrayConnector(Object.assign({}, minit, overrides), []);
        pipelines["@input" + (i + 2)] = () => pminit;
    }

    const output = pipelines["@output"];
    if (output == null)
        throw new Error("no output pipeline!");
    const finalstate = await (await output()).iterateToEnd();
    println(4, "final normalized state:", finalstate);
    return finalstate;

}
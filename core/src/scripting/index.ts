import fs from "fs";
import path from "path";

import { Table, createEnv } from "lua-in-js";

import { RC4 } from "../util/rc4";
import { PipelineState, PipelineInit, DataType, GlobalOptions, ArrayConnector, BaseConnector, PipelineStage } from "../pipeline";
import { overrideOptions } from "../pipeline/options";
import { getSuites, getSuite } from "../stages";
import { println, luascript, hashObject } from "../util";

import { Cache } from "./cache";

interface ScriptedPipeline {
    name: string;
    stages: (PipelineStage<unknown> | [string, () => unknown])[];
    pendingFlush: boolean;
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

export async function executeLuaScript(path: string, cached: boolean,
    init: PipelineInit, ...minits: PipelineInit[]) {

    const cache = cached ? new Cache(path + ".cache") : null;
    if (cached) {
        await cache.init();
    }

    println(4, "initial states:", init, minits);

    var globalopts: GlobalOptions = overrideOptions(init.globalOptions);
    var initseed: string = init.seed;

    if (initseed == null) {
        initseed = RC4.genSeed();
        println(0, `seed: ${initseed}`);
    }

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

    var pipelines: { [key: string]: () => BaseConnector | Promise<BaseConnector> } = {};
    var resolved: { [key: string]: BaseConnector } = {};
    var currentPipeline: ScriptedPipeline;
    function resetPipeline() {
        currentPipeline = {
            name: null,
            stages: [],
            pendingFlush: false
        };
    }
    resetPipeline();

    async function get(name: string): Promise<BaseConnector> {
        if (name in resolved) {
            return resolved[name];
        }
        if (!(name in pipelines)) {
            throw new Error("attempt to reference undefined pipeline " + name);
        }
        const pipeline = await pipelines[name]();
        resolved[name] = pipeline;
        return pipeline;
    }

    function from(source: string): void {
        if (source == null) {
            throw new Error("from source must be string");
        }
        currentPipeline.stages.push({
            id: "from",
            suite: "internal",
            type: DataType.Any,
            init: (state, args) => args,
            run: async (state: PipelineState) => {
                const src = await get(source);
                const nstate = await src.iterateToEnd();
                Object.assign(state, nstate);
            }
        });
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
            return { pipeline: await get(source) };
        }]);
    }

    function free(source: string): void {
        if (source == null) {
            throw new Error("push source must be string");
        }
        currentPipeline.stages.push({
            id: "free",
            suite: "internal",
            type: DataType.Any,
            init: (state, args) => args,
            run: async (state: PipelineState) => {
                delete pipelines[source];
                delete resolved[source];
            }
        });
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

    // terrible workaround for format inconsistency bugs
    function bounce() {
        currentPipeline.stages.push({
            id: "bounce",
            suite: "internal",
            type: DataType.Binary,
            init: (state, args) => args,
            run: async () => { }
        });
    }

    var yields = 0;
    function _yield(type: DataType) {
        currentPipeline.stages.push({
            id: "yield",
            suite: "internal",
            type,
            init: (state, args) => args,
            run: async (state: PipelineState) => {
                //console.debug(state);
                fs.writeFileSync(path + (yields++).toString().padStart(8, "0"), state.buffer);
            }
        });
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
        const seed = initseed;
        pipelines[pipeline.name] = async () => {
            println(4, "setting up pipeline", pipeline.name);
            var result: PipelineState;
            result = blank();
            println(4, pipeline.stages, globalopts);
            const init: PipelineInit = {
                globalOptions: Object.assign({}, globalopts),
                seed,
                buffer: result.buffer, type: result.type
            };
            const sequence: [string, unknown?][] = await Promise.all<any>(
                pipeline.stages.map(async x => {
                    if (!Array.isArray(x)) { return x; }
                    const [addr, ctor] = x;
                    var args = null;
                    if (ctor != null) {
                        args = await ctor();
                    }
                    return [addr, args];
                })
            );
            // generate unique hash dependent on seed, parent pipelines, etc
            println(4, "initializing ArrayConnector", init);
            const connector = pipeline.name !== "@output" && cached
                ? await cache.loadOrInit(pipeline.name, hashObject(init, sequence), init, sequence)
                : new ArrayConnector(init, sequence);
            println(4, "connector:", connector);
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
                if (currentPipeline.stages.length === 1) {
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
        start, stop, from, push, flush, seed, seal, bounce, yield: _yield, free,
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
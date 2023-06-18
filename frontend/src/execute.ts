import fs from "fs";
import { promisify } from "util";

import {
    PipelineInit,
    DataType,
    overrideOptions,
    PipelineState,
    PipelineStage,
    GlobalOptions,
    println,
    executeLuaScript
} from "@cherenkov/core";

import { ProgramConfig } from "./config";
import { assembleConnector } from "./connector";
import { presets } from "./presets";
import { ConfigDataType, types } from "./maps";

export async function runConfig(config: Partial<ProgramConfig>) {
    // read source file
    if (config.input == null) throw new Error("need input filename");
    const buffer = await promisify(fs.readFile)(config.input);

    // setup globalOptions (BaseConnector already does this, but we'd like to have access to it sooner)
    println(3, config.options)
    const oldopts = config.options;
    var globalOptions = overrideOptions(config.options);

    // apply preset
    // we do this after reading the source file because no preset has (or should have) an input path
    if (config.preset != null) {
        if (!(config.preset in presets)) throw new Error("nonexistent preset " + config.preset);
        Object.assign(config, presets[config.preset]);
    }

    if (config.options !== oldopts) {
        println(3, "integrating globalOptions");
        Object.assign(config.options, oldopts);
        globalOptions = overrideOptions(config.options);
    }

    // get the data type
    var type: DataType;
    if (config.type in types) type = types[config.type];
    else if (config.input.endsWith(".json")) type = DataType.Manifest;
    else type = DataType.Binary;

    // we now have enough data to setup and run the connector, let's do it!
    const init: PipelineInit = {
        globalOptions,
        buffer,
        type,
        seed: config.seed,
        midstage: {
            pre: config.prestages,
            post: config.poststages
        }
    };
    var finalState: PipelineState;

    // are we running a lua script?
    if (config.luascript != null) {
        var rinits: PipelineInit[] = [init];
        // if this is a json init manifest, parse it
        if (type === DataType.Manifest) {
            const manifest: {
                globalOptions?: Partial<GlobalOptions>;
                filename: string;
                type?: ConfigDataType;
                seed?: string;
            }[] = JSON.parse(buffer.toString());
            rinits = manifest.map(x => ({
                globalOptions: Object.assign({}, globalOptions, x.globalOptions),
                buffer: fs.readFileSync(x.filename),
                type: types[x.type] || DataType.Binary,
                seed: x.seed
            }));
            //println(3, rinits);
        }
        const rinit = rinits.shift();
        finalState = await executeLuaScript(config.luascript, config.cached,
            rinit, ...rinits);
    }
    else {
        const executor = assembleConnector(init, config.stages);
        finalState = await executor();
    }

    println(4, "final state:", finalState);

    // write output file back to disk
    if (config.output == null) throw new Error("need output filename");
    await promisify(fs.writeFile)(config.output, finalState.buffer);
}
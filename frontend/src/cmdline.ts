import { existsSync } from "fs";

import { program, InvalidOptionArgumentError } from "commander";

import { GlobalOptions, getLogLevel, setLogLevel, PipelineStage, getStageById } from "@cherenkov/core";

import { ProgramConfig } from "./config";
import { ConfigDataType, types } from "./maps";
import { ConfigPreset, presets } from "./presets";
import { runConfig } from "./execute";

function validate<T extends string>(key: string, obj: Record<T, unknown>): T {
    if (!(key in obj)) throw new InvalidOptionArgumentError("Must be one of " + Object.keys(obj).join(", "));
    return key as T;
}

function validateStage(key: string): PipelineStage<unknown> {
    try {
        return getStageById(key);
    }
    catch (ex) {
        throw new InvalidOptionArgumentError(ex);
    }
}

export async function runCmdline(args: string[]): Promise<void> {
    program
        .name("cherenkov")
        .helpOption("-h|--help", "display help")
        .requiredOption("-i|--input <file>", "input file", v => {
            if (!existsSync(v)) throw new InvalidOptionArgumentError("input file does not exist");
            return v;
        })
        .requiredOption("-o|--output <file>", "output file")
        .option<ConfigDataType>("-t|--type <type>", "file type", v => validate(v, types))
        .option("-s|--seed <seed>", "rng seed")
        .option<Partial<GlobalOptions>>("-O|--option <key=value>", "additional flags", (v, p) => {
            if (p == null) p = {};
            const [key, value] = v.split("=");
            if (typeof key !== "string" || typeof value !== "string") throw new InvalidOptionArgumentError("malformed option pair");
            p[key] = parseInt(value, 10);
            if (isNaN(p[key])) p[key] = value;// throw new InvalidOptionArgumentError("value is not a number");
            //console.log(p)
            return p;
        })
        .option<ConfigPreset>("-p|--preset <name>", "preset to use", v => validate(v, presets))
        .option<PipelineStage<unknown>[]>("-P|--prestage <name>", "add a prestage", (v, p) => {
            if (p == null) p = [];
            const stage = p.push(validateStage(v));
            return p;
        })
        .option<PipelineStage<unknown>[]>("-S|--poststage <name>", "add a poststage", (v, p) => {
            if (p == null) p = [];
            const stage = p.push(validateStage(v));
            return p;
        })
        .option("-l|--script <script>", "use a lua script", v => {
            if (!existsSync(v)) throw new InvalidOptionArgumentError("script does not exist");
            return v;
        })
        .option("-c|--cache", "use pipeline result cache")
        .option("-v", "increase verbosity", () => setLogLevel(getLogLevel() + 1))

    const opts = program.parse(args).opts();

    const config: Partial<ProgramConfig> = {
        input: opts.input,
        output: opts.output,
        type: opts.type,
        seed: opts.seed,
        preset: opts.preset,
        prestages: opts.prestage,
        poststages: opts.poststage,
        options: opts.option,
        luascript: opts.script,
        cached: opts.cache
    };

    await runConfig(config);
}
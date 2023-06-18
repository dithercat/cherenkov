import { GlobalOptions, PipelineStage } from "@cherenkov/core";

import { StageConfig } from "./connector";
import { ConfigPreset } from "./presets";
import { ConfigDataType } from "./maps";

export interface ProgramConfig {
    input: string;
    output: string;
    type?: ConfigDataType;
    seed?: string;
    options?: Partial<GlobalOptions>;
    preset?: ConfigPreset;
    prestages?: PipelineStage<unknown>[];
    poststages?: PipelineStage<unknown>[];
    stages: StageConfig;
    luascript?: string;
    cached?: boolean;
}
import { RC4 } from "../util/rc4";

import { GlobalOptions } from "./options";

export enum DataType {
    Any = -1,
    Binary, Audio, Image, Text,
    Manifest = -2
}

export interface PipelineInit {
    globalOptions?: Partial<GlobalOptions>;
    buffer: Buffer;
    type?: DataType;
    seed?: string;
    midstage?: {
        pre?: PipelineStage<unknown>[];
        post?: PipelineStage<unknown>[];
    }
}

export interface PipelineState {
    // configuration options
    globalOptions: GlobalOptions;
    // current data
    buffer: Buffer;
    // last buffer
    previousBuffer: Buffer;
    // datatype currently held in buffer
    type: DataType;
    // the initial data type
    initialType: DataType;
    // the number of times iterate() has been called
    iterations: number;
    // pipeline history
    history: PipelineStage<unknown>[];
    // rng state
    rng: RC4;
}

export interface PipelineStage<T> {
    // optional metadata, filled in by registry
    id?: string;
    suite?: string;
    // datatype accepted/produced by this stage
    type: DataType;
    // function to initialize the stage and get args
    // args is always partial to keep the typechecker from fucking me (and should be checked anyway!)
    // stage registry seals the overrides argument during takeup
    init?: (state: PipelineState, overrides: Partial<T>) => Partial<T>;
    // function to actually process the state
    run: (state: PipelineState, args: Partial<T>) => void | Promise<void>;
}

export function isPipelineState(obj: any): obj is PipelineState {
    if (typeof obj !== "object") return false;
    if (typeof obj.globalOptions !== "object") return false;
    if (!Buffer.isBuffer(obj.buffer)) return false;
    if (typeof obj.type !== "number") return false;
    return true; // good enough
}

export * from "./connectors"
export * from "./options";
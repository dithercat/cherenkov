import { println } from "..";

export interface GlobalOptions {
    [key: string]: any;

    generations: number;

    width: number;
    height: number;
    channels: number;

    data_rate: number;
    data_format: string;

    ffmpeg_gain: number;

    carnage: number;
    max_skip: number;

    jackpot: { [key: string]: boolean; };
}

const defaultOptions: GlobalOptions = {
    generations: 8,

    // dimensions
    width: 1024,
    height: 1024,
    channels: 1,

    data_rate: 48,
    data_format: "u32le",

    ffmpeg_gain: 1.00,

    carnage: 1.0,
    max_skip: 5,

    // cheats
    jackpot: {}
};

export function overrideOptions(options: Partial<GlobalOptions>): GlobalOptions {
    const opts = Object.assign({}, defaultOptions);
    println(3, "option override", options);
    Object.assign(opts, options);
    return opts;
}
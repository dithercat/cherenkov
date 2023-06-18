import { registerStage } from ".";
import { DataType, PipelineState } from "../pipeline";
import { ffaudio } from "../util/ffmpeg";

export interface AudioFilterArguments {
    options: any;
}

function audiofilterstage(suite: string, filter: string, rules?: Partial<AudioFilterArguments>) {
    registerStage(suite, filter, {
        type: DataType.Audio,
        init(state: PipelineState, overrides?: Partial<AudioFilterArguments>) {
            const args: Partial<AudioFilterArguments> = {};
            if (rules != null) Object.assign(args, rules);
            if (overrides != null) Object.assign(args, overrides);
            return args;
        },
        async run(state: PipelineState, args: AudioFilterArguments) {
            const { options } = args;
            // run filter
            state.buffer = await ffaudio(state.buffer, cfg => cfg
                .outputFormat("wav")
                .audioFilter([{ filter, options }]));
        }
    });
}

[
    "acompressor",
    "acontrast",
    "acrusher",
    "adeclick",
    "adeclip",
    "adenorm",
    "aecho",
    "aemphasis",
    "aexciter",
    "afreqshift",
    "agate",
    "alimiter",
    "allpass",
    "anlmdn",
    "anlms",
    "aphaser",
    "aphaseshift",
    "apulsator",
    "arnndn",
    "asoftclip",
    "asubboost",
    "asubcut",
    "asupercut",
    "asuperpass",
    "asuperstop",
    "atempo",
    "bandpass",
    "bandreject",
    "bass",
    "biquad",
    "chorus",
    "compand",
    "crystalizer",
    "dcshift",
    "deesser",
    "dynaudnorm",
    "earwax",
    "equalizer",
    "extrastereo",
    "firequalizer",
    "flanger",
    "haas",
    "highpass",
    "highshelf",
    "loudnorm",
    "lowpass",
    "lowshelf",
    "mcompand",
    "pan",
    "rubberband",
    "sidechaincompress",
    "sidechaingate",
    "silenceremove",
    "speechnorm",
    "stereowiden",
    "superequalizer",
    "treble",
    "tremolo",
    "vibrato"
].map(x => audiofilterstage("afilter", x));
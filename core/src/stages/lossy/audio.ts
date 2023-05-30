import { roll, Bounds, isBounds, println, accumulativeAlign } from "../../util";
import { ffaudio, canUseEncoder } from "../../util/ffmpeg";
import { PipelineState, DataType } from "../../pipeline";
import { bin2wav, wav2bin } from "../../transform/wav";

import { registerStage } from "..";

const LIST_KNOCK = 69;

export interface AudioArguments {
    bitrate?: number | Bounds | [69, ...number[]];
    quality?: number | Bounds;
    samplerate?: number | number[];
    channels?: number;
}

function audiostage(suite: string, container: string, encoder: string, rules?: Partial<AudioArguments>, temp = false) {
    registerStage(suite, encoder, {
        type: DataType.Audio,
        init(state: PipelineState, overrides?: Partial<AudioArguments>) {
            const composite: Partial<AudioArguments> = {
                bitrate: [64, 128, 16],
                quality: null,
                samplerate: 48
            };
            if (rules != null) Object.assign(composite, rules);
            if (overrides != null) Object.assign(composite, overrides);

            if (Array.isArray(composite.bitrate)) {
                if (composite.bitrate[0] === LIST_KNOCK) // knock knock
                    composite.bitrate = composite.bitrate[roll(state, 1, composite.bitrate.length - 1)];
                else if (isBounds(composite.bitrate))
                    composite.bitrate = roll(state, composite.bitrate);
                else throw new Error("eh ????? nonsense bitrate argument");
            }
            if (isBounds(composite.quality))
                composite.quality = roll(state, composite.quality);
            if (typeof composite.channels !== "number")
                composite.channels = state.globalOptions.channels;
            if (Array.isArray(composite.samplerate)) {
                //if (state.initialType !== DataType.Audio)
                composite.samplerate = state.globalOptions.data_rate;// * composite.channels;
                //else composite.samplerate = composite.samplerate[roll(state, 0, composite.samplerate.length - 1)];
            }

            return composite;
        },
        async run(state: PipelineState, args: Partial<AudioArguments>) {
            if (!await canUseEncoder(encoder)) {
                println(0, "encoder " + encoder + " is not available, doing nothing for this stage :(");
                return;
            }

            const rate = args.bitrate;
            const quality = args.quality;
            const khz = args.samplerate;

            if (
                (rate != null && typeof rate !== "number") ||
                (quality != null && typeof quality !== "number") ||
                (khz != null && typeof khz !== "number")
            ) throw new Error("audiostage runner: something is still not a number?!?!");

            // convert to new codec
            var newbuff = await ffaudio(state.buffer, cfg => {
                cfg = cfg
                    .outputFormat(container)
                    .audioCodec(encoder)
                    .audioChannels(Math.min(args.channels, state.globalOptions.channels))
                    .outputOption("-fflags", "+bitexact")
                    .outputOption("-flags:a", "+bitexact")
                    .audioFilter("volume=" + state.globalOptions.ffmpeg_gain);
                if (typeof rate === "number") cfg = cfg
                    .audioBitrate(rate + "k")
                    .outputOption("-minrate", rate + "k")
                    .outputOption("-maxrate", rate + "k")
                    .outputOption("-bufsize", rate + "k");
                if (typeof quality === "number") cfg = cfg.audioQuality(quality);
                if (typeof khz === "number") cfg = cfg.audioFrequency(khz * 1000);
                return cfg;
            }, temp);

            // if the result is a wav, just return it
            if (container === "wav") {
                state.buffer = newbuff;
                return;
            }

            // convert back to wav
            //newbuff = await ffaudio(newbuff, cmd => cmd.outputFormat("wav"), false, temp);
            const oldbuff = await wav2bin(state.buffer, state.globalOptions);
            newbuff = await wav2bin(newbuff, state.globalOptions, true);

            // accumulative align if necessary
            if (newbuff.length !== oldbuff.length) newbuff = accumulativeAlign(oldbuff, newbuff);

            state.buffer = await bin2wav(newbuff, state.globalOptions)
        }
    });
}

var suite = "audio";
audiostage(suite, "mp3", "libmp3lame", { bitrate: [64, 160, 8], samplerate: [24, 32, 48] });
audiostage(suite, "mp4", "aac", { bitrate: [64, 128, 8], samplerate: [24, 32, 48] }, true);
audiostage(suite, "ogg", "libvorbis", { bitrate: null, quality: [1, 9], samplerate: 48 });
audiostage(suite, "ogg", "libopus", { bitrate: [24, 128, 8], samplerate: [24, 32, 48] });
audiostage(suite, "asf", "wmav1", { bitrate: [32, 128, 8], samplerate: [32, 48] });
audiostage(suite, "asf", "wmav2", { bitrate: [24, 128, 8], samplerate: [32, 48] });

suite = "audio-extended";
audiostage(suite, "mp2", "mp2", { bitrate: [32, 128, 8], samplerate: [24, 32, 48] });

suite = "voice";
audiostage(suite, "amr", "libopencore_amrnb", { bitrate: [LIST_KNOCK, 1.8, 4.75, 5.15, 5.9, 6.7, 7.4, 7.95], samplerate: 8, channels: 1 });
//registerStage(suite, "amr-wb", audiostage("amr", "libvo_amrwbenc", { bitrate: [LIST_KNOCK, 1.8, 4.75, 5.15, 5.9, 6.7, 7.4, 7.95, 10.2, 12.2], samplerate: 8 }, true));
audiostage(suite, "wav", "libgsm_ms", { bitrate: 13, samplerate: 8, channels: 1 });
audiostage(suite, "flv", "nellymoser", { bitrate: null, samplerate: [5, 8, 11, 22, 44], channels: 1 }, true);
audiostage(suite, "ogg", "libspeex", { bitrate: [8, 32, 8], samplerate: null, channels: 1 });
audiostage(suite, "rm", "real_144", { bitrate: null, samplerate: null, channels: 1 });

// predictable wav formats
audiostage("util", "wav", "pcm_u8", { samplerate: 48, channels: 1 });
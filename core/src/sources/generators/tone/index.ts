import { DataType, GlobalOptions } from "../../../pipeline";
import { registerStage } from "../../../stages";
import { bin2wav } from "../../../transform/wav";
import { tone } from "../../../util";

import { dtmf } from "./dtmf";
import { mf } from "./mf";

function towav(pcm: Buffer): Promise<Buffer> {
    return bin2wav(pcm, {
        channels: 1,
        data_rate: 48,
        data_format: "s32le"
    } as GlobalOptions);
}

registerStage("source", "tone", {
    type: DataType.Audio,
    init(state, overrides: Partial<{ length: number, frequency: number, gain: number }>) {
        if (overrides.length == null) overrides.length = 1;
        if (overrides.frequency == null) overrides.frequency = 440;
        if (overrides.gain == null) overrides.gain = 0.75;
        return overrides;
    },
    async run(state, args) {
        state.buffer = await towav(tone(args.length, args.frequency));
    }
});

function phonestage(name: string, func: (string) => number[]) {
    registerStage("text", name, {
        type: DataType.Text,
        init(state, overrides: Partial<{ digit: number, space: number }>) {
            if (overrides.digit == null) overrides.digit = 55;
            if (overrides.space == null) overrides.space = 55;
            return overrides;
        },
        async run(state, args) {
            const string = state.buffer.toString("utf-8");
            const chunks: Buffer[] = [];
            for (const key of string) {
                const pair = func(key);
                if (pair.length === 0) continue;
                chunks.push(tone(args.digit / 1000, ...pair));
                chunks.push(tone(args.space / 1000));
            }
            state.buffer = await towav(Buffer.concat(chunks));
            state.type = DataType.Audio;
            state.initialType = DataType.Audio;
        }
    });
}
phonestage("dtmf", dtmf);
phonestage("mf", mf);
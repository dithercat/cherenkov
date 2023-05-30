import fs from "fs";
import path from "path";

import { resource } from "../../util";
import { DataType, GlobalOptions } from "../../pipeline";
import { registerStage } from "../../stages";
import { bin2wav, wav2bin } from "../../transform/wav";

export type DSCSVoice = "pa" | "gpws" | "sns";

export interface DSCSParameters {
    voice: DSCSVoice;
}

const cacheopts = {
    channels: 1,
    data_rate: 48,
    data_format: "u32le"
} as GlobalOptions;

const wordcache: Record<DSCSVoice, { [key: string]: () => Promise<Buffer> }> = {
    pa: {},
    gpws: {},
    sns: {}
};

function init(voice: DSCSVoice) {
    const root = resource("tts/domain/" + voice);
    const files = fs.readdirSync(root);
    for (const word of files) (() => {
        var buffer: Buffer = null;
        wordcache[voice][word.toLowerCase().split(".")[0]] = async () => {
            if (buffer == null) {
                buffer = fs.readFileSync(path.resolve(root, word));
                buffer = await wav2bin(buffer, cacheopts);
            }
            return buffer;
        };
    })();
}
init("pa");
init("gpws");
init("sns");

async function getword(voice: DSCSVoice, word: string): Promise<Buffer> {
    // we want words to be lowercase always
    word = word.toLowerCase();

    // check if it's a valid voice, and get the cache for the voice
    if (!(voice in wordcache)) throw new Error("invalid voice " + voice);
    const cache = wordcache[voice];

    // if the word isnt in the cache, return an empty buffer
    if (!(word in cache)) return Buffer.alloc(0);

    // otherwise, return the buffer for the word
    return await cache[word]();
}

/*registerStage("tts", "dscs_word", {
    type: DataType.Text,
    init(state, overrides: Partial<DSCSParameters>) {
        if (overrides.voice == null) overrides.voice = "pa";
        return overrides;
    },
    async run(state, args) {
        const word = state.buffer.toString("utf-8");
        const pcm = await getword(args.voice, word);
        state.buffer = await bin2wav(pcm, cacheopts, cacheformat);
        state.type = DataType.Audio;
        state.initialType = DataType.Audio;
    }
});*/

registerStage("tts", "dscs", {
    type: DataType.Text,
    init(state, overrides: Partial<DSCSParameters>) {
        if (overrides.voice == null) overrides.voice = "pa";
        return overrides;
    },
    async run(state, args) {
        const words = state.buffer.toString("utf-8").split(" ");
        const pcms: Buffer[] = [];
        for (const word of words) {
                // command prefix
                if (word[0] === "@") {
                    const cargs = word.substr(1).toLowerCase().split(":");
                    switch (cargs[0]) {
                        case "pau":
                            pcms.push(Buffer.alloc(4 * cacheopts.data_rate * +cargs[1]));
                            continue;
                        case "v":
                            const voice = cargs[1].toLowerCase();
                            if (voice in wordcache) args.voice = voice as DSCSVoice;
                            continue;
                        default: continue;
                    }
                }
                else pcms.push(await getword(args.voice, word));
        }
        state.buffer = await bin2wav(Buffer.concat(pcms), cacheopts);
        state.type = DataType.Audio;
        state.initialType = DataType.Audio;
    }
});
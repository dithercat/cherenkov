import fs from "fs";

import tempfile from "tempfile";

import { winerun } from "../../util";
import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";

registerStage("tts", "dectalk", {
    type: DataType.Text,
    init(state, overrides: Partial<any>) {
        // TODO: allow tweaking stuff
        return overrides;
    },
    async run(state, args) {
        const phrase = state.buffer.toString("utf-8");
        const output = tempfile(".wav");
        winerun("tts/dectalk/say.exe", "-w", "Z:" + output, phrase);
        const wav = fs.readFileSync(output);
        state.buffer = wav;
        state.type = DataType.Audio;
        state.initialType = DataType.Audio;
    }
});
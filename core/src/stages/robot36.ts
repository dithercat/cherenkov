import fs from "fs";

import tempfile from "tempfile";

import { convert } from "../util/imagemagick";
import { robot36encode, robot36decode } from "../util/robot36";
import { DataType } from "../pipeline";

import { registerStage } from ".";

registerStage("sstv", "encode", {
    type: DataType.Image,
    async run(state, args) {
        const ppm = await convert({
            srcData: state.buffer,
            format: "ppm"
        });

        // i spent hours trying to do this in a less ugly way
        // it's not worth it. if you dont like it, fix it yourself.

        const tin = tempfile(".ppm");
        const tout = tempfile(".wav");

        fs.writeFileSync(tin, ppm);
        await robot36encode(tin, tout);
        state.buffer = fs.readFileSync(tout);

        // thunk to audio
        state.type = DataType.Audio;
        state.initialType = DataType.Audio;
    }
});

registerStage("sstv", "decode", {
    type: DataType.Audio,
    async run(state, args) {
        const tin = tempfile(".wav");
        const tout = tempfile(".ppm");

        //console.log(state.globalOptions)
        fs.writeFileSync(tin, state.buffer);
        await robot36decode(tin, tout, state.globalOptions.width, state.globalOptions.height);
        const ppm = fs.readFileSync(tout);
        state.buffer = await convert({
            srcData: ppm,
            format: "bmp",
            type: "truecolor",
            depth: 24
        });

        // thunk to image
        state.type = DataType.Image;
        state.initialType = DataType.Image;
    }
});
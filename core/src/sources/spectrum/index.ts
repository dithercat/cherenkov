// just loads a random file from resources/spectrum

import { readFileSync } from "fs";
import { resolve } from "path";

import { loadImage } from "canvas";

import { roll, canvasDo, resource } from "../../util";
import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";

import files from "./files.json";

const MAX_SPECTRUM = files.length;

registerStage("source", "spectrum", {
    type: DataType.Image,
    init(state, overrides: Partial<{ index: number; }>) {
        var index = roll(state, 0, MAX_SPECTRUM);
        if (typeof overrides.index === "number" && overrides.index >= 0 && overrides.index < MAX_SPECTRUM)
            index = overrides.index;
        return { index };
    },
    run(state, args) {
        return canvasDo(state, async ctx => {
            const spectrum = readFileSync(resolve(resource("spectrum"), files[args.index]));
            const img = await loadImage(spectrum);
            ctx.drawImage(img, 0, 0, state.globalOptions.width, state.globalOptions.height);
        });
    }
});
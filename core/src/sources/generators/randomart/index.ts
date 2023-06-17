import { createCanvas, createImageData } from "canvas";

import { roll, toBmp } from "../../../util";
import { PipelineState, DataType, isPipelineState } from "../../../pipeline";
import { registerStage } from "../../../stages";

import { main } from "./engine";

export interface RandomArtArguments {
    width: number;
    height: number;
    source: string | PipelineState[];
    substates?: PipelineState[];
}

registerStage("source", "randomart", {
    type: DataType.Text,
    init(state, overrides: Partial<RandomArtArguments>) {
        var fallback = "";
        for (var i = 0; i < 16 + 1; i++) {
            if (i == 8) fallback += " ";
            else fallback += String.fromCharCode(roll(state, 0x61, 0x7A));
        }
        return Object.assign({
            width: 256,
            height: 256,
            source: overrides.substates || fallback
        }, overrides);
    },
    async run(state, args) {
        const w = args.width;
        const h = args.height;
        if (state.initialType === DataType.Text) {
            args.source = state.buffer.toString();
        }

        const bytes = await main(args.source, w, h);

        const data = createImageData(bytes, w, h);
        const canvas = createCanvas(w, h);
        const ctx = canvas.getContext("2d");
        ctx.putImageData(data, 0, 0);
        state.buffer = await toBmp(canvas);
        state.initialType = DataType.Image;
        state.type = DataType.Image;
    }
});
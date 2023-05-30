import { Canvas, CanvasRenderingContext2D, createCanvas, Image, loadImage } from "canvas";

import { PipelineState } from "../pipeline";

import { convert } from "./imagemagick";
import { println } from "./log";

export type CanvasAction = (ctx: CanvasRenderingContext2D, image: Image, canvas: Canvas) => void | Promise<void>;

export async function canvasDo(state: PipelineState, action: CanvasAction, tryload: boolean = true) {
    const canvas = createCanvas(state.globalOptions.width, state.globalOptions.height);
    const ctx = canvas.getContext("2d");
    var img: Image;
    if (tryload) {
        try {
            img = await loadImage(state.buffer)
        }
        catch (e) { }
    }
    await action(ctx, img, canvas);

    //println(3, "canvasDo: beginning export");

    // dont bother with compression, we're going back to bmp anyway
    state.buffer = canvas.toBuffer("image/png", { compressionLevel: 0 });
    
    // convert to bmp for later stages
    state.buffer = await convert({
        srcData: state.buffer,
        format: "bmp",
        type: "truecolor",
        depth: 24
    });

    //println(3, "canvasDo: export finished");
}

export async function toBmp(canvas: Canvas): Promise<Buffer> {
    const buff = canvas.toBuffer("image/png", { compressionLevel: 0 });
    return await convert({
        srcData: buff,
        format: "bmp",
        type: "truecolor",
        depth: 24
    });
}
import { roll, canvasDo } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "../../stages";

export interface PlasmaArguments {
    zoom: number; // 35 - 150
    hueOffset: number; // 0 - 360
    ox: number; // -10 - 10
    oy: number; // -10 - 10
}

function sin(n: number): number {
    return Math.sin(n);
}

function cos(n: number): number {
    return Math.cos(n);
}

function colorFromTicks(t: number): [number, number, number] {
    const slice = 360;
    const r = (sin(t + slice * 0.0) + 1.0) / 2.0;
    const g = (sin(t + slice * 1.0) + 1.0) / 2.0;
    const b = (sin(t + slice * 2.0) + 1.0) / 2.0;
    return [r * 0xFF, g * 0xFF, b * 0xFF];
}

export function generatePlasma(state: PipelineState, data: ImageData, args: Partial<PlasmaArguments>): ImageData {
    args.zoom = args.zoom || roll(state, 35, 150);
    args.hueOffset = args.hueOffset || roll(state, 0, 360);
    args.ox = args.ox || roll(state, -10, 10);
    args.oy = args.oy || roll(state, -10, 10);

    function put(x: number, y: number, pixel: [number, number, number]) {
        const o = y * data.width * 4 + x * 4;
        data.data[o + 0] = Math.floor(pixel[0]);
        data.data[o + 1] = Math.floor(pixel[1]);
        data.data[o + 2] = Math.floor(pixel[2]);
        data.data[o + 3] = 0xFF;
    }

    for (var by = 0; by < data.height; by++) {
        for (var bx = 0; bx < data.width; bx++) {
            const x = bx / data.width + args.ox;
            const y = by / data.height + args.oy;
            const c2 = args.hueOffset / 1.0 * 5.0;
            const k = (
                128.0 + (32.0 * sin((x / 4.0 * args.zoom + 10.0 * sin(c2 / 128.0) * 8.0) / 8.0))
                + 128.0 + (32.0 * cos((y / 5.0 * args.zoom + 10.0 * cos(c2 / 142.0) * 8.0) / 8.0))
                + (128.0 + (128.0 * sin(c2 / 40.0 - Math.sqrt(x * x + y * y) * sin(c2 / 64.0) / 8.0)) / 3.0
                    + 128.0 + (128.0 * sin(c2 / 80.0 + Math.sqrt(2.0 * x * x + y * y) * sin(c2 / 256.0) / 8.0)) / 3.0)
            ) / 4.0;
            const p = colorFromTicks(c2 + k);
            put(bx, by, p);
        }
    }

    return data;
}

registerStage("source", "plasma", {
    type: DataType.Image,
    run(state, args: Partial<PlasmaArguments>) {
        return canvasDo(state, async ctx => {
            const target = ctx.createImageData(state.globalOptions.width, state.globalOptions.height);
            generatePlasma(state, target, args);
            ctx.putImageData(target, 0, 0);
        });
    }
});
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

import { Canvas, CanvasRenderingContext2D, Image, loadImage } from "canvas";

import { resource, roll, canvasDo, println } from "../../util";
import { PipelineState, DataType, isPipelineState } from "../../pipeline";
import { tf } from "../../transform";
import { registerStage } from "..";

import { generatePattern } from "../../sources/generators/pattern";
import { generatePlasma } from "../../sources/generators/plasma";

export enum ComposeBuiltinSource {
    White, Plasma, Pattern, Spectrum
}

export interface ComposeArguments<T> {
    source: Canvas | Image | ComposeBuiltinSource | PipelineState[];
    substates?: PipelineState[];
    generatorArguments?: Partial<T>;
    intensity?: number;
    center?: boolean | [number, number];
    fit?: "x" | "y" | null;
    margin?: number;
}

async function runGenerator(state: PipelineState, ctx: CanvasRenderingContext2D,
    center: boolean | [number, number], fit: "x" | "y" | null, margin: number,
    source: Canvas | Image | ComposeBuiltinSource | PipelineState[], args: unknown): Promise<Canvas> {
    const tmp = new Canvas(state.globalOptions.width, state.globalOptions.height);
    const tctx = tmp.getContext("2d");

    var cx: number, cy: number;
    if (Array.isArray(center)) {
        [cx, cy] = center;
        if (typeof cx === "number" && cx < 0) cx = state.globalOptions.width + cx;
        if (typeof cy === "number" && cy < 0) cy = state.globalOptions.height + cy;
    }
    if (center) {
        if (cx == null) cx = state.globalOptions.width / 2;
        if (cy == null) cy = state.globalOptions.height / 2;
    }

    if (Array.isArray(source)) {
        const state2 = source[0];
        if (isPipelineState(state2)) {
            await tf(state2, DataType.Image);
            const img = await loadImage(state2.buffer);
            var x = 0;
            var y = 0;
            var w = state.globalOptions.width;
            var h = state.globalOptions.height;
            if (center) {
                switch (fit) {
                    case "x":
                        w -= margin;
                        w = Math.min(w, img.width);
                        h = img.height * (w / img.width);
                        break;
                    case "y":
                        h -= margin;
                        h = Math.min(h, img.height);
                        w = img.width * (h / img.height);
                        break;
                    default:
                        w = img.width;
                        h = img.height;
                        break;
                }
                x = cx - w / 2;
                y = cy - h / 2;
            }
            tctx.drawImage(img, x, y, w, h);
            return tmp;
        }
        throw new Error("invalid source");
    }

    if (typeof source === "object") {
        tctx.drawImage(source);
        return tmp;
    }

    if (source === ComposeBuiltinSource.Spectrum) {
        const dir = resource("spectrum");
        const spectrums = readdirSync(dir);
        const spectrum = readFileSync(resolve(dir, spectrums[roll(state, 0, spectrums.length - 1)]));
        const img = await loadImage(spectrum);
        tctx.drawImage(img, x, y, state.globalOptions.width, state.globalOptions.height);
        return tmp;
    }

    const target = tctx.createImageData(state.globalOptions.width, state.globalOptions.height);

    switch (source) {
        case ComposeBuiltinSource.White:
            for (var i = 0; i < target.data.length; i++) target.data[i] = 0xFF;
            tctx.putImageData(target, x, y);
            break;
        case ComposeBuiltinSource.Plasma: {
            generatePlasma(state, target, args);
            tctx.putImageData(target, x, y);
            break;
        }
        case ComposeBuiltinSource.Pattern:
            generatePattern(state, tctx, args);
            break;
    }
    return tmp;
}

function composestage(suite: string, operation: string, source?: ComposeBuiltinSource) {
    registerStage(suite, operation, {
        type: DataType.Image,
        init(state, overrides: Partial<ComposeArguments<unknown>>) {
            if (source != null) { // hack
                if (overrides == null) overrides = { source };
                else overrides.source = source;
            }
            return Object.assign({
                source: ComposeBuiltinSource.White,
                generatorArguments: {},
                center: false,
                fit: null,
                margin: 8
            }, overrides);
        },
        run(state, args) {
            return canvasDo(state, async (ctx, img) => {
                const width = state.globalOptions.width;
                const height = state.globalOptions.height;
                ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, width, height);

                const comp = await runGenerator(state, ctx, args.center, args.fit, args.margin,
                    (args.substates != null && args.substates.length > 0) ? args.substates : args.source,
                    args.generatorArguments);
                const cdata = comp.getContext("2d").getImageData(0, 0, width, height);

                const bops = {
                    blend(a: number, b: number) {
                        const strength = args.intensity != null ? args.intensity : 2;
                        return (b * strength + a * (1 - strength));
                    },
                    blend2(b: number, a: number) {
                        const strength = args.intensity != null ? args.intensity : 2;
                        return (b * strength + a * (1 - strength));
                    },
                    add(a: number, b: number) { return a + b; },
                    mult(a: number, b: number) { return a * b; }
                }

                if (operation in bops) {
                    const op = bops[operation];
                    for (var i = 0; i < data.data.length; i++) {
                        data.data[i] = op(data.data[i], cdata.data[i]) & 0xFF;
                    }
                    ctx.putImageData(data, 0, 0);
                }
                else {
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = operation as "hue"; // TERRIBLE
                    ctx.drawImage(comp, 0, 0, width, height);
                }
            });
        }
    });
}

const ops = [
    "hue",
    "saturation",
    "color"
];
ops.map(x => composestage("compose", x));
ops.map(x => composestage("plasma", x, ComposeBuiltinSource.Plasma));
ops.map(x => composestage("pattern", x, ComposeBuiltinSource.Pattern));
ops.map(x => composestage("spectrum", x, ComposeBuiltinSource.Spectrum));

const sops = [
    "blend", // based on Blend() function from brosilio's colorfully named image corruptor
    //"blend2",
    //"add"
];
sops.map(x => composestage("scompose", x));
sops.map(x => composestage("splasma", x, ComposeBuiltinSource.Plasma));
sops.map(x => composestage("spattern", x, ComposeBuiltinSource.Pattern));
sops.map(x => composestage("sspectrum", x, ComposeBuiltinSource.Spectrum));

const uops = [
    "source-over",
    "source-in",
    "source-out",
    "source-atop",
    "destination-over",
    "destination-in",
    "destination-out",
    "destination-atop",
    "lighter",
    "copy",
    "xor",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "luminosity"
]
uops.map(x => composestage("ucompose", x));
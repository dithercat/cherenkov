import { roll, canvasDo, lazyPlus } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "..";

export interface FilterArguments {
    value?: number | any;
}

function filterstage(suite: string, filter: string, finish: (n: number) => any = n => n, min = -255, max = 255) {
    registerStage(suite || "filter", filter, {
        type: DataType.Image,
        init(state: PipelineState, overrides?: Partial<FilterArguments>) {
            var value = roll(state, min, max);
            if (finish == null) {
                value = null;
                overrides = null;
            }
            else if (overrides != null && overrides.value != null) value = overrides.value;

            if (typeof value === "number") value = finish(value);
            return { value };
        },
        async run(state: PipelineState, args: Partial<FilterArguments>) {
            const plus = lazyPlus();
            await canvasDo(state, (ctx, img, canvas) => {
                ctx.drawImage(img, 0, 0);
                const pcanvas = new plus();
                pcanvas.importCanvas(canvas);
                pcanvas[filter](args.value);
            });
        }
    });
}

filterstage(null, "brightness", n => n, -64, 32);
filterstage(null, "contrast", n => n, -32, 255);
filterstage(null, "saturation", n => n, -32, 255); // can have little a desaturate (but not too much)
filterstage(null, "hue", n => n, 0, 360);

filterstage(null, "temperature", n => ({ amount: n }));
filterstage(null, "gamma", n => ({ amount: n / 100 }), 70, 150); // roll is integer-only
filterstage(null, "threshold", n => ({ level: n }), 96, 128); // use a relatively sane range as the default

const cn = "cfilter";
filterstage(cn, "sharpen", null);
filterstage(cn, "sepia", null);
filterstage(cn, "normalize", null);

// timeout for overpowered filters
const op = "opfilter";
filterstage(op, "emboss", null);
filterstage(op, "solarize", null);
filterstage(op, "findEdges", null);

const curves: number[][] = [
    // fuck everything up on purpose
    [0, 255, 0, 255],
    [255, 0, 255, 0]
];
filterstage(op, "curves", n => ({ rgb: curves[n] }), 0, curves.length - 1);

filterstage(op, "invert", null);
filterstage(op, "gaussianBlur", n => ({ amount: n }), 2, 8);
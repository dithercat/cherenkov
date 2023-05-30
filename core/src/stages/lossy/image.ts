import { roll, Bounds, isBounds } from "../../util";
import { convert } from "../../util/imagemagick";
import { PipelineStage, PipelineState, DataType } from "../../pipeline";
import { registerStage } from "..";

export interface ImageArguments {
    quality?: number | Bounds;
}

function imagestage(codec: string, rules?: Partial<ImageArguments>): PipelineStage<ImageArguments> {
    return {
        type: DataType.Image,
        init(state: PipelineState, overrides?: Partial<ImageArguments>) {
            const composite: Partial<ImageArguments> = {
                quality: [1, 99]
            };
            if (rules != null) Object.assign(composite, rules);
            if (overrides != null) Object.assign(composite, overrides);

            if (isBounds(composite.quality)) composite.quality = roll(state, composite.quality);

            return composite;
        },
        async run(state: PipelineState, args: Partial<ImageArguments>) {
            const quality = args.quality;

            if (
                (quality == null || typeof quality !== "number")
            ) throw new Error("imagestage.run(): still not number?!?!");

            state.buffer = await convert({
                srcData: state.buffer,
                format: codec,
                quality: quality
            });

            state.buffer = await convert({
                srcData: state.buffer,
                format: "bmp",
                type: "truecolor",
                depth: 24
            });
        }
    };
}

var suite = "image";
registerStage(suite, "jpg", imagestage("jpg", { quality: [1, 99] }));
registerStage(suite, "jp2", imagestage("jp2", { quality: [30, 99] }));
registerStage(suite, "webp", imagestage("webp", { quality: [10, 99] }));
registerStage(suite, "heic", imagestage("heic", { quality: [20, 99] }));
registerStage(suite, "gif", imagestage("gif", { quality: 0 }));
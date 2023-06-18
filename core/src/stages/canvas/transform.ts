import { lazyPlus } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { convert } from "../../util/imagemagick";
import { registerStage } from "..";

export interface XCropArguments {
    x: number;
    y: number;
    width: number;
    height: number;
}

registerStage("util", "xcrop", {
    type: DataType.Image,
    init(state: PipelineState, overrides?: Partial<XCropArguments>) {
        return Object.assign({}, {
            x: 0,
            y: 0,
            width: state.globalOptions.width,
            height: state.globalOptions.height
        }, overrides);
    },
    async run(state: PipelineState, args: Partial<XCropArguments>) {
        const plus = lazyPlus();
        const canvas = new plus();
        await canvas.load(state.buffer);
        canvas.crop(args);
        state.buffer = await canvas.write({ format: "png" });
        state.globalOptions.width = args.width;
        state.globalOptions.height = args.height;
    }
});

export interface TransformArguments {
    rotate?: number;
    fliph?: boolean;
    flipv?: boolean;
    background?: string;
    antialias?: string;
    fixed?: boolean;
}

registerStage("util", "transform", {
    type: DataType.Image,
    init(state: PipelineState, overrides?: Partial<TransformArguments>) {
        return Object.assign({}, {
            fixed: true
        }, overrides);
    },
    async run(state: PipelineState, args: Partial<TransformArguments>) {
        const plus = lazyPlus();
        const canvas = new plus();
        await canvas.load(state.buffer);
        canvas.transform(args);
        state.buffer = await canvas.write({ format: "png" });
        state.buffer = await convert({
            srcData: state.buffer,
            format: "bmp",
            type: "truecolor",
            depth: 24
        });
    }
});
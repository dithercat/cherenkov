import { roll, canvasDo } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "..";

export interface BlockshiftArguments {
    depth: number;
    width: number;
}

async function blockshift(state: PipelineState, args: Partial<BlockshiftArguments>) {
    await canvasDo(state, (ctx, img) => {
        ctx.drawImage(img, 0, 0);
        ctx.antialias = "none";
        for (var y = 0; y < state.globalOptions.height; y += args.width) {
            const shift = roll(state, -args.depth, args.depth);
            const data = ctx.getImageData(0, y, state.globalOptions.width, args.width);
            // lazy smear
            for (var x = 0; x < shift; x++) ctx.putImageData(data, x, y);
        }
    });
}

registerStage("canvas", "blockshift", {
    type: DataType.Image,
    init(state: PipelineState, overrides?: Partial<BlockshiftArguments>) {
        var wm = 10;
        var dm = 0.75;

        if (overrides) {
            if (overrides.width != null) wm = overrides.width;
            if (overrides.depth != null) dm = overrides.depth;
        }

        const wp = Math.floor(state.globalOptions.width / 100);
        const hp = Math.floor(state.globalOptions.height / 100);

        const width = wp * wm;
        const depth = hp * dm;

        return Object.assign({ width, depth }, overrides);
    },
    run: blockshift
});
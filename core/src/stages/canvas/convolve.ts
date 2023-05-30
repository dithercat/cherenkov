import { registerStage } from "..";

import { DataType, PipelineState } from "../../pipeline";
import { canvasDo, draw, lazyPlus, println, roll } from "../../util";

export interface ConvolveArguments {
    size: number;
    kernel: number[];
}

registerStage("opfilter", "convolve", {
    type: DataType.Image,
    init(state, overrides?: Partial<ConvolveArguments>) {
        const randsize = roll(state, 3, 16);
        const size = (overrides.size == null ? randsize : overrides.size);
        const mult = 1 / size;
        const randkern: number[] = new Array(size ** 2);
        for (var i = 0; i < randkern.length; i++) {
            println(4, "mult", mult);
            const r = state.rng.randomFloat() * 2 * mult - mult * 0.91;
            randkern[i] = r;
        }
        if (overrides.kernel == null) overrides.kernel = randkern;
        return overrides;
    },
    async run(state, overrides) {
        const plus = lazyPlus();
        await canvasDo(state, (ctx, img, canvas) => {
            ctx.drawImage(img, 0, 0);
            const pcanvas = new plus();
            pcanvas.importCanvas(canvas);
            pcanvas.convolve({ matrix: overrides.kernel });
        });
    }
});
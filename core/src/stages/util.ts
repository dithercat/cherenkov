import { createCanvas, loadImage } from "canvas";

import { DataType, GlobalOptions, PipelineState } from "../pipeline";
import { registerStage } from "../stages";
import { tf } from "../transform";
import { toBmp, flip45, println } from "../util";
import { RC4 } from "../util/rc4";

registerStage("util", "dump", {
    type: DataType.Any,
    run(state, args) {
        console.debug(state.buffer.toString());
    }
})

registerStage("util", "setopt", {
    type: DataType.Image,
    run(state, args: Partial<GlobalOptions>) {
        Object.assign(state.globalOptions, args);
    }
});

registerStage("util", "crop", {
    type: DataType.Image,
    init(state, overrides: Partial<{ width: number, height: number }>) {
        if (overrides.width == null) overrides.width = state.globalOptions.width;
        if (overrides.height == null) overrides.height = state.globalOptions.height;
        return overrides;
    },
    async run(state, args) {
        const canvas = createCanvas(args.width, args.height);
        const ctx = canvas.getContext("2d");
        const img = await loadImage(state.buffer);
        ctx.drawImage(img, 0, 0);
        state.buffer = await toBmp(canvas);

        state.globalOptions.width = args.width;
        state.globalOptions.height = args.height;
    }
});

registerStage("util", "scale", {
    type: DataType.Image,
    init(state, overrides: Partial<{ width: number, height: number, antialias: boolean }>) {
        if (overrides.width == null) overrides.width = state.globalOptions.width;
        if (overrides.height == null) overrides.height = state.globalOptions.height;
        if (overrides.antialias == null) overrides.antialias = true;
        return overrides;
    },
    async run(state, args) {
        const canvas = createCanvas(args.width, args.height);
        const ctx = canvas.getContext("2d");
        const img = await loadImage(state.buffer);
        ctx.imageSmoothingEnabled = args.antialias;
        ctx.drawImage(img, 0, 0, args.width, args.height);
        state.buffer = await toBmp(canvas);

        state.globalOptions.width = args.width;
        state.globalOptions.height = args.height;
    }
});

registerStage("util", "flip45", {
    type: DataType.Binary,
    run(state, args) {
        flip45(state, state.buffer);
    }
});

registerStage("util", "concat", {
    type: DataType.Binary,
    async run(state, args: Partial<{ substates: PipelineState[] }>) {
        if (args.substates == null) return;
        const buffs = await Promise.all(args.substates.map(async x => {
            await tf(x, DataType.Binary);
            return x.buffer;
        }));
        buffs.unshift(state.buffer);
        state.buffer = Buffer.concat(buffs);
    }
});

registerStage("util", "discard", {
    type: DataType.Binary,
    run(state, args: Partial<{ count: number }>) {
        if (args.count == null || args.count === 0) return;
        state.buffer = state.buffer.subarray(args.count, state.buffer.length);
    }
});

registerStage("util", "cast", {
    type: DataType.Any,
    run(state, args: Partial<{ type: DataType }>) {
        state.initialType = args.type;
    }
});

registerStage("util", "seal", {
    type: DataType.Any,
    run(state) {
        println(3, "seal", state.initialType, state.type);
        state.initialType = state.type;
    }
});

registerStage("util", "reseed", {
    type: DataType.Any,
    run(state, args: Partial<{ seed: string }>) {
        state.rng = new RC4(args.seed == null ? RC4.genSeed() : args.seed);
    }
});
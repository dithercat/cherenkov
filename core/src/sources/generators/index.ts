import { canvasDo, println } from "../../util";
import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";

registerStage("source", "blank", {
    type: DataType.Image,
    init(state, overrides: Partial<{ sequence: number[] }>) {
        println(3, overrides);
        if (overrides.sequence == null || overrides.sequence.length === 0) overrides.sequence = [0xFF];
        return overrides;
    },
    run(state, args) {
        return canvasDo(state, async (ctx, img) => {
            const target = ctx.createImageData(state.globalOptions.width, state.globalOptions.height);
            println(3, args, target.data);
            for (var i = 0; i < target.data.length; i++) target.data[i] = args.sequence[i % args.sequence.length];
            println(3, args, target.data);
            ctx.putImageData(target, 0, 0);
        });
    }
});

registerStage("source", "string", {
    type: DataType.Text,
    init(state, overrides: Partial<{ text: string }>) {
        if (overrides.text == null) throw new Error("string source must provide a... well, string!");
        return overrides;
    },
    run(state, args) {
        state.buffer = Buffer.from(args.text, "utf-8");
    }
});

import "./pattern";
import "./plasma";
import "./randomart";
import "./fluidcoast";
import "./keysmash";
import "./tone";
import "./list";
import "./sdwebui";
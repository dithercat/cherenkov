import { DataType, PipelineState } from "../../pipeline"

import { registerStage } from "..";

registerStage("text", "concat", {
    type: DataType.Text,
    init(state, overrides: Partial<{ substates: PipelineState[], join: string }>) {
        if (typeof overrides.join !== "string") overrides.join = "";
        return overrides;
    },
    run(state, args) {
        if (args.substates == null) return;
        var str = state.buffer.toString("utf-8");
        for (var i = 0; i < args.substates.length; i++) str += args.substates[i].buffer.toString("utf-8") + args.join;
        state.buffer = Buffer.from(str, "utf-8");
    }
});

registerStage("text", "wrap", {
    type: DataType.Text,
    init(state, overrides: Partial<{ cols: number }>) {
        if (typeof overrides.cols !== "number") overrides.cols = 80;
        return overrides;
    },
    run(state, args) {
        const w = args.cols;
        const regex = new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g');
        var str = state.buffer.toString("utf-8").replace(regex, '$1\n');
        state.buffer = Buffer.from(str, "utf-8");
    }
});

export function stringop(name: string, func: (x: string) => string) {
    registerStage("text", name, {
        type: DataType.Text,
        run(state, args) {
            var text = state.buffer.toString("utf-8");
            state.buffer = Buffer.from(text);
        }
    });
}

stringop("upper", x => x.toUpperCase());
stringop("lower", x => x.toLowerCase());
stringop("trim", x => x.trim());
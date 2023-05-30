import codepage from "codepage";

import { DataType } from "../../pipeline";
import { roll } from "../../util";

import { registerStage } from "..";

const utf8 = 65001;

const defaults = [
    437, // dos us
    1252, // windows western
    1200, // utf-16 little
    1201, // utf-16 big
];

registerStage("text", "codepage", {
    type: DataType.Text,
    init(state, overrides: Partial<{ from: number, to: number }>) {
        const to = defaults[roll(state, 0, defaults.length - 1)];
        if (overrides.from == null) overrides.from = utf8;
        if (overrides.to == null) overrides.to = to;
        return overrides;
    },
    run(state, args) {
        const original = state.buffer.toString("utf-8");
        const encoded = codepage.utils.encode(args.from, original);
        const decoded = codepage.utils.decode(args.to, encoded);
        state.buffer = Buffer.from(decoded, "utf-8");
    }
});
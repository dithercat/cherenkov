import { DataType } from "../../../pipeline"

import { registerStage } from "../..";

import alphabet from "./alphabet.json";

registerStage("text", "nato", {
    type: DataType.Text,
    run(state, args) {
        var text = state.buffer.toString("utf-8").toLowerCase();
        var out = "";
        for (var i = 0; i < text.length; i++) {
            const char = text[i];
            if (char in alphabet) out += alphabet[char] + " ";
        }
        state.buffer = Buffer.from(out.trim());
    }
});
import { DataType } from "../../pipeline"

import { registerStage } from "..";

// inspired by wordsmuggler.com

function smugglestage(to: BufferEncoding) {
    registerStage("text", to, {
        type: DataType.Binary,
        run(state, args) {
            state.buffer = Buffer.from(state.buffer.toString(to), "utf-8");
            state.type = DataType.Text;
        }
    });

    registerStage("text", "un" + to, {
        type: DataType.Text,
        run(state, args) {
            state.buffer = Buffer.from(state.buffer.toString("utf-8"), to);
            state.type = DataType.Binary;
        }
    });
}

smugglestage("hex");
smugglestage("base64");

registerStage("text", "binary", {
    type: DataType.Binary,
    run(state, args) {
        var str = "";
        for (var i = 0; i < state.buffer.length; i++) {
            str += state.buffer[i].toString(2).padStart(8, "0");
        }
        state.buffer = Buffer.from(str, "utf-8");
    }
});
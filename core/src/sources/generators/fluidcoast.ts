import { readFileSync } from "fs";

import { draw, resource } from "../../util";
import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";

const wordset = JSON.parse(readFileSync(resource("lists/fluidcoast.json")).toString());
const { adjectives, nouns } = wordset;

registerStage("source", "adjective", {
    type: DataType.Text,
    run(state, args) {
        state.buffer = Buffer.from(draw(state, adjectives));
    }
});

registerStage("source", "noun", {
    type: DataType.Text,
    run(state, args) {
        state.buffer = Buffer.from(draw(state, nouns));
    }
});

registerStage("source", "fluidcoast", {
    type: DataType.Text,
    run(state, args) {
        const adj = draw(state, adjectives);
        var noun: string;
        do noun = draw(state, nouns); while (noun[0] === adj[0]);
        state.buffer = Buffer.from(adj + " " + noun, "utf-8");
    }
});
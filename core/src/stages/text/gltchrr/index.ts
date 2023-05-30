import { DataType } from "../../../pipeline"

import { registerStage } from "../..";

import { gltchrr } from "./engine";

export interface GltchrrParameters {
    base: number;

    varyBy: number;
    decayTo: number;
    decayExponent: number;

    vary: boolean;
    decay: boolean;

    slurring: number;
    stutter: number;
    bitrot: number;
    blackout: number;
    garbage: number;
    zalgo: number;
    overread: number;
}

registerStage("text", "gltchrr", {
    type: DataType.Text,
    run(state, args: Partial<GltchrrParameters>) {
        var text = state.buffer.toString("utf-8");
        const engine = new gltchrr(state);
        Object.assign(engine.params, args);
        text = engine.processText(text);
        state.buffer = Buffer.from(text);
    }
});

registerStage("text", "uwuize", {
    type: DataType.Text,
    run(state, args) {
        const text = state.buffer.toString("utf-8")
            .replace(/(?:r|l)/g, "w")
            .replace(/(?:R|L)/g, "W")
            .replace(/n([aeiou])/g, 'ny$1')
            .replace(/N([aeiou])/g, 'Ny$1')
            .replace(/N([AEIOU])/g, 'NY$1')
            .replace(/ove/g, "uv");
        state.buffer = Buffer.from(text);
    }
});
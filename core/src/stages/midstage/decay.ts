import { registerStage } from "..";
import { DataType, PipelineState } from "../../pipeline";
import { println, curve } from "../../util";

registerStage("mid", "decay", {
    type: DataType.Binary,
    init(state: PipelineState) { return null; },
    async run(state: PipelineState) {
        const passed = state.iterations;
        const total = state.globalOptions.generations;
        const slice = Math.ceil(state.buffer.length / total);
        const base = slice * passed;
        const end = base + slice;
        const newbuffer = Buffer.alloc(state.previousBuffer.length);
        println(2, "decay params", passed, total, slice, base, end);
        state.previousBuffer.copy(newbuffer);
        state.buffer.copy(newbuffer, end, end);
        for (var i = 0; i < slice; i++) {
            var fin = i / slice;
            /*if (state.initialType === DataType.Audio)*/ fin = curve(fin);
            const fout = 1 - fin;
            const b = base + i;
            const f = (state.previousBuffer[b] - 128) * fout;
            const g = (state.buffer[b] - 128) * fin;
            newbuffer[b] = (f + g) + 128;
        }
        state.previousBuffer = state.buffer;
        state.buffer = newbuffer;
    }
});
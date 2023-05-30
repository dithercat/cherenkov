// lazy bitcrush

import { registerStage } from "..";
import { DataType, PipelineState } from "../../pipeline";

// TODO: support other bit depths
registerStage("util", "crush", {
    type: DataType.Binary,
    init(state: PipelineState) { return null; },
    async run(state: PipelineState) {
        for (var i = 0; i < state.buffer.length; i++) {
            state.buffer[i] = state.buffer[i] < 0x7F ? 0 : 0xFF;
        }
    }
});
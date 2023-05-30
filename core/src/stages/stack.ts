import { BaseConnector, DataType, PipelineState } from "../pipeline";
import { registerStage } from "../stages";
import { println } from "../util";

registerStage("internal", "stackpush", {
    type: DataType.Any,
    async run(state, args: Partial<{
        substates: PipelineState[],
        pipeline: BaseConnector
    }>) {
        println(4, "state/args", state, args);
        if (args.substates == null) return;
        args.substates.push(await args.pipeline.iterateToEnd());
    }
});

registerStage("internal", "stackflush", {
    type: DataType.Any,
    async run(state, args: Partial<{
        substates: PipelineState[]
    }>) {
        if (args.substates == null) return;
        while (args.substates.length > 0) args.substates.pop();
    }
});
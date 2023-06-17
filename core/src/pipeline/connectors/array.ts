import { getStageById } from "../../stages";
import { PipelineInit, PipelineStage } from "..";

import { BaseConnector } from "./core";

export class ArrayConnector extends BaseConnector {
    stages: PipelineStage<unknown>[] = [];

    constructor(
        init: PipelineInit,
        private ostages: (PipelineStage<unknown> | [string, unknown?])[]
    ) {
        super(init);

        if (!Array.isArray(ostages)) throw new Error("need array as argument to ArrayConnector");

        for (var i = 0; i < ostages.length; i++) {
            const stage = ostages[i];
            if (Array.isArray(stage)) this.stages[i] = getStageById(stage[0], stage[1]);
            else this.stages[i] = stage;
        }

        this.state.globalOptions.generations = this.stages.length;
    }

    protected async selectNextStage(): Promise<PipelineStage<unknown>> {
        const stage = this.stages.shift();
        if (stage == null) return null;
        return stage;
    }
}
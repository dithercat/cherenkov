import { roll, shuffle } from "../../util";
import { getSuite } from "../../stages";
import { PipelineInit, PipelineStage } from "..";

import { BaseConnector } from "./core";

export class PoolConnector extends BaseConnector {
    pool: PipelineStage<unknown>[] = [];

    constructor(init: PipelineInit, suites: [string, number?][]) {
        super(init);

        if (!Array.isArray(suites)) throw new Error("need array as argument to PoolConnector");

        for (var i = 0; i < suites.length; i++) {
            if (!Array.isArray(suites[i]))
                throw new Error("all entries must be array");
            const entry = suites[i];
            if (typeof entry[0] !== "string")
                throw new Error("entry[0] (stage) must be string");
            if (entry[1] != null && typeof entry[1] !== "number")
                throw new Error("entry[1] (weight) must be number or null-like");

            const suite = getSuite(suites[i][0]);
            const weight = suites[i][1] || 1;
            for (var j = 0; j < weight; j++) this.pool.push(...Object.values(suite));
            shuffle(this.state, this.pool);
        }
    }

    protected async selectNextStage(): Promise<PipelineStage<unknown>> {
        return this.pool[roll(this.state, 0, this.pool.length - 1)];
    }
}
import { PipelineStage } from "../pipeline";

type StageSuite = { [key: string]: PipelineStage<unknown> };

const registry: {
    [key: string]: StageSuite
} = {
    global: {}
};
const _global = registry.global;

export function registerStage<T>(suiteid: string, id: string, stage: PipelineStage<T>) {
    if (!(suiteid in registry)) registry[suiteid] = {};
    const suite = registry[suiteid];

    if (id in suite) throw new Error("registry: " + id + " already exists in suite " + suiteid);

    stage.suite = suiteid;
    stage.id = id;
    if (stage.init == null) { stage.init = (x, y) => y; }

    suite[id] = stage;

    // hack to disallow shorthanding ambiguous operations
    if (id in _global) _global[id] = null;
    else _global[id] = stage;
}

export function getStageById<T>(fid: string, overrides?: Partial<T>): PipelineStage<T> {
    if (fid.indexOf(".") === -1) throw new Error("registry: need full id");
    const [suiteid, id] = fid.split(".");

    if (!(suiteid in registry)) throw new Error("registry: no such suite " + suiteid);
    const suite = registry[suiteid];

    if (id in suite) {
        const stage = suite[id];
        if (overrides != null) {
            return {
                suite: stage.suite,
                id: stage.id,
                type: stage.type,
                init: (stage.init == null) ? (() => overrides) : (s => stage.init(s, overrides)),
                run: stage.run.bind(stage) // bind me~
            };
        }
        else return stage as PipelineStage<T>; // not much we can do about this
    }
    else throw new Error("registry: no such stage " + id + " in " + suiteid);
}

export function getSuite(suiteid: string): StageSuite {
    if (!(suiteid in registry)) throw new Error("registry: no such suite " + suiteid);
    return Object.assign({}, registry[suiteid]);
}

export function getSuites(): string[] {
    return Object.keys(registry);
}

import "./entrypoints";
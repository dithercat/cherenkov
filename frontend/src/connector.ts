import { BaseConnector, PipelineInit, PipelineState } from "@cherenkov/core";

import { ConnectorIterator, connectors, StageConnector } from "./maps";

export interface StageConfig {
    connector: StageConnector;
    pipeline: any;
    generations?: number;
}

export interface ConnectorStrategy<T> {
    connector: new (init: PipelineInit, args: T) => BaseConnector;
    iterator: ConnectorIterator;
}

export function assembleConnector(init: PipelineInit, config: StageConfig): () => Promise<PipelineState> {
    const info = connectors[config.connector];
    if (info == null) throw new Error("no such connector");
    const connector = new info.connector(init, config.pipeline);
    switch (info.iterator) {
        case ConnectorIterator.Once:
            return () => connector.iterate();
        case ConnectorIterator.Count:
            return () => connector.iterateFor(connector.state.globalOptions.generations);
        case ConnectorIterator.ToEnd:
            return () => connector.iterateToEnd();
        default: throw new Error("invalid iteration strategy??? this is a bug");
    }
}
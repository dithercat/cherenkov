import { ArrayConnector, PoolConnector, DataType } from "@cherenkov/core";

import { ConnectorStrategy } from "./connector";

export type ConfigDataType = "binary" | "audio" | "image" | "text" | "manifest";
export const types: Record<ConfigDataType, DataType> = {
    binary: DataType.Binary,
    audio: DataType.Audio,
    image: DataType.Image,
    text: DataType.Text,

    manifest: DataType.Manifest
}

export type StageConnector = "sequence" | "pool";
export enum ConnectorIterator {
    Once, ToEnd, Count
}
export const connectors: Record<StageConnector, ConnectorStrategy<unknown>> = {
    "sequence": { connector: ArrayConnector, iterator: ConnectorIterator.ToEnd },
    "pool": { connector: PoolConnector, iterator: ConnectorIterator.Count }
};
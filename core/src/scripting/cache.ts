import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";
import msgpack from "msgpack-lite";

import { ArrayConnector, DataType, PipelineInit, PipelineStage, PipelineState } from "../pipeline";
import { println } from "../util";

class CachedArrayConnector extends ArrayConnector {
    constructor(
        init: PipelineInit,
        ostages: (PipelineStage<unknown> | [string, unknown?])[],
        state: PipelineState
    ) {
        super(init, ostages);
        this._state = state;
    }
    public async iterateToEnd(): Promise<PipelineState> {
        return this.state;
    }
}

export class Cache {

    private readonly sql: Sequelize;
    private readonly cache: ModelStatic<Model<any, any>>;

    constructor(storage: string) {
        this.sql = new Sequelize({
            dialect: "sqlite",
            storage,
            logging: false
        });
        this.cache = this.sql.define("cache", {
            key: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true
            },
            hash: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            data: {
                type: DataTypes.BLOB,
                allowNull: false
            }
        });
    }

    async init() {
        await this.sql.authenticate();
        await this.cache.sync();
    }

    async loadOrInit(
        key: string, hash: string,
        init: PipelineInit, sequence: (PipelineStage<unknown> | [string, unknown?])[]
    ): Promise<ArrayConnector> {
        // add cache stage to pipeline
        sequence.push({
            id: "cache",
            suite: "internal",
            type: DataType.Any,
            init: (state, args) => args,
            run: async (state: PipelineState) => {
                await this.save(key, hash, state);
            }
        });

        // lookup cached result
        const result = await this.cache.findOne({
            where: { key, hash }
        });
        if (result == null) {
            return new ArrayConnector(init, sequence);
        }
        println(1, "pipeline cache hit!");
        const state: PipelineState = msgpack.decode(result.dataValues.data);
        return new CachedArrayConnector(init, sequence, state);
    }

    async save(key: string, hash: string, state: PipelineState) {
        await this.cache.upsert({
            key, hash,
            data: msgpack.encode(state)
        });
    }

}
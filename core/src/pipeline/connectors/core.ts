import { println } from "../../util";
import { RC4 } from "../../util/rc4";
import { DataType } from "../../pipeline";
import { tf } from "../../transform";
import { PipelineState, PipelineStage, PipelineInit } from ".."
import { overrideOptions } from "../options";

export abstract class BaseConnector {
    protected _state: PipelineState;
    get state() { return this._state; }

    private substates: PipelineState[] = [];
    private prestage: PipelineStage<unknown>[] = [];
    private poststage: PipelineStage<unknown>[] = [];
    private didDummyPass = false;
    private readonly realInitialType: DataType;

    constructor(init: PipelineInit) {
        if (init.buffer == null) throw new Error("need buffer to init pipeline");
        const type = init.type != null ? init.type : DataType.Binary;
        this.realInitialType = type;
        this._state = {
            globalOptions: overrideOptions(init.globalOptions),
            buffer: init.buffer, previousBuffer: null,
            type, initialType: type,
            iterations: 0,
            history: [],
            rng: new RC4(init.seed == null ? RC4.genSeed() : init.seed)
        };
        if (init.seed == null) {
            println(0, "seed: " + this.state.rng.seed);
        }
        if (init.midstage != null) {
            if (init.midstage.pre != null) this.prestage = this.prestage.concat(init.midstage.pre);
            if (init.midstage.post != null) this.poststage = this.poststage.concat(init.midstage.post);
        }
    }

    // null signals end of stages
    protected abstract selectNextStage(): Promise<PipelineStage<unknown>>;

    protected async runStage(stage: PipelineStage<unknown>, mid = false): Promise<PipelineState> {
        // tf to new type if necessary
        await tf(this.state, stage.type);

        // backup previous buffer
        if (!mid) {
            this.state.previousBuffer = Buffer.alloc(this.state.buffer.length);
            this.state.buffer.copy(this.state.previousBuffer);
        }

        // setup stage
        // overrides should be sealed during setup
        const args = stage.init(this.state, null);

        // run stage
        println(mid ? 2 : 1, stage.suite + "." + stage.id, args);
        await stage.run(this.state, Object.assign({
            substates: this.substates
        }, args));
        this.state.history.push(stage);

        return this.state
    }

    public async iterate(): Promise<PipelineState> {
        // dirty hack to get correct image dimensions
        if (this.realInitialType === DataType.Image && !this.didDummyPass) {
            println(4, "dummy pass", this.state);
            await tf(this.state, DataType.Binary);
            this.didDummyPass = true;
        }

        // select the next stage
        const stage = await this.selectNextStage();
        if (stage == null) return null;

        // run prestages
        for (var i = 0; i < this.prestage.length; i++) await this.runStage(this.prestage[i], true);

        // run main stage
        await this.runStage(stage);

        // run poststages
        for (var i = 0; i < this.poststage.length; i++) await this.runStage(this.poststage[i], true);

        this.state.iterations++;

        // return result
        return this.state;
    }

    public async iterateFor(rounds: number): Promise<PipelineState> {
        for (var i = 0; i < rounds; i++) {
            println(2, "iteration " + i);
            if (await this.iterate() == null) break;
        }
        return await this.getResult();
    }

    // !!! causes an infinite loop on connectors with no end
    public async iterateToEnd(): Promise<PipelineState> {
        var l = 0;
        while (await this.iterate() != null);
        return await this.getResult();
    }

    private async getResult(): Promise<PipelineState> {
        await tf(this.state, this.state.initialType);
        return this.state;
    }
}
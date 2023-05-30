import { PipelineStage, PipelineState, DataType } from "../../pipeline";
import { maybe, roll } from "../../util";
import { registerStage } from "..";

import "./bitcrush";

import {
    SuperOperator,
    add, mult, div, xor, overwrite, irradiate, shallow, invert, MathOpArguments
} from "./operators";
import {
    RegionArguments, RegionOperator,
    reverse, skip, smear, skew, remap
} from "./region";

function region2stage<T extends RegionArguments>(op: RegionOperator<T>, min: number, max: number, fix: (state: PipelineState, args: Partial<T>) => void = () => { }): PipelineStage<T> {
    return {
        type: DataType.Binary,
        init(state: PipelineState, overrides?: Partial<T>) {
            const col = state.globalOptions.width * 3;
            const base = col * state.globalOptions.height / 100 * state.globalOptions.carnage;
            const args = Object.assign({
                minStart: Math.floor(base * min),
                maxLength: Math.floor(base * max)
            }, overrides);

            // used to be in getStretch()
            if (args.start == null || args.end == null) {
                if (args.minStart == null || args.maxLength == null) throw new Error("must provide minStart/maxLength or start/end");
                args.start = roll(state, 0, state.buffer.length - args.maxLength - 1);
                args.end = args.start + roll(state, args.minStart, args.maxLength);
            }
            else {
                // keep rng in sync
                roll(state, 0, 0);
                roll(state, 0, 0);
            }

            fix(state, args);

            return args;
        },
        async run(state: PipelineState, args: T) {
            op(state, state.buffer, args);
        }
    };
}

function bytestage<T>(suite: string, name: string, sop: SuperOperator<RegionArguments & T>, min: number, max: number, fix: (state: PipelineState, args: Partial<RegionArguments & T>) => void = () => { }) {
    registerStage(suite, name, region2stage((state, buffer, args) => {
        const op = sop(state, args);
        const b = buffer.subarray(args.start, args.end);
        for (var i = 0; i < b.length; i++) b[i] = op(b[i]);
    }, min, max, fix));
    registerStage("f" + suite, name, region2stage((state, buffer, args) => {
        const op = sop(state, args);
        for (var i = 0; i < buffer.length; i++) buffer[i] = op(buffer[i]);
    }, min, max, fix));
}

function croll(min: number, max: number, cnst = true) {
    return (s: PipelineState, x: RegionArguments & MathOpArguments) => {
        if (x.min == null) x.min = min;
        if (x.max == null) x.max = max;
        if (cnst) x.value = roll(s, x.min, x.max);
    }
}

/* === BINARY OPERATORS (constant value) === */
const sc = "const";
bytestage(sc, "add", add, 1, 30, croll(-0x7F, 0x7F));
bytestage(sc, "mult", mult, 1, 10, croll(0x00, 0x7F));
bytestage(sc, "div", div, 1, 20, croll(0x00, 0x3F));
bytestage(sc, "xor", xor, 1, 30, croll(0x00, 0xFF));
bytestage(sc, "overwrite", overwrite, 1, 5, croll(0x00, 0xFF));

/* === BINARY OPERATORS (random value) === */
const sn = "rand";
//registerStage(sn, "add", region2stage(radd, 1, 5));
bytestage(sn, "mult", mult, 1, 5, croll(0x00, 0x7F, false));
bytestage(sn, "div", div, 1, 5, croll(0x00, 0x3F, false));
//registerStage(sn, "xor", region2stage(rxor, 1, 5));
bytestage(sn, "overwrite", overwrite, 1, 5, croll(0x00, 0xFF, false));
bytestage(sn, "irradiate", irradiate, 5, 50, (s, x) => {
    if (x.density == null) x.density = 0.2;
});

/* === GENERAL CORRUPTIONS === */
const sp = "bend";
bytestage(sp, "shallow", shallow, 5, 70, (s, x) => {
    if (x.loss == null) x.loss = 4;
});
registerStage(sp, "reverse", region2stage(reverse, 5, 10));
registerStage(sp, "skip", region2stage(skip, 1, 20, (s, x) => {
    const reverse = maybe(s, 0.5, "skip_reverse");
    const count = roll(s, 1, s.globalOptions.max_skip);
    if (x.reverse == null) x.reverse = reverse;
    if (x.count == null) x.count = count;
}));
registerStage(sp, "smear", region2stage(smear, 1, 2));
bytestage(sp, "invert", invert, 1, 20);

/* === BITMAP CORRUPTIONS === */
const sr = "rgb";
registerStage(sr, "skew", region2stage(skew, 20, 40, (s, x) => {
    const anchor = roll(s, 0, 2);
    const off0 = roll(s, 1, s.globalOptions.width * 50);
    const off1 = roll(s, 1, s.globalOptions.width * 50);
    if (x.anchor == null) x.anchor = anchor;
    if (x.offsets == null) x.offsets = [off0, off1];
    else if (typeof x.offsets === "number") x.offsets = [x.offsets, x.offsets * 2];
}));
registerStage(sr, "remap", region2stage(remap, 20, 40, (s, x) => {
    // only lossless permutations are included here
    // lossy ones can be used as arguments
    const mappings: [number, number, number][] = [
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0]
    ];
    var map = mappings[roll(s, 0, mappings.length - 1)];
    if (x.mapping == null) x.mapping = map;
}));
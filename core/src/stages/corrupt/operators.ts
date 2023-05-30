import { roll, maybe } from "../../util";
import { PipelineState } from "../../pipeline";

export type Operator = (n: number) => number;
export type SuperOperator<T> = (state: PipelineState, args: T) => Operator;

export interface MathOpArguments {
    value?: number;
    min?: number;
    max?: number;
}

export interface ShallowArguments {
    loss?: number;
}

export interface IrradiateArguments {
    density?: number;
}

function oroll(v: number, state: PipelineState, min: number, max: number) {
    const r = roll(state, min, max);
    return v == null ? r : v;
}

export function add(state: PipelineState, args: MathOpArguments): Operator {
    return x => x + oroll(args.value, state, args.min, args.max);
}

export function mult(state: PipelineState, args: MathOpArguments): Operator {
    return x => x * oroll(args.value, state, args.min, args.max);
}

export function div(state: PipelineState, args: MathOpArguments): Operator {
    return x => x / oroll(args.value, state, args.min, args.max);
}

export function xor(state: PipelineState, args: MathOpArguments): Operator {
    return x => x ^ oroll(args.value, state, args.min, args.max);
}

export function irradiate(state: PipelineState, args: IrradiateArguments): Operator {
    return x => maybe(state, args.density, "irradiate") ? x ^ (1 << roll(state, 0, 7)) : x;
}

export function shallow(state: PipelineState, args: ShallowArguments): Operator {
    return x => x & ((0xFF << args.loss) & 0xFF);
}

export function overwrite(state: PipelineState, args: MathOpArguments): Operator {
    return x => oroll(args.value, state, args.min, args.max);
}

export function invert(state: PipelineState, args: MathOpArguments): Operator {
    return x => 0xFF - x;
}
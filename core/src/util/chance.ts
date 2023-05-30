import { PipelineState } from "../pipeline";
import { println } from "./log";

export type Bounds = [number, number, number?];

export function isBounds(a: any): a is Bounds {
    if (!Array.isArray(a)) return false;
    if (a.length > 3 || a.length < 2) return false;
    if (typeof a[0] !== "number") return false;
    if (typeof a[1] !== "number") return false;
    if (a[2] != null && typeof a[2] !== "number") return false;
    return true;
}

export function roll(state: PipelineState, min: number | Bounds, max?: number) {
    var m = 1;
    if (!isBounds(min) && typeof max == null) throw new Error("bad combo (number and null)");
    if (isBounds(min)) {
        if (typeof max === "number") throw new Error("bad combo (Bounds and number)");
        const a = min;
        min = a[0];
        max = a[1];
        if (typeof a[2] === "number") {
            m = a[2];
            min /= m;
            max /= m;
        }
    }
    return Math.floor(state.rng.randomFloat() * (max - min + 1) + min) * m;
}

export function maybe(state: PipelineState, chance: number, tag = "default") {
    if (tag in state.globalOptions.jackpot) {
        println(2, "jackpot! " + tag + " " + state.globalOptions.jackpot[tag]);
        state.rng.randomFloat(); // dummy to update state
        return state.globalOptions.jackpot[tag];
    }
    return state.rng.randomFloat() < chance;
}

export function shuffle<T extends any[]>(state: PipelineState, arr: T) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(state.rng.randomFloat() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

export function draw<T>(state: PipelineState, arr: T[]): T {
    return arr[roll(state, 0, arr.length - 1)];
}
import { println } from "./log";

// i imagine that in a lot of cases, 256KB of accumulation is plenty
export function accumulativeDistance(template: Buffer, response: Buffer, maxkb = 512): number {
    const smallest = Math.min(template.length, response.length, maxkb * 1024);
    var acc = 0;
    for (var i = 0; i < smallest; i++) acc += Math.abs(template[i] - response[i]);
    return acc;
}

export function accumulativeAlign(template: Buffer, response: Buffer): Buffer {
    const searchspace = Math.max(template.length, response.length) - Math.min(template.length, response.length);
    println(2, "running accumulative align over " + searchspace + " bytes");
    var best: Buffer = response, bestscore: number = 0xFFFFFFFFFF;
    for (var i = 0; i < searchspace; i++) {
        const attempt = response.subarray(i);
        const score = accumulativeDistance(template, attempt);
        if (score < bestscore) {
            best = attempt;
            bestscore = score;
        }
    }
    return best.subarray(0, template.length);
}
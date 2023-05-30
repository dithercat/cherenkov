import { curve } from "../util";

const K = 1000;
const RATE = 48;
const DEPTH = 32;
const WORDSIZE = DEPTH / 8;
const WORDMULT = 1 << (DEPTH - 1) - 1;
const FADESIZE = 5 * RATE;

export function tone(secs: number, ...freqs: number[]): Buffer {
    const count = secs * RATE * K;
    const pcm = Buffer.alloc(count * WORDSIZE);
    const layers = freqs.length;
    if (layers === 0 || freqs[0] === 0) return pcm;
    for (const freq of freqs) {
        const period = 2 * Math.PI * freq / (RATE * K);
        for (var i = 0; i < count; i++) {
            const orig = pcm.readInt32LE(i * WORDSIZE);
            pcm.writeInt32LE(orig + Math.sin(i * period) / layers * WORDMULT * 0.75, i * WORDSIZE);
        }
    }
    // taper the ends to avoid clicking
    for (var i = 0; i < FADESIZE; i++) {
        const fade = curve(i / FADESIZE);
        const offset = i * WORDSIZE;
        const eoffset = pcm.length - 4 - offset;
        pcm.writeInt32LE(pcm.readInt32LE(offset) * fade, offset);
        pcm.writeInt32LE(pcm.readInt32LE(eoffset) * fade, eoffset);
    }
    return pcm;
}
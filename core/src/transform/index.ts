import { println, printtrace } from "../util";
import { convert } from "../util/imagemagick";
import { PipelineState, DataType, GlobalOptions } from "../pipeline";

import { bin2bmp, bmp2bin } from "./bmp";
import { bin2wav, wav2bin } from "./wav";

// gets the data into binary form
async function ingress(buffer: Buffer, from: DataType, opts: GlobalOptions) {
    println(4, "tf: from", from);
    switch (from) {
        case DataType.Audio:
            buffer = await wav2bin(buffer, opts);
            break;
        case DataType.Image: {
            const bmp = await convert({
                srcData: buffer,
                format: "bmp",
                type: "truecolor",
                depth: 24
            });
            const result = bmp2bin(bmp);
            buffer = result.bin;
            if ((opts.width !== result.width) || (opts.height !== result.height)) {
                println(2, "tf: updating image dimensions");
                println(3, opts.width + "x" + opts.height + " -> " + result.width + "x" + result.height);
                opts.width = result.width;
                opts.height = result.height;
            }
            break;
        }
        case DataType.Text:
        case DataType.Binary:
            break;
        default: throw new Error("tf ingress: bad type " + from);
    }
    return buffer;
}

// converts the data to its new form
async function egress(buffer: Buffer, to: DataType, opts: GlobalOptions) {
    println(4, "tf: to", to);
    switch (to) {
        case DataType.Audio:
            buffer = await bin2wav(buffer, opts);
            break;
        case DataType.Image:
            buffer = bin2bmp(buffer, opts.width);
            opts.height = Math.ceil(buffer.length / opts.width / 3) - 1;
            break;
        case DataType.Text:
        case DataType.Binary:
            break;
        default: throw new Error("tf egress: bad type " + to);
    }
    return buffer;
}

export async function tf(state: PipelineState, to: DataType, force = false) {
    println(3, "tf:", state.type, "->", to, force ? "forcefully" : "");

    //printtrace(4, "tf source");

    if (!force && state.type === to) return;
    if (to === DataType.Any) return;

    state.buffer = await ingress(state.buffer, state.type, state.globalOptions);
    if (state.previousBuffer) state.previousBuffer = await ingress(state.previousBuffer, state.type, state.globalOptions);
    state.type = DataType.Binary; // just for the sake of it

    state.buffer = await egress(state.buffer, to, state.globalOptions);
    if (state.previousBuffer) state.previousBuffer = await egress(state.previousBuffer, to, state.globalOptions);
    state.type = to;
}
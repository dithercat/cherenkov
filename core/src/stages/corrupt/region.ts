import { roll, maybe, unzip, zip } from "../../util";
import { PipelineState } from "../../pipeline";

export type RegionOperator<T extends RegionArguments> = (state: PipelineState, buffer: Buffer, args: T) => void;
export type SuperRegionOperator<T, U> = (sop: T) => RegionOperator<RegionArguments & U>;

export interface RegionArguments {
    start?: number;
    end?: number;
    minStart?: number;
    maxLength?: number;
}

export interface SkipArguments extends RegionArguments {
    count?: number;
    reverse?: boolean;
}

export interface SkewArguments extends RegionArguments {
    anchor?: number;
    offsets?: [number, number] | number;
}

export interface RemapArguments extends RegionArguments {
    mapping?: [number, number, number];
}

export function reverse(state: PipelineState, buffer: Buffer, args: RegionArguments) {
    const b = buffer.subarray(args.start, args.end);
    b.reverse();
}

export function skip(state: PipelineState, buffer: Buffer, args: SkipArguments) {
    const diff = args.end - args.start;
    for (
        var x = args.reverse ? args.count : 1;
        args.reverse ? x > 1 : x <= args.count;
        args.reverse ? x-- : x++
    ) {
        const target = args.start + diff * x * (args.reverse ? -1 : 1);
        if (target < 0) continue;
        if (target + args.end >= buffer.length) continue;
        buffer.copy(buffer, target, args.start, args.end);
    }
}

export function smear(state: PipelineState, buffer: Buffer, args: RegionArguments) {
    buffer.copy(buffer, args.end, args.start, buffer.length);
    for (var i = args.start; i < args.end; i++) buffer[i] = buffer[args.start];
}

export function skew(state: PipelineState, buffer: Buffer, args: SkewArguments) {
    const buff = buffer.subarray(args.start, args.end);
    const planes = unzip(buff);
    const planesize = planes[0].length;
    const newplanes: Buffer[] = [];

    var c = 0;
    for (var i = 0; i < planes.length; i++) {
        newplanes[i] = Buffer.alloc(planesize);
        var offset = 0;
        if (args.anchor !== i) offset = args.offsets[c++];
        planes[i].copy(newplanes[i], offset, 0, planes[i].length);
    }
    const newbuff = zip(newplanes);
    newbuff.copy(buff);
}

export function remap(state: PipelineState, buffer: Buffer, args: RemapArguments) {
    const buff = buffer.subarray(args.start, args.end);
    const planes = unzip(buff);

    const map = args.mapping;

    // sanity check
    if (map.length !== planes.length) throw new Error("remap: bad map (too many destinations)");
    for (var i = 0; i < map.length; i++)
        if (map[i] >= planes.length)
            throw new Error("remap: bad map (source out of bounds)");

    const newbuff = zip([planes[map[0]], planes[map[1]], planes[map[2]]]);
    newbuff.copy(buff);
}
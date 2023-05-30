import { PipelineState } from "../pipeline";

export type Planes = Buffer[];

export function unzip(buffer: Buffer, tuplesize = 3): Planes {
    const planesize = Math.ceil(buffer.length / tuplesize);
    const buffs = [];
    for (var i = 0; i < tuplesize; i++) buffs[i] = Buffer.alloc(planesize);
    for (var i = 0; i < buffer.length; i += tuplesize)
        for (var j = 0; j < tuplesize; j++)
            buffs[j][i / tuplesize] = buffer[i + j];
    return buffs;
}

export function zip(buffers: Planes): Buffer {
    const planesize = buffers[0].length;
    const tuplesize = buffers.length;
    const buffer = Buffer.alloc(planesize * tuplesize);
    for (var i = 0; i < planesize; i++)
        for (var j = 0; j < tuplesize; j++)
            buffer[i * tuplesize + j] = buffers[j][i];
    return buffer;
}

function flipplane45(state: PipelineState, plane: Buffer, slant: boolean) {
    const newplane = Buffer.alloc(plane.length);
    const s = slant ? -1 : 0;
    const cols = state.globalOptions.width + s;
    const rows = state.globalOptions.height + s;
    for (var y = 0; y < rows; y++)
        for (var x = 0; x < cols; x++) {
            const ooff = cols * y + x;
            const noff = rows * x + y;
            newplane[noff] = plane[ooff];
        }
    newplane.copy(plane);
}

// TODO: calculations for non-1x slope
export function flip45(state: PipelineState, buffer: Buffer, slant: boolean = false) {
    const planes = unzip(buffer);
    for (var i = 0; i < planes.length; i++) flipplane45(state, planes[i], slant);
    //const newbuff = zip([planes[1], planes[1], planes[1]]);
    const newbuff = zip(planes);
    newbuff.copy(buffer);

    // since the dimensions have changed, we need to update the dimension
    // info for future operations. flip45() should be called again to restore
    // the flip and clean up! flipping is only here to change corruption
    // orientation (since corruptions are linear and will naturally follow the
    // horizon)
    const r = state.globalOptions.width;
    state.globalOptions.width = state.globalOptions.height;
    state.globalOptions.height = r;
}
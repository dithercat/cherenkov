import m from "./ugly.min";

export async function robot36encode(_in: string, out: string) {
    (await m.createEncoder({ arguments: [_in, out] }));
}

export async function robot36decode(_in: string, out: string, width = 320, height = 240) {
    (await m.createDecoder({ arguments: [_in, out, width.toString(), height.toString()] }));
}
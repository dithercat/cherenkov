import fs from "fs";
import { Readable, PassThrough } from "stream";
import { promisify } from "util";

import type ffmpeg from "fluent-ffmpeg";
import type { FfmpegCommand, Encoders } from "fluent-ffmpeg";
import tempfile from "tempfile";

import { getPath } from "./path";

var _ffmpeg: typeof ffmpeg = null;
var _encoders: Encoders = null;
async function lazyFfmpeg() {
    if (_ffmpeg != null) return _ffmpeg;
    _ffmpeg = require("fluent-ffmpeg/lib/fluent-ffmpeg");
    _ffmpeg.setFfmpegPath(getPath("ffmpeg"));
    _encoders = await new Promise((r, e) => _ffmpeg.availableEncoders((err, data) => { if (err != null) e(err); else r(data); }));
    return _ffmpeg;
}

export type ConfiguratorAction = (cmd: FfmpegCommand) => FfmpegCommand;

// grrrrrrrrrr
class BufferStream extends Readable {
    private buffer: Buffer;
    private ptr = 0;

    constructor(buffer: Buffer) {
        super();
        if (buffer == null) throw new Error("the buffer is not optional!");
        this.buffer = buffer;
    }

    _read(size: number = this.buffer.length) {
        if (this.ptr >= this.buffer.length) {
            this.push(null);
            return;
        }
        const sub = this.buffer.subarray(this.ptr, this.ptr + size);
        this.push(sub);
        this.ptr += size;
    }
}

export async function ff(input: Buffer, cfg: ConfiguratorAction = x => x, temp = false, tempin = false): Promise<Buffer> {
    const ffmpeg = await lazyFfmpeg();

    const tmpin = tempfile();
    if (tempin) {
        // write tmp file
        await promisify(fs.writeFile)(tmpin, input);
        if (!await promisify(fs.exists)(tmpin)) throw new Error("failed to write tmp file");
    }
    const source: string | Readable = tempin ? tmpin : new BufferStream(input);

    if (temp) {
        const tmpout = tempfile();

        // convert
        const config = cfg(ffmpeg({ source, logger: console })
            .outputOption("-fflags", "+bitexact")
            .outputOption("-flags:a", "+bitexact")
        );
        await new Promise((resolve, reject) => config.save(tmpout).on("end", resolve).on("error", reject));

        // make sure result file is present
        if (!await promisify(fs.exists)(tmpout)) throw new Error("ffmpeg returned nothing (temp file)");

        // read result
        const buff = await promisify(fs.readFile)(tmpout);

        // cleanup
        await promisify(fs.unlink)(tmpout);
        if (tempin) await promisify(fs.unlink)(tmpin);

        return buff;
    }
    else return await new Promise((resolve, reject) => {
        const stream = new PassThrough();
        const bufs = [];
        stream.on("data", d => {
            bufs.push(d);
        });
        stream.on("end", async () => {
            const buff = Buffer.concat(bufs);
            if (buff.length <= 0) reject("ffmpeg returned nothing (stream)");
            if (tempin) await promisify(fs.unlink)(tmpin);
            resolve(buff);
        });
        const config = cfg(ffmpeg({
            //logger: console,
            source
        })
            .outputOption("-fflags", "+bitexact")
            .outputOption("-flags:a", "+bitexact")
        )
            //.on("start", cmdline => console.debug(cmdline))
            .on("error", reject);
        config.stream(stream, { end: true });
    });
}

export function ffaudio(input: Buffer, cfg: ConfiguratorAction = x => x, temp = false, tempin = false): Promise<Buffer> {
    return ff(input, cmd => cfg(cmd.noVideo()), temp, tempin);
}

export async function canUseEncoder(encoder: string): Promise<boolean> {
    if (_encoders == null) await lazyFfmpeg();
    return encoder in _encoders;
}
import { ffaudio } from "../util/ffmpeg";
import { GlobalOptions } from "../pipeline/options";

const wavHdr = {
    template: Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0xAA, 0xAA, 0xAA, 0xAA, // chunk size = (filesize - 8)
        0x57, 0x41, 0x56, 0x45, // WAVE

        0x66, 0x6D, 0x74, 0x20, // fmt
        0x10, 0x00, 0x00, 0x00, // chunk size = 16
        0x01, 0x00, // audio format = pcm
        0x01, 0x00, // channels = 1
        0x80, 0xBB, 0x00, 0x00, // sample rate = 48khz
        0x80, 0xBB, 0x00, 0x00, // byte rate = "SampleRate * NumChannels * BitsPerSample/8"
        0x01, 0x00, // block alignment
        0x08, 0x00, // sample bit depth = 8

        0x64, 0x61, 0x74, 0x61, // data
        0xAA, 0xAA, 0xAA, 0xAA // data size
    ]),
    riffSize: 0x04,
    channels: 0x16,
    sampleRate: 0x18,
    byteRate: 0x1C,
    dataSize: 0x28,
    dataStart: 0x2C
};

export async function bin2wav(bin: Buffer, opts: GlobalOptions): Promise<Buffer> {
    /*// calculate parameters
    const stub = Buffer.alloc(wavHdr.template.length);
    wavHdr.template.copy(stub);
    const datasize = bin.length;
    const filesize = stub.length + datasize;

    // build header
    stub.writeUInt32LE(filesize - 8, wavHdr.riffSize);
    stub.writeUInt32LE(datasize, wavHdr.dataSize);

    // composite header onto data
    return Buffer.concat([stub, bin], filesize);*/

    var wav = await ffaudio(bin, cmd => cmd
        .addInputOptions(
            "-f", opts.data_format,
            "-acodec", "pcm_" + opts.data_format,
            "-ac", opts.channels.toString(),
            "-ar", (opts.data_rate * 1000).toString())
        .outputFormat("wav"));
    
    // for some reason, bitexact seems to result in an incorrect data size *sometimes*
    // i dont know the exact situation that causes this, so... here's a dirty workaround
    wav.writeUInt32LE(wav.length - wavHdr.dataStart, wavHdr.dataSize);

    return wav;
}

export async function wav2bin(wav: Buffer, opts: GlobalOptions, temp = false): Promise<Buffer> {
    return await ffaudio(wav, cmd => cmd
        .outputFormat(opts.data_format)
        .audioCodec("pcm_" + opts.data_format)
        .audioChannels(opts.channels)
        .audioFrequency(opts.data_rate * 1000), false, temp);
}
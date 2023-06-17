import { CanvasRenderingContext2D } from "canvas";

import { canvasDo } from "../../util";
import { DataType, GlobalOptions } from "../../pipeline";
import { bin2wav } from "../../transform/wav";
import { registerStage } from "..";

// https://github.com/alexadam/img-encode
function toaudio(ctx: CanvasRenderingContext2D, width: number, height: number, duration: number, max: number) {
    const imgdata = ctx.getImageData(0, 0, width, height);

    const srate = 48000;

    var tmpData = [];
    var maxFreq = 0;
    var numSamples = Math.round(srate * duration);
    var samplesPerPixel = Math.floor(numSamples / width);
    var C = max / height;
    var yFactor = 2

    for (var x = 0; x < numSamples; x++) {
        var rez = 0;
        var pixel_x = Math.floor(x / samplesPerPixel);

        for (var y = 0; y < height; y += yFactor) {
            var pixel_index = (y * width + pixel_x) * 4;
            var r = imgdata.data[pixel_index];
            var g = imgdata.data[pixel_index + 1];
            var b = imgdata.data[pixel_index + 2];

            var s = r + b + g;
            var volume = Math.pow(s * 100 / 765, 2);

            var freq = Math.round(C * (height - y + 1));
            rez += Math.floor(volume * Math.cos(freq * 6.28 * x / srate));
        }

        tmpData.push(rez);

        if (Math.abs(rez) > maxFreq) {
            maxFreq = Math.abs(rez);
        }
    }

    const buff = Buffer.alloc(tmpData.length * 4);
    for (var i = 0; i < tmpData.length; i++) {
        buff.writeInt32LE(0x7FFFFFFF * tmpData[i] / maxFreq, i * 4);
    }
    return buff;
}

registerStage("spectrogram", "encode", {
    type: DataType.Image,
    init(state, overrides: { seconds: number, max: number }) {
        if (overrides.seconds == null) overrides.seconds = 10;
        if (overrides.max == null) overrides.max = 20000;
        return overrides;
    },
    async run(state, args) {
        var buffer: Buffer;
        await canvasDo(state, async (ctx, img) => {
            ctx.drawImage(img, 0, 0);
            buffer = await bin2wav(toaudio(ctx, img.width, img.height, args.seconds, args.max), {
                channels: 1,
                data_rate: 48,
                data_format: "s32le"
            } as GlobalOptions);
        });
        state.buffer = buffer;
        state.type = DataType.Audio;
        state.initialType = DataType.Audio;
    }
});
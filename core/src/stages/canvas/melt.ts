import { roll, canvasDo } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "..";

export interface MeltArguments {
    wmult: number;
    dmult: number;
    start: number;
    width: number;
    depth: number;
}

async function melt(state: PipelineState, args: Partial<MeltArguments>) {
    await canvasDo(state, (ctx, img) => {
        ctx.drawImage(img, 0, 0);
        ctx.antialias = "none";
        for (var x = 0; x < args.width; x++) {
            const shift = Math.floor(args.depth * Math.sin((x / args.width) * Math.PI));
            const rx = args.start + x;
            const data = ctx.getImageData(rx, 0, 1, state.globalOptions.height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#" + 
                data.data[0].toString(16).padStart(2, "0") +
                data.data[1].toString(16).padStart(2, "0") +
                data.data[2].toString(16).padStart(2, "0");
            ctx.beginPath();
            ctx.moveTo(rx, 0);
            ctx.lineTo(rx, shift + 1);
            ctx.stroke();

            ctx.putImageData(data, rx, shift, 0, 0, 1, state.globalOptions.height - shift);
        }
    });
}

registerStage("canvas", "melt", {
    type: DataType.Image,
    init(state: PipelineState, overrides?: Partial<MeltArguments>) {
        var wmult = 3;
        var dmult = 3;

        if (overrides) {
            if (overrides.wmult != null) wmult = overrides.wmult;
            if (overrides.dmult != null) dmult = overrides.dmult;
        }

        const wp = Math.floor(state.globalOptions.width / 100);
        const hp = Math.floor(state.globalOptions.height / 100);

        const width = roll(state, wp * wmult, wp * 2 * wmult);
        const depth = roll(state, hp * dmult, hp * 2 * dmult);

        const start = roll(state, 0, state.globalOptions.width - width);

        return Object.assign({
            start, width, depth
        }, overrides);
    },
    run: melt
});
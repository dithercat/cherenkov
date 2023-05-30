import { CanvasRenderingContext2D } from "canvas";

import { roll, canvasDo } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "../../stages";

export enum BuiltinPattern {
    HLines,
    VLines,
    DLines,
    Hexagon,
    Bricks,
    VBricks,
    Square,
    DSquare
};

export interface PatternArguments {
    pattern: BuiltinPattern;
    scale: number;
    width: number;
    fgstyle: string;
    bgstyle: string;
}

type StrokePosition = [number, number, boolean];

interface PatternData {
    width: number;
    height: number;
    strokes: StrokePosition[];
}

const patternData: Record<BuiltinPattern, PatternData> = [
    {
        width: 8,
        height: 2,
        strokes: [
            [0, 0, false],
            [7, 0, true]
        ]
    },
    {
        width: 2,
        height: 8,
        strokes: [
            [0, 0, false],
            [0, 7, true]
        ]
    },
    {
        width: 2.5,
        height: 2.5,
        strokes: [
            [0, 0, false],
            [1.5, 1.5, true]
        ]
    },
    {
        width: 5,
        height: 7,
        strokes: [
            [0, 1, false],
            [2, 0, true],
            [4, 1, true],
            [4, 3, true],
            [2, 4, true],
            [2, 6, true],
            [2, 4, false],
            [0, 3, true],
        ]
    },
    {
        width: 3,
        height: 3,
        strokes: [
            [0, 0, false],
            [2, 0, true],
            [2, 1, true],
            [0, 1, true],
            [1, 1, false],
            [1, 2, true],
        ]
    },
    {
        width: 3,
        height: 3,
        strokes: [
            [0, 0, false],
            [0, 2, true],
            [1, 2, true],
            [1, 0, true],
            [1, 1, false],
            [2, 1, true]
        ]
    },
    {
        width: 2,
        height: 2,
        strokes: [
            [0, 0, false],
            [0, 1, true],
            [1, 1, true]
        ]
    },
    {
        width: 3,
        height: 3,
        strokes: [
            [1, 0, false],
            [2, 1, true],
            [1, 2, true],
            [0, 1, true],
            [1, 0, true]
        ]
    }
];

const defaultStyles = [
    "#FF0000",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#0000FF",
    "#FF00FF",

    "#AF0000",
    "#AFAF00",
    "#00AF00",
    "#00AFAF",
    "#0000AF",
    "#AF00AF",

    "#7F7F7F",
    "#7F0000",
    "#7F7F00",
    "#007F00",
    "#007F7F",
    "#00007F",
    "#7F007F",
    
    "#FFFFFF",
    "#AFAFAF",
    "#7F7F7F",
    "#000000"
];

export function generatePattern(state: PipelineState, ctx: CanvasRenderingContext2D, args: Partial<PatternArguments>) {
    var pattern = roll(state, 0, (patternData as unknown as PatternData[]).length - 1);
    if (args.pattern != null) pattern = args.pattern;
    const data = patternData[pattern];

    var g = roll(state, 5, 50);
    if (args.width != null) g = args.width;
    var m = roll(state, g * 2, 100);
    if (args.scale != null) m = args.scale;

    const pw = (data.width - 1) * m;
    const ph = (data.height - 1) * m;

    var fg = defaultStyles[roll(state, 0, defaultStyles.length - 1)];
    var bg: string;
    do bg = defaultStyles[roll(state, 0, defaultStyles.length - 1)]; while (fg === bg);
    if (args.fgstyle != null) fg = args.fgstyle;
    if (args.bgstyle != null) bg = args.bgstyle;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, state.globalOptions.width, state.globalOptions.height);

    for (var y = -ph * 1.5; y < state.globalOptions.height; y += ph) {
        for (var x = -pw * 1.5; x < state.globalOptions.width; x += pw) {
            ctx.strokeStyle = fg;
            ctx.lineWidth = g;
            ctx.beginPath();
            for (var i = 0; i < data.strokes.length; i++) {
                var [sx, sy, draw] = data.strokes[i];
                sx *= m; sy *= m;
                sx += x; sy += y;
                if (draw) ctx.lineTo(sx, sy);
                else ctx.moveTo(sx, sy);
            }
            ctx.stroke();
        }
    }
}

registerStage("source", "pattern", {
    type: DataType.Image,
    run(state, args: Partial<PatternArguments>) {
        return canvasDo(state, async ctx => generatePattern(state, ctx, args));
    }
});
import fs from "fs";
import path from "path";

import { Image, loadImage, createCanvas } from "canvas";

import { canvasDo, resource, lazyPlus, println } from "../../util";
import { PipelineState, DataType } from "../../pipeline";
import { registerStage } from "..";

const L2U = 0x20;
const A = 0x61;
const Z = 0x7A;

interface FontManifest {
    name: string;
    rules: {
        invert?: boolean;
        cased?: boolean;
        antialias?: boolean;
        extension: string;
        ranges: (string | [string, string])[];
    };
    dimensions: {
        height: number;
        width?: number;
    };
}

interface FontInfo {
    manifest: FontManifest;
    chars: Record<string, Image>;
}

async function loadFont(name: string): Promise<FontInfo> {
    const fontpath = path.resolve(resource("fonts"), name);
    const manifestpath = path.resolve(fontpath, "index.json");
    if (!fs.existsSync(manifestpath)) {
        throw new Error("font " + name + " does not exist");
    }
    const manifest: FontManifest = JSON.parse(fs.readFileSync(manifestpath).toString());
    const charentries: [string, Image][] = [];
    for (var range of manifest.rules.ranges) {
        if (typeof range === "string") range = [range, range];
        const [start, stop] = range.map(x => x.charCodeAt(0));
        for (var i = start; i <= stop; i++) {
            const charstr = String.fromCharCode(i);
            println(4, i.toString(16).toLowerCase());
            var charpath = path.resolve(fontpath, i.toString(16).toLowerCase() + "." + manifest.rules.extension);
            if (!fs.existsSync(charpath)) {
                charpath = path.resolve(fontpath, charstr + "." + manifest.rules.extension);
            }
            if (!fs.existsSync(charpath)) {
                throw new Error("invalid font manifest");
            }
            const charbuff = fs.readFileSync(charpath);
            var charimg = await loadImage(charbuff);

            const canvas = createCanvas(charimg.width, charimg.height);
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = manifest.rules.antialias !== false;
            ctx.fillStyle = manifest.rules.invert ? "#FFF" : "#000";
            ctx.fillRect(0, 0, charimg.width, charimg.height);
            ctx.drawImage(charimg, 0, 0);
            if (manifest.rules.invert) {
                const pcanvas = new (lazyPlus())()
                pcanvas.importCanvas(canvas);
                pcanvas.curves({ rgb: [255, 0] });   
            }
            // ???
            const invert = canvas.toBuffer("image/png", { compressionLevel: 0 });
            //fs.writeFileSync("DEBUG_RENDER_CHAR_INVERT.png", invert);
            charimg = await loadImage(invert);

            charentries.push([charstr, charimg]);
            if (i >= A && i <= Z && !manifest.rules.cased) {
                charentries.push([charstr.toUpperCase(), charimg]);
            }
        }
    }
    return {
        manifest,
        chars: Object.fromEntries(charentries)
    }
}

function measureString(font: FontInfo, str: string): number {
    // monospace
    if (font.manifest.dimensions.width != null) {
        return font.manifest.dimensions.width * str.length;
    }
    var width = 0;
    for (var i = 0; i < str.length; i++) {
        const char = str[i];
        println(4, char, i);
        if (char in font.chars) {
            const img = font.chars[char];
            if (img != null && img.width != null) {
                //println(4, "non-monospace; add block", width, img.width);
                width += img.width;
            }
            /*else {
                println(1, "img.width == null", img);
            }*/
        }
    }
    return width;
}

export interface TextRenderArguments {
    font: string;
}

registerStage("text", "render", {
    type: DataType.Text,
    init(state: PipelineState, overrides?: Partial<TextRenderArguments>) {
        return Object.assign({ font: "default" }, overrides);
    },
    async run(state, args) {
        const text = state.buffer.toString("utf-8").trim();
        const font = await loadFont(args.font);
        state.globalOptions.width = measureString(font, text);
        state.globalOptions.height = font.manifest.dimensions.height;
        println(4, "measureString says", state.globalOptions.width, state.globalOptions.height);
        await canvasDo(state, async ctx => {
            var dx = 0;
            for (var i = 0; i < text.length; i++) {
                const ch = text[i];
                var w = font.manifest.dimensions.width;
                if (w == null) { w = 0; }
                switch (ch) {
                    /*case "\n":
                    case "\r":
                    case " ":
                        println(4, "skip", ch);
                        continue;*/
                    default:
                        //println(4, "draw char", escape(ch));
                        if (!(ch in font.chars)) {
                            println(4, "no entry for char 0x" + ch.charCodeAt(16));
                        }
                        else {
                            const img = font.chars[ch];
                            w = img.width;
                            //const x = i * w;
                            const y = 0;
                            ctx.drawImage(img, dx, y);
                        }
                }
                dx += w;
                //println(4, "xpos", w, dx);
            }
        }, false);
        state.type = DataType.Image;
        state.initialType = DataType.Image;
        println(2, "text rendered!");
        //fs.writeFileSync("RENDER_DEBUG.bmp", state.buffer);
    }
});
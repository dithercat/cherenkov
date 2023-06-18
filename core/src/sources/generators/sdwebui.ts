import { DataType, PipelineState, isPipelineState } from "../../pipeline";
import { registerStage } from "../../stages";
import { println, roll } from "../../util";

// i hate the sampler names used by sd webui api
export enum StableDiffusionSamplers {
    Euler = "Euler",
    Euler_a = "Euler a",
    LMS = "LMS",
    Heun = "Heun",
    DPM2 = "DPM2",
    DPM2_a = "DPM2 a",
    DPM_fast = "DPM fast",
    DPM_adaptive = "DPM adaptive",
    DPMpp_2S_a = "DPM++ 2S a",
    DPMpp_2M = "DPM++ 2M",
    DPMpp_SDE = "DPM++ SDE",
    DDIM = "DDIM",
    PLMS = "PLMS",
    UniPC = "UniPC"
}
const sampler_fix: Record<string, StableDiffusionSamplers> = {
    euler: StableDiffusionSamplers.Euler,

    eulera: StableDiffusionSamplers.Euler_a,
    euler_a: StableDiffusionSamplers.Euler_a,
    ["euler a"]: StableDiffusionSamplers.Euler_a,

    lms: StableDiffusionSamplers.LMS,

    heun: StableDiffusionSamplers.Heun,

    dpm2: StableDiffusionSamplers.DPM2,

    dpm2a: StableDiffusionSamplers.DPM2_a,
    dpm2_a: StableDiffusionSamplers.DPM2_a,
    ["dpm2 a"]: StableDiffusionSamplers.DPM2_a,

    dpmfast: StableDiffusionSamplers.DPM_fast,
    dpm_fast: StableDiffusionSamplers.DPM_fast,
    ["dpm fast"]: StableDiffusionSamplers.DPM_fast,

    dpmadaptive: StableDiffusionSamplers.DPM_adaptive,
    dpm_adaptive: StableDiffusionSamplers.DPM_adaptive,
    ["dpm adaptive"]: StableDiffusionSamplers.DPM_adaptive,

    dpmpp2sa: StableDiffusionSamplers.DPMpp_2S_a,
    dpmpp_2s_a: StableDiffusionSamplers.DPMpp_2S_a,
    ["dpm++ 2s a"]: StableDiffusionSamplers.DPMpp_2S_a,

    dpmpp2m: StableDiffusionSamplers.DPMpp_2M,
    dpmpp_2m: StableDiffusionSamplers.DPMpp_2M,
    ["dpm++ 2m"]: StableDiffusionSamplers.DPMpp_2M,

    dpmppsde: StableDiffusionSamplers.DPMpp_SDE,
    dpmpp_sde: StableDiffusionSamplers.DPMpp_SDE,
    ["dpm++ sde"]: StableDiffusionSamplers.DPMpp_SDE,

    ddim: StableDiffusionSamplers.DDIM,

    plms: StableDiffusionSamplers.PLMS,
    
    unipc: StableDiffusionSamplers.UniPC
};

export interface StableDiffusionArguments {
    seed: number;
    steps: number;
    cfg_scale: number;
    sampler_name: StableDiffusionSamplers | keyof typeof sampler_fix;
    sampler?: StableDiffusionSamplers | keyof typeof sampler_fix;
    width: number;
    height: number;
    prompt: string | PipelineState[];
    prompt_in_args: boolean;
    prompt_prefix: string;
    negative_prompt: string;
    denoising_strength: number;
    substates?: PipelineState[];
}

async function generate(args: Partial<StableDiffusionArguments>, buff?: Buffer) {
    println(2, "stable diffusion prompt", args.prompt);
    const img2img = buff != null;
    const res = await fetch("http://127.0.0.1:7860/sdapi/v1/" + (img2img ? "img2img" : "txt2img"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.assign({
            init_images: img2img ? [buff.toString("base64")] : null
        }, args))
    });
    const json: any = await res.json();
    return Buffer.from(json.images[0], "base64");
}

registerStage("sd", "txt2img", {
    type: DataType.Text,
    init(state, overrides: Partial<StableDiffusionArguments>) {
        // generate a random, completely incoherent prompt if one isnt provided
        var fallback = "";
        for (var i = 0; i < 16 + 1; i++) {
            if (i == 8) fallback += " ";
            else fallback += String.fromCharCode(roll(state, 0x61, 0x7A));
        }
        return Object.assign({
            seed: roll(state, 0, 2 ** 32 - 1),
            steps: 16,
            cfg_scale: 7,
            sampler_name: overrides.sampler || StableDiffusionSamplers.Euler,
            width: 512,
            height: 512,
            prompt: fallback,
            prompt_in_args: overrides.prompt != null,
            negative_prompt: "",
            denoising_strength: 0.50
        }, overrides);
    },
    async run(state, args) {
        if (args.sampler_name.toLowerCase() in sampler_fix) {
            args.sampler_name = sampler_fix[args.sampler_name.toLowerCase()];
        }
        if (!args.prompt_in_args && state.initialType === DataType.Text) {
            args.prompt = state.buffer.toString();
        }
        args.prompt = args.prompt_prefix + ", " + args.prompt;
        state.buffer = await generate(args);
        state.type = DataType.Image;
        state.initialType = DataType.Image;
    }
});

registerStage("sd", "img2img", {
    type: DataType.Image,
    init(state, overrides: Partial<StableDiffusionArguments>) {
        // generate a random, completely incoherent prompt if one isnt provided
        var fallback = "";
        for (var i = 0; i < 16 + 1; i++) {
            if (i == 8) fallback += " ";
            else fallback += String.fromCharCode(roll(state, 0x61, 0x7A));
        }
        return Object.assign({
            seed: roll(state, 0, 2 ** 32 - 1),
            steps: 16,
            cfg_scale: 7,
            sampler_name: overrides.sampler || StableDiffusionSamplers.Euler,
            prompt: fallback,
            prompt_in_args: overrides.prompt != null,
            negative_prompt: "",
            denoising_strength: 0.50
        }, overrides);
    },
    async run(state, args) {
        if (args.sampler_name.toLowerCase() in sampler_fix) {
            args.sampler_name = sampler_fix[args.sampler_name.toLowerCase()];
        }
        if (!args.prompt_in_args) {
            if (Array.isArray(args.substates)) {
                const seedstate = args.substates[0];
                if (isPipelineState(seedstate)) {
                    if (seedstate.type !== DataType.Text)
                        throw new Error("need string prompt");
                    args.prompt = seedstate.buffer.toString("utf-8");
                }
                else throw new Error("invalid prompt");
            }
            else throw new Error("invalid prompt");
        }
        args.width = args.width || state.globalOptions.width;
        args.height = args.height || state.globalOptions.height;
        args.prompt = args.prompt_prefix + ", " + args.prompt;
        state.buffer = await generate(args, state.buffer);
        state.initialType = DataType.Image;
        state.globalOptions.width = args.width;
        state.globalOptions.height = args.height;
    }
});
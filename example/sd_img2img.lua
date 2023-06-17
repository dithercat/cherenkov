-- img2img sample
-- cherenkov -t image -i whatever.png -o whatever_out.bmp -l sd_img2img.lua

output(function ()
    from("@input")
    push(function () stage.source.fluidcoast() end)
    stage.sd.img2img({
        cfg_scale = 11,
        prompt_prefix = "absurdres",
        negative_prompt = "nsfw, text, error",
        denoising_strength = 0.5
    })
end)
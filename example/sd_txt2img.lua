-- some seeds for safe keeping
-- -s 80efb2a34f4fd0a0d043d916e7f7b8b2cc22254e5155a9ccd65fa5c97f24f94b
-- -s 679cc8c9ef4c0a5a5c642553e505cf6fe939759aad687c59dc229ee36240b909
-- -s 9ba7a7d78c77a7415a63583ca91376e287185870ba443efa90910ba51123f6ee

output(function ()
    stage.source.fluidcoast()
    stage.sd.txt2img({
        cfg_scale = 11,
        prompt_prefix = "absurdres",
        negative_prompt = "nsfw, text, error"
    })
end)
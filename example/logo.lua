-- logo
-- by dither, 2022

local SIZE = 1024
local FACTOR = 2
local FINAL_SIZE = SIZE / FACTOR
local SKEW_SIZE = 20 / FACTOR

-- enable/disable lossy stages, for faster testing
local LOSSY = true
-- causes the pentagram pipeline to overwrite instead of composing
local FG_COPY = false

local FG_DESAT = false
local BG_GREEN = false

seed("make it really pretty")

local function green()
    -- blanks with a pattern of 00 FF
    -- this doubles up to 00 FF 00 0FF
    -- the result is green; rgba(0, 1, 0, 1)
    stage.source.blank({ sequence = { 0x00, 0xFF } })
end

-- the plasma is the primary source of the color in this piece
local function plasma()
    -- generate some plasma 
    stage.source.plasma()
    -- scale the resulting image to 256x1024
    -- this is done to make the sstv scanlines appear wider
    stage.util.scale({ width = SIZE / 4, height = SIZE })

    -- encode the image with sstv
    stage.sstv.encode()
    -- compress the resulting audio with opus at 24kbps
    -- this introduces noise in the resulting image
    stage.audio.libopus({ bitrate = 24 })
    -- decode the sstv data to get our final plasma element
    stage.sstv.decode()
end

-- cherenkov includes an assortment of colorful images to use as sources
-- these come from a much older image corruption experiment, which simply
-- referred to them as "spectrums"
local function spectrum()
    -- spectrum 6 is a visually interesting one
    stage.source.spectrum({ index = 6 })
    -- sharpen it to make the vertical lines more intense
    stage.cfilter.sharpen()
end

local function pentagram()
    from("@input2")
    stage.util.scale({ width = FINAL_SIZE, height = FINAL_SIZE })

    stage.opfilter.invert()

    -- run through mp3
    if LOSSY then stage.audio.libmp3lame({ bitrate = 32 }) end

    -- pretty rgb skewing
    stage.rgb.skew({
        anchor = 0,
        offsets = SKEW_SIZE,
        start = 0,
        ["end"] = 999999
    })
    -- recenter image
    stage.util.discard({ count = SKEW_SIZE * 3 })

    -- desaturate a bit, so the red and blue arent too distracting
    if FG_DESAT then stage.filter.saturation({ value = -72 }) end

    -- run through mp3 again to make it look a little more organic
    if LOSSY then stage.audio.libmp3lame({ bitrate = 64 }) end
end

output(function ()
    -- take input pipeline as source
    from("@input")
    -- the input is audio data, but we want to cast it to an image
    as(IMAGE)
    -- 1024 is the default width when casting to an image from a non-image
    -- the result with large amounts of data is an extremely tall image
    -- so, let's crop the image to a nice square 1024x1024 pixels
    stage.util.crop({ width = SIZE, height = SIZE })

    -- push can also accept a function
    -- doing so will create and push a pipeline onto the stack automatically
    push(plasma)
    -- compose the two pipeline states at the *bottom* of the stack into one
    -- in this case, we use the "color" composition operation
    -- see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
    stage.compose.color()

    -- create and push the result of the spectrum pipeline
    push(spectrum)
    -- "blend" uses a formula that is intended to crossfade two images
    -- however, it expects a float value in the range of 0-1 inclusive
    -- giving it a value greater than 1 results in visually interesting errors
    stage.scompose.blend({ intensity = 1.7 })

    if LOSSY then
        -- flip the image diagonally before running it through mp3
        -- normally, artifacts from lossy audio compression have a "grain" across
        -- the x axis; flipping causes the grain to be vertical instead
        stage.util.flip45()
        -- compress the image using mp3 at 64kbps
        -- cherenkov automatically "casts" between audio and image data
        stage.audio.libmp3lame({ bitrate = 64 })
        -- flip the image back, yielding the final result
        stage.util.flip45()
    end

    if BG_GREEN then
        -- color it green
        push(green)
        stage.compose.hue()
    end

    -- darken a bit to make the pentagram clearer
    stage.filter.brightness({ value = -64 })

    -- super fine details wont be visible when the logo is small
    -- so, just crop to the corner
    stage.util.crop({
        width = FINAL_SIZE / 2,
        height = FINAL_SIZE / 2
    })
    stage.util.scale({
        width = FINAL_SIZE,
        height = FINAL_SIZE,
        antialias = false
    })

    -- overlay pentagram
    push(pentagram)
    if FG_COPY then
        stage.ucompose.copy()
    else
        stage.ucompose.screen()
    end
end)
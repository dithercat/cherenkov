-- buzz
-- by dither, 2021
-- converted to lua and annotated 2022

-- the basis of this piece was created accidentally during testing and
-- development due to a bug in automatic casting. i liked it, so i developed
-- it further (after fixing the bug...)

local SIZE = 1024

-- set a seed for the rng
seed("make it really pretty")

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
-- these come from a much older image corruption experiment, which simple
-- referred to them as "spectrums"
local function spectrum()
    -- spectrum 6 is a visually interesting one
    stage.source.spectrum({ index = 6 })
    -- sharpen it to make the vertical lines more intense
    stage.cfilter.sharpen()
end

-- the output pipeline, which produces the final file
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

    -- flip the image diagonally before running it through mp3
    -- normally, artifacts from lossy audio compression have a "grain" across
    -- the x axis; flipping causes the grain to be vertical instead
    stage.util.flip45()
    -- compress the image using mp3 at 64kbps
    -- cherenkov automatically "casts" between audio and image data
    stage.audio.libmp3lame({ bitrate = 64 })
    -- flip the image back, yielding the final result
    stage.util.flip45()
end)
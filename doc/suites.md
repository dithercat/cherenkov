# stage suites
TODO: generate this file automatically!

## audio
lossy audio compression codecs
- libmp3lame
- aac
- libvorbis
- libopus
- wmav1
- wmav2

## audio-extended
more audio codecs
- mp2

## voice
lossy audio codecs intended for voice (more destructive)
- libopencore_amrnb
- libgsm_ms
- nellymoser
- libspeex
- real_144

## image
lossy image compression codecs
- jpg
- jp2
- webp
- heic
- gif

## bend
classic synthetic corruption effects
- shallow
- reverse
- skip
- smear
- invert

## rgb
classic corruptions related to rgb
- skew
- remap

## const
mathematical corruptions using constant values
- add
- mult
- div
- xor
- overwrite

## rand
mathematical corruptions using random values
- mult
- div
- overwrite
- irradiate

## canvas
custom canvas-based effects
- melt
- blockshift

## filter
image filters
- brightness
- contrast
- saturation
- hue
- temperature
- gamma
- threshold

## cfilter
stronger image filters
- sharpen
- sepia
- normalize

## opfilter
"overpowered" image filters
- emboss
- solarize
- findEdges
- curves
- invert
- convolve

## text
text generation and processing
- gltchrr
- uwuize
- nato
- codepage
- hex
- unhex
- base64
- unbase64
- binary
- renderer
- concat
- wrap
- upper
- lower
- trim

## tts
text to speech
- dectalk
- dscs

## sstv
robot36 modem
- encode
- decode

## spectrogram
stages related to spectrograms

## source
messy catchall that should be split into multiple suites eventually
- blank
- string
- tone
- dtmf
- mf
- adjective
- noun
- fluidcoast
- enchant
- keysmash
- randomart
- plasma
- pattern
- spectrum

## mid
midstages
- decay

## util
special-purpose stages
- pcm_u8
- crush
- setopt
- crop
- scale
- flip45
- concat
- discard
- cast
- seal
- reseed

## internal
intended for internal use only
- stackpush
- stackflush
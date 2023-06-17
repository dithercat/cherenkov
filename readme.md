<img src="example/logo.png" width="256"/>

# cherenkov

automated generative art and databending toolset

contains a huge variety of experiments jammed into a single tree

this software was created for personal use; i cannot provide support in using it

### known ambient dependencies

- node
- ffmpeg
- imagemagick
- wine (optional, needed for dectalk)
- xvfb (optional, needed for dectalk)
- stable-diffusion-webui (optional, needed for stable diffusion, start with `--api`)

### install instructions

#### manually

- install dependencies
- build with `cd core;yarn;yarn build;cd ../frontend;yarn;yarn build;cd ..`
- run with `./frontend/dist/cli.js`
- install with `npm install -g ./frontend`

### notes

- will not work on windows, but wsl should work

### example scripts

the script, input manifest, and source files used to create the cherenkov logo are included in the `example/` directory, among others

instructions for invoking them are under `example/README.md`
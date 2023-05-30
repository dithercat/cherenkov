import path from "path";
import child_process from "child_process";

import { resource } from ".";

const DISPLAY = ":22011116";

export function winerun(program: string, ...args: string[]) {
    const xvfb = child_process.spawn("Xvfb", [DISPLAY, "-screen", "0", "800x600x24"]);
    const exe = resource(program);
    child_process.spawnSync("wine", [exe].concat(...args), {
        cwd: path.dirname(exe),
        env: { DISPLAY }
    });
    xvfb.kill();
}
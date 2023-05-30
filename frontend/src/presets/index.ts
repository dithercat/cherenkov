import type { ProgramConfig } from "../config";

import _super from "./super.json";
import deepfry from "./deepfry.json";
import audio from "./audio.json";
import crunch from "./crunch.json";
import classic from "./classic.json";

export type ConfigPreset = "super" | "deepfry" | "audio" | "crunch" | "classic";

export const presets: Record<ConfigPreset, Partial<ProgramConfig>> = {
    super: _super,
    deepfry,
    audio,
    crunch,
    classic
} as Record<ConfigPreset, Partial<ProgramConfig>>;
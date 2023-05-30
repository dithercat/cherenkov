import { roll } from "../../util";
import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";

// homerow layouts
enum KeyboardLayout {
    QWERTY = "qwerty",
    QWERTY_Full = "qwerty2",
    AZERTY = "azerty",
    Dvorak = "dvorak",
    Colemak = "colemak"
}
const homerows: Record<KeyboardLayout, string> = {
    qwerty: "sdfghjkl",
    qwerty2: "asdfghjkl;",
    azerty: "qsdfghjklm",
    dvorak: "aoeuidhtns",
    colemak: "arstdhneio"
};
registerStage("source", "keysmash", {
    type: DataType.Text,
    init(state, overrides: Partial<{ length: number, layout: KeyboardLayout }>) {
        const _length = roll(state, 8, 32);
        overrides.length = typeof overrides.length === "number" ? overrides.length : _length;
        overrides.layout = overrides.layout in homerows ? overrides.layout : KeyboardLayout.QWERTY;
        return overrides;
    },
    run(state, args) {
        const keys = homerows[args.layout] + " ";
        var output = [];
        for (var i = 0; i < args.length; i++) output.push(keys[roll(state, 0, keys.length - 1)]);
        state.buffer = Buffer.from(output.join(''), "utf-8");
    }
});
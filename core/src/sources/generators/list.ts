import { DataType } from "../../pipeline";
import { registerStage } from "../../stages";
import { loadlist, roll, draw } from "../../util";

function liststage(list: string, min: number = 1, max: number = 1) {
    const mylist = loadlist(list);
    registerStage("list", list, {
        type: DataType.Text,
        init(state, overrides: Partial<{ words: number }>) {
            const w = roll(state, min, max);
            if (overrides.words == null) overrides.words = w;
            return overrides;
        },
        run(state, args) {
            const words: string[] = [];
            for (var i = 0; i < args.words; i++) {
                words.push(draw(state, mylist));
            }
            state.buffer = Buffer.from(words.join(" "));
        }
    });
}

liststage("enchant", 2, 4);
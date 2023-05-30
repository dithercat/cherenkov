import { readFileSync } from "fs";
import { resolve } from "path";

export function resource(filename: string) {
    return resolve(__dirname, "..", "..", "resources", filename);
}

export function luascript(filename: string) {
    return resolve(__dirname, "..", "..", "lua", filename + ".lua");
}

const listcache: Record<string, string[]> = {};
export function loadlist(name: string): string[] {
    name = name.toLowerCase();
    if (name in listcache) return listcache[name];
    const raw = readFileSync(resource("lists/" + name + ".txt")).toString();
    const list = raw.split("\n").map(x => x.trim()).filter(x => {
        if (x[0] === "#") return false;
        if (x.length === 0) return false;
        return true;
    });
    listcache[name] = list;
    return list;
}
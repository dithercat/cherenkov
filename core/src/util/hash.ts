import { createHash } from "crypto";

import msgpack from "msgpack-lite";

export function hashObject(...obj: any[]) {
    const blobs = obj.map(x => msgpack.encode(x));
    const blob = Buffer.concat(blobs);
    const hash = createHash("sha256");
    hash.update(blob);
    return hash.digest("hex");
}
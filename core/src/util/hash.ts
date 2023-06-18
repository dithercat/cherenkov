import { createHash } from "crypto";

import msgpack from "msgpack-lite";

export function hashObject(...obj: any[]) {
    const blobs = obj.map(x => msgpack.encode(x));
    const blob = Buffer.concat(blobs);
    const hash = createHash("sha256");
    for (var i = 0; i < Math.ceil(blob.length / 1024); i++) {
        hash.update(blob.subarray(i * 1024, i * 1024 + 1024));
    }
    return hash.digest("hex");
}
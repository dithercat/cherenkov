const bmpHdr = {
    template: Buffer.from([
        0x42, 0x4D, 0xAA, 0xAA, 0xAA, 0xAA, 0x00, 0x00,
        0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
        0x00, 0x00, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA,
        0xAA, 0xAA, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xAA, 0xAA, 0xAA, 0xAA, 0xC4, 0x0E,
        0x00, 0x00, 0xC4, 0x0E, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]),
    sizeFile: 2,
    offset: 10,
    pxWidth: 18,
    pxHeight: 22,
    sizeBitmap: 34
};

function calcstride(w: number) {
    return w + (4 - w % 4) % 4;
}

export function bin2bmp(bin: Buffer, width: number = 1024): Buffer {
    // calculate parameters
    const stub = Buffer.alloc(bmpHdr.template.length);
    bmpHdr.template.copy(stub);
    const rows = Math.ceil(bin.length / width / 3);
    const cols = width * 3;
    const stride = calcstride(cols);
    const datasize = stride * rows;
    const filesize = stub.length + datasize;

    // build bmp header
    stub.writeUInt32LE(filesize, bmpHdr.sizeFile);
    stub.writeUInt32LE(width, bmpHdr.pxWidth);
    stub.writeUInt32LE(rows, bmpHdr.pxHeight);
    stub.writeUInt32LE(datasize, bmpHdr.sizeBitmap);

    // write data
    const target = Buffer.alloc(datasize);
    for (var y = 0; y < rows; y++)
        for (var x = 0; x < cols; x++)
            target[y * stride + x] = bin[y * cols + x];

    // composite header onto data
    return Buffer.concat([stub, target], filesize);
}

export function bmp2bin(bmp: Buffer): { bin: Buffer, width: number, height: number } {
    const offset = bmp.readUInt32LE(bmpHdr.offset);
    const length = bmp.readUInt32LE(bmpHdr.sizeBitmap);
    const rows = bmp.readUInt32LE(bmpHdr.pxHeight);
    const pcols = bmp.readUInt32LE(bmpHdr.pxWidth);
    const cols = pcols * 3;
    const stride = calcstride(cols);
    const data = bmp.subarray(offset, offset + length);
    const bin = Buffer.alloc(length);
    for (var y = 0; y < rows; y++)
        for (var x = 0; x < cols; x++)
            bin[y * cols + x] = data[y * stride + x];
    return { bin, width: pcols, height: rows };
}
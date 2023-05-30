const dtmfRows = [
    697,
    770,
    852,
    941
];

const dtmfCols = [
    1209,
    1336,
    1477,
    1633
];

const dtmfPad = "123A456B789C*0#D";

export function dtmf(digit: string): number[] {
    const index = dtmfPad.indexOf(digit.toUpperCase());
    if (index === -1) return [];
    return [
        dtmfRows[Math.floor(index / dtmfRows.length)],
        dtmfCols[index % dtmfRows.length]
    ];
}
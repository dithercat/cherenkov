// mf's layout does not correspond to a dialpad ;w;
const mfPairs = {
    1: [7, 9],
    2: [7, 11],
    3: [9, 11],
    4: [7, 13],
    5: [9, 13],
    6: [11, 13],
    7: [7, 15],
    8: [9, 15],
    9: [11, 15],
    0: [13, 15],
    ST3: [7, 17],
    ST2: [9, 17],
    KP: [11, 17],
    "*": [11, 17],
    KP2: [13, 17],
    ST: [15, 17],
    "#": [15, 17]
};

export function mf(digit: string): number[] {
    const pair = mfPairs[digit.toUpperCase()];
    if (pair == null) return [];
    const [a, b] = pair;
    return [a * 100, b * 100];
}
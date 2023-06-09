const crypto = require("crypto");

const N = 256;

function isInteger(n) {
    return parseInt(n, 10) === n;
}

function identityPermutation() {
    var s = new Array(N);
    for (var i = 0; i < N; i++) {
        s[i] = i;
    }
    return s;
}

function seed(key) {
    if (key === undefined) {
        key = new Array(N);
        for (var k = 0; k < N; k++) {
            key[k] = Math.floor(Math.random() * N);
        }
    } else if (typeof key === "string") {
        // to string
        key = "" + key;
        key = key.split("").map(function (c) { return c.charCodeAt(0) % N; });
    } else if (Array.isArray(key)) {
        if (!key.every(function (v) {
            return typeof v === "number" && v === (v | 0);
        })) {
            throw new TypeError("invalid seed key specified: not array of integers");
        }
    } else {
        throw new TypeError("invalid seed key specified");
    }

    var keylen = key.length;

    // resed state
    var s = identityPermutation();

    var j = 0;
    for (var i = 0; i < N; i++) {
        j = (j + s[i] + key[i % keylen]) % N;
        var tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
    }

    return s;
}

export class RC4 {

    seed: string;
    s: any[];
    i: number;
    j: number;

    constructor(key: string) {
        this.seed = key;
        this.s = seed(key);
        this.i = 0;
        this.j = 0;
    }

    public static genSeed() {
        return crypto.randomBytes(32).toString('hex');
    }

    randomByte() {
        this.i = (this.i + 1) % N;
        this.j = (this.j + this.s[this.i]) % N;

        var tmp = this.s[this.i];
        this.s[this.i] = this.s[this.j];
        this.s[this.j] = tmp;

        var k = this.s[(this.s[this.i] + this.s[this.j]) % N];

        return k;
    }

    randomUInt32() {
        var a = this.randomByte();
        var b = this.randomByte();
        var c = this.randomByte();
        var d = this.randomByte();

        return ((a * 256 + b) * 256 + c) * 256 + d;
    }

    randomFloat() {
        return this.randomUInt32() / 0x100000000;
    }

    random() {
        var a;
        var b;

        if (arguments.length === 1) {
            a = 0;
            b = arguments[0];
        } else if (arguments.length === 2) {
            a = arguments[0];
            b = arguments[1];
        } else {
            throw new TypeError("random takes one or two integer arguments");
        }

        if (!isInteger(a) || !isInteger(b)) {
            throw new TypeError("random takes one or two integer arguments");
        }

        return a + this.randomUInt32() % (b - a + 1);
    }

    currentState() {
        return {
            i: this.i,
            j: this.j,
            s: this.s.slice(), // copy
        };
    }

    setState(state) {
        var s = state.s;
        var i = state.i;
        var j = state.j;

        /* eslint-disable yoda */
        if (!(i === (i | 0) && 0 <= i && i < N)) {
            throw new Error("state.i should be integer [0, " + (N - 1) + "]");
        }

        if (!(j === (j | 0) && 0 <= j && j < N)) {
            throw new Error("state.j should be integer [0, " + (N - 1) + "]");
        }
        /* eslint-enable yoda */

        // check length
        if (!Array.isArray(s) || s.length !== N) {
            throw new Error("state should be array of length " + N);
        }

        // check that all params are there
        for (var k = 0; k < N; k++) {
            if (s.indexOf(k) === -1) {
                throw new Error("state should be permutation of 0.." + (N - 1) + ": " + k + " is missing");
            }
        }

        this.i = i;
        this.j = j;
        this.s = s.slice(); // assign copy
    }

}
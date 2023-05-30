export function gltchrr(state) {

    function rand() {
        return state.rng.randomFloat();
    }

    // base coefficients
    const tuning = {
        base: 0.4,

        slurring: 0.05,
        stutter: 0.1,
        bitrot: 0.09,
        blackout: 0.005,
        garbage: 0.015,
        zalgo: 0.7,

        overread: 0.3
    };

    // raw parameters
    const params = {
        base: 1,

        varyBy: 0.15,
        decayTo: 1.4,
        decayExponent: 2,

        vary: true,
        decay: false
    };

    // generate a random character
    function trashCh() { return String.fromCharCode(Math.floor(0x20 + rand() * 0xe0)); }

    // postprocessing
    const postprocess = {

        // append random garbage data to the end of the string, crudely simulating a buffer overread
        overread(msg, intensity) {
            if (rand() >= intensity) return msg;
            const times = 1 + Math.floor(rand() * 0x20);
            for (var j = 0; j < times; j++) msg += trashCh();
            return msg;
        }

    }

    // text transformations
    // these are defined in the order they are executed
    const transform = {

        // remove whitespace characters
        slurring(data, intensity, p) {
            if (data[p.i] === ' ' && rand() < intensity)
                data.splice(p.i, 1);
        },

        // cause characters to repeat as if stuttering
        stutter(data, intensity, p) {
            if (rand() < intensity) {
                const times = 1 + Math.floor(rand() * 4);
                for (var j = 0; j < times; j++)
                    data.splice(p.i, 0, data[p.i]);
                p.i += times + 1;
            }
        },

        // flip bits in characters
        bitrot(data, intensity, p) {
            if (rand() < intensity) {
                data[p.i] = String.fromCharCode(Math.max(data[p.i].charCodeAt() ^ (1 << Math.floor(rand() * 8)), 0x20));
            }
        },

        // replace random stretches of characters with a full block as if they are missing
        blackout(data, intensity, p) {
            if (rand() < intensity) {
                const times = p.i + 1 + Math.floor(rand() * 4);
                while (p.i < times && p.i < data.length) data[p.i++] = '█';
            }
        },

        // insert random junk into the string
        garbage(data, intensity, p) {
            if (rand() < intensity) {
                const times = 1 + Math.floor(rand() * 0x8);
                for (var j = 0; j < times; j++) data.splice(p.i, 0, trashCh());
                p.i += times + 1;
            }
        },

        // insert diacritic marks (like zalgo text)
        zalgo(data, intensity, p) {
            if (rand() < intensity) {
                const times = p.i + 2 + Math.floor(rand() * 6);
                while (p.i < times) data.splice(++p.i, 0, String.fromCodePoint(0x300 + Math.floor(rand() * 0x4E)));
                p.i += times + 1;
            }
        }

    };


    // populate params with default coefficients
    Object.keys(transform).forEach(k => params[k] = 1);
    Object.keys(postprocess).forEach(k => params[k] = 1);

    // get a coefficient
    function getCoeff(name) {
        if (name in params) {
            if (name in tuning) return tuning[name] * params[name];
            return params[name];
        }
    }

    // used to add some additional randomness
    function vary(c) {
        const v = params.varyBy;
        const floor = 1 - v / 2
        return params.vary ? c * ((rand() * v) + floor) : c;
    }

    this.params = params;
    this.processText = function (text) {

        const base = getCoeff('base');

        // apply transformations on text
        const data = text.split('');
        Object.keys(transform).forEach(k => {
            const func = transform[k];
            const lparams = { i: 0 }
            for (; lparams.i < data.length; lparams.i++) {
                const decayC = Math.pow(1 / data.length * lparams.i, params.decayExponent);
                const decayStep = params.decay ? ((params.decayTo - base) * decayC) : 0;
                const lbase = vary(base + decayStep);
                if (data[lparams.i] === "\n") continue;
                func(data, lbase * getCoeff(k), lparams);
            }
        });
        text = data.join('');

        // apply postprocessing
        Object.keys(postprocess).forEach(k => text = postprocess[k](text, (params.decay ? params.decayTo : base) * getCoeff(k)));

        return text;

    };

};
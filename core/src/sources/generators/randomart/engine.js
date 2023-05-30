import os from "os";

import Worker from "web-worker";

function _engine() {

    const { new_picture, compute_pixel } = (() => {

        // core taken from random-art.org

        var callbacks = {};

        function ocaml_register(name, f) {
            callbacks[name] = f;
        }

        function ocaml_get(name) {
            return callbacks[name];
        }

        // compiled by ocamlc 3.11.1, ocamljs 0.2
        var ocamljs$caml_named_value = (function () {
            var Match_failure$16g = "Match_failure";
            var Out_of_memory$17g = "Out_of_memory";
            var Stack_overflow$24g = "Stack_overflow";
            var Invalid_argument$18g = "Invalid_argument";
            var Failure$19g = "Failure";
            var Not_found$20g = "Not_found";
            var Sys_error$21g = "Sys_error";
            var End_of_file$22g = "End_of_file";
            var Division_by_zero$23g = "Division_by_zero";
            var Sys_blocked_io$25g = "Sys_blocked_io";
            var Assert_failure$26g = "Assert_failure";
            var Undefined_recursive_module$27g = "Undefined_recursive_module";
            /*
             * This file is part of ocamljs, OCaml to Javascript compiler
             * Copyright (C) 2007-9 Skydeck, Inc
             *
             * This library is free software; you can redistribute it and/or
             * modify it under the terms of the GNU Library General Public
             * License as published by the Free Software Foundation; either
             * version 2 of the License, or (at your option) any later version.
             *
             * This library is distributed in the hope that it will be useful,
             * but WITHOUT ANY WARRANTY; without even the implied warranty of
             * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
             * Library General Public License for more details.
             *
             * You should have received a copy of the GNU Library General Public
             * License along with this library; if not, write to the Free
             * Software Foundation, Inc., 59 Temple Place - Suite 330, Boston,
             * MA 02111-1307, USA
             */

            var caml_blit_string = function (s1, o1, s2, o2, n) {
                for (var i = 0; i < n; i++)
                    oc$$ssetu(s2, o2 + i, oc$$srefu(s1, o1 + i));
            }
            var caml_callback = function (f, a) { return _(f, [a]); }
            var caml_callback2 = function (f, a1, a2) { return _(f, [a1, a2]); }
            var caml_callback3 = function (f, a1, a2, a3) { return _(f, [a1, a2, a3]); }
            var caml_callback4 = function (f, a1, a2, a3, a4) { return _(f, [a1, a2, a3, a4]); }
            var caml_callback5 = function (f, a1, a2, a3, a4, a5) { return _(f, [a1, a2, a3, a4, a5]); }
            var caml_callbackN = function (f, n, args) { return _(f, args); }
            // XXX caml_callback_exn ?
            var compare_val = function (v1, v2, total) {
                var LESS = -1;
                var GREATER = 1;
                var EQUAL = 0;
                var UNORDERED = -2; // XXX ok?

                // XXX needs some work

                if (v1 == v2 && total) return EQUAL;

                var t1 = typeof v1;
                var t2 = typeof v2;
                if (t1 == t2) {
                    switch (t1) {
                        case "boolean":
                            if (v1 < v2) return LESS;
                            if (v1 > v2) return GREATER;
                            return EQUAL;
                        case "number":
                            if (v1 < v2) return LESS;
                            if (v1 > v2) return GREATER;
                            if (v1 != v2) {
                                if (!total) return UNORDERED;
                                if (v1 == v1) return GREATER;
                                if (v2 == v2) return LESS;
                                return EQUAL;
                            }
                            return EQUAL;
                        case "string":
                            if (v1 < v2) return LESS;
                            if (v1 > v2) return GREATER;
                            return EQUAL;
                        case "function":
                            caml_invalid_argument("equal: functional value");
                        case "object":
                            // like NaN
                            if (v1 == null) {
                                if (v2 == null) return EQUAL;
                                return LESS;
                            }
                            if (v2 == null) return GREATER;

                            // XXX is there a way to get the class of an object as a value?
                            // XXX is it worth special casing various JS objects?
                            if (v1 instanceof Date) {
                                var t1 = v1.getTime();
                                var t2 = v2.getTime();
                                if (t1 < t2) return LESS;
                                if (t1 > t2) return GREATER;
                                return EQUAL;
                            }
                            if (v1 instanceof Array) {
                                // we should always either have both tags or neither
                                // so it is OK to fall through here
                                if (v1.t < v2.t) return LESS;
                                if (v1.t > v2.t) return GREATER;
                                var sz1 = v1.length;
                                var sz2 = v2.length;
                                if (sz1 < sz2) return LESS;
                                if (sz1 > sz2) return GREATER;
                                if (sz1 == 0) return EQUAL;
                                for (var i = 0; i < sz1; i++) {
                                    var c = compare_val(v1[i], v2[i], total);
                                    if (c != EQUAL) return c;
                                }
                                return EQUAL;
                            }
                            if (v1 instanceof oc$$ms) {
                                var s1 = v1.toString();
                                var s2 = v2.toString();
                                if (s1 < s2) return LESS;
                                if (s1 > s2) return GREATER;
                                return EQUAL;
                            }
                            if (v1._m != null && v2._m != null) { // i.e. an OCaml object XXX better test
                                var oid1 = v1[1];
                                var oid2 = v2[1];
                                if (oid1 < oid2) return LESS;
                                if (oid1 > oid2) return GREATER;
                                return EQUAL;
                            }
                            return UNORDERED; // XXX
                        default:
                            return UNORDERED;
                    }
                }

                // like NaN
                if (v1 == null) {
                    if (v2 == null) return EQUAL;
                    return LESS;
                }
                if (v2 == null) return GREATER;

                // one boolean and one int
                if (t1 == "boolean" || t2 == "boolean") {
                    if (v1 < v2) return LESS;
                    if (v1 > v2) return GREATER;
                    return EQUAL;
                }
                // one mutable and one immutable string
                if (t1 == "string" || t2 == "string") {
                    var s1 = v1.toString();
                    var s2 = v2.toString();
                    if (s1 < s2) return LESS;
                    if (s1 > s2) return GREATER;
                    return EQUAL;
                }
                // one constructor without data (number) and one with (object Array)
                if (t1 == "number") return LESS;
                if (t2 == "number") return GREATER;
                return UNORDERED;
            }
            var caml_compare = function (v1, v2) {
                var res = compare_val(v1, v2, 1);
                return res < 0 ? -1 : res > 0 ? 1 : 0;
            }
            var caml_equal = function (v1, v2) { return compare_val(v1, v2, 0) == 0; }
            var caml_failwith = function (s) { throw $(Failure$19g, s); }
            var caml_fill_string = function (s, o, l, c) {
                for (var i = 0; i < l; i++)
                    oc$$ssetu(s, o + i, c);
            }
            var caml_float_compare = function (v1, v2) {
                if (v1 === v2) return 0;
                if (v1 < v2) return -1;
                if (v1 > v2) return 1;
                if (v1 === v1) return 1;
                if (v2 === v2) return -1;
                return 0;
            }
            var caml_float_of_string = function (s) {
                var f = parseFloat(s);
                return isNaN(f) ? caml_failwith("float_of_string") : f;
            }
            var caml_classify_float = function (f) {
                if (isNan(f)) return 4; // FP_nan
                else if (!isFinite(f)) return 3; // FP_infinite
                else if (f === 0) return 2; // FP_zero
                // can't determine subnormal from js afaik
                else return 0; // FP_normal
            }

            var caml_format_int = function (f, a) {
                function parse_format(f) { return f; } // XXX see ints.c
                var f2 = parse_format(f);
                return oc$$sprintf(f2, a);
            }

            var caml_greaterthan = function (v1, v2) { return compare_val(v1, v2, 0) > 0; }
            var caml_greaterequal = function (v1, v2) { return compare_val(v1, v2, 0) >= 0; }
            var caml_hash_univ_param = function (count, limit, obj) {
                // globals
                hash_univ_limit = limit;
                hash_univ_count = count;
                hash_accu = 0;

                // XXX needs work
                function hash_aux(obj) {
                    hash_univ_limit--;
                    if (hash_univ_count < 0 || hash_univ_limit < 0) return;

                    function combine(n) { hash_accu = hash_accu * 65599 + n; }
                    function combine_small(n) { hash_accu = hash_accu * 19 + n; }

                    switch (typeof obj) {
                        case "number":
                            // XXX for floats C impl examines bit rep
                            // XXX for constructors without data C impl uses combine_small
                            hash_univ_count--;
                            combine(obj);
                            break;
                        case "string":
                            hash_univ_count--;
                            for (var i = obj.length; i > 0; i--)
                                combine_small(obj.charCodeAt(i));
                            break;
                        case "boolean":
                            hash_univ_count--;
                            combine_small(obj ? 1 : 0);
                            break;
                        case "object":
                            if (obj instanceof oc$$ms)
                                hash_aux(obj.toString());
                            else if (obj instanceof Array) { // possibly a block
                                if (obj.t) {
                                    hash_univ_count--;
                                    combine_small(obj.t);
                                    for (var i = obj.length; i > 0; i--)
                                        hash_aux(obj[i]);
                                }
                            }
                            else if (obj._m != null) { // OCaml object, use oid
                                hash_univ_count--;
                                combine(obj[1]);
                            }
                            break;
                        default:
                            break;
                    }
                }

                hash_aux(obj);
                return hash_accu & 0x3FFFFFFF;
            }
            var caml_input_value = function () { throw "caml_input_value"; }
            var caml_input_value_from_string = function () { throw "caml_input_value_from_string"; }
            var caml_install_signal_handler = function () { throw "caml_install_signal_handler"; }
            var caml_int_compare = function (i1, i2) { return (i1 > i2) - (i1 < i2); }
            var caml_int32_compare = function (i1, i2) { return (i1 > i2) - (i1 < i2); }
            var caml_int64_compare = function (i1, i2) { throw "caml_int64_compare"; }
            var caml_int64_float_of_bits = function (s) {
                // see pervasives.ml; int64s are represented by strings
                switch (s) {
                    case "9218868437227405312": return Number.POSITIVE_INFINITY;
                    case "-4503599627370496": return Number.NEGATIVE_INFINITY;
                    case "9218868437227405313": return Number.NaN;
                    case "9218868437227405311": return Number.MAX_VALUE;
                    case "4503599627370496": return Number.MIN_VALUE;
                    case "4372995238176751616": return 0; // XXX how to get epsilon in js?
                    default: return 0;
                }
            }
            var caml_int_of_string = function (s) {
                var i = parseInt(s, 10);
                return isNaN(i) ? caml_failwith("int_of_string") : i;
            }
            var caml_int32_of_string = caml_int_of_string;
            var caml_int64_of_string = caml_int_of_string;
            var caml_nativeint_of_string = caml_int_of_string;
            var caml_invalid_argument = function (s) { throw $(Invalid_argument$18g, s); }
            var caml_is_printable = function (c) { return c > 31 && c < 127; } // XXX get this right
            var caml_lessthan = function (v1, v2) { return compare_val(v1, v2, 0) - 1 < -1; }
            var caml_lessequal = function (v1, v2) { return compare_val(v1, v2, 0) - 1 <= -1; }
            var caml_make_vect = function (l, i) {
                var a = new Array(l);
                for (var j = 0; j < l; j++)
                    a[j] = i;
                return a;
            }
            var caml_marshal_data_size = function () { throw "caml_marshal_data_size"; }
            var caml_md5_chan = function () { throw "caml_md5_chan"; }
            var caml_md5_string = function () { throw "caml_md5_string"; }
            var caml_ml_channel_size = function () { throw "caml_ml_channel_size"; }
            var caml_ml_channel_size_64 = function () { throw "caml_ml_channel_size_64"; }
            var caml_ml_close_channel = function () { throw "caml_ml_close_channel"; }

            var caml_ml_flush = function (c) { }

            var caml_ml_input = function () { throw "caml_ml_input"; }
            var caml_ml_input_char = function () { throw "caml_ml_input_char"; }
            var caml_ml_input_int = function () { throw "caml_ml_input_int"; }
            var caml_ml_input_scan_line = function () { throw "caml_ml_input_scan_line"; }
            var caml_ml_open_descriptor_in = function () { return 0; } // XXX
            var caml_ml_open_descriptor_out = function () { return 0; } // XXX
            var caml_ml_out_channels_list = function () { return 0; }

            var caml_ml_output = function (c, b, s, l) { print_verbatim(b); }
            var caml_ml_output_char = function (c, ch) { }

            var caml_ml_output_int = function () { throw "caml_ml_output_int"; }
            var caml_ml_pos_in = function () { throw "caml_ml_pos_in"; }
            var caml_ml_pos_in_64 = function () { throw "caml_ml_pos_in_64"; }
            var caml_ml_pos_out = function () { throw "caml_ml_pos_out"; }
            var caml_ml_pos_out_64 = function () { throw "caml_ml_pos_out_64"; }
            var caml_ml_seek_in = function () { throw "caml_ml_seek_in"; }
            var caml_ml_seek_in_64 = function () { throw "caml_ml_seek_in_64"; }
            var caml_ml_seek_out = function () { throw "caml_ml_seek_out"; }
            var caml_ml_seek_out_64 = function () { throw "caml_ml_seek_out_64"; }
            var caml_ml_set_binary_mode = function () { throw "caml_ml_set_binary_mode"; }
            var caml_named_value = function (n) { return oc$$nv[n]; }
            var caml_nativeint_compare = function (i1, i2) { return (i1 > i2) - (i1 < i2); }
            var caml_notequal = function (v1, v2) { return compare_val(v1, v2, 0) != 0; }
            var caml_obj_dup = function (a) {
                var l = a.length;
                var d = new Array(l);
                for (var i = 0; i < l; i++)
                    d[i] = a[i];
                d.t = a.t;
                return d;
            }
            var caml_obj_is_block = function (o) { return !(typeof o == 'number') }
            var caml_obj_tag = function (o) { return o.t; }
            var caml_obj_set_tag = function (o, t) { o.t = t; }
            var caml_obj_block = function (t, s) { if (s == 0) return t; else { var a = new Array(s); a.t = t; return a; } }
            var caml_obj_truncate = function (o, s) { o.length = s; }
            var caml_output_value = function () { throw "caml_output_value"; }
            var caml_output_value_to_string = function () { throw "caml_output_value_to_string"; }
            var caml_output_value_to_buffer = function () { throw "caml_output_value_to_buffer"; }
            var caml_record_backtrace = function () { throw "caml_record_backtrace"; }
            var caml_backtrace_status = function () { throw "caml_backtrace_status"; }
            var caml_get_exception_backtrace = function () { throw "caml_get_exception_backtrace"; }
            var caml_register_named_value = function (n, v) { oc$$nv[n] = v; }
            var caml_string_compare = function (s1, s2) {
                if (oc$$slt(s1, s2)) return -1;
                else if (oc$$sgt(s1, s2)) return 1;
                else return 0;
            }
            var caml_sys_exit = function () { throw "caml_sys_exit"; }
            var init_time = (new Date()).getTime() / 1000;
            var caml_sys_time = function () { return (new Date()).getTime() / 1000 - init_time; }
            var caml_sys_get_argv = function () { return $("", $()); } // XXX put something here?
            var caml_sys_get_config = function () { return $("js", 32); } // XXX browser name?
            var caml_sys_open = function () { throw "caml_sys_open"; }
            var caml_sys_random_seed = function () { throw "caml_sys_random_seed"; }

            // lexing.c

            function Short(tbl, n) {
                var s = tbl.charCodeAt(n * 2) + (tbl.charCodeAt(n * 2 + 1) << 8);
                return s & 32768 ? s + -65536 : s;
            }

            var caml_lex_engine = function (tbl, start_state, lexbuf) {
                var state, base, backtrk, c;

                state = start_state;
                if (state >= 0) {
                    /* First entry */
                    lexbuf[6] = lexbuf[4] = lexbuf[5];
                    lexbuf[7] = -1;
                } else {
                    /* Reentry after refill */
                    state = -state - 1;
                }
                while (1) {
                    /* Lookup base address or action number for current state */
                    base = Short(tbl[0], state);
                    if (base < 0) return -base - 1;
                    /* See if it's a backtrack point */
                    backtrk = Short(tbl[1], state);
                    if (backtrk >= 0) {
                        lexbuf[6] = lexbuf[5];
                        lexbuf[7] = backtrk;
                    }
                    /* See if we need a refill */
                    if (lexbuf[5] >= lexbuf[2]) {
                        if (lexbuf[8] === false) {
                            return -state - 1;
                        } else {
                            c = 256;
                        }
                    } else {
                        /* Read next input char */
                        c = lexbuf[1].charCodeAt(lexbuf[5]);
                        lexbuf[5] += 1;
                    }
                    /* Determine next state */
                    if (Short(tbl[4], base + c) == state)
                        state = Short(tbl[3], base + c);
                    else
                        state = Short(tbl[2], state);
                    /* If no transition on this char, return to last backtrack point */
                    if (state < 0) {
                        lexbuf[5] = lexbuf[6];
                        if (lexbuf[7] == -1) {
                            caml_failwith("lexing: empty token");
                        } else {
                            return lexbuf[7];
                        }
                    } else {
                        /* Erase the EOF condition only if the EOF pseudo-character was
                           consumed by the automaton (i.e. there was no backtrack above)
                         */
                        if (c == 256) lexbuf[8] = false;
                    }
                }
            }

            /***********************************************/
            /* New lexer engine, with memory of positions  */
            /***********************************************/

            function run_mem(p, pc, mem, curr_pos) {
                for (; ;) {
                    var dst, src;

                    dst = p.charCodeAt(pc++);
                    if (dst == 0xff)
                        return;
                    src = p.charCodeAt(pc++);
                    if (src == 0xff) {
                        /*      fprintf(stderr,"[%hhu] <- %d\n",dst,Int_val(curr_pos)) ;*/
                        mem[dst] = curr_pos;
                    } else {
                        /*      fprintf(stderr,"[%hhu] <- [%hhu]\n",dst,src) ; */
                        mem[dst] = mem[src];
                    }
                }
            }

            function run_tag(p, pc, mem) {
                for (; ;) {
                    var dst, src;

                    dst = p.charCodeAt(pc++);
                    if (dst == 0xff)
                        return;
                    src = p.charCodeAt(pc++);
                    if (src == 0xff) {
                        /*      fprintf(stderr,"[%hhu] <- -1\n",dst) ; */
                        mem[dst] = -1;
                    } else {
                        /*      fprintf(stderr,"[%hhu] <- [%hhu]\n",dst,src) ; */
                        mem[dst] = mem[src];
                    }
                }
            }

            var caml_new_lex_engine = function (tbl, start_state, lexbuf) {
                var state, base, backtrk, c, pstate;
                state = start_state;
                if (state >= 0) {
                    /* First entry */
                    lexbuf[6] = lexbuf[4] = lexbuf[5];
                    lexbuf[7] = -1;
                } else {
                    /* Reentry after refill */
                    state = -state - 1;
                }
                while (1) {
                    /* Lookup base address or action number for current state */
                    base = Short(tbl[0], state);
                    if (base < 0) {
                        var pc_off = Short(tbl[5], state);
                        run_tag(tbl[10], pc_off, lexbuf[9]);
                        /*      fprintf(stderr,"Perform: %d\n",-base-1) ; */
                        return -base - 1;
                    }
                    /* See if it's a backtrack point */
                    backtrk = Short(tbl[1], state);
                    if (backtrk >= 0) {
                        var pc_off = Short(tbl[6], state);
                        run_tag(tbl[10], pc_off, lexbuf[9]);
                        lexbuf[6] = lexbuf[5];
                        lexbuf[7] = backtrk;

                    }
                    /* See if we need a refill */
                    if (lexbuf[5] >= lexbuf[2]) {
                        if (lexbuf[8] === false) {
                            return -state - 1;
                        } else {
                            c = 256;
                        }
                    } else {
                        /* Read next input char */
                        c = lexbuf[1].charCodeAt(lexbuf[5]);
                        lexbuf[5] += 1;
                    }
                    /* Determine next state */
                    pstate = state;
                    if (Short(tbl[4], base + c) == state)
                        state = Short(tbl[3], base + c);
                    else
                        state = Short(tbl[2], state);
                    /* If no transition on this char, return to last backtrack point */
                    if (state < 0) {
                        lexbuf[5] = lexbuf[6];
                        if (lexbuf[7] == -1) {
                            caml_failwith("lexing: empty token");
                        } else {
                            return lexbuf[7];
                        }
                    } else {
                        /* If some transition, get and perform memory moves */
                        var base_code = Short(tbl[5], pstate);
                        var pc_off;
                        if (Short(tbl[9], base_code + c) == pstate)
                            pc_off = Short(tbl[8], base_code + c);
                        else
                            pc_off = Short(tbl[7], pstate);
                        if (pc_off > 0)
                            run_mem(tbl[10], pc_off, lexbuf[9], lexbuf[5]);
                        /* Erase the EOF condition only if the EOF pseudo-character was
                           consumed by the automaton (i.e. there was no backtrack above)
                         */
                        if (c == 256) lexbuf[8] = false;
                    }
                }
            }

            // parsing.c

            var caml_parser_trace = false

            /* Auxiliary for printing token just read */

            function token_name(names, number) {
                var n = 0;
                for (/*nothing*/; number > 0; number--) {
                    var i = names.indexOf("\x00", n);
                    if (i == -1) return "<unknown token>";
                    n = i + 1;
                }
                return names.substr(n, names.indexOf("\x00", n) - n);
            }

            function print_token(tables, state, tok) {
                if (typeof tok == 'number') {
                    print("State " + state + ": read token " + token_name(tables[14], tok));
                } else {
                    print("State " + state + ": read token " + token_name(tables[15], tok.t) + "(" + tok[0] + ")");
                }
            }

            /* The pushdown automata */

            var caml_parse_engine = function (tables, env, cmd, arg) {
                var state;
                var sp, asp;
                var errflag;
                var n, n1, n2, m, state1;

                loop: while (true) switch (cmd) {

                    case 0:
                        state = 0;
                        sp = env[13];
                        errflag = 0;

                    case -1:
                        n = Short(tables[5], state);
                        if (n != 0) { cmd = -7; continue loop; }
                        if (env[6] >= 0) { cmd = -2; continue loop; }
                        env[13] = sp; env[14] = state; env[15] = errflag;
                        return 0;
                    /* The ML code calls the lexer and updates */
                    /* symb_start and symb_end */
                    case 1:
                        sp = env[13]; state = env[14]; errflag = env[15];
                        if (!(typeof arg == 'number')) {
                            env[6] = tables[2][arg.t];
                            env[7] = arg[0];
                        } else {
                            env[6] = tables[1][arg];
                            env[7] = 0;
                        }
                        if (caml_parser_trace) print_token(tables, state, arg);

                    case -2:
                        n1 = Short(tables[7], state);
                        n2 = n1 + env[6];
                        if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                            Short(tables[12], n2) == env[6]) { cmd = -4; continue loop; }
                        n1 = Short(tables[8], state);
                        n2 = n1 + env[6];
                        if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                            Short(tables[12], n2) == env[6]) {
                            n = Short(tables[11], n2);
                            cmd = -7; continue loop;
                        }
                        if (errflag > 0) { cmd = -3; continue; }
                        env[13] = sp; env[14] = state; env[15] = errflag;
                        return 5;
                    /* The ML code calls the error function */
                    case 5:
                        sp = env[13]; state = env[14]; errflag = env[15];
                    case -3:
                        if (errflag < 3) {
                            errflag = 3;
                            while (1) {
                                state1 = env[0][sp];
                                n1 = Short(tables[7], state1);
                                n2 = n1 + 256;
                                if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                                    Short(tables[12], n2) == 256) {
                                    if (caml_parser_trace)
                                        print("Recovering in state " + state1);
                                    cmd = -5; continue loop;
                                } else {
                                    if (caml_parser_trace) {
                                        print("Discarding state " + state1);
                                    }
                                    if (sp <= env[5]) {
                                        if (caml_parser_trace) {
                                            print("No more states to discard");
                                        }
                                        return 1; /* The ML code raises Parse_error */
                                    }
                                    sp--;
                                }
                            }
                        } else {
                            if (env[6] == 0)
                                return 1; /* The ML code raises Parse_error */
                            if (caml_parser_trace) print("Discarding last token read");
                            env[6] = -1;
                            cmd = -1; continue loop;
                        }

                    case -4:
                        env[6] = -1;
                        if (errflag > 0) errflag--;
                    case -5:
                        if (caml_parser_trace)
                            print("State " + state + ": shift to state " + Short(tables[11], n2));
                        state = Short(tables[11], n2);
                        sp++;
                        if (sp < env[4]) { cmd = -6; continue loop; }
                        env[13] = sp; env[14] = state; env[15] = errflag;
                        return 2;
                    /* The ML code resizes the stacks */
                    case 2:
                        sp = env[13]; state = env[14]; errflag = env[15];
                    case -6:
                        env[0][sp] = state;
                        env[1][sp] = env[7];
                        env[2][sp] = env[8];
                        env[3][sp] = env[9];
                        cmd = -1; continue loop;

                    case -7:
                        if (caml_parser_trace)
                            print("State " + state + ": reduce by rule " + n);
                        m = Short(tables[4], n);
                        env[10] = sp;
                        env[12] = n;
                        env[11] = m;
                        sp = sp - m + 1;
                        m = Short(tables[3], n);
                        state1 = env[0][sp - 1];
                        n1 = Short(tables[9], m);
                        n2 = n1 + state1;
                        if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                            Short(tables[12], n2) == state1) {
                            state = Short(tables[11], n2);
                        } else {
                            state = Short(tables[6], m);
                        }
                        if (sp < env[4]) { cmd = -8; continue loop; }
                        env[13] = sp; env[14] = state; env[15] = errflag;
                        return 3;
                    /* The ML code resizes the stacks */
                    case 3:
                        sp = env[13]; state = env[14]; errflag = env[15];
                    case -8:
                        env[13] = sp; env[14] = state; env[15] = errflag;
                        return 4;
                    /* The ML code calls the semantic action */
                    case 4:
                        sp = env[13]; state = env[14]; errflag = env[15];
                        env[0][sp] = state;
                        env[1][sp] = arg;
                        asp = env[10];
                        env[3][sp] = env[3][asp];
                        if (sp > asp) {
                            /* This is an epsilon production. Take symb_start equal to symb_end. */
                            env[2][sp] = env[3][asp];
                        }
                        cmd = -1; continue loop;
                }
            }

            var caml_set_parser_trace = function (flag) {
                var oldflag = caml_parser_trace;
                caml_parser_trace = flag;
                return oldflag;
            }
            /*
             * This file is part of ocamljs, OCaml to Javascript compiler
             * Copyright (C) 2007-9 Skydeck, Inc
             *
             * This library is free software; you can redistribute it and/or
             * modify it under the terms of the GNU Library General Public
             * License as published by the Free Software Foundation; either
             * version 2 of the License, or (at your option) any later version.
             *
             * This library is distributed in the hope that it will be useful,
             * but WITHOUT ANY WARRANTY; without even the implied warranty of
             * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
             * Library General Public License for more details.
             *
             * You should have received a copy of the GNU Library General Public
             * License along with this library; if not, write to the Free
             * Software Foundation, Inc., 59 Temple Place - Suite 330, Boston,
             * MA 02111-1307, USA
             */

            /*
            function console_log(s) {
              var cs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces["nsIConsoleService"]);
              cs.logStringMessage(s);
            }
            */

            var oc$$nv = {}

            // XXX name these sensibly and compactify code afterwards

            function ___a(m, t, a) {
                return m.apply(t, a);
            }

            /*@cc_on @if (@_win32 && @_jscript_version >= 5)
            function ___a(m, t, a) {
              if (m.apply)
                return m.apply(t, a);
              else
                // IE < 8 doesn't support apply for DOM methods, but does support "cached" methods bound to an object
                switch (a.length) {
                case 0: return m();
                case 1: return m(a[0]);
                case 2: return m(a[0], a[1]);
                case 3: return m(a[0], a[1], a[2]);
                case 4: return m(a[0], a[1], a[2], a[3]);
                case 5: return m(a[0], a[1], a[2], a[3], a[4]);
                case 6: return m(a[0], a[1], a[2], a[3], a[4], a[5]);
                case 7: return m(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
                default: throw "unimplemented";
                }
            }
            @end @*/

            function ___m(m, t, a) {
                function ap(a1, a2) {
                    var a = new Array();
                    for (var i = 0; i < a1.length; i++) a.push(a1[i]);
                    for (var i = 0; i < a2.length; i++) a.push(a2[i]);
                    return a;
                }

                while (true) {
                    var al = a.length;
                    var ml = m.length;

                    if (al < ml) {
                        switch (ml - al) {
                            case 1: return _f(function (z) { return m.apply(t, ap(a, arguments)) });
                            case 2: return _f(function (z, y) { return m.apply(t, ap(a, arguments)) });
                            case 3: return _f(function (z, y, x) { return m.apply(t, ap(a, arguments)) });
                            case 4: return _f(function (z, y, x, w) { return m.apply(t, ap(a, arguments)) });
                            case 5: return _f(function (z, y, x, w, v) { return m.apply(t, ap(a, arguments)) });
                            case 6: return _f(function (z, y, x, w, v, u) { return m.apply(t, ap(a, arguments)) });
                            case 7: return _f(function (z, y, x, w, v, u, s) { return m.apply(t, ap(a, arguments)) });
                            default: throw "unimplemented";
                        }
                    }
                    else if (al == ml)
                        return m.apply(t, a);
                    else // al > ml
                    {
                        m = _m(m, t, a.slice(0, ml));
                        t = m;
                        a = a.slice(ml);
                    }
                }
            }

            var $in_tail = false;

            // tail call
            function __m(m, t, args) {
                if (m.$oc) {
                    if ($in_tail) {
                        args.$m = m;
                        args.$t = t;
                        args.$tr = true;
                        return args;
                    }
                    else
                        return _m(m, t, args);
                }
                else {
                    var old_in_tail = $in_tail;
                    $in_tail = false;
                    try { return ___a(m, t, args); }
                    finally { $in_tail = old_in_tail; }
                }
            }
            function __(t, args) { return __m(t, t, args); }

            // non tail call
            function _m(m, t, args) {
                if (m.$oc) {
                    var old_in_tail = $in_tail;
                    $in_tail = true;
                    try {
                        var v = __m(m, t, args);
                        while (v && v.$tr)
                            v = ___m(v.$m, v.$t, v);
                        return v;
                    }
                    finally { $in_tail = old_in_tail; }
                }
                else {
                    var old_in_tail = $in_tail;
                    $in_tail = false;
                    try { return ___a(m, t, args); }
                    finally { $in_tail = old_in_tail; }
                }
            }
            function _(t, args) { return _m(t, t, args); }

            function _f(f) {
                f.$oc = true;
                return f;
            }

            function $N(t, a) {
                var l = a.length;
                var b = new Array(l);
                for (var i = 0; i < l; i++)
                    b[i] = a[i];
                b.t = t;
                return b;
            }
            function $() { return $N(0, arguments); }
            function $1() { return $N(1, arguments); }
            function $2() { return $N(2, arguments); }
            function $3() { return $N(3, arguments); }
            function $4() { return $N(4, arguments); }
            function $5() { return $N(5, arguments); }
            function $6() { return $N(6, arguments); }
            function $7() { return $N(7, arguments); }
            function $8() { return $N(8, arguments); }
            function $9() { return $N(9, arguments); }
            function $t(a) { return a.t; }

            function $xM(t) { return { $t: t }; }
            function $xN(t, a) { a.$t = t; return a; }
            function $xt(a) { return a.$t; }

            function oc$$arefs(o, i) {
                return i < o.length ? o[i] : oc$Pervasives$[0]("index out of bounds");
            }
            function oc$$asets(o, i, v) {
                return i < o.length ? o[i] = v : oc$Pervasives$[0]("index out of bounds");
            }

            // mutable strings, argh

            function oc$$ms(a) {
                this.a = a;
                this.length = a.length;
            }

            // XXX cache the string rep?
            oc$$ms.prototype.toString = function () { return String.fromCharCode.apply(null, this.a); }

            function oc$$lms(s) {
                var l = s.length;
                var a = new Array(l);
                for (var i = 0; i < l; i++)
                    a[i] = s.charCodeAt(i);
                return new oc$$ms(a);
            }
            function oc$$cms(n) {
                return new oc$$ms(new Array(n));
            }
            function oc$$srefu(o, i) { return typeof o == "string" ? o.charCodeAt(i) : o.a[i]; }
            function oc$$ssetu(o, i, v) { o.a[i] = v; }
            function oc$$srefs(o, i) {
                return i < o.length ? oc$$srefu(o, i) : oc$Pervasives$[0]("index out of bounds");
            }
            function oc$$ssets(o, i, v) {
                return i < o.length ? oc$$ssetu(o, i, v) : oc$Pervasives$[0]("index out of bounds");
            }

            function oc$$seq(s1, s2) { return s1.toString() == s2.toString(); }
            function oc$$sneq(s1, s2) { return s1.toString() != s2.toString(); }
            function oc$$slt(s1, s2) { return s1.toString() < s2.toString(); }
            function oc$$sgt(s1, s2) { return s1.toString() > s2.toString(); }
            function oc$$slte(s1, s2) { return s1.toString() <= s2.toString(); }
            function oc$$sgte(s1, s2) { return s1.toString() >= s2.toString(); }

            /*
            **  sprintf.js -- POSIX sprintf(3) style formatting function for JavaScript
            **  Copyright (c) 2006-2007 Ralf S. Engelschall <rse@engelschall.com>
            **  Partly based on Public Domain code by Jan Moesen <http://jan.moesen.nu/>
            **  Licensed under GPL <http://www.gnu.org/licenses/gpl.txt>
            **
            **  modified for ocamljs to more closely match Linux
            **
            **  $LastChangedDate$
            **  $LastChangedRevision$
            */

            /*  make sure the ECMAScript 3.0 Number.toFixed() method is available  */
            if (typeof Number.prototype.toFixed != "undefined") {
                (function () {
                    /*  see http://www.jibbering.com/faq/#FAQ4_6 for details  */
                    function Stretch(Q, L, c) {
                        var S = Q
                        if (c.length > 0)
                            while (S.length < L)
                                S = c + S;
                        return S;
                    }
                    function StrU(X, M, N) { /* X >= 0.0 */
                        var T, S;
                        S = new String(Math.round(X * Number("1e" + N)));
                        if (S.search && S.search(/\D/) != -1)
                            return '' + X;
                        //with (new String(Stretch(S, M + N, '0')))
                        //return substring(0, T = (length - N)) + '.' + substring(T);
                        const str = new String(Stretch(S, M + N, '0'));
                        return str.substring(0, T = (str.length - N)) + '.' + str.substring(T);
                    }
                    function Sign(X) {
                        return X < 0 ? '-' : '';
                    }
                    function StrS(X, M, N) {
                        return Sign(X) + StrU(Math.abs(X), M, N);
                    }
                    Number.prototype.toFixed = function (n) { return StrS(this, 1, n) };
                })();
            }

            /*  the sprintf() function  */
            var oc$$sprintf = function () {
                /*  argument sanity checking  */
                if (!arguments || arguments.length < 1)
                    alert("sprintf:ERROR: not enough arguments 1");

                /*  initialize processing queue  */
                var argumentnum = 0;
                var done = "", todo = arguments[argumentnum++];

                /*  parse still to be done format string  */
                var m;
                while ((m = /^([^%]*)%(\d+$)?([#0 +'-]+)?(\*|\d+)?(\.\*|\.\d+)?([%dioulLnNxXfFgGcs])(.*)$/.exec(todo))) {
                    var pProlog = m[1],
                        pAccess = m[2],
                        pFlags = m[3],
                        pMinLength = m[4],
                        pPrecision = m[5],
                        pType = m[6],
                        pEpilog = m[7];

                    /*  determine substitution  */
                    var subst;
                    if (pType == '%')
                        /*  special case: escaped percent character  */
                        subst = '%';
                    else {
                        /*  parse padding and justify aspects of flags  */
                        var padWith = ' ';
                        var justifyRight = true;
                        if (pFlags) {
                            if (pFlags.indexOf('0') >= 0)
                                padWith = '0';
                            if (pFlags.indexOf('-') >= 0) {
                                padWith = ' ';
                                justifyRight = false;
                            }
                        }
                        else
                            pFlags = "";

                        /*  determine minimum length  */
                        var minLength = -1;
                        if (pMinLength) {
                            if (pMinLength == "*") {
                                var access = argumentnum++;
                                if (access >= arguments.length)
                                    alert("sprintf:ERROR: not enough arguments 2");
                                minLength = arguments[access];
                            }
                            else
                                minLength = parseInt(pMinLength, 10);
                        }

                        /*  determine precision  */
                        var precision = -1;
                        if (pPrecision) {
                            if (pPrecision == ".*") {
                                var access = argumentnum++;
                                if (access >= arguments.length)
                                    alert("sprintf:ERROR: not enough arguments 3");
                                precision = arguments[access];
                            }
                            else
                                precision = parseInt(pPrecision.substring(1), 10);
                        }

                        /*  determine how to fetch argument  */
                        var access = argumentnum++;
                        if (pAccess)
                            access = parseInt(pAccess.substring(0, pAccess.length - 1), 10);
                        if (access >= arguments.length)
                            alert("sprintf:ERROR: not enough arguments 4");

                        /*  dispatch into expansions according to type  */
                        var prefix = "";
                        switch (pType) {
                            case 'd':
                            case 'i':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = subst.toString(10);
                                if (pFlags.indexOf('#') >= 0 && subst >= 0)
                                    subst = "+" + subst;
                                if (pFlags.indexOf(' ') >= 0 && subst >= 0)
                                    subst = " " + subst;
                                break;
                            case 'o':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = subst.toString(8);
                                break;
                            case 'u':
                            case 'l':
                            case 'L':
                            case 'n':
                            case 'N':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = Math.abs(subst);
                                subst = subst.toString(10);
                                break;
                            case 'x':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = subst.toString(16).toLowerCase();
                                if (pFlags.indexOf('#') >= 0)
                                    prefix = "0x";
                                break;
                            case 'X':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = subst.toString(16).toUpperCase();
                                if (pFlags.indexOf('#') >= 0)
                                    prefix = "0X";
                                break;
                            case 'f':
                            case 'F':
                            case 'g':
                            case 'G':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0.0;
                                subst = 0.0 + subst;
                                if (precision > -1) {
                                    if (subst.toFixed)
                                        subst = subst.toFixed(precision);
                                    else {
                                        subst = (Math.round(subst * Math.pow(10, precision)) / Math.pow(10, precision));
                                        subst += "0000000000";
                                        subst = subst.substr(0, subst.indexOf(".") + precision + 1);
                                    }
                                }
                                subst = '' + subst;
                                if (pFlags.indexOf("'") >= 0) {
                                    var k = 0;
                                    for (var i = (subst.length - 1) - 3; i >= 0; i -= 3) {
                                        subst = subst.substring(0, i) + (k == 0 ? "." : ",") + subst.substring(i);
                                        k = (k + 1) % 2;
                                    }
                                }
                                subst = subst.replace('Infinity', 'inf');
                                subst = subst.replace('NaN', 'nan');
                                break;
                            case 'c':
                                subst = arguments[access];
                                if (typeof subst != "number")
                                    subst = 0;
                                subst = String.fromCharCode(subst);
                                break;
                            case 's':
                                subst = arguments[access];
                                if (precision > -1)
                                    subst = subst.substr(0, precision);
                                if (typeof subst != "string")
                                    subst = "";
                                break;
                        }

                        /*  apply optional padding  */
                        var padding = minLength - subst.toString().length - prefix.toString().length;
                        if (padding > 0) {
                            var arrTmp = new Array(padding + 1);
                            if (justifyRight)
                                subst = arrTmp.join(padWith) + subst;
                            else
                                subst = subst + arrTmp.join(padWith);
                        }

                        /*  add optional prefix  */
                        subst = prefix + subst;
                    }

                    /*  update the processing queue  */
                    done = done + pProlog + subst;
                    todo = pEpilog;
                }
                return (done + todo);
            };

            /*@cc_on @if (@_win32 && @_jscript_version >= 5) if (!window.XMLHttpRequest)
            window.XMLHttpRequest = function() { return new ActiveXObject('Microsoft.XMLHTTP') };
            @end @*/
            var oc$Pervasives$ =
                function () {
                    var failwith$54 = _f(function (s$55) { throw $(Failure$19g, s$55); });
                    var invalid_arg$56 = _f(function (s$57) { throw $(Invalid_argument$18g, s$57); });
                    var Exit$58 = $("Pervasives.Exit");
                    var min$66 = _f(function (x$67, y$68) { if (caml_lessequal(x$67, y$68)) return x$67; return y$68; });
                    var max$69 = _f(function (x$70, y$71) { if (caml_greaterequal(x$70, y$71)) return x$70; return y$71; });
                    var abs$87 = _f(function (x$88) { if (x$88 >= 0) return x$88; return -x$88; });
                    var lnot$92 = _f(function (x$93) { return x$93 ^ -1; });
                    var min_int$97 = 1 << (1 << 31 === 0 ? 30 : 62);
                    var max_int$98 = min_int$97 - 1;
                    var infinity$131 = caml_int64_float_of_bits("9218868437227405312");
                    var neg_infinity$132 = caml_int64_float_of_bits("-4503599627370496");
                    var nan$133 = caml_int64_float_of_bits("9218868437227405313");
                    var max_float$134 = caml_int64_float_of_bits("9218868437227405311");
                    var min_float$135 = caml_int64_float_of_bits("4503599627370496");
                    var epsilon_float$136 = caml_int64_float_of_bits("4372995238176751616");
                    var $5E$152 = _f(function (s1$153, s2$154) { return s1$153.toString() + s2$154.toString(); });
                    var char_of_int$157 =
                        _f(function (n$158) { if (n$158 < 0 || n$158 > 255) return __(invalid_arg$56, ["char_of_int"]); return n$158; });
                    var string_of_bool$164 = _f(function (b$165) { if (b$165) return "true"; return "false"; });
                    var bool_of_string$166 =
                        _f(function (param$428) {
                            if (!oc$$sneq(param$428, "false")) return false;
                            if (oc$$sneq(param$428, "true")) return __(invalid_arg$56, ["bool_of_string"]);
                            return true;
                        });
                    var string_of_int$167 = _f(function (n$168) { return caml_format_int("%d", n$168); });
                    var String$171 = $();
                    var valid_float_lexem$172 =
                        _f(function (s$173) {
                            var l$174 = s$173.length;
                            var loop$175 =
                                _f(function (i$176) {
                                    if (i$176 >= l$174) return __($5E$152, [s$173, "."]);
                                    var match$427 = oc$$srefs(s$173, i$176);
                                    var $r58 = false;
                                    r$58: {
                                        {
                                            if (!(match$427 >= 48)) { { if (!(match$427 !== 45)) { { $r58 = true; break r$58; } } return s$173; } }
                                            if (!(match$427 >= 58)) { { $r58 = true; break r$58; } }
                                            return s$173;
                                        }
                                    }
                                    if ($r58) return __(loop$175, [i$176 + 1]);
                                });
                            return __(loop$175, [0]);
                        });
                    var string_of_float$177 = _f(function (f$178) { return __(valid_float_lexem$172, [oc$$sprintf("%.12g", f$178)]); });
                    var $40$180 =
                        _f(function (l1$181, l2$182) { if (l1$181) return $(l1$181[0], _($40$180, [l1$181[1], l2$182])); return l2$182; });
                    var stdin$189 = caml_ml_open_descriptor_in(0);
                    var stdout$190 = caml_ml_open_descriptor_out(1);
                    var stderr$191 = caml_ml_open_descriptor_out(2);
                    var open_out_gen$212 =
                        _f(function (mode$213, perm$214, name$215) {
                            return caml_ml_open_descriptor_out(caml_sys_open(name$215, mode$213, perm$214));
                        });
                    var open_out$216 = _f(function (name$217) { return __(open_out_gen$212, [$(1, $(3, $(4, $(7, 0)))), 438, name$217]); });
                    var open_out_bin$218 = _f(function (name$219) { return __(open_out_gen$212, [$(1, $(3, $(4, $(6, 0)))), 438, name$219]); });
                    var flush_all$222 =
                        _f(function (param$424) {
                            var iter$223 =
                                _f(function (param$425) {
                                    if (param$425) {
                                        { try { caml_ml_flush(param$425[0]); } catch (exn$426) { } return __(iter$223, [param$425[1]]); }
                                    }
                                    return 0;
                                });
                            return __(iter$223, [caml_ml_out_channels_list(0)]);
                        });
                    var output_string$228 = _f(function (oc$229, s$230) { return caml_ml_output(oc$229, s$230, 0, s$230.length); });
                    var output$231 =
                        _f(function (oc$232, s$233, ofs$234, len$235) {
                            if (ofs$234 < 0 || (len$235 < 0 || ofs$234 > s$233.length - len$235)) return __(invalid_arg$56, ["output"]);
                            return caml_ml_output(oc$232, s$233, ofs$234, len$235);
                        });
                    var output_value$239 = _f(function (chan$240, v$241) { return caml_output_value(chan$240, v$241, 0); });
                    var close_out$246 = _f(function (oc$247) { caml_ml_flush(oc$247); return caml_ml_close_channel(oc$247); });
                    var close_out_noerr$248 =
                        _f(function (oc$249) {
                            try { caml_ml_flush(oc$249); } catch (exn$423) { }
                            try { return caml_ml_close_channel(oc$249); } catch (exn$422) { return 0; }
                        });
                    var open_in_gen$251 =
                        _f(function (mode$252, perm$253, name$254) {
                            return caml_ml_open_descriptor_in(caml_sys_open(name$254, mode$252, perm$253));
                        });
                    var open_in$255 = _f(function (name$256) { return __(open_in_gen$251, [$(0, $(7, 0)), 0, name$256]); });
                    var open_in_bin$257 = _f(function (name$258) { return __(open_in_gen$251, [$(0, $(6, 0)), 0, name$258]); });
                    var input$261 =
                        _f(function (ic$262, s$263, ofs$264, len$265) {
                            if (ofs$264 < 0 || (len$265 < 0 || ofs$264 > s$263.length - len$265)) return __(invalid_arg$56, ["input"]);
                            return caml_ml_input(ic$262, s$263, ofs$264, len$265);
                        });
                    var unsafe_really_input$266 =
                        _f(function (ic$267, s$268, ofs$269, len$270) {
                            if (len$270 <= 0) return 0;
                            var r$271 = caml_ml_input(ic$267, s$268, ofs$269, len$270);
                            if (r$271 === 0) throw $(End_of_file$22g);
                            return __(unsafe_really_input$266, [ic$267, s$268, ofs$269 + r$271, len$270 - r$271]);
                        });
                    var really_input$272 =
                        _f(function (ic$273, s$274, ofs$275, len$276) {
                            if (ofs$275 < 0 || (len$276 < 0 || ofs$275 > s$274.length - len$276)) return __(invalid_arg$56, ["really_input"]);
                            return __(unsafe_really_input$266, [ic$273, s$274, ofs$275, len$276]);
                        });
                    var input_line$278 =
                        _f(function (chan$279) {
                            var build_result$280 =
                                _f(function (buf$281, pos$282, param$421) {
                                    if (param$421) {
                                        {
                                            var hd$283 = param$421[0];
                                            var len$285 = hd$283.length;
                                            caml_blit_string(hd$283, 0, buf$281, pos$282 - len$285, len$285);
                                            return __(build_result$280, [buf$281, pos$282 - len$285, param$421[1]]);
                                        }
                                    }
                                    return buf$281;
                                });
                            var scan$286 =
                                _f(function (accu$287, len$288) {
                                    var n$289 = caml_ml_input_scan_line(chan$279);
                                    if (!(n$289 === 0)) {
                                        {
                                            if (n$289 > 0) {
                                                {
                                                    var res$290 = oc$$cms(n$289 - 1);
                                                    caml_ml_input(chan$279, res$290, 0, n$289 - 1);
                                                    caml_ml_input_char(chan$279);
                                                    if (accu$287) {
                                                        {
                                                            var len$291 = len$288 + n$289 - 1;
                                                            return __(build_result$280, [oc$$cms(len$291), len$291, $(res$290, accu$287)]);
                                                        }
                                                    }
                                                    return res$290;
                                                }
                                            }
                                            var beg$292 = oc$$cms(-n$289);
                                            caml_ml_input(chan$279, beg$292, 0, -n$289);
                                            return __(scan$286, [$(beg$292, accu$287), len$288 - n$289]);
                                        }
                                    }
                                    if (accu$287) return __(build_result$280, [oc$$cms(len$288), len$288, accu$287]);
                                    throw $(End_of_file$22g);
                                });
                            return __(scan$286, [0, 0]);
                        });
                    var close_in_noerr$300 = _f(function (ic$301) { try { return caml_ml_close_channel(ic$301); } catch (exn$420) { return 0; } });
                    var print_char$303 = _f(function (c$304) { return caml_ml_output_char(stdout$190, c$304); });
                    var print_string$305 = _f(function (s$306) { return __(output_string$228, [stdout$190, s$306]); });
                    var print_int$307 = _f(function (i$308) { return __(output_string$228, [stdout$190, _(string_of_int$167, [i$308])]); });
                    var print_float$309 = _f(function (f$310) { return __(output_string$228, [stdout$190, _(string_of_float$177, [f$310])]); });
                    var print_endline$311 =
                        _f(function (s$312) {
                            _(output_string$228, [stdout$190, s$312]);
                            caml_ml_output_char(stdout$190, 10);
                            return caml_ml_flush(stdout$190);
                        });
                    var print_newline$313 = _f(function (param$419) { caml_ml_output_char(stdout$190, 10); return caml_ml_flush(stdout$190); });
                    var prerr_char$314 = _f(function (c$315) { return caml_ml_output_char(stderr$191, c$315); });
                    var prerr_string$316 = _f(function (s$317) { return __(output_string$228, [stderr$191, s$317]); });
                    var prerr_int$318 = _f(function (i$319) { return __(output_string$228, [stderr$191, _(string_of_int$167, [i$319])]); });
                    var prerr_float$320 = _f(function (f$321) { return __(output_string$228, [stderr$191, _(string_of_float$177, [f$321])]); });
                    var prerr_endline$322 =
                        _f(function (s$323) {
                            _(output_string$228, [stderr$191, s$323]);
                            caml_ml_output_char(stderr$191, 10);
                            return caml_ml_flush(stderr$191);
                        });
                    var prerr_newline$324 = _f(function (param$418) { caml_ml_output_char(stderr$191, 10); return caml_ml_flush(stderr$191); });
                    var read_line$325 = _f(function (param$417) { caml_ml_flush(stdout$190); return __(input_line$278, [stdin$189]); });
                    var read_int$326 = _f(function (param$416) { return caml_int_of_string(_(read_line$325, [0])); });
                    var read_float$327 = _f(function (param$415) { return caml_float_of_string(_(read_line$325, [0])); });
                    var LargeFile$334 = $();
                    var $5E$5E$349 = _f(function (fmt1$350, fmt2$351) { return _($5E$152, [fmt1$350, fmt2$351]); });
                    var string_of_format$352 =
                        _f(function (fmt$353) {
                            var s$354 = fmt$353;
                            var l$355 = s$354.length;
                            var r$356 = oc$$cms(l$355);
                            caml_blit_string(s$354, 0, r$356, 0, l$355);
                            return r$356;
                        });
                    var exit_function$358 = $(flush_all$222);
                    var at_exit$359 =
                        _f(function (f$360) {
                            var g$361 = exit_function$358[0];
                            return exit_function$358[0] = _f(function (param$414) { _(f$360, [0]); return __(g$361, [0]); });
                        });
                    var do_at_exit$362 = _f(function (param$413) { return __(exit_function$358[0], [0]); });
                    var exit$363 = _f(function (retcode$364) { _(do_at_exit$362, [0]); return caml_sys_exit(retcode$364); });
                    caml_register_named_value("Pervasives.do_at_exit", do_at_exit$362);
                    return $(invalid_arg$56, failwith$54, Exit$58, min$66, max$69, abs$87, max_int$98, min_int$97, lnot$92, infinity$131,
                        neg_infinity$132, nan$133, max_float$134, min_float$135, epsilon_float$136, $5E$152, char_of_int$157,
                        string_of_bool$164, bool_of_string$166, string_of_int$167, string_of_float$177, $40$180, stdin$189, stdout$190,
                        stderr$191, print_char$303, print_string$305, print_int$307, print_float$309, print_endline$311, print_newline$313,
                        prerr_char$314, prerr_string$316, prerr_int$318, prerr_float$320, prerr_endline$322, prerr_newline$324, read_line$325,
                        read_int$326, read_float$327, open_out$216, open_out_bin$218, open_out_gen$212,
                        _f(function (prim$381) { return caml_ml_flush(prim$381); }), flush_all$222,
                        _f(function (prim$383, prim$382) { return caml_ml_output_char(prim$383, prim$382); }), output_string$228, output$231,
                        _f(function (prim$385, prim$384) { return caml_ml_output_char(prim$385, prim$384); }),
                        _f(function (prim$387, prim$386) { return caml_ml_output_int(prim$387, prim$386); }), output_value$239,
                        _f(function (prim$389, prim$388) { return caml_ml_seek_out(prim$389, prim$388); }),
                        _f(function (prim$390) { return caml_ml_pos_out(prim$390); }),
                        _f(function (prim$391) { return caml_ml_channel_size(prim$391); }), close_out$246, close_out_noerr$248,
                        _f(function (prim$393, prim$392) { return caml_ml_set_binary_mode(prim$393, prim$392); }), open_in$255,
                        open_in_bin$257, open_in_gen$251, _f(function (prim$394) { return caml_ml_input_char(prim$394); }), input_line$278,
                        input$261, really_input$272, _f(function (prim$395) { return caml_ml_input_char(prim$395); }),
                        _f(function (prim$396) { return caml_ml_input_int(prim$396); }),
                        _f(function (prim$397) { return caml_input_value(prim$397); }),
                        _f(function (prim$399, prim$398) { return caml_ml_seek_in(prim$399, prim$398); }),
                        _f(function (prim$400) { return caml_ml_pos_in(prim$400); }),
                        _f(function (prim$401) { return caml_ml_channel_size(prim$401); }),
                        _f(function (prim$402) { return caml_ml_close_channel(prim$402); }), close_in_noerr$300,
                        _f(function (prim$404, prim$403) { return caml_ml_set_binary_mode(prim$404, prim$403); }),
                        $(_f(function (prim$406, prim$405) { return caml_ml_seek_out_64(prim$406, prim$405); }),
                            _f(function (prim$407) { return caml_ml_pos_out_64(prim$407); }),
                            _f(function (prim$408) { return caml_ml_channel_size_64(prim$408); }),
                            _f(function (prim$410, prim$409) { return caml_ml_seek_in_64(prim$410, prim$409); }),
                            _f(function (prim$411) { return caml_ml_pos_in_64(prim$411); }),
                            _f(function (prim$412) { return caml_ml_channel_size_64(prim$412); })), string_of_format$352, $5E$5E$349, exit$363,
                        at_exit$359, valid_float_lexem$172, unsafe_really_input$266, do_at_exit$362);
                }();
            var oc$Char$ =
                function () {
                    var chr$60 = _f(function (n$61) { if (n$61 < 0 || n$61 > 255) return __(oc$Pervasives$[0], ["Char.chr"]); return n$61; });
                    var escaped$66 =
                        _f(function (c$67) {
                            var $r7 = false;
                            r$7: {
                                {
                                    if (!(c$67 !== 39)) return "\\\'";
                                    if (!(c$67 !== 92)) return "\\\\";
                                    if (c$67 >= 14) { { $r7 = true; break r$7; } }
                                    switch (c$67) {
                                        case 0: $r7 = true; break r$7;
                                        case 1: $r7 = true; break r$7;
                                        case 2: $r7 = true; break r$7;
                                        case 3: $r7 = true; break r$7;
                                        case 4: $r7 = true; break r$7;
                                        case 5: $r7 = true; break r$7;
                                        case 6: $r7 = true; break r$7;
                                        case 7: $r7 = true; break r$7;
                                        case 8: return "\\b";
                                        case 9: return "\\t";
                                        case 10: return "\\n";
                                        case 11: $r7 = true; break r$7;
                                        case 12: $r7 = true; break r$7;
                                        case 13: return "\\r";
                                        default: return null;
                                    }
                                }
                            }
                            if ($r7) {
                                {
                                    if (caml_is_printable(c$67)) { { var s$68 = oc$$cms(1); oc$$ssetu(s$68, 0, c$67); return s$68; } }
                                    var n$69 = c$67;
                                    var s$70 = oc$$cms(4);
                                    oc$$ssetu(s$70, 0, 92);
                                    oc$$ssetu(s$70, 1, 48 + (n$69 / 100 >> 0));
                                    oc$$ssetu(s$70, 2, 48 + (n$69 / 10 >> 0) % 10);
                                    oc$$ssetu(s$70, 3, 48 + n$69 % 10);
                                    return s$70;
                                }
                            }
                        });
                    var lowercase$71 =
                        _f(function (c$72) {
                            if (c$72 >= 65 && c$72 <= 90 || (c$72 >= 192 && c$72 <= 214 || c$72 >= 216 && c$72 <= 222)) return c$72 + 32;
                            return c$72;
                        });
                    var uppercase$73 =
                        _f(function (c$74) {
                            if (c$74 >= 97 && c$74 <= 122 || (c$74 >= 224 && c$74 <= 246 || c$74 >= 248 && c$74 <= 254)) return c$74 - 32;
                            return c$74;
                        });
                    var compare$76 = _f(function (c1$77, c2$78) { return c1$77 - c2$78; });
                    return $(chr$60, escaped$66, lowercase$71, uppercase$73, compare$76);
                }();
            var oc$List$ =
                function () {
                    var length_aux$58 =
                        _f(function (len$59, param$394) { if (param$394) return __(length_aux$58, [len$59 + 1, param$394[1]]); return len$59; });
                    var length$62 = _f(function (l$63) { return __(length_aux$58, [0, l$63]); });
                    var hd$64 = _f(function (param$393) { if (param$393) return param$393[0]; return __(oc$Pervasives$[1], ["hd"]); });
                    var tl$67 = _f(function (param$392) { if (param$392) return param$392[1]; return __(oc$Pervasives$[1], ["tl"]); });
                    var nth$70 =
                        _f(function (l$71, n$72) {
                            if (n$72 < 0) return __(oc$Pervasives$[0], ["List.nth"]);
                            var nth_aux$73 =
                                _f(function (l$74, n$75) {
                                    if (!l$74) return __(oc$Pervasives$[1], ["nth"]);
                                    if (n$75 === 0) return l$74[0];
                                    return __(nth_aux$73, [l$74[1], n$75 - 1]);
                                });
                            return __(nth_aux$73, [l$71, n$72]);
                        });
                    var append$78 = oc$Pervasives$[21];
                    var rev_append$79 =
                        _f(function (l1$80, l2$81) { if (l1$80) return __(rev_append$79, [l1$80[1], $(l1$80[0], l2$81)]); return l2$81; });
                    var rev$84 = _f(function (l$85) { return __(rev_append$79, [l$85, 0]); });
                    var flatten$86 =
                        _f(function (param$391) {
                            if (param$391) return __(oc$Pervasives$[21], [param$391[0], _(flatten$86, [param$391[1]])]);
                            return 0;
                        });
                    var map$90 =
                        _f(function (f$91, param$390) {
                            if (param$390) { { var r$94 = _(f$91, [param$390[0]]); return $(r$94, _(map$90, [f$91, param$390[1]])); } }
                            return 0;
                        });
                    var rev_map$95 =
                        _f(function (f$96, l$97) {
                            var rmap_f$98 =
                                _f(function (accu$99, param$389) {
                                    if (param$389) return __(rmap_f$98, [$(_(f$96, [param$389[0]]), accu$99), param$389[1]]);
                                    return accu$99;
                                });
                            return __(rmap_f$98, [0, l$97]);
                        });
                    var iter$102 =
                        _f(function (f$103, param$388) {
                            if (param$388) { { _(f$103, [param$388[0]]); return __(iter$102, [f$103, param$388[1]]); } }
                            return 0;
                        });
                    var fold_left$106 =
                        _f(function (f$107, accu$108, l$109) {
                            if (l$109) return __(fold_left$106, [f$107, _(f$107, [accu$108, l$109[0]]), l$109[1]]);
                            return accu$108;
                        });
                    var fold_right$112 =
                        _f(function (f$113, l$114, accu$115) {
                            if (l$114) return __(f$113, [l$114[0], _(fold_right$112, [f$113, l$114[1], accu$115])]);
                            return accu$115;
                        });
                    var map2$118 =
                        _f(function (f$119, l1$120, l2$121) {
                            var $r34 = false;
                            r$34: {
                                {
                                    if (!l1$120) { { if (l2$121) { { $r34 = true; break r$34; } } return 0; } }
                                    if (!l2$121) { { $r34 = true; break r$34; } }
                                    var r$126 = _(f$119, [l1$120[0], l2$121[0]]);
                                    return $(r$126, _(map2$118, [f$119, l1$120[1], l2$121[1]]));
                                }
                            }
                            if ($r34) return __(oc$Pervasives$[0], ["List.map2"]);
                        });
                    var rev_map2$127 =
                        _f(function (f$128, l1$129, l2$130) {
                            var rmap2_f$131 =
                                _f(function (accu$132, l1$133, l2$134) {
                                    var $r31 = false;
                                    r$31: {
                                        {
                                            if (!l1$133) { { if (l2$134) { { $r31 = true; break r$31; } } return accu$132; } }
                                            if (!l2$134) { { $r31 = true; break r$31; } }
                                            return __(rmap2_f$131, [$(_(f$128, [l1$133[0], l2$134[0]]), accu$132), l1$133[1], l2$134[1]]);
                                        }
                                    }
                                    if ($r31) return __(oc$Pervasives$[0], ["List.rev_map2"]);
                                });
                            return __(rmap2_f$131, [0, l1$129, l2$130]);
                        });
                    var iter2$139 =
                        _f(function (f$140, l1$141, l2$142) {
                            var $r30 = false;
                            r$30: {
                                {
                                    if (!l1$141) { { if (l2$142) { { $r30 = true; break r$30; } } return 0; } }
                                    if (!l2$142) { { $r30 = true; break r$30; } }
                                    _(f$140, [l1$141[0], l2$142[0]]);
                                    return __(iter2$139, [f$140, l1$141[1], l2$142[1]]);
                                }
                            }
                            if ($r30) return __(oc$Pervasives$[0], ["List.iter2"]);
                        });
                    var fold_left2$147 =
                        _f(function (f$148, accu$149, l1$150, l2$151) {
                            var $r29 = false;
                            r$29: {
                                {
                                    if (!l1$150) { { if (l2$151) { { $r29 = true; break r$29; } } return accu$149; } }
                                    if (!l2$151) { { $r29 = true; break r$29; } }
                                    return __(fold_left2$147, [f$148, _(f$148, [accu$149, l1$150[0], l2$151[0]]), l1$150[1], l2$151[1]]);
                                }
                            }
                            if ($r29) return __(oc$Pervasives$[0], ["List.fold_left2"]);
                        });
                    var fold_right2$156 =
                        _f(function (f$157, l1$158, l2$159, accu$160) {
                            var $r28 = false;
                            r$28: {
                                {
                                    if (!l1$158) { { if (l2$159) { { $r28 = true; break r$28; } } return accu$160; } }
                                    if (!l2$159) { { $r28 = true; break r$28; } }
                                    return __(f$157, [l1$158[0], l2$159[0], _(fold_right2$156, [f$157, l1$158[1], l2$159[1], accu$160])]);
                                }
                            }
                            if ($r28) return __(oc$Pervasives$[0], ["List.fold_right2"]);
                        });
                    var for_all$165 =
                        _f(function (p$166, param$377) {
                            if (param$377) return _(p$166, [param$377[0]]) && _(for_all$165, [p$166, param$377[1]]);
                            return true;
                        });
                    var exists$169 =
                        _f(function (p$170, param$376) {
                            if (param$376) return _(p$170, [param$376[0]]) || _(exists$169, [p$170, param$376[1]]);
                            return false;
                        });
                    var for_all2$173 =
                        _f(function (p$174, l1$175, l2$176) {
                            var $r27 = false;
                            r$27: {
                                {
                                    if (!l1$175) { { if (l2$176) { { $r27 = true; break r$27; } } return true; } }
                                    if (!l2$176) { { $r27 = true; break r$27; } }
                                    return _(p$174, [l1$175[0], l2$176[0]]) && _(for_all2$173, [p$174, l1$175[1], l2$176[1]]);
                                }
                            }
                            if ($r27) return __(oc$Pervasives$[0], ["List.for_all2"]);
                        });
                    var exists2$181 =
                        _f(function (p$182, l1$183, l2$184) {
                            var $r26 = false;
                            r$26: {
                                {
                                    if (!l1$183) { { if (l2$184) { { $r26 = true; break r$26; } } return false; } }
                                    if (!l2$184) { { $r26 = true; break r$26; } }
                                    return _(p$182, [l1$183[0], l2$184[0]]) || _(exists2$181, [p$182, l1$183[1], l2$184[1]]);
                                }
                            }
                            if ($r26) return __(oc$Pervasives$[0], ["List.exists2"]);
                        });
                    var mem$189 =
                        _f(function (x$190, param$371) {
                            if (param$371) return caml_compare(param$371[0], x$190) === 0 || _(mem$189, [x$190, param$371[1]]);
                            return false;
                        });
                    var memq$193 =
                        _f(function (x$194, param$370) {
                            if (param$370) return param$370[0] === x$194 || _(memq$193, [x$194, param$370[1]]);
                            return false;
                        });
                    var assoc$197 =
                        _f(function (x$198, param$368) {
                            if (param$368) {
                                {
                                    var match$369 = param$368[0];
                                    if (caml_compare(match$369[0], x$198) === 0) return match$369[1];
                                    return __(assoc$197, [x$198, param$368[1]]);
                                }
                            }
                            throw $(Not_found$20g);
                        });
                    var assq$202 =
                        _f(function (x$203, param$366) {
                            if (param$366) {
                                {
                                    var match$367 = param$366[0];
                                    if (match$367[0] === x$203) return match$367[1];
                                    return __(assq$202, [x$203, param$366[1]]);
                                }
                            }
                            throw $(Not_found$20g);
                        });
                    var mem_assoc$207 =
                        _f(function (x$208, param$364) {
                            if (param$364) return caml_compare(param$364[0][0], x$208) === 0 || _(mem_assoc$207, [x$208, param$364[1]]);
                            return false;
                        });
                    var mem_assq$212 =
                        _f(function (x$213, param$362) {
                            if (param$362) return param$362[0][0] === x$213 || _(mem_assq$212, [x$213, param$362[1]]);
                            return false;
                        });
                    var remove_assoc$217 =
                        _f(function (x$218, param$361) {
                            if (param$361) {
                                {
                                    var l$222 = param$361[1];
                                    var pair$221 = param$361[0];
                                    if (caml_compare(pair$221[0], x$218) === 0) return l$222;
                                    return $(pair$221, _(remove_assoc$217, [x$218, l$222]));
                                }
                            }
                            return 0;
                        });
                    var remove_assq$223 =
                        _f(function (x$224, param$360) {
                            if (param$360) {
                                {
                                    var l$228 = param$360[1];
                                    var pair$227 = param$360[0];
                                    if (pair$227[0] === x$224) return l$228;
                                    return $(pair$227, _(remove_assq$223, [x$224, l$228]));
                                }
                            }
                            return 0;
                        });
                    var find$229 =
                        _f(function (p$230, param$359) {
                            if (param$359) {
                                { var x$231 = param$359[0]; if (_(p$230, [x$231])) return x$231; return __(find$229, [p$230, param$359[1]]); }
                            }
                            throw $(Not_found$20g);
                        });
                    var find_all$233 =
                        _f(function (p$234) {
                            var find$235 =
                                _f(function (accu$236, param$358) {
                                    if (param$358) {
                                        {
                                            var l$238 = param$358[1];
                                            var x$237 = param$358[0];
                                            if (_(p$234, [x$237])) return __(find$235, [$(x$237, accu$236), l$238]);
                                            return __(find$235, [accu$236, l$238]);
                                        }
                                    }
                                    return __(rev$84, [accu$236]);
                                });
                            return __(find$235, [0]);
                        });
                    var partition$240 =
                        _f(function (p$241, l$242) {
                            var part$243 =
                                _f(function (yes$244, no$245, param$357) {
                                    if (param$357) {
                                        {
                                            var l$247 = param$357[1];
                                            var x$246 = param$357[0];
                                            if (_(p$241, [x$246])) return __(part$243, [$(x$246, yes$244), no$245, l$247]);
                                            return __(part$243, [yes$244, $(x$246, no$245), l$247]);
                                        }
                                    }
                                    return $(_(rev$84, [yes$244]), _(rev$84, [no$245]));
                                });
                            return __(part$243, [0, 0, l$242]);
                        });
                    var split$248 =
                        _f(function (param$354) {
                            if (param$354) {
                                {
                                    var match$356 = param$354[0];
                                    var match$355 = _(split$248, [param$354[1]]);
                                    return $($(match$356[0], match$355[0]), $(match$356[1], match$355[1]));
                                }
                            }
                            return $(0, 0);
                        });
                    var combine$254 =
                        _f(function (l1$255, l2$256) {
                            var $r21 = false;
                            r$21: {
                                {
                                    if (!l1$255) { { if (l2$256) { { $r21 = true; break r$21; } } return 0; } }
                                    if (!l2$256) { { $r21 = true; break r$21; } }
                                    return $($(l1$255[0], l2$256[0]), _(combine$254, [l1$255[1], l2$256[1]]));
                                }
                            }
                            if ($r21) return __(oc$Pervasives$[0], ["List.combine"]);
                        });
                    var merge$261 =
                        _f(function (cmp$262, l1$263, l2$264) {
                            if (!l1$263) return l2$264;
                            if (l2$264) {
                                {
                                    var h2$269 = l2$264[0];
                                    var h1$267 = l1$263[0];
                                    if (_(cmp$262, [h1$267, h2$269]) <= 0) return $(h1$267, _(merge$261, [cmp$262, l1$263[1], l2$264]));
                                    return $(h2$269, _(merge$261, [cmp$262, l1$263, l2$264[1]]));
                                }
                            }
                            return l1$263;
                        });
                    var chop$271 =
                        _f(function (k$272, l$273) {
                            if (k$272 === 0) return l$273;
                            if (l$273) return __(chop$271, [k$272 - 1, l$273[1]]);
                            throw $(Assert_failure$26g, $("ocaml/stdlib/list.ml", 213, 11));
                        });
                    var stable_sort$276 =
                        _f(function (cmp$277, l$278) {
                            var rev_merge$279 =
                                _f(function (l1$280, l2$281, accu$282) {
                                    if (!l1$280) return __(rev_append$79, [l2$281, accu$282]);
                                    if (l2$281) {
                                        {
                                            var h2$287 = l2$281[0];
                                            var h1$285 = l1$280[0];
                                            if (_(cmp$277, [h1$285, h2$287]) <= 0)
                                                return __(rev_merge$279, [l1$280[1], l2$281, $(h1$285, accu$282)]);
                                            return __(rev_merge$279, [l1$280, l2$281[1], $(h2$287, accu$282)]);
                                        }
                                    }
                                    return __(rev_append$79, [l1$280, accu$282]);
                                });
                            var rev_merge_rev$289 =
                                _f(function (l1$290, l2$291, accu$292) {
                                    if (!l1$290) return __(rev_append$79, [l2$291, accu$292]);
                                    if (l2$291) {
                                        {
                                            var h2$297 = l2$291[0];
                                            var h1$295 = l1$290[0];
                                            if (_(cmp$277, [h1$295, h2$297]) > 0)
                                                return __(rev_merge_rev$289, [l1$290[1], l2$291, $(h1$295, accu$292)]);
                                            return __(rev_merge_rev$289, [l1$290, l2$291[1], $(h2$297, accu$292)]);
                                        }
                                    }
                                    return __(rev_append$79, [l1$290, accu$292]);
                                });
                            var sort$299 =
                                _f(function (n$301, l$302) {
                                    var $r9 = false;
                                    r$9: {
                                        {
                                            if (!(n$301 !== 2)) {
                                                {
                                                    if (!l$302) { { $r9 = true; break r$9; } }
                                                    var match$334 = l$302[1];
                                                    if (!match$334) { { $r9 = true; break r$9; } }
                                                    var x2$304 = match$334[0];
                                                    var x1$303 = l$302[0];
                                                    if (_(cmp$277, [x1$303, x2$304]) <= 0) return $(x1$303, $(x2$304, 0));
                                                    return $(x2$304, $(x1$303, 0));
                                                }
                                            }
                                            if (n$301 !== 3) { { $r9 = true; break r$9; } }
                                            if (!l$302) { { $r9 = true; break r$9; } }
                                            var match$336 = l$302[1];
                                            if (!match$336) { { $r9 = true; break r$9; } }
                                            var match$337 = match$336[1];
                                            if (!match$337) { { $r9 = true; break r$9; } }
                                            var x3$307 = match$337[0];
                                            var x2$306 = match$336[0];
                                            var x1$305 = l$302[0];
                                            if (!(_(cmp$277, [x1$305, x2$306]) <= 0)) {
                                                {
                                                    if (_(cmp$277, [x1$305, x3$307]) <= 0) return $(x2$306, $(x1$305, $(x3$307, 0)));
                                                    if (_(cmp$277, [x2$306, x3$307]) <= 0) return $(x2$306, $(x3$307, $(x1$305, 0)));
                                                    return $(x3$307, $(x2$306, $(x1$305, 0)));
                                                }
                                            }
                                            if (_(cmp$277, [x2$306, x3$307]) <= 0) return $(x1$305, $(x2$306, $(x3$307, 0)));
                                            if (_(cmp$277, [x1$305, x3$307]) <= 0) return $(x1$305, $(x3$307, $(x2$306, 0)));
                                            return $(x3$307, $(x1$305, $(x2$306, 0)));
                                        }
                                    }
                                    if ($r9) {
                                        {
                                            var n1$310 = n$301 >>> 1;
                                            var n2$311 = n$301 - n1$310;
                                            var l2$312 = _(chop$271, [n1$310, l$302]);
                                            var s1$313 = _(rev_sort$300, [n1$310, l$302]);
                                            var s2$314 = _(rev_sort$300, [n2$311, l2$312]);
                                            return __(rev_merge_rev$289, [s1$313, s2$314, 0]);
                                        }
                                    }
                                });
                            var rev_sort$300 =
                                _f(function (n$315, l$316) {
                                    var $r15 = false;
                                    r$15: {
                                        {
                                            if (!(n$315 !== 2)) {
                                                {
                                                    if (!l$316) { { $r15 = true; break r$15; } }
                                                    var match$341 = l$316[1];
                                                    if (!match$341) { { $r15 = true; break r$15; } }
                                                    var x2$318 = match$341[0];
                                                    var x1$317 = l$316[0];
                                                    if (_(cmp$277, [x1$317, x2$318]) > 0) return $(x1$317, $(x2$318, 0));
                                                    return $(x2$318, $(x1$317, 0));
                                                }
                                            }
                                            if (n$315 !== 3) { { $r15 = true; break r$15; } }
                                            if (!l$316) { { $r15 = true; break r$15; } }
                                            var match$343 = l$316[1];
                                            if (!match$343) { { $r15 = true; break r$15; } }
                                            var match$344 = match$343[1];
                                            if (!match$344) { { $r15 = true; break r$15; } }
                                            var x3$321 = match$344[0];
                                            var x2$320 = match$343[0];
                                            var x1$319 = l$316[0];
                                            if (!(_(cmp$277, [x1$319, x2$320]) > 0)) {
                                                {
                                                    if (_(cmp$277, [x1$319, x3$321]) > 0) return $(x2$320, $(x1$319, $(x3$321, 0)));
                                                    if (_(cmp$277, [x2$320, x3$321]) > 0) return $(x2$320, $(x3$321, $(x1$319, 0)));
                                                    return $(x3$321, $(x2$320, $(x1$319, 0)));
                                                }
                                            }
                                            if (_(cmp$277, [x2$320, x3$321]) > 0) return $(x1$319, $(x2$320, $(x3$321, 0)));
                                            if (_(cmp$277, [x1$319, x3$321]) > 0) return $(x1$319, $(x3$321, $(x2$320, 0)));
                                            return $(x3$321, $(x1$319, $(x2$320, 0)));
                                        }
                                    }
                                    if ($r15) {
                                        {
                                            var n1$324 = n$315 >>> 1;
                                            var n2$325 = n$315 - n1$324;
                                            var l2$326 = _(chop$271, [n1$324, l$316]);
                                            var s1$327 = _(sort$299, [n1$324, l$316]);
                                            var s2$328 = _(sort$299, [n2$325, l2$326]);
                                            return __(rev_merge$279, [s1$327, s2$328, 0]);
                                        }
                                    }
                                });
                            var len$329 = _(length$62, [l$278]);
                            if (len$329 < 2) return l$278;
                            return __(sort$299, [len$329, l$278]);
                        });
                    return $(length$62, hd$64, tl$67, nth$70, rev$84, append$78, rev_append$79, flatten$86, flatten$86, iter$102, map$90,
                        rev_map$95, fold_left$106, fold_right$112, iter2$139, map2$118, rev_map2$127, fold_left2$147, fold_right2$156,
                        for_all$165, exists$169, for_all2$173, exists2$181, mem$189, memq$193, find$229, find_all$233, find_all$233,
                        partition$240, assoc$197, assq$202, mem_assoc$207, mem_assq$212, remove_assoc$217, remove_assq$223, split$248,
                        combine$254, stable_sort$276, stable_sort$276, stable_sort$276, merge$261);
                }();
            var oc$String$ =
                function () {
                    var make$66 = _f(function (n$67, c$68) { var s$69 = oc$$cms(n$67); caml_fill_string(s$69, 0, n$67, c$68); return s$69; });
                    var copy$70 =
                        _f(function (s$71) {
                            var len$72 = s$71.length;
                            var r$73 = oc$$cms(len$72);
                            caml_blit_string(s$71, 0, r$73, 0, len$72);
                            return r$73;
                        });
                    var sub$74 =
                        _f(function (s$75, ofs$76, len$77) {
                            if (ofs$76 < 0 || (len$77 < 0 || ofs$76 > s$75.length - len$77)) return __(oc$Pervasives$[0], ["String.sub"]);
                            var r$78 = oc$$cms(len$77);
                            caml_blit_string(s$75, ofs$76, r$78, 0, len$77);
                            return r$78;
                        });
                    var fill$79 =
                        _f(function (s$80, ofs$81, len$82, c$83) {
                            if (ofs$81 < 0 || (len$82 < 0 || ofs$81 > s$80.length - len$82)) return __(oc$Pervasives$[0], ["String.fill"]);
                            return caml_fill_string(s$80, ofs$81, len$82, c$83);
                        });
                    var blit$84 =
                        _f(function (s1$85, ofs1$86, s2$87, ofs2$88, len$89) {
                            if (len$89 < 0 || (ofs1$86 < 0 || (ofs1$86 > s1$85.length - len$89 || (ofs2$88 < 0 || ofs2$88 > s2$87.length - len$89))))
                                return __(oc$Pervasives$[0], ["String.blit"]);
                            return caml_blit_string(s1$85, ofs1$86, s2$87, ofs2$88, len$89);
                        });
                    var iter$90 =
                        _f(function (f$91, a$92) {
                            for (var i$93 = 0; i$93 <= a$92.length - 1; i$93++) { (function (i$93) { _(f$91, [oc$$srefu(a$92, i$93)]); }(i$93)); }
                        });
                    var concat$94 =
                        _f(function (sep$95, l$96) {
                            if (l$96) {
                                {
                                    var hd$97 = l$96[0];
                                    var num$99 = $(0);
                                    var len$100 = $(0);
                                    _(oc$List$[9], [_f(function (s$101) { num$99[0]++; return len$100[0] = len$100[0] + s$101.length; }), l$96]);
                                    var r$102 = oc$$cms(len$100[0] + sep$95.length * (num$99[0] - 1));
                                    caml_blit_string(hd$97, 0, r$102, 0, hd$97.length);
                                    var pos$103 = $(hd$97.length);
                                    _(oc$List$[9],
                                        [
                                            _f(function (s$104) {
                                                caml_blit_string(sep$95, 0, r$102, pos$103[0], sep$95.length);
                                                pos$103[0] = pos$103[0] + sep$95.length;
                                                caml_blit_string(s$104, 0, r$102, pos$103[0], s$104.length);
                                                return pos$103[0] = pos$103[0] + s$104.length;
                                            }),
                                            l$96[1]
                                        ]);
                                    return r$102;
                                }
                            }
                            return "";
                        });
                    var escaped$108 =
                        _f(function (s$109) {
                            var n$110 = 0;
                            for (var i$111 = 0; i$111 <= s$109.length - 1; i$111++) {
                                (function (i$111) {
                                    n$110 =
                                        n$110 +
                                        function () {
                                            var c$112 = oc$$srefu(s$109, i$111);
                                            var $r26 = false;
                                            r$26: {
                                                {
                                                    var $r27 = false;
                                                    r$27: {
                                                        {
                                                            if (!(c$112 >= 14)) {
                                                                {
                                                                    if (!(c$112 >= 11)) {
                                                                        { if (!(c$112 >= 8)) { { $r27 = true; break r$27; } } $r26 = true; break r$26; }
                                                                    }
                                                                    if (!(c$112 >= 13)) { { $r27 = true; break r$27; } }
                                                                    $r26 = true;
                                                                    break r$26;
                                                                }
                                                            }
                                                            if (!(c$112 !== 34)) { { $r26 = true; break r$26; } }
                                                            if (!(c$112 !== 92)) { { $r26 = true; break r$26; } }
                                                            $r27 = true;
                                                            break r$27;
                                                        }
                                                    }
                                                    if ($r27) { { if (caml_is_printable(c$112)) return 1; return 4; } }
                                                }
                                            }
                                            if ($r26) return 2;
                                        }();
                                }(i$111));
                            }
                            if (n$110 === s$109.length) return s$109;
                            var s$27$113 = oc$$cms(n$110);
                            n$110 = 0;
                            for (var i$114 = 0; i$114 <= s$109.length - 1; i$114++) {
                                (function (i$114) {
                                    var c$115 = oc$$srefu(s$109, i$114);
                                    var $r24 = false;
                                    r$24: {
                                        {
                                            var switcher$178 = -34 + c$115;
                                            if (!(switcher$178 < 0 || switcher$178 > 58)) {
                                                {
                                                    if (!(-1 + switcher$178 < 0 || -1 + switcher$178 > 56)) { { $r24 = true; break r$24; } }
                                                    oc$$ssetu(s$27$113, n$110, 92);
                                                    n$110 = 1 + n$110;
                                                    oc$$ssetu(s$27$113, n$110, c$115);
                                                }
                                            }
                                            else {
                                                {
                                                    if (switcher$178 >= -20) { { $r24 = true; break r$24; } }
                                                    var s$181 = 34 + switcher$178;
                                                    switch (s$181) {
                                                        case 0: $r24 = true; break r$24;
                                                        case 1: $r24 = true; break r$24;
                                                        case 2: $r24 = true; break r$24;
                                                        case 3: $r24 = true; break r$24;
                                                        case 4: $r24 = true; break r$24;
                                                        case 5: $r24 = true; break r$24;
                                                        case 6: $r24 = true; break r$24;
                                                        case 7: $r24 = true; break r$24;
                                                        case 8: oc$$ssetu(s$27$113, n$110, 92); n$110 = 1 + n$110; oc$$ssetu(s$27$113, n$110, 98); break;
                                                        case 9: oc$$ssetu(s$27$113, n$110, 92); n$110 = 1 + n$110; oc$$ssetu(s$27$113, n$110, 116); break;
                                                        case 10: oc$$ssetu(s$27$113, n$110, 92); n$110 = 1 + n$110; oc$$ssetu(s$27$113, n$110, 110); break;
                                                        case 11: $r24 = true; break r$24;
                                                        case 12: $r24 = true; break r$24;
                                                        case 13: oc$$ssetu(s$27$113, n$110, 92); n$110 = 1 + n$110; oc$$ssetu(s$27$113, n$110, 114); break;
                                                        default: null;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if ($r24)
                                        if (caml_is_printable(c$115))
                                            oc$$ssetu(s$27$113, n$110, c$115);
                                        else {
                                            {
                                                var a$117 = c$115;
                                                oc$$ssetu(s$27$113, n$110, 92);
                                                n$110 = 1 + n$110;
                                                oc$$ssetu(s$27$113, n$110, 48 + (a$117 / 100 >> 0));
                                                n$110 = 1 + n$110;
                                                oc$$ssetu(s$27$113, n$110, 48 + (a$117 / 10 >> 0) % 10);
                                                n$110 = 1 + n$110;
                                                oc$$ssetu(s$27$113, n$110, 48 + a$117 % 10);
                                            }
                                        }
                                    n$110 = 1 + n$110;
                                }(i$114));
                            }
                            return s$27$113;
                        });
                    var map$118 =
                        _f(function (f$119, s$120) {
                            var l$121 = s$120.length;
                            if (l$121 === 0) return s$120;
                            var r$122 = oc$$cms(l$121);
                            for (var i$123 = 0; i$123 <= l$121 - 1; i$123++) {
                                (function (i$123) { oc$$ssetu(r$122, i$123, _(f$119, [oc$$srefu(s$120, i$123)])); }(i$123));
                            }
                            return r$122;
                        });
                    var uppercase$124 = _f(function (s$125) { return __(map$118, [oc$Char$[3], s$125]); });
                    var lowercase$126 = _f(function (s$127) { return __(map$118, [oc$Char$[2], s$127]); });
                    var apply1$128 =
                        _f(function (f$129, s$130) {
                            if (s$130.length === 0) return s$130;
                            var r$131 = _(copy$70, [s$130]);
                            oc$$ssetu(r$131, 0, _(f$129, [oc$$srefu(s$130, 0)]));
                            return r$131;
                        });
                    var capitalize$132 = _f(function (s$133) { return __(apply1$128, [oc$Char$[3], s$133]); });
                    var uncapitalize$134 = _f(function (s$135) { return __(apply1$128, [oc$Char$[2], s$135]); });
                    var index_rec$136 =
                        _f(function (s$137, lim$138, i$139, c$140) {
                            if (i$139 >= lim$138) throw $(Not_found$20g);
                            if (oc$$srefu(s$137, i$139) === c$140) return i$139;
                            return __(index_rec$136, [s$137, lim$138, i$139 + 1, c$140]);
                        });
                    var index$141 = _f(function (s$142, c$143) { return __(index_rec$136, [s$142, s$142.length, 0, c$143]); });
                    var index_from$144 =
                        _f(function (s$145, i$146, c$147) {
                            var l$148 = s$145.length;
                            if (i$146 < 0 || i$146 > l$148) return __(oc$Pervasives$[0], ["String.index_from"]);
                            return __(index_rec$136, [s$145, l$148, i$146, c$147]);
                        });
                    var rindex_rec$149 =
                        _f(function (s$150, i$151, c$152) {
                            if (i$151 < 0) throw $(Not_found$20g);
                            if (oc$$srefu(s$150, i$151) === c$152) return i$151;
                            return __(rindex_rec$149, [s$150, i$151 - 1, c$152]);
                        });
                    var rindex$153 = _f(function (s$154, c$155) { return __(rindex_rec$149, [s$154, s$154.length - 1, c$155]); });
                    var rindex_from$156 =
                        _f(function (s$157, i$158, c$159) {
                            if (i$158 < -1 || i$158 >= s$157.length) return __(oc$Pervasives$[0], ["String.rindex_from"]);
                            return __(rindex_rec$149, [s$157, i$158, c$159]);
                        });
                    var contains_from$160 =
                        _f(function (s$161, i$162, c$163) {
                            var l$164 = s$161.length;
                            if (i$162 < 0 || i$162 > l$164) return __(oc$Pervasives$[0], ["String.contains_from"]);
                            try {
                                _(index_rec$136, [s$161, l$164, i$162, c$163]);
                                return true;
                            }
                            catch (exn$177) {
                                if (exn$177[0] === Not_found$20g) return false;
                                throw exn$177;
                            }
                        });
                    var contains$165 = _f(function (s$166, c$167) { return __(contains_from$160, [s$166, 0, c$167]); });
                    var rcontains_from$168 =
                        _f(function (s$169, i$170, c$171) {
                            if (i$170 < 0 || i$170 >= s$169.length) return __(oc$Pervasives$[0], ["String.rcontains_from"]);
                            try {
                                _(rindex_rec$149, [s$169, i$170, c$171]);
                                return true;
                            }
                            catch (exn$176) {
                                if (exn$176[0] === Not_found$20g) return false;
                                throw exn$176;
                            }
                        });
                    var compare$173 = _f(function (prim$175, prim$174) { return caml_compare(prim$175, prim$174); });
                    return $(make$66, copy$70, sub$74, fill$79, blit$84, concat$94, iter$90, escaped$108, index$141, rindex$153, index_from$144,
                        rindex_from$156, contains$165, contains_from$160, rcontains_from$168, uppercase$124, lowercase$126, capitalize$132,
                        uncapitalize$134, compare$173);
                }();
            var oc$Array$ =
                function () {
                    var init$65 =
                        _f(function (l$66, f$67) {
                            if (l$66 === 0) return $();
                            var res$68 = caml_make_vect(l$66, _(f$67, [0]));
                            for (var i$69 = 1; i$69 <= -1 + l$66; i$69++) { (function (i$69) { res$68[i$69] = _(f$67, [i$69]); }(i$69)); }
                            return res$68;
                        });
                    var make_matrix$70 =
                        _f(function (sx$71, sy$72, init$73) {
                            var res$74 = caml_make_vect(sx$71, $());
                            for (var x$75 = 0; x$75 <= -1 + sx$71; x$75++) {
                                (function (x$75) { res$74[x$75] = caml_make_vect(sy$72, init$73); }(x$75));
                            }
                            return res$74;
                        });
                    var copy$77 =
                        _f(function (a$78) {
                            var l$79 = a$78.length;
                            if (l$79 === 0) return $();
                            var res$80 = caml_make_vect(l$79, a$78[0]);
                            for (var i$81 = 1; i$81 <= -1 + l$79; i$81++) { (function (i$81) { res$80[i$81] = a$78[i$81]; }(i$81)); }
                            return res$80;
                        });
                    var append$82 =
                        _f(function (a1$83, a2$84) {
                            var l1$85 = a1$83.length;
                            var l2$86 = a2$84.length;
                            if (l1$85 === 0 && l2$86 === 0) return $();
                            var r$87 = caml_make_vect(l1$85 + l2$86, (l1$85 > 0 ? a1$83 : a2$84)[0]);
                            for (var i$88 = 0; i$88 <= l1$85 - 1; i$88++) { (function (i$88) { r$87[i$88] = a1$83[i$88]; }(i$88)); }
                            for (var i$89 = 0; i$89 <= l2$86 - 1; i$89++) { (function (i$89) { r$87[i$89 + l1$85] = a2$84[i$89]; }(i$89)); }
                            return r$87;
                        });
                    var concat_aux$90 =
                        _f(function (init$91, al$92) {
                            var size$93 =
                                _f(function (accu$94, param$262) {
                                    if (param$262) return __(size$93, [accu$94 + (param$262[0]).length, param$262[1]]);
                                    return accu$94;
                                });
                            var res$97 = caml_make_vect(_(size$93, [0, al$92]), init$91);
                            var fill$98 =
                                _f(function (pos$99, param$261) {
                                    if (param$261) {
                                        {
                                            var h$100 = param$261[0];
                                            for (var i$102 = 0; i$102 <= h$100.length - 1; i$102++) {
                                                (function (i$102) { res$97[pos$99 + i$102] = h$100[i$102]; }(i$102));
                                            }
                                            return __(fill$98, [pos$99 + h$100.length, param$261[1]]);
                                        }
                                    }
                                    return 0;
                                });
                            _(fill$98, [0, al$92]);
                            return res$97;
                        });
                    var concat$103 =
                        _f(function (al$104) {
                            var find_init$105 =
                                _f(function (param$260) {
                                    if (param$260) {
                                        {
                                            var a$106 = param$260[0];
                                            if (a$106.length > 0) return __(concat_aux$90, [a$106[0], al$104]);
                                            return __(find_init$105, [param$260[1]]);
                                        }
                                    }
                                    return $();
                                });
                            return __(find_init$105, [al$104]);
                        });
                    var sub$108 =
                        _f(function (a$109, ofs$110, len$111) {
                            if (ofs$110 < 0 || (len$111 < 0 || ofs$110 > a$109.length - len$111)) return __(oc$Pervasives$[0], ["Array.sub"]);
                            if (len$111 === 0) return $();
                            var r$112 = caml_make_vect(len$111, a$109[ofs$110]);
                            for (var i$113 = 1; i$113 <= len$111 - 1; i$113++) {
                                (function (i$113) { r$112[i$113] = a$109[ofs$110 + i$113]; }(i$113));
                            }
                            return r$112;
                        });
                    var fill$114 =
                        _f(function (a$115, ofs$116, len$117, v$118) {
                            if (ofs$116 < 0 || (len$117 < 0 || ofs$116 > a$115.length - len$117)) return __(oc$Pervasives$[0], ["Array.fill"]);
                            for (var i$119 = ofs$116; i$119 <= ofs$116 + len$117 - 1; i$119++) {
                                (function (i$119) { a$115[i$119] = v$118; }(i$119));
                            }
                        });
                    var blit$120 =
                        _f(function (a1$121, ofs1$122, a2$123, ofs2$124, len$125) {
                            if (len$125 < 0 ||
                                (ofs1$122 < 0 || (ofs1$122 > a1$121.length - len$125 || (ofs2$124 < 0 || ofs2$124 > a2$123.length - len$125))))
                                return __(oc$Pervasives$[0], ["Array.blit"]);
                            if (ofs1$122 < ofs2$124)
                                for (var i$126 = len$125 - 1; i$126 >= 0; i$126--) {
                                    (function (i$126) { a2$123[ofs2$124 + i$126] = a1$121[ofs1$122 + i$126]; }(i$126));
                                }
                            for (var i$127 = 0; i$127 <= len$125 - 1; i$127++) {
                                (function (i$127) { a2$123[ofs2$124 + i$127] = a1$121[ofs1$122 + i$127]; }(i$127));
                            }
                        });
                    var iter$128 =
                        _f(function (f$129, a$130) {
                            for (var i$131 = 0; i$131 <= a$130.length - 1; i$131++) { (function (i$131) { _(f$129, [a$130[i$131]]); }(i$131)); }
                        });
                    var map$132 =
                        _f(function (f$133, a$134) {
                            var l$135 = a$134.length;
                            if (l$135 === 0) return $();
                            var r$136 = caml_make_vect(l$135, _(f$133, [a$134[0]]));
                            for (var i$137 = 1; i$137 <= l$135 - 1; i$137++) {
                                (function (i$137) { r$136[i$137] = _(f$133, [a$134[i$137]]); }(i$137));
                            }
                            return r$136;
                        });
                    var iteri$138 =
                        _f(function (f$139, a$140) {
                            for (var i$141 = 0; i$141 <= a$140.length - 1; i$141++) {
                                (function (i$141) { _(f$139, [i$141, a$140[i$141]]); }(i$141));
                            }
                        });
                    var mapi$142 =
                        _f(function (f$143, a$144) {
                            var l$145 = a$144.length;
                            if (l$145 === 0) return $();
                            var r$146 = caml_make_vect(l$145, _(f$143, [0, a$144[0]]));
                            for (var i$147 = 1; i$147 <= l$145 - 1; i$147++) {
                                (function (i$147) { r$146[i$147] = _(f$143, [i$147, a$144[i$147]]); }(i$147));
                            }
                            return r$146;
                        });
                    var to_list$148 =
                        _f(function (a$149) {
                            var tolist$150 =
                                _f(function (i$151, res$152) {
                                    if (i$151 < 0) return res$152;
                                    return __(tolist$150, [i$151 - 1, $(a$149[i$151], res$152)]);
                                });
                            return __(tolist$150, [a$149.length - 1, 0]);
                        });
                    var list_length$153 =
                        _f(function (accu$154, param$259) {
                            if (param$259) return __(list_length$153, [1 + accu$154, param$259[1]]);
                            return accu$154;
                        });
                    var of_list$157 =
                        _f(function (l$160) {
                            if (l$160) {
                                {
                                    var a$161 = caml_make_vect(_(list_length$153, [0, l$160]), l$160[0]);
                                    var fill$162 =
                                        _f(function (i$163, param$258) {
                                            if (param$258) { { a$161[i$163] = param$258[0]; return __(fill$162, [i$163 + 1, param$258[1]]); } }
                                            return a$161;
                                        });
                                    return __(fill$162, [1, l$160[1]]);
                                }
                            }
                            return $();
                        });
                    var fold_left$166 =
                        _f(function (f$167, x$168, a$169) {
                            var r$170 = x$168;
                            for (var i$171 = 0; i$171 <= a$169.length - 1; i$171++) {
                                (function (i$171) { r$170 = _(f$167, [r$170, a$169[i$171]]); }(i$171));
                            }
                            return r$170;
                        });
                    var fold_right$172 =
                        _f(function (f$173, a$174, x$175) {
                            var r$176 = x$175;
                            for (var i$177 = a$174.length - 1; i$177 >= 0; i$177--) {
                                (function (i$177) { r$176 = _(f$173, [a$174[i$177], r$176]); }(i$177));
                            }
                            return r$176;
                        });
                    var Bottom$178 = $("Array.Bottom");
                    var sort$179 =
                        _f(function (cmp$180, a$181) {
                            var maxson$182 =
                                _f(function (l$183, i$184) {
                                    var i31$185 = i$184 + i$184 + i$184 + 1;
                                    var x$186 = i31$185;
                                    if (i31$185 + 2 < l$183) {
                                        {
                                            if (_(cmp$180, [oc$$arefs(a$181, i31$185), oc$$arefs(a$181, i31$185 + 1)]) < 0) x$186 = i31$185 + 1; else;
                                            if (_(cmp$180, [oc$$arefs(a$181, x$186), oc$$arefs(a$181, i31$185 + 2)]) < 0) x$186 = i31$185 + 2; else;
                                            return x$186;
                                        }
                                    }
                                    if (i31$185 + 1 < l$183 && _(cmp$180, [oc$$arefs(a$181, i31$185), oc$$arefs(a$181, i31$185 + 1)]) < 0)
                                        return i31$185 + 1;
                                    if (i31$185 < l$183) return i31$185;
                                    throw $(Bottom$178, i$184);
                                });
                            var trickledown$187 =
                                _f(function (l$188, i$189, e$190) {
                                    var j$191 = _(maxson$182, [l$188, i$189]);
                                    if (_(cmp$180, [oc$$arefs(a$181, j$191), e$190]) > 0) {
                                        { oc$$asets(a$181, i$189, oc$$arefs(a$181, j$191)); return __(trickledown$187, [l$188, j$191, e$190]); }
                                    }
                                    return oc$$asets(a$181, i$189, e$190);
                                });
                            var trickle$192 =
                                _f(function (l$193, i$194, e$195) {
                                    try {
                                        return _(trickledown$187, [l$193, i$194, e$195]);
                                    }
                                    catch (exn$257) {
                                        if (exn$257[0] === Bottom$178) return oc$$asets(a$181, exn$257[1], e$195);
                                        throw exn$257;
                                    }
                                });
                            var bubbledown$197 =
                                _f(function (l$198, i$199) {
                                    var j$200 = _(maxson$182, [l$198, i$199]);
                                    oc$$asets(a$181, i$199, oc$$arefs(a$181, j$200));
                                    return __(bubbledown$197, [l$198, j$200]);
                                });
                            var bubble$201 =
                                _f(function (l$202, i$203) {
                                    try {
                                        return _(bubbledown$197, [l$202, i$203]);
                                    }
                                    catch (exn$256) {
                                        if (exn$256[0] === Bottom$178) return exn$256[1];
                                        throw exn$256;
                                    }
                                });
                            var trickleup$205 =
                                _f(function (i$206, e$207) {
                                    var father$208 = (i$206 - 1) / 3 >> 0;
                                    if (i$206 !== father$208); else throw $(Assert_failure$26g, $("ocaml/stdlib/array.ml", 208, 4));
                                    if (_(cmp$180, [oc$$arefs(a$181, father$208), e$207]) < 0) {
                                        {
                                            oc$$asets(a$181, i$206, oc$$arefs(a$181, father$208));
                                            if (father$208 > 0) return __(trickleup$205, [father$208, e$207]);
                                            return oc$$asets(a$181, 0, e$207);
                                        }
                                    }
                                    return oc$$asets(a$181, i$206, e$207);
                                });
                            var l$209 = a$181.length;
                            for (var i$210 = ((l$209 + 1) / 3 >> 0) - 1; i$210 >= 0; i$210--) {
                                (function (i$210) { _(trickle$192, [l$209, i$210, oc$$arefs(a$181, i$210)]); }(i$210));
                            }
                            for (var i$211 = l$209 - 1; i$211 >= 2; i$211--) {
                                (function (i$211) {
                                    var e$212 = oc$$arefs(a$181, i$211);
                                    oc$$asets(a$181, i$211, oc$$arefs(a$181, 0));
                                    _(trickleup$205, [_(bubble$201, [i$211, 0]), e$212]);
                                }(i$211));
                            }
                            if (l$209 > 1) {
                                { var e$213 = oc$$arefs(a$181, 1); oc$$asets(a$181, 1, oc$$arefs(a$181, 0)); return oc$$asets(a$181, 0, e$213); }
                            }
                            return 0;
                        });
                    var cutoff$214 = 5;
                    var stable_sort$215 =
                        _f(function (cmp$216, a$217) {
                            var merge$218 =
                                _f(function (src1ofs$219, src1len$220, src2$221, src2ofs$222, src2len$223, dst$224, dstofs$225) {
                                    var src1r$226 = src1ofs$219 + src1len$220;
                                    var src2r$227 = src2ofs$222 + src2len$223;
                                    var loop$228 =
                                        _f(function (i1$229, s1$230, i2$231, s2$232, d$233) {
                                            if (_(cmp$216, [s1$230, s2$232]) <= 0) {
                                                {
                                                    oc$$asets(dst$224, d$233, s1$230);
                                                    var i1$234 = i1$229 + 1;
                                                    if (i1$234 < src1r$226)
                                                        return __(loop$228, [i1$234, oc$$arefs(a$217, i1$234), i2$231, s2$232, d$233 + 1]);
                                                    return __(blit$120, [src2$221, i2$231, dst$224, d$233 + 1, src2r$227 - i2$231]);
                                                }
                                            }
                                            oc$$asets(dst$224, d$233, s2$232);
                                            var i2$235 = i2$231 + 1;
                                            if (i2$235 < src2r$227)
                                                return __(loop$228, [i1$229, s1$230, i2$235, oc$$arefs(src2$221, i2$235), d$233 + 1]);
                                            return __(blit$120, [a$217, i1$229, dst$224, d$233 + 1, src1r$226 - i1$229]);
                                        });
                                    return __(loop$228,
                                        [
                                            src1ofs$219,
                                            oc$$arefs(a$217, src1ofs$219),
                                            src2ofs$222,
                                            oc$$arefs(src2$221, src2ofs$222),
                                            dstofs$225
                                        ]);
                                });
                            var isortto$236 =
                                _f(function (srcofs$237, dst$238, dstofs$239, len$240) {
                                    for (var i$241 = 0; i$241 <= len$240 - 1; i$241++) {
                                        (function (i$241) {
                                            var e$242 = oc$$arefs(a$217, srcofs$237 + i$241);
                                            var j$243 = dstofs$239 + i$241 - 1;
                                            while (j$243 >= dstofs$239 && _(cmp$216, [oc$$arefs(dst$238, j$243), e$242]) > 0) {
                                                { oc$$asets(dst$238, j$243 + 1, oc$$arefs(dst$238, j$243)); j$243 = -1 + j$243; }
                                            }
                                            oc$$asets(dst$238, j$243 + 1, e$242);
                                        }(i$241));
                                    }
                                });
                            var sortto$244 =
                                _f(function (srcofs$245, dst$246, dstofs$247, len$248) {
                                    if (len$248 <= cutoff$214) return __(isortto$236, [srcofs$245, dst$246, dstofs$247, len$248]);
                                    var l1$249 = len$248 / 2 >> 0;
                                    var l2$250 = len$248 - l1$249;
                                    _(sortto$244, [srcofs$245 + l1$249, dst$246, dstofs$247 + l1$249, l2$250]);
                                    _(sortto$244, [srcofs$245, a$217, srcofs$245 + l2$250, l1$249]);
                                    return __(merge$218, [srcofs$245 + l2$250, l1$249, dst$246, dstofs$247 + l1$249, l2$250, dst$246, dstofs$247]);
                                });
                            var l$251 = a$217.length;
                            if (l$251 <= cutoff$214) return __(isortto$236, [0, a$217, 0, l$251]);
                            var l1$252 = l$251 / 2 >> 0;
                            var l2$253 = l$251 - l1$252;
                            var t$254 = caml_make_vect(l2$253, oc$$arefs(a$217, 0));
                            _(sortto$244, [l1$252, t$254, 0, l2$253]);
                            _(sortto$244, [0, a$217, l2$253, l1$252]);
                            return __(merge$218, [l2$253, l1$252, t$254, 0, l2$253, a$217, 0]);
                        });
                    return $(init$65, make_matrix$70, make_matrix$70, append$82, concat$103, sub$108, copy$77, fill$114, blit$120, to_list$148,
                        of_list$157, iter$128, map$132, iteri$138, mapi$142, fold_left$166, fold_right$172, sort$179, stable_sort$215,
                        stable_sort$215);
                }();
            var oc$Sys$ =
                function () {
                    var match$118 = caml_sys_get_argv(0);
                    var match$117 = caml_sys_get_config(0);
                    var word_size$63 = match$117[1];
                    var max_array_length$64 = (1 << word_size$63 - 10) - 1;
                    var max_string_length$65 = (word_size$63 / 8 >> 0) * max_array_length$64 - 1;
                    var interactive$76 = $(false);
                    var set_signal$85 = _f(function (sig_num$86, sig_beh$87) { caml_install_signal_handler(sig_num$86, sig_beh$87); return 0; });
                    var sigabrt$88 = -1;
                    var sigalrm$89 = -2;
                    var sigfpe$90 = -3;
                    var sighup$91 = -4;
                    var sigill$92 = -5;
                    var sigint$93 = -6;
                    var sigkill$94 = -7;
                    var sigpipe$95 = -8;
                    var sigquit$96 = -9;
                    var sigsegv$97 = -10;
                    var sigterm$98 = -11;
                    var sigusr1$99 = -12;
                    var sigusr2$100 = -13;
                    var sigchld$101 = -14;
                    var sigcont$102 = -15;
                    var sigstop$103 = -16;
                    var sigtstp$104 = -17;
                    var sigttin$105 = -18;
                    var sigttou$106 = -19;
                    var sigvtalrm$107 = -20;
                    var sigprof$108 = -21;
                    var Break$109 = $("Sys.Break");
                    var catch_break$110 =
                        _f(function (on$111) {
                            if (on$111) return __(set_signal$85, [sigint$93, $(_f(function (param$116) { throw $(Break$109); }))]);
                            return __(set_signal$85, [sigint$93, 0]);
                        });
                    var ocaml_version$112 = "3.11.1";
                    return $(match$118[1], match$118[0], interactive$76, match$117[0], word_size$63, max_string_length$65, max_array_length$64,
                        set_signal$85, sigabrt$88, sigalrm$89, sigfpe$90, sighup$91, sigill$92, sigint$93, sigkill$94, sigpipe$95, sigquit$96,
                        sigsegv$97, sigterm$98, sigusr1$99, sigusr2$100, sigchld$101, sigcont$102, sigstop$103, sigtstp$104, sigttin$105,
                        sigttou$106, sigvtalrm$107, sigprof$108, Break$109, catch_break$110, ocaml_version$112);
                }();
            var oc$Int32$ =
                function () {
                    var zero$76 = 0;
                    var one$77 = 1;
                    var minus_one$78 = -1;
                    var succ$79 = _f(function (n$80) { return n$80 + 1; });
                    var pred$81 = _f(function (n$82) { return n$82 - 1; });
                    var abs$83 = _f(function (n$84) { if (n$84 >= 0) return n$84; return -n$84; });
                    var min_int$85 = -2147483648;
                    var max_int$86 = 2147483647;
                    var lognot$87 = _f(function (n$88) { return n$88 ^ -1; });
                    var to_string$90 = _f(function (n$91) { return caml_format_int("%d", n$91); });
                    var compare$94 = _f(function (x$95, y$96) { return caml_int32_compare(x$95, y$96); });
                    return $(zero$76, one$77, minus_one$78, succ$79, pred$81, abs$83, max_int$86, min_int$85, lognot$87, to_string$90, compare$94);
                }();
            var oc$Int64$ =
                function () {
                    var zero$78 = "0";
                    var one$79 = "1";
                    var minus_one$80 = "-1";
                    var succ$81 = _f(function (n$82) { return n$82 + "1"; });
                    var pred$83 = _f(function (n$84) { return n$84 - "1"; });
                    var abs$85 = _f(function (n$86) { if (n$86 >= "0") return n$86; return -n$86; });
                    var min_int$87 = "-9223372036854775808";
                    var max_int$88 = "9223372036854775807";
                    var lognot$89 = _f(function (n$90) { return n$90 ^ "-1"; });
                    var to_string$92 = _f(function (n$93) { return caml_format_int("%d", n$93); });
                    var compare$98 = _f(function (x$99, y$100) { return caml_int64_compare(x$99, y$100); });
                    return $(zero$78, one$79, minus_one$80, succ$81, pred$83, abs$85, max_int$88, min_int$87, lognot$89, to_string$92, compare$98);
                }();
            var oc$Nativeint$ =
                function () {
                    var zero$76 = 0;
                    var one$77 = 1;
                    var minus_one$78 = -1;
                    var succ$79 = _f(function (n$80) { return n$80 + 1; });
                    var pred$81 = _f(function (n$82) { return n$82 - 1; });
                    var abs$83 = _f(function (n$84) { if (n$84 >= 0) return n$84; return -n$84; });
                    var size$85 = oc$Sys$[4];
                    var min_int$86 = 1 << size$85 - 1;
                    var max_int$87 = min_int$86 - 1;
                    var lognot$88 = _f(function (n$89) { return n$89 ^ -1; });
                    var to_string$91 = _f(function (n$92) { return caml_format_int("%d", n$92); });
                    var compare$95 = _f(function (x$96, y$97) { return caml_nativeint_compare(x$96, y$97); });
                    return $(zero$76, one$77, minus_one$78, succ$79, pred$81, abs$83, size$85, max_int$87, min_int$86, lognot$88, to_string$91,
                        compare$95);
                }();
            var oc$Ocamljs$ =
                function () {
                    var option_of_nullable$74 = _f(function (x$75) { if (x$75 === null) return 0; return $(x$75); });
                    var nullable_of_option$76 = _f(function (x$77) { if (x$77) return x$77[0]; return null; });
                    var is_null$79 = _f(function (a$80) { return caml_equal(a$80, null); });
                    var Inline$268 = function () { var Jslib_ast$262 = $(); var _loc$267 = 0; return $(Jslib_ast$262, _loc$267); }();
                    return $(option_of_nullable$74, nullable_of_option$76, is_null$79, Inline$268);
                }();
            var oc$Types$ =
                function () {
                    var value$96 = _f(function (param$132) { return param$132[0][0]; });
                    var sorts$98 = $(0, $(1, $(2, $(3, 0))));
                    var string_of_color$99 =
                        _f(function (param$131) {
                            return __(oc$Pervasives$[15],
                                [
                                    "{r=",
                                    _(oc$Pervasives$[15],
                                        [
                                            _(oc$Pervasives$[20], [param$131[0]]),
                                            _(oc$Pervasives$[15],
                                                [
                                                    ";",
                                                    _(oc$Pervasives$[15],
                                                        [
                                                            "g=",
                                                            _(oc$Pervasives$[15],
                                                                [
                                                                    _(oc$Pervasives$[20], [param$131[1]]),
                                                                    _(oc$Pervasives$[15],
                                                                        [
                                                                            ";",
                                                                            _(oc$Pervasives$[15],
                                                                                ["b=", _(oc$Pervasives$[15], [_(oc$Pervasives$[20], [param$131[2]]), "}"])])
                                                                        ])
                                                                ])
                                                        ])
                                                ])
                                        ])
                                ]);
                        });
                    var string_of_sort$103 =
                        _f(function (param$130) {
                            switch (param$130) {
                                case 0: return "bool";
                                case 1: return "float";
                                case 2: return "point";
                                case 3: return "color";
                                default: return null;
                            }
                        });
                    return $(value$96, sorts$98, string_of_color$99, string_of_sort$103);
                }();
            var oc$Myrandom$ =
                function () {
                    var State$139 =
                        function () {
                            var new_state$63 = _f(function (param$197) { return $(caml_make_vect(55, 0), 0); });
                            var assign$64 =
                                _f(function (st1$65, st2$66) { _(oc$Array$[8], [st2$66[0], 0, st1$65[0], 0, 55]); return st1$65[1] = st2$66[1]; });
                            var pad$67 =
                                _f(function (k$68, s$69) {
                                    var n$70 = s$69.length;
                                    if (n$70 <= k$68) return __(oc$Pervasives$[15], [s$69, _(oc$String$[0], [k$68 - n$70, 97])]);
                                    return __(oc$String$[2], [s$69, n$70 - k$68, k$68]);
                                });
                            var full_init$71 =
                                _f(function (s$72, seed$73) {
                                    var combine$74 =
                                        _f(function (accu$75, x$76) {
                                            return __(pad$67, [16, _(oc$Pervasives$[15], [accu$75, _(oc$Pervasives$[19], [x$76])])]);
                                        });
                                    var extract$77 =
                                        _f(function (d$78) {
                                            return oc$$srefs(d$78, 0) + (oc$$srefs(d$78, 1) << 8) + (oc$$srefs(d$78, 2) << 16) ^ oc$$srefs(d$78, 3) << 22;
                                        });
                                    var l$79 = seed$73.length;
                                    for (var i$80 = 0; i$80 <= 54; i$80++) { (function (i$80) { oc$$asets(s$72[0], i$80, i$80); }(i$80)); }
                                    var accu$81 = "x";
                                    for (var i$82 = 0; i$82 <= 54 + _(oc$Pervasives$[4], [55, l$79]); i$82++) {
                                        (function (i$82) {
                                            var j$83 = i$82 % 55;
                                            var k$84 = i$82 % l$79;
                                            accu$81 = _(combine$74, [accu$81, oc$$arefs(seed$73, k$84)]);
                                            oc$$asets(s$72[0], j$83, oc$$arefs(s$72[0], j$83) ^ _(extract$77, [accu$81]));
                                        }(i$82));
                                    }
                                    return s$72[1] = 0;
                                });
                            var make$85 =
                                _f(function (seed$86) {
                                    var result$87 = _(new_state$63, [0]);
                                    _(full_init$71, [result$87, seed$86]);
                                    return result$87;
                                });
                            var copy$88 =
                                _f(function (s$89) { var result$90 = _(new_state$63, [0]); _(assign$64, [result$90, s$89]); return result$90; });
                            var bits$91 =
                                _f(function (s$92) {
                                    s$92[1] = (s$92[1] + 1) % 55;
                                    var newval$93 = oc$$arefs(s$92[0], (s$92[1] + 24) % 55) + oc$$arefs(s$92[0], s$92[1]) & 1073741823;
                                    oc$$asets(s$92[0], s$92[1], newval$93);
                                    return newval$93;
                                });
                            var intaux$94 =
                                _f(function (s$95, n$96) {
                                    var r$97 = _(bits$91, [s$95]);
                                    var v$98 = r$97 % n$96;
                                    if (r$97 - v$98 > 1073741823 - n$96 + 1) return __(intaux$94, [s$95, n$96]);
                                    return v$98;
                                });
                            var int$99 =
                                _f(function (s$100, bound$101) {
                                    if (bound$101 > 1073741823 || bound$101 <= 0) return __(oc$Pervasives$[0], ["Myrandom.int"]);
                                    return __(intaux$94, [s$100, bound$101]);
                                });
                            var int32aux$102 =
                                _f(function (s$103, n$104) {
                                    var b1$105 = _(bits$91, [s$103]);
                                    var b2$106 = (_(bits$91, [s$103]) & 1) << 30;
                                    var r$107 = b1$105 | b2$106;
                                    var v$108 = r$107 % n$104;
                                    if (r$107 - v$108 > oc$Int32$[6] - n$104 + 1) return __(int32aux$102, [s$103, n$104]);
                                    return v$108;
                                });
                            var int32$109 =
                                _f(function (s$110, bound$111) {
                                    if (bound$111 <= 0) return __(oc$Pervasives$[0], ["Random.int32"]);
                                    return __(int32aux$102, [s$110, bound$111]);
                                });
                            var int64aux$112 =
                                _f(function (s$113, n$114) {
                                    var b1$115 = _(bits$91, [s$113]);
                                    var b2$116 = _(bits$91, [s$113]) << 30;
                                    var b3$117 = (_(bits$91, [s$113]) & 7) << 60;
                                    var r$118 = b1$115 | (b2$116 | b3$117);
                                    var v$119 = r$118 % n$114;
                                    if (r$118 - v$119 > oc$Int64$[6] - n$114 + "1") return __(int64aux$112, [s$113, n$114]);
                                    return v$119;
                                });
                            var int64$120 =
                                _f(function (s$121, bound$122) {
                                    if (bound$122 <= "0") return __(oc$Pervasives$[0], ["Random.int64"]);
                                    return __(int64aux$112, [s$121, bound$122]);
                                });
                            var nativeint$123 =
                                oc$Nativeint$[6] === 32 ?
                                    _f(function (s$124, bound$125) { return _(int32$109, [s$124, bound$125]); }) :
                                    _f(function (s$126, bound$127) { return _(int64$120, [s$126, bound$127]); });
                            var rawfloat$128 =
                                _f(function (s$129) {
                                    var scale$130 = 1073741824.0;
                                    var r0$131 = _(bits$91, [s$129]);
                                    var r1$132 = _(bits$91, [s$129]);
                                    var r2$133 = _(bits$91, [s$129]);
                                    return ((r0$131 / scale$130 + r1$132) / scale$130 + r2$133) / scale$130;
                                });
                            var float$134 = _f(function (s$135, bound$136) { return _(rawfloat$128, [s$135]) * bound$136; });
                            var bool$137 = _f(function (s$138) { return (_(bits$91, [s$138]) & 1) === 0; });
                            return $(new_state$63, assign$64, pad$67, full_init$71, make$85, copy$88, bits$91, intaux$94, int$99, int32aux$102,
                                int32$109, int64aux$112, int64$120, nativeint$123, rawfloat$128, float$134, bool$137);
                        }();
                    var default$140 =
                        $(caml_obj_dup($(509760043, 399328820, 99941072, 112282318, 611886020, 516451399, 626288598, 337482183, 748548471, 808894867,
                            657927153, 386437385, 42355480, 977713532, 311548488, 13857891, 307938721, 93724463, 1041159001, 444711218,
                            1040610926, 233671814, 664494626, 1071756703, 188709089, 420289414, 969883075, 513442196, 275039308,
                            918830973, 598627151, 134083417, 823987070, 619204222, 81893604, 871834315, 398384680, 475117924, 520153386,
                            324637501, 38588599, 435158812, 168033706, 585877294, 328347186, 293179100, 671391820, 846150845, 283985689,
                            502873302, 718642511, 938465128, 962756406, 107944131, 192910970)), 0);
                    var bits$141 = _f(function (param$195) { return __(State$139[6], [default$140]); });
                    var int$142 = _f(function (bound$143) { return __(State$139[8], [default$140, bound$143]); });
                    var int32$144 = _f(function (bound$145) { return __(State$139[10], [default$140, bound$145]); });
                    var nativeint$146 = _f(function (bound$147) { return __(State$139[13], [default$140, bound$147]); });
                    var int64$148 = _f(function (bound$149) { return __(State$139[12], [default$140, bound$149]); });
                    var float$150 = _f(function (scale$151) { return __(State$139[15], [default$140, scale$151]); });
                    var bool$152 = _f(function (param$194) { return __(State$139[16], [default$140]); });
                    var full_init$153 = _f(function (seed$154) { return __(State$139[3], [default$140, seed$154]); });
                    var init$155 = _f(function (seed$156) { return __(State$139[3], [default$140, $(seed$156)]); });
                    var get_state$157 = _f(function (param$193) { return __(State$139[5], [default$140]); });
                    var set_state$158 = _f(function (s$159) { return __(State$139[1], [default$140, s$159]); });
                    return $(State$139, default$140, bits$141, int$142, int32$144, nativeint$146, int64$148, float$150, bool$152, full_init$153,
                        init$155, get_state$157, set_state$158);
                }();
            var oc$Util$ =
                function () {
                    var pi$74 = Math.atan2(0.0, -1.0);
                    var mod_float$27$75 =
                        _f(function (a$76, b$77) {
                            var x$78 = a$76 / b$77;
                            var n$79 = Math.floor(Math.abs(x$78));
                            if (x$78 >= 0.0) return a$76 - n$79 * b$77;
                            return a$76 + n$79 * b$77;
                        });
                    var range$80 =
                        _f(function ($2Aopt$2A$81, $2Aopt$2A$84, $2Aopt$2A$87, $2Aopt$2A$90, x$93) {
                            var a$82 = $2Aopt$2A$81 ? $2Aopt$2A$81[0] : -1.0;
                            var b$85 = $2Aopt$2A$84 ? $2Aopt$2A$84[0] : 1.0;
                            var min$88 = $2Aopt$2A$87 ? $2Aopt$2A$87[0] : -1.0;
                            var max$91 = $2Aopt$2A$90 ? $2Aopt$2A$90[0] : 1.0;
                            return max$91 -
                                (max$91 - min$88) *
                                Math.abs(_(mod_float$27$75, [Math.abs(x$93 - a$82), 2.0 * (b$85 - a$82)]) / (b$85 - a$82) - 1.0);
                        });
                    var rgb_range$94 =
                        _f(function ($2Aopt$2A$95, $2Aopt$2A$98, x$101) {
                            var min$96 = $2Aopt$2A$95 ? $2Aopt$2A$95[0] : -1.0;
                            var max$99 = $2Aopt$2A$98 ? $2Aopt$2A$98[0] : 1.0;
                            return min$96 + (max$99 - min$96) * (0.5 + Math.atan(2.0 * x$101) / pi$74);
                        });
                    var prob$102 = _f(function (param$418) { return __(oc$Myrandom$[7], [1.0]); });
                    var rnd_int$103 = _f(function (a$104, b$105) { return a$104 + _(oc$Myrandom$[3], [b$105 - a$104 + 1]); });
                    var rnd_float$106 = _f(function (u$107, v$108) { return u$107 + _(oc$Myrandom$[7], [v$108 - u$107]); });
                    var rnd_name$109 =
                        _f(function (n1$110, n2$111) {
                            var pick$112 = _f(function (a$113) { return oc$$arefs(a$113, _(oc$Myrandom$[3], [a$113.length])); });
                            var prefix$114 = caml_obj_dup($("pre", "sup", "sub", "anti", "de", "non", "a", "e", "ae", "u", "i"));
                            var syllable$115 =
                                _f(function (param$417) {
                                    var vowels$116 = caml_obj_dup($("a", "a", "ae", "e", "e", "ea", "ee", "y", "i", "o", "oo", "ou", "u"));
                                    var consonants$117 =
                                        caml_obj_dup($("b", "bl", "bv", "c", "ck", "ch", "d", "d", "f", "fl", "g", "gl", "gg", "h", "j", "k", "l",
                                            "ll", "m", "n", "nt", "ng", "p", "pr", "pl", "qu", "r", "rr", "s", "sh", "st", "sp", "t", "tr",
                                            "t", "v", "x"));
                                    var c$118 = _(pick$112, [consonants$117]);
                                    var v$119 = _(pick$112, [vowels$116]);
                                    return __(oc$Pervasives$[15], [c$118, v$119]);
                                });
                            var ending$120 =
                                _f(function (param$416) {
                                    var noun$121 =
                                        caml_obj_dup($("", "", "", "re", "er", "es", "ub", "imp", "ius", "or", "ors", "ack", "ent", "ies", "ry", "elp",
                                            "ay", "ays"));
                                    var adj$122 =
                                        caml_obj_dup($("", "", "", "ish", "er", "est", "al", "ary", "ing", "ight", "ough", "ich", "ed", "ian", "ast",
                                            "ool"));
                                    var n$123 = _(pick$112, [noun$121]);
                                    var a$124 = _(pick$112, [adj$122]);
                                    return $(n$123, a$124);
                                });
                            var make$125 =
                                _f(function (k$126) {
                                    if (k$126 <= 0) return "";
                                    var s$127 = _(syllable$115, [0]);
                                    var ss$128 = _(make$125, [k$126 - 1]);
                                    return __(oc$Pervasives$[15], [s$127, ss$128]);
                                });
                            var match$415 = _(ending$120, [0]);
                            var noun$131 =
                                _(oc$Pervasives$[15], [_(prob$102, [0]) < 0.5 ? "" : _(pick$112, [prefix$114]), _(make$125, [n1$110])]);
                            var adj$132 =
                                _(oc$Pervasives$[15], [_(prob$102, [0]) < 0.5 ? "" : _(pick$112, [prefix$114]), _(make$125, [n2$111])]);
                            return __(oc$Pervasives$[15],
                                [
                                    adj$132,
                                    _(oc$Pervasives$[15],
                                        [match$415[1], _(oc$Pervasives$[15], [" ", _(oc$Pervasives$[15], [noun$131, match$415[0]])])])
                                ]);
                        });
                    var split_name$133 =
                        _f(function (str$134) {
                            try {
                                var k$135 = _(oc$String$[8], [str$134, 32]);
                                return $(_(oc$String$[2], [str$134, 0, k$135]),
                                    _(oc$String$[2], [str$134, k$135 + 1, str$134.length - k$135 - 1]));
                            }
                            catch (exn$414) {
                                if (exn$414[0] === Not_found$20g) return $(_(oc$Pervasives$[15], [str$134, " "]), str$134);
                                throw exn$414;
                            }
                        });
                    var nest$136 =
                        _f(function (f$137, x$138, n$139) {
                            if (n$139 <= 0) return x$138;
                            return __(f$137, [_(nest$136, [f$137, x$138, n$139 - 1])]);
                        });
                    var rnd_partition$140 =
                        _f(function (q$141, k$142) {
                            var inc$143 =
                                _f(function (param$411) {
                                    var n$146 = param$411[0];
                                    var $r140 = false;
                                    r$140: {
                                        {
                                            if (!!n$146) { { $r140 = true; break r$140; } }
                                            var match$412 = param$411[1];
                                            if (!match$412) { { $r140 = true; break r$140; } }
                                            return $(match$412[0] + 1, match$412[1]);
                                        }
                                    }
                                    if ($r140) {
                                        {
                                            var match$413 = param$411[1];
                                            if (match$413) return $(match$413[0], _(inc$143, [$(n$146 - 1, match$413[1])]));
                                            return __(oc$Pervasives$[1], ["rnd_partition: an impossible thing happened"]);
                                        }
                                    }
                                });
                            return __(nest$136,
                                [
                                    _f(function (is$149) {
                                        var r$150 = _(rnd_int$103, [0, k$142 - 1]);
                                        return __(inc$143, [$(r$150, is$149)]);
                                    }),
                                    _(nest$136, [_f(function (zs$151) { return $(0, zs$151); }), 0, k$142]),
                                    q$141
                                ]);
                        });
                    var map_range$152 =
                        _f(function (f$153, a$154, b$155) {
                            if (a$154 > b$155) return 0;
                            var x$156 = _(f$153, [a$154]);
                            var xs$157 = _(map_range$152, [f$153, a$154 + 1, b$155]);
                            return $(x$156, xs$157);
                        });
                    var pick_exp$158 =
                        _f(function (p$159, lst$160) {
                            var pck$161 =
                                _f(function (u$162, v$163, param$410) {
                                    if (param$410) {
                                        {
                                            var xs$166 = param$410[1];
                                            var x$164 = param$410[0];
                                            if (!xs$166) return x$164;
                                            if (v$163 <= u$162) return x$164;
                                            return __(pck$161, [u$162 * (1.0 - p$159), v$163 - u$162, xs$166]);
                                        }
                                    }
                                    return __(oc$Pervasives$[1], ["pick_exp: empty list"]);
                                });
                            var n$167 = _(oc$List$[0], [lst$160]);
                            var q$168 = _(rnd_float$106, [0.0, 1.0 - Math.pow(1.0 - p$159, n$167)]);
                            return __(pck$161, [p$159, q$168, lst$160]);
                        });
                    var pick_exp_maybe$169 =
                        _f(function (p$170, lst$171) {
                            var pck$172 =
                                _f(function (u$173, v$174, param$409) {
                                    if (!param$409) return 0;
                                    if (v$174 <= u$173) return $(param$409[0]);
                                    return __(pck$172, [u$173 * (1.0 - p$170), v$174 - u$173, param$409[1]]);
                                });
                            var q$177 = _(rnd_float$106, [0.0, 1.0]);
                            return __(pck$172, [p$170, q$177, lst$171]);
                        });
                    var pick$178 =
                        _f(function (lst$179) { return __(oc$List$[3], [lst$179, _(rnd_int$103, [0, _(oc$List$[0], [lst$179]) - 1])]); });
                    var pick_many$180 =
                        _f(function (n$181, lst$182) {
                            var split$183 =
                                _f(function (n$184, param$407) {
                                    if (param$407) {
                                        {
                                            var xs$186 = param$407[1];
                                            var x$185 = param$407[0];
                                            if (n$184 === 0) return $(x$185, xs$186);
                                            var match$408 = _(split$183, [n$184 - 1, xs$186]);
                                            return $(match$408[0], $(x$185, match$408[1]));
                                        }
                                    }
                                    throw $(Match_failure$16g, $("util.ml", 115, 18));
                                });
                            var pck$189 =
                                _f(function (n$190, lst$191, xs$192) {
                                    if (n$190 === 0) return xs$192;
                                    var k$193 = _(rnd_int$103, [0, _(oc$List$[0], [lst$191]) - 1]);
                                    var match$406 = _(split$183, [k$193, lst$191]);
                                    return __(pck$189, [n$190 - 1, match$406[1], $(match$406[0], xs$192)]);
                                });
                            return __(pck$189, [n$181, lst$182, 0]);
                        });
                    var index_of$196 =
                        _f(function (x$197, param$405) {
                            if (!param$405) return __(oc$Pervasives$[1], ["index_of: empty list"]);
                            if (caml_equal(x$197, param$405[0])) return 0;
                            return 1 + _(index_of$196, [x$197, param$405[1]]);
                        });
                    var enumerate$200 =
                        _f(function (lst$201) {
                            var enum$202 =
                                _f(function (k$203, param$404) {
                                    if (param$404) return $($(param$404[0], k$203), _(enum$202, [k$203 + 1, param$404[1]]));
                                    return 0;
                                });
                            return __(enum$202, [0, lst$201]);
                        });
                    var unionq$206 =
                        _f(function (x$207, lst$210) {
                            if (lst$210) {
                                {
                                    var y$208 = lst$210[0];
                                    if (x$207 === y$208) return lst$210;
                                    return $(y$208, _(unionq$206, [x$207, lst$210[1]]));
                                }
                            }
                            return $(x$207, 0);
                        });
                    var count$211 =
                        _f(function (lst$212, tok$213) {
                            var c$214 = _(oc$List$[10], [_f(function (t$215) { return $(t$215, $(0)); }), tok$213]);
                            _(oc$List$[9], [_f(function (x$216) { return _(oc$List$[29], [x$216, c$214])[0]++; }), lst$212]);
                            return __(oc$List$[10], [_f(function (param$403) { return $(param$403[0], param$403[1][0]); }), c$214]);
                        });
                    var color_of_rgb$219 = _f(function (r$220, g$221, b$222) { return $(r$220, g$221, b$222); });
                    var rgb_of_color$223 =
                        _f(function (param$401) {
                            return $(_(rgb_range$94, [$(0.0), $(255.0), param$401[0]]) >> 0,
                                _(rgb_range$94, [$(0.0), $(255.0), param$401[1]]) >> 0,
                                _(rgb_range$94, [$(0.0), $(255.0), param$401[2]]) >> 0);
                        });
                    var rgb_of_hsl$227 =
                        _f(function (h$228, sl$229, l$230) {
                            var v$231 = l$230 <= 0.5 ? l$230 * (1.0 + sl$229) : l$230 + sl$229 - l$230 * sl$229;
                            if (v$231 <= 0.0) return $(0.0, 0.0, 0.0);
                            var m$232 = l$230 + l$230 - v$231;
                            var sv$233 = (v$231 - m$232) / v$231;
                            var h6$234 = Math.abs(h$228 * 6.0);
                            var sextant$235 = (h6$234 >> 0) % 6;
                            var fract$236 = h6$234 - Math.floor(h6$234);
                            var vsf$237 = v$231 * sv$233 * fract$236;
                            var mid1$238 = m$232 + vsf$237;
                            var mid2$239 = v$231 - vsf$237;
                            if (sextant$235 < 0 || sextant$235 > 4) return $(v$231, m$232, mid2$239);
                            switch (sextant$235) {
                                case 0: return $(v$231, mid1$238, m$232);
                                case 1: return $(mid2$239, v$231, m$232);
                                case 2: return $(m$232, v$231, mid1$238);
                                case 3: return $(m$232, mid2$239, v$231);
                                case 4: return $(mid1$238, m$232, v$231);
                                default: return null;
                            }
                        });
                    var rnd_color$240 =
                        _f(function (param$400) {
                            var r$241 = _(rnd_float$106, [-1.0, 1.0]);
                            var g$242 = _(rnd_float$106, [-1.0, 1.0]);
                            var b$243 = _(rnd_float$106, [-1.0, 1.0]);
                            return __(color_of_rgb$219, [r$241, g$242, b$243]);
                        });
                    var rgb_force$244 =
                        _f(function (param$398, param$399) {
                            var dr$251 = param$398[0] - param$399[0];
                            var dg$252 = param$398[1] - param$399[1];
                            var db$253 = param$398[2] - param$399[2];
                            var d2$254 = 1.0 / (dr$251 * dr$251 + dg$252 * dg$252 + db$253 * db$253);
                            return $(dr$251 * d2$254, dg$252 * d2$254, db$253 * d2$254);
                        });
                    var palette_force$255 =
                        _f(function (c$256, p$257) {
                            return __(oc$List$[12],
                                [
                                    _f(function (param$396, d$261) {
                                        var z$260 = param$396[2];
                                        var y$259 = param$396[1];
                                        var x$258 = param$396[0];
                                        if (caml_equal(d$261, c$256)) return $(x$258, y$259, z$260);
                                        var match$397 = _(rgb_force$244, [c$256, d$261]);
                                        return $(x$258 + match$397[0], y$259 + match$397[1], z$260 + match$397[2]);
                                    }),
                                    $(0.0, 0.0, 0.0),
                                    p$257
                                ]);
                        });
                    var string_of_color$265 =
                        _f(function (param$395) {
                            return __(oc$Pervasives$[15],
                                [
                                    _(oc$Pervasives$[20], [param$395[0]]),
                                    _(oc$Pervasives$[15],
                                        [
                                            ", ",
                                            _(oc$Pervasives$[15],
                                                [
                                                    _(oc$Pervasives$[20], [param$395[1]]),
                                                    _(oc$Pervasives$[15], [", ", _(oc$Pervasives$[20], [param$395[2]])])
                                                ])
                                        ])
                                ]);
                        });
                    var string_of_palette$269 =
                        _f(function (p$270) { return __(oc$String$[5], ["\n", _(oc$List$[10], [string_of_color$265, p$270])]); });
                    var mix$271 =
                        _f(function (t$272, param$392, param$393) {
                            var u$279 = 1.0 - t$272;
                            return $(t$272 * param$392[0] + u$279 * param$393[0], t$272 * param$392[1] + u$279 * param$393[1],
                                t$272 * param$392[2] + u$279 * param$393[2]);
                        });
                    var mix3$280 =
                        _f(function (u$281, v$282, param$388, param$389, param$390) {
                            var w$292 = 1.0 - u$281 - v$282;
                            return $(u$281 * param$388[0] + v$282 * param$389[0] + w$292 * param$390[0],
                                u$281 * param$388[1] + v$282 * param$389[1] + w$292 * param$390[1],
                                u$281 * param$388[2] + v$282 * param$389[2] + w$292 * param$390[2]);
                        });
                    var mix4$293 =
                        _f(function (u$294, v$295, w$296, param$383, param$384, param$385, param$386) {
                            var t$309 = 1.0 - u$294 - v$295;
                            return $(u$294 * param$383[0] + v$295 * param$384[0] + w$296 * param$385[0] + t$309 * param$386[0],
                                u$294 * param$383[1] + v$295 * param$384[1] + w$296 * param$385[1] + t$309 * param$386[1],
                                u$294 * param$383[2] + v$295 * param$384[2] + w$296 * param$385[2] + t$309 * param$386[2]);
                        });
                    var minimize$310 =
                        _f(function (f$311, lst$312) {
                            var m$313 =
                                _f(function (y$314, v$315, param$382) {
                                    if (param$382) {
                                        {
                                            var xs$317 = param$382[1];
                                            var x$316 = param$382[0];
                                            var w$318 = _(f$311, [x$316]);
                                            if (caml_lessthan(v$315, w$318)) return __(m$313, [y$314, v$315, xs$317]);
                                            return __(m$313, [x$316, w$318, xs$317]);
                                        }
                                    }
                                    return y$314;
                                });
                            if (lst$312) { { var x$319 = lst$312[0]; return __(m$313, [x$319, _(f$311, [x$319]), lst$312[1]]); } }
                            return __(oc$Pervasives$[1], ["minimize: empty list"]);
                        });
                    var get$321 = _f(function (x$322, lst$323) { return __(oc$List$[29], [x$322, lst$323]); });
                    var put$324 =
                        _f(function (x$325, v$326, param$381) {
                            if (param$381) {
                                {
                                    var lst$330 = param$381[1];
                                    var p$329 = param$381[0];
                                    var y$327 = p$329[0];
                                    if (caml_equal(x$325, y$327)) return $($(y$327, $(v$326, p$329[1])), lst$330);
                                    return $(p$329, _(put$324, [x$325, v$326, lst$330]));
                                }
                            }
                            return $($(x$325, $(v$326, 0)), 0);
                        });
                    var uniq$331 =
                        _f(function (param$380) {
                            if (param$380) {
                                {
                                    var xs$333 = param$380[1];
                                    var x$332 = param$380[0];
                                    if (_(oc$List$[23], [x$332, xs$333])) return __(uniq$331, [xs$333]);
                                    return $(x$332, _(uniq$331, [xs$333]));
                                }
                            }
                            return 0;
                        });
                    var union$334 =
                        _f(function (lst$335) {
                            return __(oc$List$[37],
                                [_f(function (prim$379, prim$378) { return caml_compare(prim$379, prim$378); }), _(uniq$331, [lst$335])]);
                        });
                    var prng_init$336 =
                        _f(function (str$337) {
                            if (oc$$sneq(str$337, "")) {
                                {
                                    var n$338 = str$337.length;
                                    var a$339 = caml_make_vect(n$338, 0);
                                    for (var i$340 = 0; i$340 <= n$338 - 1; i$340++) {
                                        (function (i$340) { oc$$asets(a$339, i$340, i$340 * i$340 + oc$$srefs(str$337, i$340)); }(i$340));
                                    }
                                    return __(oc$Myrandom$[9], [a$339]);
                                }
                            }
                            return __(oc$Myrandom$[9], [$(0)]);
                        });
                    return $(pi$74, mod_float$27$75, range$80, rgb_range$94, prob$102, rnd_int$103, rnd_float$106, rnd_name$109, split_name$133,
                        nest$136, rnd_partition$140, map_range$152, pick_exp$158, pick_exp_maybe$169, pick$178, pick_many$180, index_of$196,
                        enumerate$200, unionq$206, count$211, color_of_rgb$219, rgb_of_color$223, rgb_of_hsl$227, rnd_color$240,
                        rgb_force$244, palette_force$255, string_of_color$265, string_of_palette$269, mix$271, mix3$280, mix4$293,
                        minimize$310, get$321, put$324, uniq$331, union$334, prng_init$336);
                }();
            var oc$Op$ =
                function () {
                    var op_scalar$83 =
                        _f(function (name$84, r$85) {
                            return $(name$84, 0, 1, _f(function (param$968, param$969, param$970) { return $1(r$85[0]); }));
                        });
                    var op_pt$86 =
                        _f(function (x$87, y$88) {
                            return $("pt", 0, 2, _f(function (param$964, param$965, param$966) { return $2(x$87[0], y$88[0]); }));
                        });
                    var O$491 =
                        function () {
                            var palette_f$89 =
                                $("palette_f", $(1, 0), 3,
                                    _f(function (param$953) {
                                        var $r378 = false;
                                        r$378: {
                                            {
                                                var match$958 = _(oc$Util$[15], [2, param$953[2]]);
                                                if (!match$958) { { $r378 = true; break r$378; } }
                                                var match$959 = match$958[1];
                                                if (!match$959) { { $r378 = true; break r$378; } }
                                                if (match$959[1]) { { $r378 = true; break r$378; } }
                                                return _f(function (param$954) {
                                                    var $r377 = false;
                                                    r$377: {
                                                        {
                                                            if (!param$954) { { $r377 = true; break r$377; } }
                                                            if (param$954[1]) { { $r377 = true; break r$377; } }
                                                            return _f(function (param$955) {
                                                                var match$956 = _(oc$Types$[0], [param$954[0]]);
                                                                switch ($t(match$956)) {
                                                                    case 1:
                                                                        return $3(_(oc$Util$[28],
                                                                            [
                                                                                _(oc$Util$[2], [0, 0, $(-1.0), $(2.0), match$956[0]]),
                                                                                match$958[0],
                                                                                match$959[0]
                                                                            ]));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 34, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r377) throw $(Match_failure$16g, $("op.ml", 33, 4));
                                                });
                                            }
                                        }
                                        if ($r378) throw $(Match_failure$16g, $("op.ml", 32, 6));
                                    }));
                            var palette_p$95 =
                                $("palette_p", $(2, 0), 3,
                                    _f(function (param$942) {
                                        var $r372 = false;
                                        r$372: {
                                            {
                                                var match$947 = _(oc$Util$[15], [2, param$942[2]]);
                                                if (!match$947) { { $r372 = true; break r$372; } }
                                                var match$948 = match$947[1];
                                                if (!match$948) { { $r372 = true; break r$372; } }
                                                if (match$948[1]) { { $r372 = true; break r$372; } }
                                                return _f(function (param$943) {
                                                    var $r371 = false;
                                                    r$371: {
                                                        {
                                                            if (!param$943) { { $r371 = true; break r$371; } }
                                                            if (param$943[1]) { { $r371 = true; break r$371; } }
                                                            return _f(function (param$944) {
                                                                var match$945 = _(oc$Types$[0], [param$943[0]]);
                                                                switch ($t(match$945)) {
                                                                    case 2:
                                                                        var x$102 = Math.abs(match$945[0]);
                                                                        var y$103 = Math.abs(match$945[1]);
                                                                        var t$104 = 1.0 / (x$102 + y$103);
                                                                        return $3(_(oc$Util$[28], [x$102 * t$104, match$947[0], match$948[0]]));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 46, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r371) throw $(Match_failure$16g, $("op.ml", 45, 4));
                                                });
                                            }
                                        }
                                        if ($r372) throw $(Match_failure$16g, $("op.ml", 44, 6));
                                    }));
                            var palette_pf$105 =
                                $("palette_pf", $(2, $(1, 0)), 3,
                                    _f(function (param$928) {
                                        var $r363 = false;
                                        r$363: {
                                            {
                                                var match$935 = _(oc$Util$[15], [3, param$928[2]]);
                                                if (!match$935) { { $r363 = true; break r$363; } }
                                                var match$936 = match$935[1];
                                                if (!match$936) { { $r363 = true; break r$363; } }
                                                var match$937 = match$936[1];
                                                if (!match$937) { { $r363 = true; break r$363; } }
                                                if (match$937[1]) { { $r363 = true; break r$363; } }
                                                return _f(function (param$929) {
                                                    var $r362 = false;
                                                    r$362: {
                                                        {
                                                            if (!param$929) { { $r362 = true; break r$362; } }
                                                            var match$933 = param$929[1];
                                                            if (!match$933) { { $r362 = true; break r$362; } }
                                                            if (match$933[1]) { { $r362 = true; break r$362; } }
                                                            return _f(function (param$930) {
                                                                var match$932 = _(oc$Types$[0], [param$929[0]]);
                                                                switch ($t(match$932)) {
                                                                    case 2:
                                                                        var match$931 = _(oc$Types$[0], [match$933[0]]);
                                                                        switch ($t(match$931)) {
                                                                            case 1:
                                                                                var x$115 = Math.abs(match$932[0]);
                                                                                var y$116 = Math.abs(match$932[1]);
                                                                                var z$117 = Math.abs(match$931[0]);
                                                                                var t$118 = 1.0 / (x$115 + y$116 + z$117);
                                                                                var c$119 =
                                                                                    _(oc$Util$[29],
                                                                                        [x$115 * t$118, y$116 * t$118, match$935[0], match$936[0], match$937[0]]);
                                                                                return $3(c$119);
                                                                            default: throw $(Match_failure$16g, $("op.ml", 62, 24));
                                                                        }
                                                                        break;
                                                                    default: throw $(Match_failure$16g, $("op.ml", 61, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r362) throw $(Match_failure$16g, $("op.ml", 60, 4));
                                                });
                                            }
                                        }
                                        if ($r363) throw $(Match_failure$16g, $("op.ml", 59, 6));
                                    }));
                            var palette_pp$120 =
                                $("palette_pp", $(2, $(2, 0)), 3,
                                    _f(function (param$913) {
                                        var $r351 = false;
                                        r$351: {
                                            {
                                                var match$920 = _(oc$Util$[15], [4, param$913[2]]);
                                                if (!match$920) { { $r351 = true; break r$351; } }
                                                var match$921 = match$920[1];
                                                if (!match$921) { { $r351 = true; break r$351; } }
                                                var match$922 = match$921[1];
                                                if (!match$922) { { $r351 = true; break r$351; } }
                                                var match$923 = match$922[1];
                                                if (!match$923) { { $r351 = true; break r$351; } }
                                                if (match$923[1]) { { $r351 = true; break r$351; } }
                                                return _f(function (param$914) {
                                                    var $r350 = false;
                                                    r$350: {
                                                        {
                                                            if (!param$914) { { $r350 = true; break r$350; } }
                                                            var match$918 = param$914[1];
                                                            if (!match$918) { { $r350 = true; break r$350; } }
                                                            if (match$918[1]) { { $r350 = true; break r$350; } }
                                                            return _f(function (param$915) {
                                                                var match$917 = _(oc$Types$[0], [param$914[0]]);
                                                                switch ($t(match$917)) {
                                                                    case 2:
                                                                        var match$916 = _(oc$Types$[0], [match$918[0]]);
                                                                        switch ($t(match$916)) {
                                                                            case 2:
                                                                                var x$132 = Math.abs(match$917[0]);
                                                                                var y$133 = Math.abs(match$917[1]);
                                                                                var z$134 = Math.abs(match$916[0]);
                                                                                var w$135 = Math.abs(match$916[1]);
                                                                                var t$136 = 1.0 / (x$132 + y$133 + z$134 + w$135);
                                                                                return $3(_(oc$Util$[30],
                                                                                    [
                                                                                        x$132 * t$136,
                                                                                        y$133 * t$136,
                                                                                        z$134 * t$136,
                                                                                        match$920[0],
                                                                                        match$921[0],
                                                                                        match$922[0],
                                                                                        match$923[0]
                                                                                    ]));
                                                                            default: throw $(Match_failure$16g, $("op.ml", 80, 24));
                                                                        }
                                                                        break;
                                                                    default: throw $(Match_failure$16g, $("op.ml", 79, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r350) throw $(Match_failure$16g, $("op.ml", 78, 4));
                                                });
                                            }
                                        }
                                        if ($r351) throw $(Match_failure$16g, $("op.ml", 77, 6));
                                    }));
                            var saturate$137 =
                                $("saturate", $(3, $(1, 0)), 3,
                                    _f(function (param$905, param$906) {
                                        var $r339 = false;
                                        r$339: {
                                            {
                                                if (!param$906) { { $r339 = true; break r$339; } }
                                                var match$910 = param$906[1];
                                                if (!match$910) { { $r339 = true; break r$339; } }
                                                if (match$910[1]) { { $r339 = true; break r$339; } }
                                                return _f(function (param$907) {
                                                    var match$909 = _(oc$Types$[0], [param$906[0]]);
                                                    switch ($t(match$909)) {
                                                        case 3:
                                                            var c$143 = match$909[0];
                                                            var b$142 = c$143[2];
                                                            var g$141 = c$143[1];
                                                            var r$140 = c$143[0];
                                                            var match$908 = _(oc$Types$[0], [match$910[0]]);
                                                            switch ($t(match$908)) {
                                                                case 1:
                                                                    var t$145 =
                                                                        _(oc$Pervasives$[4], [1.0, _(oc$Util$[2], [0, 0, $(0.0), $(1.1), match$908[0]])]);
                                                                    var mx$146 = _(oc$Pervasives$[4], [r$140, _(oc$Pervasives$[4], [g$141, b$142])]) + 0.01;
                                                                    var mn$147 = _(oc$Pervasives$[3], [r$140, _(oc$Pervasives$[3], [g$141, b$142])]) - 0.01;
                                                                    var d$148 = 1.0 / (mx$146 - mn$147);
                                                                    return $3(_(oc$Util$[28],
                                                                        [
                                                                            t$145,
                                                                            c$143,
                                                                            _(oc$Util$[20],
                                                                                [
                                                                                    2.0 * (r$140 - mn$147) * d$148 - 1.0,
                                                                                    2.0 * (g$141 - mn$147) * d$148 - 1.0,
                                                                                    2.0 * (b$142 - mn$147) * d$148 - 1.0
                                                                                ])
                                                                        ]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 96, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 95, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r339) throw $(Match_failure$16g, $("op.ml", 94, 20));
                                    }));
                            var scalar$149 =
                                $("scalar", $(2, 0), 1,
                                    _f(function (param$897) {
                                        var match$902 = _(oc$Util$[14], [param$897[0]]);
                                        var phi$154 = _(oc$Util$[14], [param$897[1]]);
                                        var u$155 = Math.cos(2.0 * oc$Util$[0] * phi$154);
                                        var v$156 = Math.sin(2.0 * oc$Util$[0] * phi$154);
                                        return _f(function (param$898) {
                                            var $r325 = false;
                                            r$325: {
                                                {
                                                    if (!param$898) { { $r325 = true; break r$325; } }
                                                    if (param$898[1]) { { $r325 = true; break r$325; } }
                                                    return _f(function (param$899) {
                                                        var match$900 = _(oc$Types$[0], [param$898[0]]);
                                                        switch ($t(match$900)) {
                                                            case 2:
                                                                return $1((match$900[0] - match$902[0]) * u$155 +
                                                                    (match$900[1] - match$902[1]) * v$156);
                                                            default: throw $(Match_failure$16g, $("op.ml", 118, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r325) throw $(Match_failure$16g, $("op.ml", 117, 4));
                                        });
                                    }));
                            var pmult$160 =
                                $("pmult", $(2, $(2, 0)), 2,
                                    _f(function (param$886) {
                                        var match$893 = _(oc$Util$[14], [param$886[0]]);
                                        var y$163 = match$893[1];
                                        var x$162 = match$893[0];
                                        return _f(function (param$887) {
                                            var $r319 = false;
                                            r$319: {
                                                {
                                                    if (!param$887) { { $r319 = true; break r$319; } }
                                                    var match$891 = param$887[1];
                                                    if (!match$891) { { $r319 = true; break r$319; } }
                                                    if (match$891[1]) { { $r319 = true; break r$319; } }
                                                    return _f(function (param$888) {
                                                        var match$890 = _(oc$Types$[0], [param$887[0]]);
                                                        switch ($t(match$890)) {
                                                            case 2:
                                                                var match$889 = _(oc$Types$[0], [match$891[0]]);
                                                                switch ($t(match$889)) {
                                                                    case 2:
                                                                        var u$27$170 = match$890[0] - x$162;
                                                                        var v$27$171 = match$890[1] - y$163;
                                                                        var w$27$172 = match$889[0] - x$162;
                                                                        var t$27$173 = match$889[1] - y$163;
                                                                        return $2(x$162 + u$27$170 * w$27$172 - v$27$171 * t$27$173,
                                                                            y$163 + u$27$170 * t$27$173 + v$27$171 * w$27$172);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 130, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 129, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r319) throw $(Match_failure$16g, $("op.ml", 128, 5));
                                        });
                                    }));
                            var protfold$174 =
                                $("protfold", $(2, $(2, 0)), 2,
                                    _f(function (param$876) {
                                        var n$176 = oc$Util$[0] / Math.ceil(_(oc$Util$[2], [0, 0, $(1.5), $(12.0), _(oc$Util$[14], [param$876[1]])]));
                                        return _f(function (param$877) {
                                            var $r308 = false;
                                            r$308: {
                                                {
                                                    if (!param$877) { { $r308 = true; break r$308; } }
                                                    var match$881 = param$877[1];
                                                    if (!match$881) { { $r308 = true; break r$308; } }
                                                    if (match$881[1]) { { $r308 = true; break r$308; } }
                                                    return _f(function (param$878) {
                                                        var match$880 = _(oc$Types$[0], [param$877[0]]);
                                                        switch ($t(match$880)) {
                                                            case 2:
                                                                var match$879 = _(oc$Types$[0], [match$881[0]]);
                                                                switch ($t(match$879)) {
                                                                    case 2:
                                                                        var y$182 = match$879[1];
                                                                        var x$181 = match$879[0];
                                                                        var u$27$183 = match$880[0] - x$181;
                                                                        var v$27$184 = match$880[1] - y$182;
                                                                        var phi$185 =
                                                                            _(oc$Util$[2],
                                                                                [
                                                                                    $(-n$176),
                                                                                    $(n$176),
                                                                                    $(-oc$Util$[0]),
                                                                                    $(oc$Util$[0]),
                                                                                    Math.atan2(v$27$184, u$27$183)
                                                                                ]);
                                                                        var r$186 = Math.sqrt(u$27$183 * u$27$183 + v$27$184 * v$27$184);
                                                                        return $2(x$181 + r$186 * Math.cos(phi$185), y$182 + r$186 * Math.sin(phi$185));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 146, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 145, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r308) throw $(Match_failure$16g, $("op.ml", 144, 4));
                                        });
                                    }));
                            var fold$187 =
                                $("fold", $(2, $(2, $(1, 0))), 2,
                                    _f(function (param$864) {
                                        var s$188 = param$864[1];
                                        var wgh1$190 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-1.1), $(0.3), _(oc$Util$[14], [s$188])])]);
                                        var wgh2$191 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-1.1), $(0.3), _(oc$Util$[14], [s$188])])]);
                                        var match$873 = _(oc$Util$[14], [param$864[0]]);
                                        var x1$194 = (1.0 - wgh1$190) * match$873[0];
                                        var y1$195 = (1.0 - wgh1$190) * match$873[1];
                                        var phi$196 = (1.0 - wgh2$191) * 2.0 * oc$Util$[0] * _(oc$Util$[14], [s$188]);
                                        return _f(function (param$865) {
                                            var $r292 = false;
                                            r$292: {
                                                {
                                                    if (!param$865) { { $r292 = true; break r$292; } }
                                                    var match$870 = param$865[1];
                                                    if (!match$870) { { $r292 = true; break r$292; } }
                                                    var match$871 = match$870[1];
                                                    if (!match$871) { { $r292 = true; break r$292; } }
                                                    if (match$871[1]) { { $r292 = true; break r$292; } }
                                                    return _f(function (param$866) {
                                                        var match$869 = _(oc$Types$[0], [param$865[0]]);
                                                        switch ($t(match$869)) {
                                                            case 2:
                                                                var match$868 = _(oc$Types$[0], [match$870[0]]);
                                                                switch ($t(match$868)) {
                                                                    case 2:
                                                                        var v$203 = match$868[1];
                                                                        var u$202 = match$868[0];
                                                                        var match$867 = _(oc$Types$[0], [match$871[0]]);
                                                                        switch ($t(match$867)) {
                                                                            case 1:
                                                                                var x$27$205 = x1$194 + wgh1$190 * match$869[0];
                                                                                var y$27$206 = y1$195 + wgh1$190 * match$869[1];
                                                                                var a$207 = u$202 - x$27$205;
                                                                                var b$208 = v$203 - y$27$206;
                                                                                var t$27$209 = phi$196 + wgh2$191 * 2.0 * oc$Util$[0] * match$867[0];
                                                                                var cs$210 = Math.cos(t$27$209);
                                                                                var sn$211 = Math.sin(t$27$209);
                                                                                var r$212 = 2.0 * _(oc$Pervasives$[4], [0.0, a$207 * cs$210 + b$208 * sn$211]);
                                                                                return $2(u$202 - r$212 * cs$210, v$203 - r$212 * sn$211);
                                                                            default: throw $(Match_failure$16g, $("op.ml", 169, 24));
                                                                        }
                                                                        break;
                                                                    default: throw $(Match_failure$16g, $("op.ml", 168, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 167, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r292) throw $(Match_failure$16g, $("op.ml", 166, 4));
                                        });
                                    }));
                            var dist$213 =
                                $("dist", $(2, $(2, 0)), 1,
                                    _f(function (param$854) {
                                        var wgh$216 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.2), $(0.5), _(oc$Util$[14], [param$854[1]])])]);
                                        var match$861 = _(oc$Util$[14], [param$854[0]]);
                                        var x1$219 = (1.0 - wgh$216) * match$861[0];
                                        var y1$220 = (1.0 - wgh$216) * match$861[1];
                                        return _f(function (param$855) {
                                            var $r273 = false;
                                            r$273: {
                                                {
                                                    if (!param$855) { { $r273 = true; break r$273; } }
                                                    var match$859 = param$855[1];
                                                    if (!match$859) { { $r273 = true; break r$273; } }
                                                    if (match$859[1]) { { $r273 = true; break r$273; } }
                                                    return _f(function (param$856) {
                                                        var match$858 = _(oc$Types$[0], [param$855[0]]);
                                                        switch ($t(match$858)) {
                                                            case 2:
                                                                var match$857 = _(oc$Types$[0], [match$859[0]]);
                                                                switch ($t(match$857)) {
                                                                    case 2:
                                                                        var dx$227 = match$858[0] - x1$219 - wgh$216 * match$857[0];
                                                                        var dy$228 = match$858[1] - y1$220 - wgh$216 * match$857[1];
                                                                        return $1(Math.sqrt(2.0 * (dx$227 * dx$227 + dy$228 * dy$228)) - 1.0);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 192, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 191, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r273) throw $(Match_failure$16g, $("op.ml", 190, 4));
                                        });
                                    }));
                            var rotate$229 =
                                $("rotate", $(2, $(2, $(1, 0))), 2,
                                    _f(function (param$842) {
                                        var s$230 = param$842[1];
                                        var wgh1$232 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(0.3), _(oc$Util$[14], [s$230])])]);
                                        var wgh2$233 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(0.3), _(oc$Util$[14], [s$230])])]);
                                        var match$851 = _(oc$Util$[14], [param$842[0]]);
                                        var x1$236 = (1.0 - wgh1$232) * match$851[0];
                                        var y1$237 = (1.0 - wgh1$232) * match$851[1];
                                        var phi$238 = (1.0 - wgh2$233) * 2.0 * oc$Util$[0] * _(oc$Util$[14], [s$230]);
                                        return _f(function (param$843) {
                                            var $r259 = false;
                                            r$259: {
                                                {
                                                    if (!param$843) { { $r259 = true; break r$259; } }
                                                    var match$848 = param$843[1];
                                                    if (!match$848) { { $r259 = true; break r$259; } }
                                                    var match$849 = match$848[1];
                                                    if (!match$849) { { $r259 = true; break r$259; } }
                                                    if (match$849[1]) { { $r259 = true; break r$259; } }
                                                    return _f(function (param$844) {
                                                        var match$847 = _(oc$Types$[0], [param$843[0]]);
                                                        switch ($t(match$847)) {
                                                            case 2:
                                                                var match$846 = _(oc$Types$[0], [match$848[0]]);
                                                                switch ($t(match$846)) {
                                                                    case 2:
                                                                        var match$845 = _(oc$Types$[0], [match$849[0]]);
                                                                        switch ($t(match$845)) {
                                                                            case 1:
                                                                                var x$27$247 = x1$236 + wgh1$232 * match$847[0];
                                                                                var y$27$248 = y1$237 + wgh1$232 * match$847[1];
                                                                                var a$249 = match$846[0] - x$27$247;
                                                                                var b$250 = match$846[1] - y$27$248;
                                                                                var t$27$251 = phi$238 + wgh2$233 * 2.0 * oc$Util$[0] * match$845[0];
                                                                                var cs$252 = Math.cos(t$27$251);
                                                                                var sn$253 = Math.sin(t$27$251);
                                                                                return $2(x$27$247 + cs$252 * a$249 + sn$253 * b$250,
                                                                                    y$27$248 - sn$253 * a$249 + cs$252 * b$250);
                                                                            default: throw $(Match_failure$16g, $("op.ml", 214, 24));
                                                                        }
                                                                        break;
                                                                    default: throw $(Match_failure$16g, $("op.ml", 213, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 212, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r259) throw $(Match_failure$16g, $("op.ml", 211, 4));
                                        });
                                    }));
                            var discretize$254 =
                                $("discretize", $(2, $(2, 0)), 2,
                                    _f(function (param$832) {
                                        var match$839 = _(oc$Util$[14], [param$832[0]]);
                                        var t$259 =
                                            _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.1), $(0.8), _(oc$Util$[14], [param$832[1]])])]);
                                        var a$260 = 0.1 * (1.0 - t$259) * match$839[0];
                                        var b$261 = 0.1 * (1.0 - t$259) * match$839[1];
                                        return _f(function (param$833) {
                                            var $r241 = false;
                                            r$241: {
                                                {
                                                    if (!param$833) { { $r241 = true; break r$241; } }
                                                    var match$837 = param$833[1];
                                                    if (!match$837) { { $r241 = true; break r$241; } }
                                                    if (match$837[1]) { { $r241 = true; break r$241; } }
                                                    return _f(function (param$834) {
                                                        var match$836 = _(oc$Types$[0], [param$833[0]]);
                                                        switch ($t(match$836)) {
                                                            case 2:
                                                                var match$835 = _(oc$Types$[0], [match$837[0]]);
                                                                switch ($t(match$835)) {
                                                                    case 2:
                                                                        var a$27$268 = match$835[0] * t$259 + a$260;
                                                                        var b$27$269 = match$835[1] * t$259 + b$261;
                                                                        return $2(a$27$268 * Math.floor(match$836[0] / a$27$268),
                                                                            b$27$269 * Math.floor(match$836[1] / b$27$269));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 236, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 235, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r241) throw $(Match_failure$16g, $("op.ml", 234, 4));
                                        });
                                    }));
                            var pplus$270 =
                                $("pplus", $(2, $(2, 0)), 2,
                                    _f(function (param$824, param$825) {
                                        var $r233 = false;
                                        r$233: {
                                            {
                                                if (!param$825) { { $r233 = true; break r$233; } }
                                                var match$829 = param$825[1];
                                                if (!match$829) { { $r233 = true; break r$233; } }
                                                if (match$829[1]) { { $r233 = true; break r$233; } }
                                                return _f(function (param$826) {
                                                    var match$828 = _(oc$Types$[0], [param$825[0]]);
                                                    switch ($t(match$828)) {
                                                        case 2:
                                                            var match$827 = _(oc$Types$[0], [match$829[0]]);
                                                            switch ($t(match$827)) {
                                                                case 2: return $2(0.5 * (match$828[0] + match$827[0]), 0.5 * (match$828[1] + match$827[1]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 250, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 249, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r233) throw $(Match_failure$16g, $("op.ml", 248, 20));
                                    }));
                            var fplus$277 =
                                $("fplus", $(1, $(1, 0)), 1,
                                    _f(function (param$816, param$817) {
                                        var $r227 = false;
                                        r$227: {
                                            {
                                                if (!param$817) { { $r227 = true; break r$227; } }
                                                var match$821 = param$817[1];
                                                if (!match$821) { { $r227 = true; break r$227; } }
                                                if (match$821[1]) { { $r227 = true; break r$227; } }
                                                return _f(function (param$818) {
                                                    var match$820 = _(oc$Types$[0], [param$817[0]]);
                                                    switch ($t(match$820)) {
                                                        case 1:
                                                            var match$819 = _(oc$Types$[0], [match$821[0]]);
                                                            switch ($t(match$819)) {
                                                                case 1: return $1(0.5 * (match$820[0] + match$819[0]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 260, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 259, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r227) throw $(Match_failure$16g, $("op.ml", 258, 20));
                                    }));
                            var ftimes$282 =
                                $("ftimes", $(1, $(1, 0)), 1,
                                    _f(function (param$805) {
                                        var match$812 = _(oc$Util$[14], [param$805[0]]);
                                        return _f(function (param$806) {
                                            var $r220 = false;
                                            r$220: {
                                                {
                                                    if (!param$806) { { $r220 = true; break r$220; } }
                                                    var match$810 = param$806[1];
                                                    if (!match$810) { { $r220 = true; break r$220; } }
                                                    if (match$810[1]) { { $r220 = true; break r$220; } }
                                                    return _f(function (param$807) {
                                                        var match$809 = _(oc$Types$[0], [param$806[0]]);
                                                        switch ($t(match$809)) {
                                                            case 1:
                                                                var match$808 = _(oc$Types$[0], [match$810[0]]);
                                                                switch ($t(match$808)) {
                                                                    case 1: return $1((match$809[0] + match$812[0]) * (match$808[0] + match$812[1]));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 272, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 271, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r220) throw $(Match_failure$16g, $("op.ml", 270, 18));
                                        });
                                    }));
                            var fmix$290 =
                                $("fmix", $(1, $(1, $(1, 0))), 1,
                                    _f(function (param$795, param$796) {
                                        var $r214 = false;
                                        r$214: {
                                            {
                                                if (!param$796) { { $r214 = true; break r$214; } }
                                                var match$801 = param$796[1];
                                                if (!match$801) { { $r214 = true; break r$214; } }
                                                var match$802 = match$801[1];
                                                if (!match$802) { { $r214 = true; break r$214; } }
                                                if (match$802[1]) { { $r214 = true; break r$214; } }
                                                return _f(function (param$797) {
                                                    var match$800 = _(oc$Types$[0], [param$796[0]]);
                                                    switch ($t(match$800)) {
                                                        case 1:
                                                            var match$799 = _(oc$Types$[0], [match$801[0]]);
                                                            switch ($t(match$799)) {
                                                                case 1:
                                                                    var match$798 = _(oc$Types$[0], [match$802[0]]);
                                                                    switch ($t(match$798)) {
                                                                        case 1:
                                                                            var u$297 = Math.abs(_(oc$Util$[3], [$(0.0), $(1.0), match$800[0]]));
                                                                            return $1(u$297 * match$799[0] + (1.0 - u$297) * match$798[0]);
                                                                        default: throw $(Match_failure$16g, $("op.ml", 283, 20));
                                                                    }
                                                                    break;
                                                                default: throw $(Match_failure$16g, $("op.ml", 282, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 281, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r214) throw $(Match_failure$16g, $("op.ml", 280, 20));
                                    }));
                            var pmix$298 =
                                $("pmix", $(2, $(2, $(1, 0))), 2,
                                    _f(function (param$785, param$786) {
                                        var $r206 = false;
                                        r$206: {
                                            {
                                                if (!param$786) { { $r206 = true; break r$206; } }
                                                var match$791 = param$786[1];
                                                if (!match$791) { { $r206 = true; break r$206; } }
                                                var match$792 = match$791[1];
                                                if (!match$792) { { $r206 = true; break r$206; } }
                                                if (match$792[1]) { { $r206 = true; break r$206; } }
                                                return _f(function (param$787) {
                                                    var match$790 = _(oc$Types$[0], [param$786[0]]);
                                                    switch ($t(match$790)) {
                                                        case 2:
                                                            var match$789 = _(oc$Types$[0], [match$791[0]]);
                                                            switch ($t(match$789)) {
                                                                case 2:
                                                                    var match$788 = _(oc$Types$[0], [match$792[0]]);
                                                                    switch ($t(match$788)) {
                                                                        case 1:
                                                                            var t$307 = Math.abs(_(oc$Util$[2], [0, 0, 0, 0, match$788[0]]));
                                                                            return $2(t$307 * match$790[0] + (1.0 - t$307) * match$789[0],
                                                                                t$307 * match$790[1] + (1.0 - t$307) * match$789[1]);
                                                                        default: throw $(Match_failure$16g, $("op.ml", 295, 20));
                                                                    }
                                                                    break;
                                                                default: throw $(Match_failure$16g, $("op.ml", 294, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 293, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r206) throw $(Match_failure$16g, $("op.ml", 292, 20));
                                    }));
                            var fatan$308 =
                                $("fatan", $(1, 0), 1,
                                    _f(function (param$774) {
                                        var $r198 = false;
                                        r$198: {
                                            {
                                                var match$779 = _(oc$Util$[15], [2, param$774[1]]);
                                                if (!match$779) { { $r198 = true; break r$198; } }
                                                var match$780 = match$779[1];
                                                if (!match$780) { { $r198 = true; break r$198; } }
                                                if (match$780[1]) { { $r198 = true; break r$198; } }
                                                var a$312 = _(oc$Util$[2], [0, 0, $(0.1), $(10.0), match$779[0]]);
                                                return _f(function (param$775) {
                                                    var $r196 = false;
                                                    r$196: {
                                                        {
                                                            if (!param$775) { { $r196 = true; break r$196; } }
                                                            if (param$775[1]) { { $r196 = true; break r$196; } }
                                                            return _f(function (param$776) {
                                                                var match$777 = _(oc$Types$[0], [param$775[0]]);
                                                                switch ($t(match$777)) {
                                                                    case 1:
                                                                        return $1(Math.atan((match$777[0] - match$780[0]) / a$312) * 2.0 / oc$Util$[0]);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 308, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r196) throw $(Match_failure$16g, $("op.ml", 307, 18));
                                                });
                                            }
                                        }
                                        if ($r198) throw $(Match_failure$16g, $("op.ml", 305, 6));
                                    }));
                            var fsin$315 =
                                $("fsin", $(1, 0), 1,
                                    _f(function (param$766) {
                                        var f$317 = 10.0 * oc$Util$[0] * _(oc$Util$[14], [param$766[1]]);
                                        return _f(function (param$767) {
                                            var $r190 = false;
                                            r$190: {
                                                {
                                                    if (!param$767) { { $r190 = true; break r$190; } }
                                                    if (param$767[1]) { { $r190 = true; break r$190; } }
                                                    return _f(function (param$768) {
                                                        var match$769 = _(oc$Types$[0], [param$767[0]]);
                                                        switch ($t(match$769)) {
                                                            case 1: return $1(Math.sin(f$317 * match$769[0]));
                                                            default: throw $(Match_failure$16g, $("op.ml", 319, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r190) throw $(Match_failure$16g, $("op.ml", 318, 18));
                                        });
                                    }));
                            var sqrt$320 =
                                $("sqrt", $(1, 0), 1,
                                    _f(function (param$760, param$761) {
                                        var $r185 = false;
                                        r$185: {
                                            {
                                                if (!param$761) { { $r185 = true; break r$185; } }
                                                if (param$761[1]) { { $r185 = true; break r$185; } }
                                                return _f(function (param$762) {
                                                    var match$763 = _(oc$Types$[0], [param$761[0]]);
                                                    switch ($t(match$763)) {
                                                        case 1: return $1(2.0 * Math.sqrt(Math.abs(match$763[0])) - 1.0);
                                                        default: throw $(Match_failure$16g, $("op.ml", 328, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r185) throw $(Match_failure$16g, $("op.ml", 327, 20));
                                    }));
                            var fabs$323 =
                                $("abs", $(1, 0), 1,
                                    _f(function (param$754, param$755) {
                                        var $r180 = false;
                                        r$180: {
                                            {
                                                if (!param$755) { { $r180 = true; break r$180; } }
                                                if (param$755[1]) { { $r180 = true; break r$180; } }
                                                return _f(function (param$756) {
                                                    var match$757 = _(oc$Types$[0], [param$755[0]]);
                                                    switch ($t(match$757)) {
                                                        case 1: return $1(2.0 * Math.abs(match$757[0]) - 1.0);
                                                        default: throw $(Match_failure$16g, $("op.ml", 339, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r180) throw $(Match_failure$16g, $("op.ml", 338, 20));
                                    }));
                            var fmax$326 =
                                $("max", $(1, $(1, 0)), 1,
                                    _f(function (param$746, param$747) {
                                        var $r175 = false;
                                        r$175: {
                                            {
                                                if (!param$747) { { $r175 = true; break r$175; } }
                                                var match$751 = param$747[1];
                                                if (!match$751) { { $r175 = true; break r$175; } }
                                                if (match$751[1]) { { $r175 = true; break r$175; } }
                                                return _f(function (param$748) {
                                                    var match$750 = _(oc$Types$[0], [param$747[0]]);
                                                    switch ($t(match$750)) {
                                                        case 1:
                                                            var match$749 = _(oc$Types$[0], [match$751[0]]);
                                                            switch ($t(match$749)) {
                                                                case 1: return $1(_(oc$Pervasives$[4], [match$750[0], match$749[0]]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 350, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 349, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r175) throw $(Match_failure$16g, $("op.ml", 348, 20));
                                    }));
                            var cmix$331 =
                                $("cmix", $(1, $(3, $(3, 0))), 3,
                                    _f(function (param$736, param$737) {
                                        var $r169 = false;
                                        r$169: {
                                            {
                                                if (!param$737) { { $r169 = true; break r$169; } }
                                                var match$742 = param$737[1];
                                                if (!match$742) { { $r169 = true; break r$169; } }
                                                var match$743 = match$742[1];
                                                if (!match$743) { { $r169 = true; break r$169; } }
                                                if (match$743[1]) { { $r169 = true; break r$169; } }
                                                return _f(function (param$738) {
                                                    var match$741 = _(oc$Types$[0], [param$737[0]]);
                                                    switch ($t(match$741)) {
                                                        case 1:
                                                            var match$740 = _(oc$Types$[0], [match$742[0]]);
                                                            switch ($t(match$740)) {
                                                                case 3:
                                                                    var match$739 = _(oc$Types$[0], [match$743[0]]);
                                                                    switch ($t(match$739)) {
                                                                        case 3: return $3(_(oc$Util$[28], [match$741[0], match$740[0], match$739[0]]));
                                                                        default: throw $(Match_failure$16g, $("op.ml", 361, 20));
                                                                    }
                                                                    break;
                                                                default: throw $(Match_failure$16g, $("op.ml", 360, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 359, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r169) throw $(Match_failure$16g, $("op.ml", 358, 20));
                                    }));
                            var inrange$338 =
                                $("negative", $(1, 0), 0,
                                    _f(function (param$725) {
                                        var $r162 = false;
                                        r$162: {
                                            {
                                                var match$730 = _(oc$Util$[15], [2, param$725[1]]);
                                                if (!match$730) { { $r162 = true; break r$162; } }
                                                var match$731 = match$730[1];
                                                if (!match$731) { { $r162 = true; break r$162; } }
                                                if (match$731[1]) { { $r162 = true; break r$162; } }
                                                var b$341 = match$731[0];
                                                var a$342 = _(oc$Pervasives$[3], [match$730[0], b$341]);
                                                var b$343 = _(oc$Pervasives$[4], [a$342, b$341]);
                                                return _f(function (param$726) {
                                                    var $r159 = false;
                                                    r$159: {
                                                        {
                                                            if (!param$726) { { $r159 = true; break r$159; } }
                                                            if (param$726[1]) { { $r159 = true; break r$159; } }
                                                            return _f(function (param$727) {
                                                                var match$728 = _(oc$Types$[0], [param$726[0]]);
                                                                switch ($t(match$728)) {
                                                                    case 1: var x$345 = match$728[0]; return $(a$342 < x$345 && x$345 < b$343);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 374, 24));
                                                                }
                                                            });
                                                        }
                                                    }
                                                    if ($r159) throw $(Match_failure$16g, $("op.ml", 373, 18));
                                                });
                                            }
                                        }
                                        if ($r162) throw $(Match_failure$16g, $("op.ml", 370, 6));
                                    }));
                            var negative$346 =
                                $("negative", $(1, 0), 0,
                                    _f(function (param$719, param$720) {
                                        var $r154 = false;
                                        r$154: {
                                            {
                                                if (!param$720) { { $r154 = true; break r$154; } }
                                                if (param$720[1]) { { $r154 = true; break r$154; } }
                                                return _f(function (param$721) {
                                                    var match$722 = _(oc$Types$[0], [param$720[0]]);
                                                    switch ($t(match$722)) {
                                                        case 1: return $(match$722[0] < 0.0);
                                                        default: throw $(Match_failure$16g, $("op.ml", 383, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r154) throw $(Match_failure$16g, $("op.ml", 382, 20));
                                    }));
                            var fless$349 =
                                $("fless", $(1, $(1, 0)), 0,
                                    _f(function (param$711, param$712) {
                                        var $r149 = false;
                                        r$149: {
                                            {
                                                if (!param$712) { { $r149 = true; break r$149; } }
                                                var match$716 = param$712[1];
                                                if (!match$716) { { $r149 = true; break r$149; } }
                                                if (match$716[1]) { { $r149 = true; break r$149; } }
                                                return _f(function (param$713) {
                                                    var match$715 = _(oc$Types$[0], [param$712[0]]);
                                                    switch ($t(match$715)) {
                                                        case 1:
                                                            var match$714 = _(oc$Types$[0], [match$716[0]]);
                                                            switch ($t(match$714)) {
                                                                case 1: return $(match$715[0] < match$714[0]);
                                                                default: throw $(Match_failure$16g, $("op.ml", 394, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 393, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r149) throw $(Match_failure$16g, $("op.ml", 392, 20));
                                    }));
                            var even$354 =
                                $("even", $(1, $(1, 0)), 0,
                                    _f(function (param$701) {
                                        var s$355 = param$701[1];
                                        var v$356 = _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(2.0), _(oc$Util$[14], [s$355])])]);
                                        var w$357 = _(oc$Util$[2], [0, 0, $(2.0), $(20.0), _(oc$Util$[14], [s$355])]);
                                        return _f(function (param$702) {
                                            var $r141 = false;
                                            r$141: {
                                                {
                                                    if (!param$702) { { $r141 = true; break r$141; } }
                                                    var match$706 = param$702[1];
                                                    if (!match$706) { { $r141 = true; break r$141; } }
                                                    if (match$706[1]) { { $r141 = true; break r$141; } }
                                                    return _f(function (param$703) {
                                                        var match$705 = _(oc$Types$[0], [param$702[0]]);
                                                        switch ($t(match$705)) {
                                                            case 1:
                                                                var match$704 = _(oc$Types$[0], [match$706[0]]);
                                                                switch ($t(match$704)) {
                                                                    case 1:
                                                                        var y$361 = match$704[0];
                                                                        return $((v$356 * y$361 * y$361 * y$361 + w$357 * match$705[0] >> 0) % 2 === 0);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 407, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 406, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r141) throw $(Match_failure$16g, $("op.ml", 405, 18));
                                        });
                                    }));
                            var close$362 =
                                $("close", $(2, $(2, 0)), 0,
                                    _f(function (param$691) {
                                        var r$364 = _(oc$Util$[14], [param$691[1]]);
                                        var r2$365 = r$364 * r$364;
                                        return _f(function (param$692) {
                                            var $r133 = false;
                                            r$133: {
                                                {
                                                    if (!param$692) { { $r133 = true; break r$133; } }
                                                    var match$696 = param$692[1];
                                                    if (!match$696) { { $r133 = true; break r$133; } }
                                                    if (match$696[1]) { { $r133 = true; break r$133; } }
                                                    return _f(function (param$693) {
                                                        var match$695 = _(oc$Types$[0], [param$692[0]]);
                                                        switch ($t(match$695)) {
                                                            case 2:
                                                                var match$694 = _(oc$Types$[0], [match$696[0]]);
                                                                switch ($t(match$694)) {
                                                                    case 2:
                                                                        var a$372 = match$695[0] - match$694[0];
                                                                        var b$373 = match$695[1] - match$694[1];
                                                                        return $(a$372 * a$372 + b$373 * b$373 < r2$365);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 420, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 419, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r133) throw $(Match_failure$16g, $("op.ml", 418, 4));
                                        });
                                    }));
                            var pfoci$374 =
                                $("pfoci", $(2, $(2, $(2, 0))), 2,
                                    _f(function (param$675) {
                                        var s$376 = param$675[1];
                                        var f$375 = param$675[0];
                                        var n$377 = _(oc$Pervasives$[3], [_(oc$List$[0], [f$375]), _(oc$List$[0], [s$376])]);
                                        var k$378 = _(oc$Util$[5], [2, n$377]);
                                        var p$379 = _(oc$Pervasives$[4], [0.0, _(oc$Util$[2], [0, 0, $(-0.05), $(0.5), _(oc$Util$[14], [s$376])])]);
                                        var fs$380 =
                                            function () {
                                                var xs$381 = _(oc$Util$[15], [k$378, f$375]);
                                                var ys$382 = _(oc$Util$[15], [k$378, s$376]);
                                                return _(oc$List$[36],
                                                    [xs$381, _(oc$List$[10], [_f(function (r$383) { return 0.1 * r$383 * r$383; }), ys$382])]);
                                            }();
                                        return _f(function (param$676) {
                                            var $r118 = false;
                                            r$118: {
                                                {
                                                    if (!param$676) { { $r118 = true; break r$118; } }
                                                    var match$686 = param$676[1];
                                                    if (!match$686) { { $r118 = true; break r$118; } }
                                                    var match$687 = match$686[1];
                                                    if (!match$687) { { $r118 = true; break r$118; } }
                                                    if (match$687[1]) { { $r118 = true; break r$118; } }
                                                    return _f(function (param$677) {
                                                        var match$685 = _(oc$Types$[0], [param$676[0]]);
                                                        switch ($t(match$685)) {
                                                            case 2:
                                                                var y$388 = match$685[1];
                                                                var x$387 = match$685[0];
                                                                var t$389 = _(oc$Types$[0], [match$686[0]]);
                                                                var match$684 = _(oc$Types$[0], [match$687[0]]);
                                                                switch ($t(match$684)) {
                                                                    case 2:
                                                                        try {
                                                                            var match$681 =
                                                                                _(oc$List$[25],
                                                                                    [
                                                                                        _f(function
                                                                                            (param$679) {
                                                                                            var match$680 = param$679[0];
                                                                                            var a$397 = x$387 - match$680[0] - p$379 * match$684[0];
                                                                                            var b$398 = y$388 - match$680[1] - p$379 * match$684[1];
                                                                                            return a$397 * a$397 + b$398 * b$398 < param$679[1];
                                                                                        }),
                                                                                        fs$380
                                                                                    ]);
                                                                            var match$682 = match$681[0];
                                                                            return $2(x$387 - match$682[0], y$388 - match$682[1]);
                                                                        }
                                                                        catch (exn$678) {
                                                                            if (exn$678[0] === Not_found$20g) return t$389;
                                                                            throw exn$678;
                                                                        }
                                                                        break;
                                                                    default: throw $(Match_failure$16g, $("op.ml", 441, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 439, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r118) throw $(Match_failure$16g, $("op.ml", 438, 4));
                                        });
                                    }));
                            var pclosestmax$399 =
                                $("pclosestmax", $(2, $(1, 0)), 2,
                                    _f(function (param$663) {
                                        var f$400 = param$663[0];
                                        var n$401 = _(oc$List$[0], [f$400]);
                                        var ps$402 = _(oc$Util$[15], [_(oc$Util$[5], [n$401 / 2 >> 0, n$401]), f$400]);
                                        return _f(function (param$664) {
                                            var $r104 = false;
                                            r$104: {
                                                {
                                                    if (!param$664) { { $r104 = true; break r$104; } }
                                                    var match$670 = param$664[1];
                                                    if (!match$670) { { $r104 = true; break r$104; } }
                                                    if (match$670[1]) { { $r104 = true; break r$104; } }
                                                    return _f(function (param$665) {
                                                        var match$669 = _(oc$Types$[0], [param$664[0]]);
                                                        switch ($t(match$669)) {
                                                            case 2:
                                                                var match$668 = _(oc$Types$[0], [match$670[0]]);
                                                                switch ($t(match$668)) {
                                                                    case 1:
                                                                        var t$407 = match$668[0];
                                                                        var match$667 =
                                                                            _(oc$Util$[31],
                                                                                [
                                                                                    _f(function (param$666) {
                                                                                        return __
                                                                                            (oc$Pervasives$[4],
                                                                                                [
                                                                                                    t$407 * param$666[0] - match$669[0],
                                                                                                    t$407 * param$666[1] - match$669[1]
                                                                                                ]);
                                                                                    }),
                                                                                    ps$402
                                                                                ]);
                                                                        return $2(match$667[0], match$667[1]);
                                                                    default: throw $(Match_failure$16g, $("op.ml", 465, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 464, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r104) throw $(Match_failure$16g, $("op.ml", 463, 4));
                                        });
                                    }));
                            var fclosest$412 =
                                $("fclosest", $(1, $(1, 0)), 1,
                                    _f(function (param$653) {
                                        var s$413 = param$653[1];
                                        var n$414 = _(oc$List$[0], [s$413]);
                                        var ss$415 = _(oc$Util$[15], [_(oc$Util$[5], [n$414 / 2 >> 0, n$414]), s$413]);
                                        return _f(function (param$654) {
                                            var $r94 = false;
                                            r$94: {
                                                {
                                                    if (!param$654) { { $r94 = true; break r$94; } }
                                                    var match$658 = param$654[1];
                                                    if (!match$658) { { $r94 = true; break r$94; } }
                                                    if (match$658[1]) { { $r94 = true; break r$94; } }
                                                    return _f(function (param$655) {
                                                        var match$657 = _(oc$Types$[0], [param$654[0]]);
                                                        switch ($t(match$657)) {
                                                            case 1:
                                                                var match$656 = _(oc$Types$[0], [match$658[0]]);
                                                                switch ($t(match$656)) {
                                                                    case 1:
                                                                        return $1(_(oc$Util$[31],
                                                                            [
                                                                                _f(function
                                                                                    (u$420) {
                                                                                    return Math.abs(u$420 * match$656[0] - match$657[0]);
                                                                                }),
                                                                                ss$415
                                                                            ]));
                                                                    default: throw $(Match_failure$16g, $("op.ml", 480, 24));
                                                                }
                                                                break;
                                                            default: throw $(Match_failure$16g, $("op.ml", 479, 24));
                                                        }
                                                    });
                                                }
                                            }
                                            if ($r94) throw $(Match_failure$16g, $("op.ml", 478, 18));
                                        });
                                    }));
                            var torus$421 =
                                $("torus", $(2, $(1, $(1, 0))), 2,
                                    _f(function (param$643, param$644) {
                                        var $r87 = false;
                                        r$87: {
                                            {
                                                if (!param$644) { { $r87 = true; break r$87; } }
                                                var match$649 = param$644[1];
                                                if (!match$649) { { $r87 = true; break r$87; } }
                                                var match$650 = match$649[1];
                                                if (!match$650) { { $r87 = true; break r$87; } }
                                                if (match$650[1]) { { $r87 = true; break r$87; } }
                                                return _f(function (param$645) {
                                                    var match$648 = _(oc$Types$[0], [param$644[0]]);
                                                    switch ($t(match$648)) {
                                                        case 2:
                                                            var match$647 = _(oc$Types$[0], [match$649[0]]);
                                                            switch ($t(match$647)) {
                                                                case 1:
                                                                    var a$427 = match$647[0];
                                                                    var match$646 = _(oc$Types$[0], [match$650[0]]);
                                                                    switch ($t(match$646)) {
                                                                        case 1:
                                                                            var b$428 = match$646[0];
                                                                            var a$27$429 = _(oc$Pervasives$[3], [a$427, b$428]) - 0.1;
                                                                            var b$27$430 = _(oc$Pervasives$[4], [a$427, b$428]) + 0.1;
                                                                            return $2(_(oc$Util$[2], [$(a$27$429), $(b$27$430), $(-1.0), $(1.0), match$648[0]]),
                                                                                _(oc$Util$[2], [$(a$27$429), $(b$27$430), $(-1.0), $(1.0), match$648[1]]));
                                                                        default: throw $(Match_failure$16g, $("op.ml", 492, 20));
                                                                    }
                                                                    break;
                                                                default: throw $(Match_failure$16g, $("op.ml", 491, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 490, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r87) throw $(Match_failure$16g, $("op.ml", 489, 20));
                                    }));
                            var bor$431 =
                                $("or", $(0, $(0, 0)), 0,
                                    _f(function (param$635, param$636) {
                                        var $r78 = false;
                                        r$78: {
                                            {
                                                if (!param$636) { { $r78 = true; break r$78; } }
                                                var match$640 = param$636[1];
                                                if (!match$640) { { $r78 = true; break r$78; } }
                                                if (match$640[1]) { { $r78 = true; break r$78; } }
                                                return _f(function (param$637) {
                                                    var match$639 = _(oc$Types$[0], [param$636[0]]);
                                                    switch ($t(match$639)) {
                                                        case 0:
                                                            var match$638 = _(oc$Types$[0], [match$640[0]]);
                                                            switch ($t(match$638)) {
                                                                case 0: return $(match$639[0] || match$638[0]);
                                                                default: throw $(Match_failure$16g, $("op.ml", 505, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 504, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r78) throw $(Match_failure$16g, $("op.ml", 503, 20));
                                    }));
                            var band$436 =
                                $("and", $(0, $(0, 0)), 0,
                                    _f(function (param$627, param$628) {
                                        var $r72 = false;
                                        r$72: {
                                            {
                                                if (!param$628) { { $r72 = true; break r$72; } }
                                                var match$632 = param$628[1];
                                                if (!match$632) { { $r72 = true; break r$72; } }
                                                if (match$632[1]) { { $r72 = true; break r$72; } }
                                                return _f(function (param$629) {
                                                    var match$631 = _(oc$Types$[0], [param$628[0]]);
                                                    switch ($t(match$631)) {
                                                        case 0:
                                                            var match$630 = _(oc$Types$[0], [match$632[0]]);
                                                            switch ($t(match$630)) {
                                                                case 0: return $(match$631[0] && match$630[0]);
                                                                default: throw $(Match_failure$16g, $("op.ml", 515, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 514, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r72) throw $(Match_failure$16g, $("op.ml", 513, 20));
                                    }));
                            var fif$441 =
                                $("fif", $(0, $(1, $(1, 0))), 1,
                                    _f(function (param$619, param$620) {
                                        var $r66 = false;
                                        r$66: {
                                            {
                                                if (!param$620) { { $r66 = true; break r$66; } }
                                                var match$623 = param$620[1];
                                                if (!match$623) { { $r66 = true; break r$66; } }
                                                var match$624 = match$623[1];
                                                if (!match$624) { { $r66 = true; break r$66; } }
                                                if (match$624[1]) { { $r66 = true; break r$66; } }
                                                return _f(function (param$621) {
                                                    var match$622 = _(oc$Types$[0], [param$620[0]]);
                                                    switch ($t(match$622)) {
                                                        case 0:
                                                            var u$446 = _(oc$Types$[0], [match$623[0]]);
                                                            var v$447 = _(oc$Types$[0], [match$624[0]]);
                                                            if (match$622[0]) return u$446;
                                                            return v$447;
                                                        default: throw $(Match_failure$16g, $("op.ml", 524, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r66) throw $(Match_failure$16g, $("op.ml", 523, 20));
                                    }));
                            var cif$448 =
                                $("cif", $(0, $(3, $(3, 0))), 3,
                                    _f(function (param$611, param$612) {
                                        var $r59 = false;
                                        r$59: {
                                            {
                                                if (!param$612) { { $r59 = true; break r$59; } }
                                                var match$615 = param$612[1];
                                                if (!match$615) { { $r59 = true; break r$59; } }
                                                var match$616 = match$615[1];
                                                if (!match$616) { { $r59 = true; break r$59; } }
                                                if (match$616[1]) { { $r59 = true; break r$59; } }
                                                return _f(function (param$613) {
                                                    var match$614 = _(oc$Types$[0], [param$612[0]]);
                                                    switch ($t(match$614)) {
                                                        case 0:
                                                            var u$453 = _(oc$Types$[0], [match$615[0]]);
                                                            var v$454 = _(oc$Types$[0], [match$616[0]]);
                                                            if (match$614[0]) return u$453;
                                                            return v$454;
                                                        default: throw $(Match_failure$16g, $("op.ml", 535, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r59) throw $(Match_failure$16g, $("op.ml", 534, 20));
                                    }));
                            var pif$455 =
                                $("pif", $(0, $(2, $(2, 0))), 2,
                                    _f(function (param$603, param$604) {
                                        var $r52 = false;
                                        r$52: {
                                            {
                                                if (!param$604) { { $r52 = true; break r$52; } }
                                                var match$607 = param$604[1];
                                                if (!match$607) { { $r52 = true; break r$52; } }
                                                var match$608 = match$607[1];
                                                if (!match$608) { { $r52 = true; break r$52; } }
                                                if (match$608[1]) { { $r52 = true; break r$52; } }
                                                return _f(function (param$605) {
                                                    var match$606 = _(oc$Types$[0], [param$604[0]]);
                                                    switch ($t(match$606)) {
                                                        case 0:
                                                            var u$460 = _(oc$Types$[0], [match$607[0]]);
                                                            var v$461 = _(oc$Types$[0], [match$608[0]]);
                                                            if (match$606[0]) return u$460;
                                                            return v$461;
                                                        default: throw $(Match_failure$16g, $("op.ml", 546, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r52) throw $(Match_failure$16g, $("op.ml", 545, 20));
                                    }));
                            var hsl$462 =
                                $("hsl", $(2, $(1, 0)), 3,
                                    _f(function (param$594, param$595) {
                                        var $r45 = false;
                                        r$45: {
                                            {
                                                if (!param$595) { { $r45 = true; break r$45; } }
                                                var match$600 = param$595[1];
                                                if (!match$600) { { $r45 = true; break r$45; } }
                                                if (match$600[1]) { { $r45 = true; break r$45; } }
                                                return _f(function (param$596) {
                                                    var match$599 = _(oc$Types$[0], [param$595[0]]);
                                                    switch ($t(match$599)) {
                                                        case 2:
                                                            var match$598 = _(oc$Types$[0], [match$600[0]]);
                                                            switch ($t(match$598)) {
                                                                case 1:
                                                                    var h$468 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$599[0] / 2.0]);
                                                                    var s$469 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$598[0]]);
                                                                    var l$470 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$599[1]]);
                                                                    var match$597 = _(oc$Util$[22], [h$468, s$469, l$470]);
                                                                    return $3(_(oc$Util$[20],
                                                                        [2.0 * match$597[0] - 1.0, 2.0 * match$597[1] - 1.0, 2.0 * match$597[2] - 1.0]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 558, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 557, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r45) throw $(Match_failure$16g, $("op.ml", 556, 20));
                                    }));
                            var bw$474 =
                                $("bw", $(1, 0), 3,
                                    _f(function (param$588, param$589) {
                                        var $r35 = false;
                                        r$35: {
                                            {
                                                if (!param$589) { { $r35 = true; break r$35; } }
                                                if (param$589[1]) { { $r35 = true; break r$35; } }
                                                return _f(function (param$590) {
                                                    var match$591 = _(oc$Types$[0], [param$589[0]]);
                                                    switch ($t(match$591)) {
                                                        case 1: var x$476 = match$591[0]; return $3(_(oc$Util$[20], [x$476, x$476, x$476]));
                                                        default: throw $(Match_failure$16g, $("op.ml", 575, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r35) throw $(Match_failure$16g, $("op.ml", 574, 20));
                                    }));
                            var rgb$477 =
                                $("rgb", $(1, $(1, $(1, 0))), 3,
                                    _f(function (param$578, param$579) {
                                        var $r30 = false;
                                        r$30: {
                                            {
                                                if (!param$579) { { $r30 = true; break r$30; } }
                                                var match$584 = param$579[1];
                                                if (!match$584) { { $r30 = true; break r$30; } }
                                                var match$585 = match$584[1];
                                                if (!match$585) { { $r30 = true; break r$30; } }
                                                if (match$585[1]) { { $r30 = true; break r$30; } }
                                                return _f(function (param$580) {
                                                    var match$583 = _(oc$Types$[0], [param$579[0]]);
                                                    switch ($t(match$583)) {
                                                        case 1:
                                                            var match$582 = _(oc$Types$[0], [match$584[0]]);
                                                            switch ($t(match$582)) {
                                                                case 1:
                                                                    var match$581 = _(oc$Types$[0], [match$585[0]]);
                                                                    switch ($t(match$581)) {
                                                                        case 1: return $3(_(oc$Util$[20], [match$583[0], match$582[0], match$581[0]]));
                                                                        default: throw $(Match_failure$16g, $("op.ml", 586, 20));
                                                                    }
                                                                    break;
                                                                default: throw $(Match_failure$16g, $("op.ml", 585, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 584, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r30) throw $(Match_failure$16g, $("op.ml", 583, 20));
                                    }));
                            var rgbv$484 =
                                $("rgbv", $(2, $(2, 0)), 3,
                                    _f(function (param$570, param$571) {
                                        var $r23 = false;
                                        r$23: {
                                            {
                                                if (!param$571) { { $r23 = true; break r$23; } }
                                                var match$575 = param$571[1];
                                                if (!match$575) { { $r23 = true; break r$23; } }
                                                if (match$575[1]) { { $r23 = true; break r$23; } }
                                                return _f(function (param$572) {
                                                    var match$574 = _(oc$Types$[0], [param$571[0]]);
                                                    switch ($t(match$574)) {
                                                        case 2:
                                                            var match$573 = _(oc$Types$[0], [match$575[0]]);
                                                            switch ($t(match$573)) {
                                                                case 2:
                                                                    var v$490 = match$573[1];
                                                                    return $3(_(oc$Util$[20],
                                                                        [match$574[0] * v$490, match$574[1] * v$490, match$573[0] * v$490]));
                                                                default: throw $(Match_failure$16g, $("op.ml", 596, 20));
                                                            }
                                                            break;
                                                        default: throw $(Match_failure$16g, $("op.ml", 595, 20));
                                                    }
                                                });
                                            }
                                        }
                                        if ($r23) throw $(Match_failure$16g, $("op.ml", 594, 20));
                                    }));
                            return $(palette_f$89, palette_p$95, palette_pf$105, palette_pp$120, saturate$137, scalar$149, pmult$160, protfold$174,
                                fold$187, dist$213, rotate$229, discretize$254, pplus$270, fplus$277, ftimes$282, fmix$290, pmix$298, fatan$308,
                                fsin$315, sqrt$320, fabs$323, fmax$326, cmix$331, inrange$338, negative$346, fless$349, even$354, close$362,
                                pfoci$374, pclosestmax$399, fclosest$412, torus$421, bor$431, band$436, fif$441, cif$448, pif$455, hsl$462,
                                bw$474, rgb$477, rgbv$484);
                        }();
                    var ops$492 =
                        $(O$491[4],
                            $(O$491[2],
                                $(O$491[3],
                                    $(O$491[5],
                                        $(O$491[6],
                                            $(O$491[7],
                                                $(O$491[9],
                                                    $(O$491[10],
                                                        $(O$491[8],
                                                            $(O$491[12],
                                                                $(O$491[13],
                                                                    $(O$491[14],
                                                                        $(O$491[15],
                                                                            $(O$491[16],
                                                                                $(O$491[17],
                                                                                    $(O$491[21],
                                                                                        $(O$491[22],
                                                                                            $(O$491[25],
                                                                                                $(O$491[24],
                                                                                                    $(O$491[11],
                                                                                                        $(O$491[23],
                                                                                                            $(O$491[28],
                                                                                                                $(O$491[29],
                                                                                                                    $(O$491[30],
                                                                                                                        $(O$491[31],
                                                                                                                            $(O$491[32],
                                                                                                                                $(O$491[33],
                                                                                                                                    $(O$491[34],
                                                                                                                                        $(O$491[35],
                                                                                                                                            $(O$491[36], $(O$491[40], $(O$491[37], $(O$491[38], 0)))))))))))))))))))))))))))))))));
                    var ops_sort$493 =
                        _f(function (s$494) { return __(oc$List$[26], [_f(function (f$495) { return caml_equal(f$495[2], s$494); }), ops$492]); });
                    var string_of_op$496 = _f(function (f$497) { return f$497[0]; });
                    var op_of_string$498 = _f(function (n$499) { return __(oc$List$[25], [n$499, ops$492]); });
                    var args$500 = _f(function (f$501) { return f$501[1]; });
                    var result$502 = _f(function (f$503) { return f$503[2]; });
                    var name$504 = _f(function (f$505) { return f$505[0]; });
                    var func$506 = _f(function (f$507) { return f$507[3]; });
                    var reduce$508 =
                        _f(function (fs$509) {
                            var n$510 = _(oc$List$[0], [fs$509]);
                            return __(oc$Util$[15], [_(oc$Util$[5], [1 + (n$510 / 5 >> 0), n$510]), fs$509]);
                        });
                    return $(op_scalar$83, op_pt$86, O$491, ops$492, ops_sort$493, string_of_op$496, op_of_string$498, args$500, result$502,
                        name$504, func$506, reduce$508);
                }();
            var oc$Gene$ =
                function () {
                    var op$82 = _f(function (l$83) { return l$83[0]; });
                    var connectors$84 = _f(function (l$85) { return l$85[1]; });
                    var link_x$86 = _f(function (x$87) { return $(_(oc$Op$[0], ["x", x$87]), 0); });
                    var link_y$88 = _f(function (y$89) { return $(_(oc$Op$[0], ["y", y$89]), 0); });
                    var link_t$90 = _f(function (t$91) { return $(_(oc$Op$[0], ["t", t$91]), 0); });
                    var link_pt$92 = _f(function (x$93, y$94) { return $(_(oc$Op$[1], [x$93, y$94]), 0); });
                    var get_sort$95 =
                        _f(function (s$96, lst$97) {
                            return __(oc$List$[26], [_f(function (l$98) { return caml_equal(_(oc$Op$[8], [l$98[0]]), s$96); }), lst$97]);
                        });
                    var connectible$99 =
                        _f(function (f$100, gene$101) {
                            return __(oc$List$[19],
                                [
                                    _f(function (s$102) {
                                        return __(oc$List$[20],
                                            [
                                                _f(function (param$227) { return caml_equal(s$102, _(oc$Op$[8], [param$227[0]])); }),
                                                gene$101
                                            ]);
                                    }),
                                    _(oc$Op$[7], [f$100])
                                ]);
                        });
                    var random_foci$104 =
                        _f(function (n$105) {
                            return __(oc$Util$[11],
                                [
                                    _f(function (param$226) {
                                        var x$106 = _(oc$Util$[6], [-1.0, 1.0]);
                                        var y$107 = _(oc$Util$[6], [-1.0, 1.0]);
                                        return $(x$106, y$107);
                                    }),
                                    1,
                                    n$105
                                ]);
                        });
                    var random_scalars$108 =
                        _f(function (n$109) {
                            return __(oc$Util$[11], [_f(function (param$225) { return __(oc$Util$[6], [-1.0, 1.0]); }), 1, n$109]);
                        });
                    var random_palette$110 =
                        _f(function (n$111) {
                            var p$112 = _(oc$Util$[11], [_f(function (param$224) { return __(oc$Util$[23], [0]); }), 1, n$111]);
                            var k$113 = _(oc$Util$[5], [-15, 15]);
                            var h$114 = 0.1;
                            return __(oc$Util$[9],
                                [
                                    _f(function (p$115) {
                                        return __(oc$List$[10],
                                            [
                                                _f(function (c$119) {
                                                    var match$223 = _(oc$Util$[25], [c$119, p$115]);
                                                    return $(c$119[0] + h$114 * match$223[0],
                                                        c$119[1] + h$114 * match$223[1],
                                                        c$119[2] + h$114 * match$223[2]);
                                                }),
                                                p$115
                                            ]);
                                    }),
                                    p$112,
                                    k$113
                                ]);
                        });
                    var connect$123 =
                        _f(function (f$124, lst$125) {
                            return $(f$124,
                                _(oc$List$[10],
                                    [
                                        _f(function (s$126) { return __(oc$Util$[12], [0.2, _(get_sort$95, [s$126, lst$125])]); }),
                                        _(oc$Op$[7], [f$124])
                                    ]));
                        });
                    var random_gene$127 =
                        _f(function (ops$128, seed$129, res$130, k$131) {
                            var make$132 =
                                _f(function (j$133, lst$134, lst1$135) {
                                    if (j$133 <= 1) {
                                        {
                                            var ops1$136 =
                                                _(oc$List$[26], [_f(function (f$137) { return __(connectible$99, [f$137, lst1$135]); }), ops$128]);
                                            var fs$139 =
                                                _(oc$List$[26],
                                                    [_f(function (f$138) { return __(oc$List$[23], [_(oc$Op$[8], [f$138]), res$130]); }), ops1$136]);
                                            if (fs$139) return $(_(connect$123, [_(oc$Util$[14], [fs$139]), lst1$135]), lst$134);
                                            if (j$133 < -k$131 - 5)
                                                return __(oc$Pervasives$[21], [_(random_gene$127, [oc$Op$[3], lst1$135, res$130, j$133]), lst$134]);
                                            var lnk$140 = _(connect$123, [_(oc$Util$[14], [ops1$136]), lst1$135]);
                                            return __(make$132, [j$133 - 1, $(lnk$140, lst$134), $(lnk$140, lst1$135)]);
                                        }
                                    }
                                    var f$141 = _(oc$Util$[14], [ops$128]);
                                    if (_(connectible$99, [f$141, lst1$135])) {
                                        {
                                            var lnk$142 = _(connect$123, [f$141, lst1$135]);
                                            return __(make$132, [j$133 - 1, $(lnk$142, lst$134), $(lnk$142, lst1$135)]);
                                        }
                                    }
                                    var match$220 =
                                        _(oc$List$[13],
                                            [
                                                _f(function (param$217, param$218) {
                                                    var g$154 = _(random_gene$127, [ops$128, lst1$135, $(param$217[0], 0), param$217[1]]);
                                                    if (g$154)
                                                        return $(param$218[0] - _(oc$List$[0], [g$154]),
                                                            $(g$154[0], param$218[1]), _(oc$Pervasives$[21], [g$154, param$218[2]]),
                                                            _(oc$Pervasives$[21], [g$154, param$218[3]]));
                                                    throw $(Match_failure$16g, $("gene.ml", 101, 7));
                                                }),
                                                _(oc$List$[36],
                                                    [
                                                        _(oc$Op$[7], [f$141]),
                                                        _(oc$Util$[10], [_(oc$Util$[5], [1, j$133 - 1]), _(oc$List$[0], [_(oc$Op$[7], [f$141])])])
                                                    ]),
                                                $(j$133, 0, lst$134, lst1$135)
                                            ]);
                                    var c$155 = $(f$141, match$220[1]);
                                    return __(make$132, [match$220[0], $(c$155, match$220[2]), $(c$155, match$220[3])]);
                                });
                            return __(make$132, [k$131, 0, seed$129]);
                        });
                    var random_dna$156 =
                        _f(function (ops$157, seed$158, res$159, k$160, n$161) {
                            var reduce$162 =
                                _f(function (ts$163, param$215) {
                                    if (param$215) {
                                        {
                                            var ls$165 = param$215[1];
                                            var l$164 = param$215[0];
                                            var t$166 = _(oc$Op$[8], [l$164[0]]);
                                            if ((t$166 !== 1 && t$166 !== 2 || _(oc$List$[23], [t$166, ts$163])) && _(oc$Util$[4], [0]) < 0.5)
                                                return __(reduce$162, [ts$163, ls$165]);
                                            return $(l$164, _(reduce$162, [$(t$166, ts$163), ls$165]));
                                        }
                                    }
                                    return 0;
                                });
                            if (n$161 <= 1) return __(random_gene$127, [ops$157, seed$158, res$159, k$160]);
                            var g1$168 = _(random_gene$127, [ops$157, seed$158, $(0, $(1, $(2, $(3, 0)))), k$160]);
                            if (g1$168) {
                                {
                                    var l1$167 = g1$168[0];
                                    var g2$170 = _(random_gene$127, [ops$157, seed$158, $(0, $(1, $(2, $(3, 0)))), k$160]);
                                    if (g2$170) {
                                        {
                                            var l2$169 = g2$170[0];
                                            var s$171 =
                                                $(l1$167,
                                                    $(l2$169, _(reduce$162, [$(_(oc$Op$[8], [l1$167[0]]), $(_(oc$Op$[8], [l2$169[0]]), 0)), seed$158])));
                                            return __(oc$Pervasives$[21],
                                                [
                                                    _(random_dna$156, [ops$157, s$171, res$159, k$160, n$161 - 2]),
                                                    _(oc$Pervasives$[21], [g1$168, g2$170])
                                                ]);
                                        }
                                    }
                                    throw $(Match_failure$16g, $("gene.ml", 128, 10));
                                }
                            }
                            throw $(Match_failure$16g, $("gene.ml", 127, 10));
                        });
                    var optimize$172 =
                        _f(function (g$173) {
                            var coll$174 =
                                _f(function (acc$176, param$212) {
                                    if (param$212) {
                                        {
                                            var cs$178 = param$212[1];
                                            var c$177 = param$212[0];
                                            if (_(oc$List$[24], [c$177, acc$176])) return __(coll$174, [acc$176, cs$178]);
                                            return __(coll$174, [_(collect$175, [acc$176, c$177]), cs$178]);
                                        }
                                    }
                                    return acc$176;
                                });
                            var collect$175 =
                                _f(function (acc$179, lnk$180) {
                                    return __(coll$174, [_(oc$Util$[18], [lnk$180, acc$179]), _(connectors$84, [lnk$180])]);
                                });
                            var used$181 = _(collect$175, [0, _(oc$List$[1], [g$173])]);
                            return __(oc$List$[26], [_f(function (l$182) { return __(oc$List$[24], [l$182, used$181]); }), g$173]);
                        });
                    var string_of_gene$183 =
                        _f(function (g$184) {
                            var h$185 = _(oc$Util$[17], [g$184]);
                            return __(oc$String$[5],
                                [
                                    "\n",
                                    _(oc$List$[10],
                                        [
                                            _f(function (param$211) {
                                                var l$186 = param$211[0];
                                                return __(oc$Pervasives$[15],
                                                    [
                                                        _(oc$Pervasives$[19], [param$211[1]]),
                                                        _(oc$Pervasives$[15],
                                                            [
                                                                ":",
                                                                _(oc$Pervasives$[15],
                                                                    [
                                                                        "[",
                                                                        _(oc$Pervasives$[15],
                                                                            [
                                                                                _(oc$Op$[5], [l$186[0]]),
                                                                                _(oc$Pervasives$[15],
                                                                                    [
                                                                                        ", (",
                                                                                        _(oc$Pervasives$[15],
                                                                                            [
                                                                                                _(oc$String$[5],
                                                                                                    [
                                                                                                        ",",
                                                                                                        _
                                                                                                            (oc$List$[10],
                                                                                                                [
                                                                                                                    _f
                                                                                                                        (function
                                                                                                                            (c$188) {
                                                                                                                            return __
                                                                                                                                (oc$Pervasives$[19],
                                                                                                                                    [_(oc$List$[30], [c$188, h$185])]);
                                                                                                                        }),
                                                                                                                    l$186[1]
                                                                                                                ])
                                                                                                    ]),
                                                                                                ")]"
                                                                                            ])
                                                                                    ])
                                                                            ])
                                                                    ])
                                                            ])
                                                    ]);
                                            }),
                                            h$185
                                        ])
                                ]);
                        });
                    return $(op$82, connectors$84, link_x$86, link_y$88, link_t$90, link_pt$92, get_sort$95, connectible$99, random_foci$104,
                        random_scalars$108, random_palette$110, connect$123, random_gene$127, random_dna$156, optimize$172,
                        string_of_gene$183);
                }();
            var oc$Compute$ =
                function () {
                    var default_color$74 = _(oc$Util$[20], [0.0, 0.0, 0.0]);
                    var default$75 =
                        _f(function (param$145) {
                            switch (param$145) {
                                case 0: return $(false);
                                case 1: return $1(0.7);
                                case 2: return $2(0.2, 0.3);
                                case 3: return $3(default_color$74);
                                default: return null;
                            }
                        });
                    var make_cell$76 =
                        _f(function (cells$77, f$78, env$79) {
                            return $($(_(default$75, [_(oc$Op$[8], [f$78])])), _(oc$Op$[10], [f$78, env$79, cells$77]));
                        });
                    var compile$80 =
                        _f(function (rna$81, env$82) {
                            var cmpl$83 =
                                _f(function (param$142) {
                                    if (param$142) {
                                        {
                                            var l$84 = param$142[0];
                                            var match$143 = _(cmpl$83, [param$142[1]]);
                                            var asc$87 = match$143[1];
                                            var c$88 =
                                                _(make_cell$76,
                                                    [
                                                        _(oc$List$[10],
                                                            [_f(function (r$89) { return __(oc$List$[30], [r$89, asc$87]); }), _(oc$Gene$[1], [l$84])]),
                                                        _(oc$Gene$[0], [l$84]),
                                                        env$82
                                                    ]);
                                            return $($(c$88, match$143[0]), $($(l$84, c$88), asc$87));
                                        }
                                    }
                                    return $(0, 0);
                                });
                            return _(cmpl$83, [rna$81])[0];
                        });
                    var random_picture$90 =
                        _f(function (str$91) {
                            var match$141 = _(oc$Util$[8], [str$91]);
                            var x$94 = $(0.0);
                            var y$95 = $(0.0);
                            var t$96 = $(-1.0);
                            _(oc$Util$[36], [match$141[0]]);
                            var scalars$97 = _(oc$Gene$[9], [10]);
                            var foci$98 = _(oc$Gene$[8], [_(oc$Util$[5], [5, 20])]);
                            var palette$99 =
                                $(_(oc$Util$[20], [-1.0, -1.0, -1.0]),
                                    $(_(oc$Util$[20], [1.0, 0.0, 1.0]), _(oc$Gene$[10], [_(oc$Util$[5], [2, 10])])));
                            var env$100 = $(foci$98, scalars$97, palette$99);
                            _(oc$Util$[36], [match$141[1]]);
                            var n$101 = _(oc$Util$[5], [120, 200]);
                            var ops$102 = _(oc$Op$[11], [oc$Op$[3]]);
                            var seed$103 = $(_(oc$Gene$[5], [x$94, y$95]), $(_(oc$Gene$[4], [t$96]), 0));
                            var g$104 =
                                _(oc$Gene$[14], [_(oc$Pervasives$[21], [_(oc$Gene$[12], [ops$102, seed$103, $(3, 0), n$101]), seed$103])]);
                            var dna$105 = _(compile$80, [g$104, env$100]);
                            return _f(function (t$27$106, x$27$107, y$27$108) {
                                x$94[0] = x$27$107;
                                y$95[0] = y$27$108;
                                t$96[0] = t$27$106;
                                return dna$105;
                            });
                        });
                    var run$109 =
                        _f(function (param$139) {
                            if (param$139) { { var c$110 = param$139[0]; _(run$109, [param$139[1]]); return c$110[0][0] = _(c$110[1], [0]); } }
                            return 0;
                        });
                    var eval$112 =
                        _f(function (rna$113, t$114, x$115, y$116) {
                            var prog$117 = _(rna$113, [t$114, x$115, y$116]);
                            var match$138 = (_(run$109, [prog$117]), _(oc$Types$[0], [_(oc$List$[1], [prog$117])]));
                            switch ($t(match$138)) {
                                case 3: return __(oc$Util$[21], [match$138[0]]);
                                default: return __(oc$Pervasives$[1], ["The result is not a color"]);
                            }
                        });
                    var compute_line$119 =
                        _f(function (rna$120, res$121, t$122, j$123, line$124) {
                            var d$125 = 2.0 / res$121;
                            for (var i$126 = 0; i$126 <= res$121 - 1; i$126++) {
                                (function (i$126) {
                                    var prog$127 = _(rna$120, [t$122, d$125 * (0.5 + i$126) - 1.0, d$125 * (0.5 + j$123) - 1.0]);
                                    var match$137 = (_(run$109, [prog$127]), _(oc$Types$[0], [_(oc$List$[1], [prog$127])]));
                                    switch ($t(match$137)) {
                                        case 3: oc$$asets(line$124, i$126, match$137[0]); break;
                                        default: _(oc$Pervasives$[1], ["The result is not a color"]);
                                    }
                                }(i$126));
                            }
                        });
                    return $(default_color$74, default$75, make_cell$76, compile$80, random_picture$90, run$109, eval$112, compute_line$119);
                }();
            var oc$Genjs$ =
                (ocaml_register("new_picture",
                    _(_f(function (prim$72, prim$71) { return caml_callback(prim$72, prim$71); }), [oc$Compute$[4]])), (
                        ocaml_register("compute_pixel",
                            _(_f(function (prim$69, prim$68, prim$67, prim$66) { return caml_callback3(prim$69, prim$68, prim$67, prim$66); }),
                                [
                                    _f(function (rna$59, x$60, y$61) {
                                        var match$70 = _(oc$Compute$[6], [rna$59, 0.0, x$60, y$61]);
                                        return __(oc$Pervasives$[15],
                                            [
                                                "rgb(",
                                                _(oc$Pervasives$[15],
                                                    [
                                                        _(oc$Pervasives$[19], [match$70[0]]),
                                                        _(oc$Pervasives$[15],
                                                            [
                                                                ",",
                                                                _(oc$Pervasives$[15],
                                                                    [
                                                                        _(oc$Pervasives$[19], [match$70[1]]),
                                                                        _(oc$Pervasives$[15],
                                                                            [
                                                                                ",",
                                                                                _(oc$Pervasives$[15], [_(oc$Pervasives$[19], [match$70[2]]), ")"])
                                                                            ])
                                                                    ])
                                                            ])
                                                    ])
                                            ]);
                                    })
                                ])), $()));
            var oc$Std_exit$ = (_(oc$Pervasives$[80], [0]), $());
            return caml_named_value;
        })();

        // outward bindings
        const __x_compute_pixel = ocaml_get("compute_pixel");
        return {
            new_picture: ocaml_get("new_picture"),
            compute_pixel(s, x, y) { return /rgb\((\d+?,\d+?,\d+?)\)/g.exec(__x_compute_pixel(s, x, y))[1].split(",").map(x => +x); }
        };

    })();

    class RandomArtEngine {

        name = null;
        width = null;
        height = null;

        init(name, width = 256, height = width) {
            this.name = name;
            this.width = width;
            this.height = height;
        }

        deinit() { }

        render() {
            throw new Error("Not implemented");
        }

    }

    class RandomArtCore extends RandomArtEngine {

        generator = null;

        init(name, width = 256, height = width) {
            console.log("init", name, width, height);
            super.init(name, width, height);
            this.generator = new_picture(name);
        }

        getCoord(i) {
            if (this.width == null) throw new Error("Engine is not initialized");
            return 2.0 * (i + 0.5) / this.width - 1.0;
        }

        getPixel(i) {
            if (this.width == null || this.generator == null)
                throw new Error("Engine is not initialized");
            // the engine generates 0,0,0 if either coordinate is 0
            // so we introduce a bit of error to avoid ever being 0
            const x = this.getCoord(i % this.width) + 0.00000001;
            const y = this.getCoord(Math.floor(i / this.width)) + 0.00000001;
            return compute_pixel(this.generator, x, y);
        }

        render(start = 0, count = this.width * this.height) {
            if (this.generator == null) throw new Error("Engine is not initialized");
            console.log("render", start, count);
            const bytes = count * 4;
            const buff = new Uint8ClampedArray(bytes);
            for (var i = 0; i < count; i++) {
                const rgb = this.getPixel(start + i);
                for (var j = 0; j < 3; j++) buff[i * 4 + j] = rgb[j];
                buff[i * 4 + 3] = 0xFF;
            }
            return buff;
        }

    }

    return { RandomArtEngine, RandomArtCore };

}
const { RandomArtEngine, RandomArtCore } = _engine();

function workerPayload({ RandomArtCore }) {

    const engine = new RandomArtCore();

    var firstInit = true;

    console.log("[worker] hello!");

    onmessage = e => {

        const data = e.data;

        if (typeof data.op !== "string" || !Array.isArray(data.args)) return;
        switch (data.op) {

            case "init":
                engine.init(...data.args);
                if (firstInit) {
                    postMessage("ready");
                    firstInit = false;
                }
                break;

            case "render":
                const buff = engine.render(...data.args);
                postMessage(buff, [buff.buffer])
                break;

        }

    };

}

class RandomArtOrchestrator extends RandomArtEngine {

    workers = [];
    queue = [];
    dormant = true;

    async init(name, width = 256, height = width, threads = 2) {
        super.init(name, width, height);
        if (this.dormant) {
            if (threads < 2) threads = 2;
            for (var i = 0; i < threads; i++) await this.appendWorker();
            this.dormant = false;
        }
        else this.publish("init", name, width, height);
    }

    deinit() {
        if (!this.dormant) {
            for (var thread of this.workers) thread.worker.terminate();
            this.workers = [];
            this.queue = [];
            this.dormant = true;
        }
    }

    publish(op, ...args) {
        for (var thread of this.workers) thread.worker.postMessage({ op, args });
    }

    appendWorker() {
        const worker = new Worker("data:,eval(unescape('" + escape("(" + workerPayload.toString() + ")((" + _engine.toString() + ")())") + "'))");
        const initPromise = new Promise(resolve => {
            worker.postMessage({
                op: "init",
                args: [this.name, this.width, this.height]
            });
            worker.addEventListener("message", x => resolve(x.data), { once: true });
        });
        initPromise.then(x => this.workers.push({
            worker,
            busy: false
        }));
        return initPromise;
    }

    dispatch(thread, job) {
        thread.busy = true;
        thread.worker.postMessage({
            op: "render",
            args: job.args
        });
        thread.worker.addEventListener("message", e => {
            job.resolve(e.data);
            if (this.queue.length > 0) this.dispatch(thread, this.queue.shift());
            else thread.busy = false;
        }, { once: true });
    }

    findFreeWorker() {
        for (const thread of this.workers) if (!thread.busy) return thread;
        return null;
    }

    queueJob(start = 0, count = this.width * this.height) {
        const job = { args: [start, count] };
        const promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = reject;
        });
        job.promise = promise;

        const thread = this.findFreeWorker();
        if (thread != null) this.dispatch(thread, job);
        else this.queue.push(job);

        return promise;
    }

    async render(callback = () => { }) {
        const pixels = this.width * this.height;
        const numjobs = this.workers.length * 2;
        const numchunks = Math.ceil(pixels / numjobs);
        const buffer = new Uint8ClampedArray(pixels * 4);
        const jobs = [];
        for (var i = 0; i < numjobs; i++) {
            const start = numchunks * i;
            jobs.push(this.queueJob(start, numchunks)
                .then(x => (buffer.set(x.subarray(0, buffer.length - start * 4), start * 4), callback(x))));
        }
        await Promise.all(jobs);
        return buffer;
    }

}

const engine = new RandomArtOrchestrator();

export async function main(seed, width = 256, height = 256) {
    if (seed == null) throw new Error("no seed provided");
    await engine.init(seed, width, height, os.cpus().length - 1); // allocate one less than hw threads
    const bytes = await engine.render();
    engine.deinit();
    return bytes;
}
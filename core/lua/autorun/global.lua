BINARY = 0
AUDIO = 1
IMAGE = 2
TEXT = 3

MIN_TYPE = BINARY
MAX_TYPE = TEXT

OPTIONS = cherenkov.globalOptions

start = cherenkov.start
stop = cherenkov.stop
seed = cherenkov.seed
seal = cherenkov.seal
bounce = cherenkov.bounce
yield = cherenkov.yield
free = cherenkov.free

function println(n, ...)
    sys.println(n, "[lua]", ...)
end

_DEFERRED = {}

local index = 0
function pipeline(func, name, defer, rseed)
    if type(func) ~= "function" then
        error("invalid pipeline function")
    end
    if not name then
        name = "@auto_" .. tostring(index)
        index = index + 1
    end
    local function go()
        println(2, "compiling " .. name)
        if rseed then
            seed(rseed)
        end
        start(name)
        func()
        stop()
    end
    if defer then
        println(2, "deferring compilation of " .. name)
        table.insert(_DEFERRED, go)
    else
        go()
    end
    return name
end

function output(func, seed)
    return pipeline(func, "@output", false, seed)
end

function from(sym, seed)
    if type(sym) == "function" then
        sym = pipeline(sym, nil, true, seed)
    end
    if type(sym) ~= "string" then
        error("invalid push (must be function or string)")
    end
    cherenkov.from(sym)
    return sym
end

function push(sym, seed)
    if type(sym) == "function" then
        sym = pipeline(sym, nil, true, seed)
    end
    if type(sym) ~= "string" then
        error("invalid push (must be function or string)")
    end
    cherenkov.push(sym)
    return sym
end

function run(sym, seed)
    push(sym, seed)
    cherenkov.flush()
    return sym
end

function as(ty)
    if ty < MIN_TYPE or ty > MAX_TYPE then
        error("invalid type " .. ty)
    end
    stage.util.cast({ type = ty })
end
cast = as

function string(str)
    stage.source.string({ text = str })
end

println(1, "setup complete")
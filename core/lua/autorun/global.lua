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

function println(n, ...)
    sys.println(n, "[lua]", ...)
end

_DEFERRED = {}

local index = 0
function pipeline(func, name, defer)
    if type(func) ~= "function" then
        error("invalid pipeline function")
    end
    if not name then
        name = "@auto_" .. tostring(index)
        index = index + 1
    end
    local function go()
        println(2, "compiling " .. name)
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

function output(func)
    pipeline(func, "@output")
end

function from(sym)
    if type(sym) == "function" then
        sym = pipeline(sym, nil, true)
    end
    if type(sym) ~= "string" then
        error("invalid push (must be function or string)")
    end
    cherenkov.from(sym)
end

function push(sym)
    if type(sym) == "function" then
        sym = pipeline(sym, nil, true)
    end
    if type(sym) ~= "string" then
        error("invalid push (must be function or string)")
    end
    cherenkov.push(sym)
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
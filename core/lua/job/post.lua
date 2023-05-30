println(1, "running post script")

local function rundeferred()
    local deferred = _DEFERRED
    _DEFERRED = {}
    for func in ipairs(deferred) do
        --print(deferred[func])
        deferred[func]()
    end
end
local count = 0
while #_DEFERRED > 0 do
    println(2, "doing deferred compiles; pass " .. tostring(count))
    rundeferred()
end

println(1, "compilation complete")
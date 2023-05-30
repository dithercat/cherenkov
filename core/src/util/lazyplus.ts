var _plus = null;
export function lazyPlus() {
    if (_plus != null) return _plus;
    return _plus = require("pixl-canvas-plus");
}
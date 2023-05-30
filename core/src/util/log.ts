var logLevel = 0;

export function setLogLevel(level: number) {
    logLevel = level;
}

export function getLogLevel(): number {
    return logLevel;
}

export function println(lvl: number, ...args: any[]) {
    if (logLevel >= lvl) console.warn(...args);
}

export function printtrace(lvl: number, ...args: any[]) {
    if (logLevel >= lvl) console.trace(...args);
}
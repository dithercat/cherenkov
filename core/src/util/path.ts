type ExecPath = "ffmpeg" | "magick"

const paths: Record<ExecPath, string> = {
    ffmpeg: "ffmpeg",
    magick: "convert"
}

export function getPath(key: ExecPath): string {
    return paths[key];
}

export function setPath(key: ExecPath, path: string) {
    paths[key] = path;
}
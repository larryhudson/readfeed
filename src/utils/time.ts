export function secsToMMSS(secs: number) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs - minutes * 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export function msToHHMMSS(ms: number) {
  const secs = Math.floor(ms / 1000);
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs - minutes * 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
}

export function secsToMs(secs: number) {
  return secs * 1000;
}

export const isPerfDebug =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_PERF_DEBUG === "true";

export function perfMark(name: string) {
  if (!isPerfDebug || typeof performance === "undefined") return;

  performance.mark(name);
}

export function perfMeasure(name: string, startMark: string, endMark: string) {
  if (!isPerfDebug || typeof performance === "undefined") return;

  try {
    performance.measure(name, startMark, endMark);
  } catch {
    // A mark can be missing after refresh, direct entry, or cross-route reload.
  }
}

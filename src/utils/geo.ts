export type LatLng = { latitude: number; longitude: number };

export function parseRoutePolyline(json: string | null | undefined): LatLng[] | null {
  if (!json || !json.trim()) return null;
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data) || data.length < 2) return null;
    const out: LatLng[] = [];
    for (const p of data) {
      if (
        p &&
        typeof p === 'object' &&
        typeof (p as LatLng).latitude === 'number' &&
        typeof (p as LatLng).longitude === 'number'
      ) {
        out.push({ latitude: (p as LatLng).latitude, longitude: (p as LatLng).longitude });
      }
    }
    return out.length >= 2 ? out : null;
  } catch {
    return null;
  }
}

/** Polígono de lote (mínimo 3 vértices válidos). */
export function parseFieldPolygon(json: string | null | undefined): LatLng[] | null {
  const pts = parseRoutePolyline(json);
  if (!pts || pts.length < 3) return null;
  return pts;
}

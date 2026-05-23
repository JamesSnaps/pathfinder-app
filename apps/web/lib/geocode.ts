export async function geocodePlace(
  postcode: string | null,
  location: string | null,
  name: string
): Promise<{ latitude: number; longitude: number } | null> {
  const query = postcode ?? (location ? `${location}, UK` : name);
  if (!query) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gb`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Pathfinder Family App (self-hosted)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function identifyWithPlantNet(buffer, mimeType='image/jpeg') {
  const key = process.env.PLANTNET_API_KEY;
  if (!key) return { configured: false, candidates: [], provider: 'plantnet' };
  const project = process.env.PLANTNET_PROJECT || 'all';
  const form = new FormData();
  form.append('images', new Blob([buffer], { type: mimeType }), 'plant-image');
  form.append('organs', 'auto');
  const response = await fetch(`https://my-api.plantnet.org/v2/identify/${encodeURIComponent(project)}?api-key=${encodeURIComponent(key)}&include-related-images=false`, { method: 'POST', body: form, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`PlantNet request failed (${response.status})`);
  const data = await response.json();
  return { configured: true, provider: 'plantnet', candidates: (data.results || []).slice(0,5).map(item => ({ scientificName: item?.species?.scientificNameWithoutAuthor || item?.species?.scientificName || '', commonNames: item?.species?.commonNames || [], score: Number(item?.score || 0), provider: 'plantnet' })).filter(x => x.scientificName) };
}

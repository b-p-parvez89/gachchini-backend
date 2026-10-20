function extractJson(text) { const cleaned = String(text || '').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim(); const start=cleaned.indexOf('{'); const end=cleaned.lastIndexOf('}'); if(start<0||end<start) throw new Error('Gemini returned invalid JSON'); return JSON.parse(cleaned.slice(start,end+1)); }
export async function identifyWithGemini(buffer, mimeType='image/jpeg') {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { configured: false, candidate: null, provider: 'gemini' };
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const base64 = Buffer.from(buffer).toString('base64');
  const prompt = `You are a cautious botanical image triage assistant. Inspect the plant photo. Return ONLY valid JSON: {"isPlantLikely": boolean, "candidates": [{"scientificName": string, "commonNames": [string], "visualEvidence": [string], "confidence": number}], "uncertaintyReasons": [string]}. Give up to 3 candidates. confidence must be 0..1 and is only a visual estimate, not calibrated probability. Prefer species only when visible features support it; otherwise return genus-level/uncertain candidates and explain uncertainty. Never infer medicinal benefits or toxicity from the image. Do not claim certainty from one photo. If image is not clearly a plant, candidates should be [].`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt},{inline_data:{mime_type:mimeType,data:base64}}]}], generationConfig:{temperature:0.1,responseMimeType:'application/json'} }), signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  const parsed = extractJson(text);
  const candidates = Array.isArray(parsed.candidates) ? parsed.candidates.slice(0,3).map(c=>({ scientificName:String(c.scientificName||'').trim(), commonNames:Array.isArray(c.commonNames)?c.commonNames.map(String):[], score:Math.max(0,Math.min(1,Number(c.confidence)||0)), visualEvidence:Array.isArray(c.visualEvidence)?c.visualEvidence.map(String):[], provider:'gemini' })).filter(c=>c.scientificName) : [];
  return { configured:true, provider:'gemini', isPlantLikely:Boolean(parsed.isPlantLikely), candidates, uncertaintyReasons:Array.isArray(parsed.uncertaintyReasons)?parsed.uncertaintyReasons.map(String):[] };
}

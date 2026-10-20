const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bauthor\b/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export function sameTaxon(a,b) { const x=norm(a), y=norm(b); if(!x||!y) return false; return x===y || x.startsWith(y+' ') || y.startsWith(x+' '); }
export function combineCandidates(plantnet, gemini, plants) {
  const all = [...(plantnet?.candidates||[]), ...(gemini?.candidates||[])];
  const groups = new Map();
  for (const c of all) {
    const key = norm(c.scientificName); if(!key) continue;
    const old = groups.get(key) || { scientificName:c.scientificName, commonNames:[], scores:[], providers:[], visualEvidence:[] };
    old.commonNames=[...new Set([...old.commonNames,...(c.commonNames||[])])]; old.scores.push(c.score||0); old.providers.push(c.provider); old.visualEvidence.push(...(c.visualEvidence||[])); groups.set(key,old);
  }
  const merged=[...groups.values()].map(c=>{
    const agreed=c.providers.includes('plantnet')&&c.providers.includes('gemini');
    const maxScore=Math.max(...c.scores); const score=agreed ? Math.min(0.99, maxScore*0.65 + Math.min(...c.scores)*0.35 + 0.08) : maxScore*(c.providers.includes('plantnet')?1:0.82);
    const plant=plants.find(p=>sameTaxon(p.scientificName,c.scientificName)||p.synonyms?.some(s=>sameTaxon(s,c.scientificName)));
    return { ...c, score:Number(score.toFixed(3)), provider: c.providers.join('+'), agreement:agreed, plantId:plant?plant._id:null, matchedInDatabase:Boolean(plant), plant };
  }).sort((a,b)=>b.score-a.score);
  return merged;
}

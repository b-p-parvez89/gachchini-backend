import { connectDB } from '@/lib/db'; import Plant from '@/models/Plant'; import Identification from '@/models/Identification'; import { getAuthUser } from '@/lib/auth'; import { uploadImageBuffer, cloudinaryReady } from '@/lib/cloudinary'; import { readImageForm } from '@/lib/image'; import { identifyWithPlantNet } from '@/lib/plantnet'; import { identifyWithGemini } from '@/lib/gemini'; import { combineCandidates } from '@/lib/matching'; import { ok, fail, handleError } from '@/lib/http';
export const runtime='nodejs'; export const maxDuration=60;
export async function POST(request){
 let uploaded=null;
 try {
  const form=await request.formData(); const {buffer,mimeType}=await readImageForm(form);
  await connectDB();
  const user=await getAuthUser(request);
  const publishedPlants=await Plant.find({status:'published'}).select('_id nameBn nameEn scientificName synonyms imageUrl toxicity medicinal').lean();
  const outcomes=await Promise.allSettled([identifyWithPlantNet(buffer,mimeType),identifyWithGemini(buffer,mimeType)]);
  const pn=outcomes[0].status==='fulfilled'?outcomes[0].value:{configured:Boolean(process.env.PLANTNET_API_KEY),candidates:[],provider:'plantnet',error:outcomes[0].reason?.message};
  const gm=outcomes[1].status==='fulfilled'?outcomes[1].value:{configured:Boolean(process.env.GEMINI_API_KEY),candidates:[],provider:'gemini',error:outcomes[1].reason?.message};
  const candidates=combineCandidates(pn,gm,publishedPlants);
  if(cloudinaryReady()) uploaded=await uploadImageBuffer(buffer,'gachchini/identifications');
  const imageUrl=uploaded?.secure_url || '';
  const bothConfigured=pn.configured&&gm.configured;
  const first=candidates[0]; const minConfidence=Math.max(0,Math.min(1,Number(process.env.IDENTIFY_MIN_CONFIDENCE)||0.35));
  const agreement=first?.agreement?'both_agree':pn.candidates?.length&&gm.candidates?.length?'disagree':pn.candidates?.length?'plantnet_only':gm.candidates?.length?'gemini_only':'no_provider';
  const warnings=[];
  if(!pn.configured)warnings.push('PlantNet API key সেট করা নেই; প্রজাতি শনাক্তকরণ সীমিত হতে পারে।');
  if(!gm.configured)warnings.push('Gemini API key সেট করা নেই; দ্বিতীয় মতামত পাওয়া যায়নি।');
  if(!first||first.score<minConfidence)warnings.push('ছবির মিল যথেষ্ট নিশ্চিত নয়। ভালো আলোতে পাতা, ফুল বা ফলের পরিষ্কার ছবি দিয়ে আবার চেষ্টা করুন।');
  if(first&&!first.matchedInDatabase)warnings.push('সম্ভাব্য প্রজাতিটি গাছচিনির স্থানীয় ডেটাবেসে নেই; ফলাফলটি নিশ্চিত তথ্য হিসেবে ধরবেন না।');
  if(first&&bothConfigured&&!first.agreement)warnings.push('দুটি AI সেবার ফল একমত নয়। প্রজাতি নিশ্চিত করতে একাধিক ছবি বা বিশেষজ্ঞের মতামত নিন।');
  const bestPlant=first?.plant||null;
  const status=first&&first.score>=minConfidence?'identified':'uncertain';
  const record=await Identification.create({userId:user?._id||null,imageUrl,imagePublicId:uploaded?.public_id||'',provider:[pn.configured?'plantnet':null,gm.configured?'gemini':null].filter(Boolean).join('+')||'none',status,bestMatch:bestPlant?._id||null,candidates:candidates.slice(0,5).map(c=>({scientificName:c.scientificName,commonNames:c.commonNames,score:c.score,plantId:c.plantId,matchedInDatabase:c.matchedInDatabase,provider:c.provider})),confidence:first?.score||0,agreement,warningsBn:warnings,rawProviderSummary:{plantnetCandidates:pn.candidates?.length||0,geminiCandidates:gm.candidates?.length||0,geminiUncertainty:gm.uncertaintyReasons||[],errors:[pn.error,gm.error].filter(Boolean)}});
  return ok({identificationId:record._id,status,confidence:first?.score||0,agreement,imageUrl,matchedPlant:bestPlant?{_id:bestPlant._id,nameBn:bestPlant.nameBn,nameEn:bestPlant.nameEn,scientificName:bestPlant.scientificName,imageUrl:bestPlant.imageUrl,toxicity:bestPlant.toxicity,medicinal:bestPlant.medicinal}:null,candidates:candidates.slice(0,5).map(c=>({scientificName:c.scientificName,commonNames:c.commonNames,score:c.score,provider:c.provider,matchedInDatabase:c.matchedInDatabase,plant:c.plant?{_id:c.plant._id,nameBn:c.plant.nameBn,nameEn:c.plant.nameEn,scientificName:c.plant.scientificName,imageUrl:c.plant.imageUrl}:null,visualEvidence:c.visualEvidence})),warningsBn:warnings,disclaimerBn:'AI ফলাফল সম্ভাব্য মিল, নিশ্চিত শনাক্তকরণ নয়। বিষাক্ততা বা ঔষধি ব্যবহার নির্ধারণে শুধু AI ফলাফলের ওপর নির্ভর করবেন না.'},201);
 }catch(e){if(e.message?.includes('ছবি')||e.message?.includes('ফাইল')||e.message?.includes('সাইজ'))return fail(e.message,400);return handleError(e)}
}

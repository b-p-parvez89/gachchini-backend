import { connectDB } from '@/lib/db'; import Plant from '@/models/Plant'; import { ok, fail, handleError } from '@/lib/http';
export async function GET(request,{params}){try{await connectDB();const {id}=await params;const plant=await Plant.findOne({_id:id,status:'published'}).lean();if(!plant)return fail('গাছের তথ্য পাওয়া যায়নি',404);return ok({plant})}catch(e){return handleError(e)}}

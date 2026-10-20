import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db'; import User from '@/models/User'; import { ok, fail, handleError } from '@/lib/http'; import { signToken } from '@/lib/auth';
const schema=z.object({name:z.string().trim().min(2).max(80),email:z.string().email().max(160),password:z.string().min(8).max(128)});
export async function POST(request){try{const body=schema.parse(await request.json());await connectDB();const email=body.email.toLowerCase();if(await User.exists({email}))return fail('এই ইমেইলে অ্যাকাউন্ট আছে',409);const user=await User.create({name:body.name,email,passwordHash:await bcrypt.hash(body.password,12)});return ok({message:'অ্যাকাউন্ট তৈরি হয়েছে',token:signToken(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}},201);}catch(e){if(e.name==='ZodError')return fail('নাম, ইমেইল ও কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন',422);return handleError(e)}}

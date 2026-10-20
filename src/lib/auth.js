import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { fail } from '@/lib/http';
export function signToken(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); }
export async function getAuthUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return null;
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); await connectDB(); return await User.findById(payload.sub).select('-passwordHash'); } catch { return null; }
}
export async function requireAuth(request) { const user = await getAuthUser(request); if (!user) return { response: fail('লগইন প্রয়োজন', 401) }; return { user }; }
export async function requireAdmin(request) { const result = await requireAuth(request); if (result.response) return result; if (result.user.role !== 'admin') return { response: fail('এই কাজের অনুমতি নেই', 403) }; return result; }

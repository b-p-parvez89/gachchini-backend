import { NextResponse } from 'next/server';
export function ok(data, status=200) { return NextResponse.json({ success: true, ...data }, { status }); }
export function fail(message, status=400, details) { return NextResponse.json({ success: false, message, ...(details ? { details } : {}) }, { status }); }
export function handleError(error) {
  console.error('[GachChini API]', error?.message || error);
  if (error?.name === 'ValidationError') return fail('তথ্য যাচাই ব্যর্থ হয়েছে', 422, error.message);
  if (error?.name === 'CastError') return fail('সঠিক ID দেওয়া হয়নি', 400);
  return fail(process.env.NODE_ENV === 'production' ? 'সার্ভারে সমস্যা হয়েছে' : (error?.message || 'Internal server error'), 500);
}
export function parseIntSafe(value, fallback, min=1, max=100) { const n = Number.parseInt(value, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }

const allowed = new Set(['image/jpeg','image/png','image/webp']);
export async function readImageForm(formData) {
  const file=formData.get('image') || formData.get('file');
  if(!file || typeof file.arrayBuffer!=='function') throw new Error('ছবি আপলোড করুন (image ফিল্ড)');
  const maxMb=Math.max(1,Number(process.env.MAX_UPLOAD_MB)||8);
  if(!allowed.has(file.type)) throw new Error('শুধু JPG, PNG অথবা WebP ছবি গ্রহণ করা হয়');
  if(file.size<=0 || file.size>maxMb*1024*1024) throw new Error(`ছবির সাইজ ${maxMb} MB-এর মধ্যে রাখুন`);
  const buffer=Buffer.from(await file.arrayBuffer());
  // Reject obvious non-image payloads by checking magic bytes rather than trusting MIME alone.
  const isJpeg=buffer[0]===0xff&&buffer[1]===0xd8;
  const isPng=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isWebp=buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP';
  if(!(isJpeg||isPng||isWebp)) throw new Error('ফাইলটি বৈধ ছবি নয়');
  return { file, buffer, mimeType:file.type };
}

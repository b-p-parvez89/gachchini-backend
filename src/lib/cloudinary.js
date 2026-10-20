import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
export function cloudinaryReady() { return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET); }
export async function uploadImageBuffer(buffer, folder = 'gachchini/plants') {
  if (!cloudinaryReady()) throw new Error('Cloudinary credentials are missing');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }] }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

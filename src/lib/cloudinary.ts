import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    resourceType: 'image' | 'video';
}

/**
 * Upload a file to Cloudinary for proof of work
 * @param file - Base64 encoded file or file URL
 * @param userId - User ID for folder organization
 * @param weekNumber - Week number for folder organization
 * @returns Upload result with secure URL
 */
export async function uploadProof(
    file: string,
    userId: string,
    weekNumber: number
): Promise<UploadResult> {
    try {
        // Determine resource type from file content
        let isVideo = false;
        if (file.startsWith('data:')) {
            const mimeType = file.substring(5, file.indexOf(';'));
            isVideo = mimeType.startsWith('video/');
        } else {
            const extension = file.split('.').pop()?.toLowerCase();
            isVideo = ['mp4', 'webm', 'mov'].includes(extension || '') || file.includes('/video/');
        }

        const result = await cloudinary.uploader.upload(file, {
            folder: `dev-sprint/week-${weekNumber}/${userId}`,
            resource_type: isVideo ? 'video' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'],
            max_bytes: 50 * 1024 * 1024, // 50MB max
            transformation: isVideo
                ? [{ quality: 'auto', fetch_format: 'auto' }]
                : [{ quality: 'auto:good', fetch_format: 'auto', width: 1920, crop: 'limit' }],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: isVideo ? 'video' : 'image',
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to Cloudinary');
    }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - 'image' or 'video'
 */
export async function deleteProof(
    publicId: string,
    resourceType: 'image' | 'video' = 'image'
): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete file from Cloudinary');
    }
}

export default cloudinary;

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

export interface ProjectFileUploadResult {
    url: string;
    publicId: string;
    format: string;
    type: 'image' | 'video' | 'pdf' | 'document' | 'other';
    size: number;
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
 * Upload a project attachment file to Cloudinary
 * Supports images, videos, PDFs, and other documents
 * @param file - Base64 encoded file
 * @param projectId - Project ID for folder organization
 * @param fileName - Original file name
 * @returns Upload result with file metadata
 */
export async function uploadProjectFile(
    file: string,
    projectId: string,
    fileName: string
): Promise<ProjectFileUploadResult> {
    try {
        // Determine file type from base64 header or filename
        let mimeType = '';
        let fileType: 'image' | 'video' | 'pdf' | 'document' | 'other' = 'other';
        let resourceType: 'image' | 'video' | 'raw' = 'raw';

        if (file.startsWith('data:')) {
            mimeType = file.substring(5, file.indexOf(';'));
        }

        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        // Determine file type and Cloudinary resource type
        if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            fileType = 'image';
            resourceType = 'image';
        } else if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
            fileType = 'video';
            resourceType = 'video';
        } else if (mimeType === 'application/pdf' || extension === 'pdf') {
            fileType = 'pdf';
            resourceType = 'raw';
        } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension)) {
            fileType = 'document';
            resourceType = 'raw';
        }

        const result = await cloudinary.uploader.upload(file, {
            folder: `dev-sprint/projects/${projectId}/attachments`,
            resource_type: resourceType,
            public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`,
            max_bytes: 10 * 1024 * 1024, // 10MB max for project files
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || extension,
            type: fileType,
            size: result.bytes || 0,
        };
    } catch (error) {
        console.error('Cloudinary project file upload error:', error);
        throw new Error('Failed to upload project file to Cloudinary');
    }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - 'image', 'video', or 'raw'
 */
export async function deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
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

/**
 * Delete a file from Cloudinary (legacy alias)
 * @param publicId - The public ID of the file to delete
 * @param resourceType - 'image' or 'video'
 */
export async function deleteProof(
    publicId: string,
    resourceType: 'image' | 'video' = 'image'
): Promise<void> {
    return deleteFile(publicId, resourceType);
}

export default cloudinary;


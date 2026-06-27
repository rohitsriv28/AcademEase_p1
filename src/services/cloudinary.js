// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloud_name: "dh1xazmiy",
    upload_preset: "academEase_unsigned"
};

// Validation rules
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validates file before upload
 * @param {File} file
 */
function validateFile(file) {
    if (!file) {
        throw new Error("No file selected.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Invalid file type. Only JPG, PNG, WEBP allowed.");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 2MB limit.");
    }
}

/**
 * Uploads image to Cloudinary using unsigned preset
 * @param {File} file 
 * @returns {Promise<string>} secure_url
 */
export async function uploadImage(file) {
    try {
        // Validate config
        if (
            !CLOUDINARY_CONFIG.cloud_name ||
            CLOUDINARY_CONFIG.cloud_name === "YOUR_CLOUD_NAME"
        ) {
            throw new Error("Cloudinary config missing.");
        }

        // Validate file
        validateFile(file);

        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_CONFIG.upload_preset);

        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Upload failed: ${errText}`);
        }

        const data = await response.json();

        if (!data.secure_url) {
            throw new Error("Upload succeeded but no URL returned.");
        }

        return data.secure_url;

    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        throw error;
    }
}
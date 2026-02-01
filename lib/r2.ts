import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 configuration from environment variables
function getR2Config() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || "specbridge-documents";

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(
            `Missing R2 configuration. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables. ` +
            `Got: ACCOUNT_ID=${accountId ? "set" : "missing"}, ACCESS_KEY=${accessKeyId ? "set" : "missing"}, SECRET=${secretAccessKey ? "set" : "missing"}`
        );
    }

    return { accountId, accessKeyId, secretAccessKey, bucketName };
}

// Lazy-initialize S3 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
    if (!r2Client) {
        const config = getR2Config();
        r2Client = new S3Client({
            region: "auto",
            endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }
    return r2Client;
}

/**
 * Upload a file to R2
 * @param key - The storage key (path) for the file
 * @param data - The file data as Buffer
 * @param contentType - The MIME type of the file
 */
export async function uploadToR2(
    key: string,
    data: Buffer,
    contentType: string
): Promise<void> {
    const config = getR2Config();
    const client = getR2Client();

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: data,
        ContentType: contentType,
    });

    await client.send(command);
}

/**
 * Get a file from R2
 * @param key - The storage key (path) of the file
 * @returns The file data as Buffer
 */
export async function getFromR2(key: string): Promise<Buffer> {
    const config = getR2Config();
    const client = getR2Client();

    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    const response = await client.send(command);

    // Convert stream to buffer
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) {
        throw new Error("Failed to read file from R2");
    }
    return Buffer.from(byteArray);
}

/**
 * Get a signed URL for temporary access to a file
 * @param key - The storage key (path) of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrlForR2(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const config = getR2Config();
    const client = getR2Client();

    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 * @param key - The storage key (path) of the file
 */
export async function deleteFromR2(key: string): Promise<void> {
    const config = getR2Config();
    const client = getR2Client();

    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    await client.send(command);
}

/**
 * Generate a unique storage key for a document
 * @param specificationId - The specification ID
 * @param fileName - The original file name
 */
export function generateStorageKey(
    specificationId: string,
    fileName: string
): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `specifications/${specificationId}/${timestamp}-${sanitizedName}`;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
        case "pdf":
            return "application/pdf";
        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        case "txt":
            return "text/plain";
        default:
            return "application/octet-stream";
    }
}

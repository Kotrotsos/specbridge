"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
    uploadToR2,
    deleteFromR2,
    generateStorageKey,
    getMimeType,
    getFromR2,
} from "@/lib/r2";
import { extractText, getFileType } from "@/lib/text-extraction";

export interface SpecificationDocumentData {
    id: string;
    specificationId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: string;
    extractedText: string | null;
    error: string | null;
    createdAt: string;
}

/**
 * Get all documents for a specification
 */
export async function getSpecificationDocuments(
    specificationId: string
): Promise<SpecificationDocumentData[]> {
    const { userId, orgId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Verify access to specification
    const specification = await prisma.specification.findUnique({
        where: { id: specificationId },
        include: { project: true },
    });

    if (!specification) throw new Error("Specification not found");

    const hasAccess =
        specification.project.userId === userId ||
        (orgId && specification.project.organizationId === orgId);
    if (!hasAccess) throw new Error("Unauthorized");

    const documents = await prisma.specificationDocument.findMany({
        where: { specificationId },
        orderBy: { createdAt: "desc" },
    });

    return documents.map((doc) => ({
        id: doc.id,
        specificationId: doc.specificationId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        extractedText: doc.extractedText,
        error: doc.error,
        createdAt: doc.createdAt.toISOString(),
    }));
}

/**
 * Upload a document and start text extraction
 */
export async function uploadSpecificationDocument(
    specificationId: string,
    formData: FormData
): Promise<SpecificationDocumentData> {
    const { userId, orgId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Verify access to specification
    const specification = await prisma.specification.findUnique({
        where: { id: specificationId },
        include: { project: true },
    });

    if (!specification) throw new Error("Specification not found");

    const hasAccess =
        specification.project.userId === userId ||
        (orgId && specification.project.organizationId === orgId);
    if (!hasAccess) throw new Error("Unauthorized");

    // Get file from form data
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Validate file type
    const fileType = getFileType(file.name);

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 10MB.");
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate storage key and upload to R2
    const storageKey = generateStorageKey(specificationId, file.name);
    const mimeType = getMimeType(file.name);

    await uploadToR2(storageKey, buffer, mimeType);

    // Create document record
    const document = await prisma.specificationDocument.create({
        data: {
            specificationId,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            storageKey,
            status: "processing",
        },
    });

    // Extract text in background (don't await)
    extractAndSaveText(document.id, buffer, fileType).catch(console.error);

    revalidatePath(`/interview/${specificationId}`);

    return {
        id: document.id,
        specificationId: document.specificationId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        extractedText: document.extractedText,
        error: document.error,
        createdAt: document.createdAt.toISOString(),
    };
}

/**
 * Extract text from a document and save it
 */
async function extractAndSaveText(
    documentId: string,
    buffer: Buffer,
    fileType: string
): Promise<void> {
    try {
        const extractedText = await extractText(buffer, fileType);

        await prisma.specificationDocument.update({
            where: { id: documentId },
            data: {
                extractedText,
                status: "extracted",
            },
        });
    } catch (error) {
        console.error("Text extraction error:", error);
        await prisma.specificationDocument.update({
            where: { id: documentId },
            data: {
                status: "error",
                error: error instanceof Error ? error.message : "Extraction failed",
            },
        });
    }
}

/**
 * Re-extract text from a document
 */
export async function reextractDocument(documentId: string): Promise<void> {
    const { userId, orgId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const document = await prisma.specificationDocument.findUnique({
        where: { id: documentId },
        include: {
            specification: {
                include: { project: true },
            },
        },
    });

    if (!document) throw new Error("Document not found");

    const hasAccess =
        document.specification.project.userId === userId ||
        (orgId && document.specification.project.organizationId === orgId);
    if (!hasAccess) throw new Error("Unauthorized");

    // Update status
    await prisma.specificationDocument.update({
        where: { id: documentId },
        data: { status: "processing", error: null },
    });

    // Fetch from R2 and re-extract
    try {
        const buffer = await getFromR2(document.storageKey);
        await extractAndSaveText(documentId, buffer, document.fileType);
    } catch (error) {
        await prisma.specificationDocument.update({
            where: { id: documentId },
            data: {
                status: "error",
                error: error instanceof Error ? error.message : "Re-extraction failed",
            },
        });
    }

    revalidatePath(`/interview/${document.specificationId}`);
}

/**
 * Delete a document
 */
export async function deleteSpecificationDocument(
    documentId: string
): Promise<void> {
    const { userId, orgId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const document = await prisma.specificationDocument.findUnique({
        where: { id: documentId },
        include: {
            specification: {
                include: { project: true },
            },
        },
    });

    if (!document) throw new Error("Document not found");

    const hasAccess =
        document.specification.project.userId === userId ||
        (orgId && document.specification.project.organizationId === orgId);
    if (!hasAccess) throw new Error("Unauthorized");

    // Delete from R2
    try {
        await deleteFromR2(document.storageKey);
    } catch (error) {
        console.error("R2 delete error:", error);
        // Continue with DB deletion even if R2 fails
    }

    // Delete from database
    await prisma.specificationDocument.delete({
        where: { id: documentId },
    });

    revalidatePath(`/interview/${document.specificationId}`);
}

/**
 * Get a single document with extracted text
 */
export async function getSpecificationDocument(
    documentId: string
): Promise<SpecificationDocumentData | null> {
    const { userId, orgId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const document = await prisma.specificationDocument.findUnique({
        where: { id: documentId },
        include: {
            specification: {
                include: { project: true },
            },
        },
    });

    if (!document) return null;

    const hasAccess =
        document.specification.project.userId === userId ||
        (orgId && document.specification.project.organizationId === orgId);
    if (!hasAccess) throw new Error("Unauthorized");

    return {
        id: document.id,
        specificationId: document.specificationId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        extractedText: document.extractedText,
        error: document.error,
        createdAt: document.createdAt.toISOString(),
    };
}

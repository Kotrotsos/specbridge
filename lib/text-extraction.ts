import mammoth from "mammoth";

/**
 * Extract text from a PDF file (using pdf-parse v1 API)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // pdf-parse v1 uses default export
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        return data.text.trim();
    } catch (error) {
        console.error("PDF extraction error:", error);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract text from PDF: ${message}`);
    }
}

/**
 * Extract text from a DOCX file
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim();
    } catch (error) {
        console.error("DOCX extraction error:", error);
        throw new Error("Failed to extract text from DOCX");
    }
}

/**
 * Extract text from a TXT file
 */
export function extractTextFromTXT(buffer: Buffer): string {
    return buffer.toString("utf-8").trim();
}

/**
 * Extract text from a file based on its type
 */
export async function extractText(
    buffer: Buffer,
    fileType: string
): Promise<string> {
    switch (fileType.toLowerCase()) {
        case "pdf":
            return extractTextFromPDF(buffer);
        case "docx":
            return extractTextFromDOCX(buffer);
        case "txt":
            return extractTextFromTXT(buffer);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
}

/**
 * Get file type from file name
 */
export function getFileType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop();
    if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
        throw new Error(`Unsupported file type. Allowed: pdf, docx, txt`);
    }
    return ext;
}

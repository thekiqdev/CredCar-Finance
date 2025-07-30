import { supabase } from "./supabase";

// Storage bucket names - centralized configuration
export const STORAGE_BUCKETS = {
  CONTRACT_DOCUMENTS: "contract-documents",
  SIGNATURES: "signatures",
  REPRESENTATIVE_DOCUMENTS: "representative-documents",
} as const;

// Storage service for file uploads
export const storageService = {
  /**
   * Upload a file to the specified bucket
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    },
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  /**
   * Upload a contract document
   */
  async uploadContractDocument(
    contractId: string,
    file: File,
    subfolder: string = "documents",
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `${subfolder}/${contractId}/${timestamp}-${file.name}`;
    return this.uploadFile(STORAGE_BUCKETS.CONTRACT_DOCUMENTS, path, file);
  },

  /**
   * Upload a signature image
   */
  async uploadSignature(
    contractId: string,
    signatureBlob: Blob,
  ): Promise<string> {
    const timestamp = Date.now();
    const file = new File(
      [signatureBlob],
      `signature-${contractId}-${timestamp}.png`,
      {
        type: "image/png",
      },
    );
    const path = `signatures/${contractId}/${file.name}`;
    return this.uploadFile(STORAGE_BUCKETS.SIGNATURES, path, file);
  },

  /**
   * Upload a representative document
   */
  async uploadRepresentativeDocument(
    representativeId: string,
    documentType: string,
    file: File,
  ): Promise<string> {
    const timestamp = Date.now();
    const sanitizedDocType = documentType
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const path = `${representativeId}/${sanitizedDocType}/${timestamp}-${file.name}`;
    return this.uploadFile(
      STORAGE_BUCKETS.REPRESENTATIVE_DOCUMENTS,
      path,
      file,
    );
  },

  /**
   * Convert data URL to blob for signature uploads
   */
  async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  },

  /**
   * Delete a file from storage
   */
  async deleteFile(bucketName: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucketName: string, path: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

    return data.publicUrl;
  },
};

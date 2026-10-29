/** Future providers must return original signed bytes. Never regenerate a signed PDF. */
export interface SignatureProvider {
  sign(input: {
    bytes: Uint8Array;
    documentVersionId: string;
  }): Promise<{ bytes: Uint8Array; providerReference: string }>;
}

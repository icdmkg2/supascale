/** Human-readable provider name for list subtitles (client-safe). */
export function providerLineLabel(kind: string): string {
  switch (kind) {
    case "s3":
      return "Amazon S3";
    case "gcs":
      return "Google Cloud";
    case "azure":
      return "Azure Blob Storage";
    case "local":
      return "Local Filesystem";
    default:
      return kind;
  }
}

import { encryptSecret } from "@/lib/crypto/secrets";
import type { CreateStorageInput } from "./create-schema";

export type InsertStorageValues = {
  id: string;
  name: string;
  endpoint: string;
  region: string | null;
  bucket: string;
  accessKeyEnc: string;
  secretKeyEnc: string;
  useSsl: boolean;
  providerKind: string;
  pathPrefix: string | null;
  isDefault: boolean;
};

export function buildInsertValues(id: string, input: CreateStorageInput): InsertStorageValues {
  const pathPrefix = input.pathPrefix?.trim() || null;
  const isDefault = input.isDefault ?? false;

  switch (input.providerKind) {
    case "s3":
      return {
        id,
        name: input.name.trim(),
        endpoint: input.endpoint.trim(),
        region: input.region?.trim() || null,
        bucket: input.bucket.trim(),
        accessKeyEnc: encryptSecret(input.accessKey),
        secretKeyEnc: encryptSecret(input.secretKey),
        useSsl: input.useSsl,
        providerKind: "s3",
        pathPrefix,
        isDefault,
      };
    case "gcs": {
      const endpoint = (input.endpoint?.trim() || "https://storage.googleapis.com").replace(/\/$/, "");
      return {
        id,
        name: input.name.trim(),
        endpoint,
        region: input.region?.trim() || null,
        bucket: input.bucket.trim(),
        accessKeyEnc: encryptSecret(input.accessKey),
        secretKeyEnc: encryptSecret(input.secretKey),
        useSsl: input.useSsl,
        providerKind: "gcs",
        pathPrefix,
        isDefault,
      };
    }
    case "azure": {
      const account = input.accountName.trim();
      return {
        id,
        name: input.name.trim(),
        endpoint: `https://${account}.blob.core.windows.net`,
        region: null,
        bucket: input.container.trim(),
        accessKeyEnc: encryptSecret(account),
        secretKeyEnc: encryptSecret(input.accountKey),
        useSsl: true,
        providerKind: "azure",
        pathPrefix,
        isDefault,
      };
    }
    case "local": {
      const local = "local";
      return {
        id,
        name: input.name.trim(),
        endpoint: input.localPath.trim(),
        region: null,
        bucket: (input.label?.trim() || "default"),
        accessKeyEnc: encryptSecret(local),
        secretKeyEnc: encryptSecret(local),
        useSsl: false,
        providerKind: "local",
        pathPrefix,
        isDefault,
      };
    }
  }
}

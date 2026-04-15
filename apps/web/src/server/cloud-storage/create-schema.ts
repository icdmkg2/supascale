import { z } from "zod";

const meta = {
  name: z.string().min(1).max(120),
  isDefault: z.boolean().optional().default(false),
  pathPrefix: z.string().max(500).optional().nullable(),
};

export const createStorageSchema = z.discriminatedUnion("providerKind", [
  z.object({
    ...meta,
    providerKind: z.literal("s3"),
    endpoint: z.string().min(1),
    region: z.string().optional().nullable(),
    bucket: z.string().min(1),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
    useSsl: z.boolean().optional().default(true),
  }),
  z.object({
    ...meta,
    providerKind: z.literal("gcs"),
    endpoint: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    bucket: z.string().min(1),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
    useSsl: z.boolean().optional().default(true),
  }),
  z.object({
    ...meta,
    providerKind: z.literal("azure"),
    accountName: z.string().min(1),
    container: z.string().min(1),
    accountKey: z.string().min(1),
  }),
  z.object({
    ...meta,
    providerKind: z.literal("local"),
    localPath: z.string().min(1),
    label: z.string().optional().nullable(),
  }),
]);

export type CreateStorageInput = z.infer<typeof createStorageSchema>;

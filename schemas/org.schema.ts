import { z } from "zod";

export const OrgSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 character")
    .nonempty("Email is required"),

  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase, numbers, and hyphens only",
    ),
  // "MyPost"        ❌ uppercase
  // "my_post"       ❌ underscore
  // "-my-post"      ❌ starts with hyphen
  // "my-post-"      ❌ ends with hyphen
  // "my--post"      ❌ double hyphen
  userId: z.string(),
});

export type orgSchemaInput = z.infer<typeof OrgSchema>;

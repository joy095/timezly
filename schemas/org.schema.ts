import {
  InferOutput,
  minLength,
  nonEmpty,
  object,
  pipe,
  regex,
  string,
} from "valibot";

export const OrgSchema = object({
  name: pipe(
    string(),
    minLength(3, "Name must be at least 3 character"),
    nonEmpty("Email is required"),
  ),

  slug: pipe(
    string(),
    minLength(1, "Slug is required"),
    regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase, numbers, and hyphens only",
    ),
  ),
  // "MyPost"        ❌ uppercase
  // "my_post"       ❌ underscore
  // "-my-post"      ❌ starts with hyphen
  // "my-post-"      ❌ ends with hyphen
  // "my--post"      ❌ double hyphen
  userId: string(),
});

export type orgSchemaInput = InferOutput<typeof OrgSchema>;

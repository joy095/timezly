import {
  object,
  string,
  optional,
  nullable,
  array,
  number,
  pipe,
  minLength,
  maxLength,
  minValue,
  maxValue,
  integer,
  InferOutput,
  custom,
} from "valibot";

// ─── Certificate ─────────────────────────────────────────────────────────────

export const certificateSchema = object({
  name: pipe(
    string(),
    minLength(1, "Certificate name is required"),
    maxLength(100, "Max 100 characters"),
  ),
  description: optional(nullable(string())),
  issuedAt: pipe(string(), minLength(1, "Issue date is required")),
  expiresAt: optional(nullable(string())),
});

// ─── Experience ───────────────────────────────────────────────────────────────

export const experienceSchema = pipe(
  object({
    organization: pipe(
      string(),
      minLength(1, "Organization is required"),
      maxLength(255, "Max 255 characters"),
    ),

    description: optional(nullable(string())),

    startDate: pipe(string(), minLength(1, "Start date is required")),

    endDate: pipe(string(), minLength(1, "End date is required")),
  }),

  custom((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    return start <= end;
  }, "Start date cannot be later than end date"),
);

// ─── Create Doctor ────────────────────────────────────────────────────────────

export const createDoctorSchema = object({
  name: pipe(string(), minLength(2, "Name must be at least 2 characters")),
  description: pipe(
    string(),
    minLength(10, "Description must be at least 10 characters"),
  ),
  specialized: optional(
    nullable(pipe(string(), maxLength(50, "Max 50 characters"))),
  ),
  // slotDurationMins arrives as a number from the form's setValue call
  slotDurationMins: pipe(
    number(),
    integer("Must be a whole number"),
    minValue(1, "Minimum 1 minutes"),
    maxValue(120, "Maximum 120 minutes"),
  ),
  experience: experienceSchema,
  certificates: optional(array(certificateSchema), []),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CertificateInput = InferOutput<typeof certificateSchema>;
export type ExperienceInput = InferOutput<typeof experienceSchema>;
export type CreateDoctorInput = InferOutput<typeof createDoctorSchema>;

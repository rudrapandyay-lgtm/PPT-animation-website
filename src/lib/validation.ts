import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const createPresentationSchema = z.object({
  templateKey: z.string().min(1),
});

const jsonRecord = z.record(z.string(), z.any());

export const presentationPayloadSchema = z.object({
  name: z.string().trim().min(2),
  accent: z.string().trim().min(2),
  slides: z.array(
    z.object({
      id: z.string(),
      title: z.string().nullable(),
      notes: z.string().nullable().optional(),
      background: jsonRecord,
      transition: jsonRecord,
      elements: z.array(
        z.object({
          id: z.string(),
          type: z.enum(["TEXT", "IMAGE", "SHAPE"]),
          name: z.string(),
          content: jsonRecord,
          position: jsonRecord,
          style: jsonRecord,
          animation: z.object({
            preset: z.enum(["FADE_IN", "SLIDE_UP", "SLIDE_LEFT", "ZOOM_IN", "STAGGER"]),
            durationMs: z.number().int().min(150).max(4000),
            delayMs: z.number().int().min(0).max(4000),
          }),
        }),
      ),
    }),
  ),
});

export const shareLinkSchema = z.object({
  passcodeEnabled: z.boolean(),
  passcode: z.string().max(32).optional().default(""),
  coverLabel: z.string().trim().min(2).max(40),
  coverTitle: z.string().trim().min(2).max(120),
  coverSubtitle: z.string().trim().min(2).max(220),
  coverButtonText: z.string().trim().min(2).max(40),
});

export type FormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

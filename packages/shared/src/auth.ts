import { z } from "zod";

// ---------------------------------------------------------------------------
// Google OAuth token returned after sign-in
// ---------------------------------------------------------------------------
export const GoogleTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().describe("Unix-ms timestamp when the access token expires"),
  scope: z.string(),
  tokenType: z.string().default("Bearer"),
});

export type GoogleToken = z.infer<typeof GoogleTokenSchema>;

// ---------------------------------------------------------------------------
// Session – lightweight representation stored on the server / in a cookie
// ---------------------------------------------------------------------------
export const SessionSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  googleToken: GoogleTokenSchema,
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// ---------------------------------------------------------------------------
// Auth callback payload – what the frontend sends after Google redirect
// ---------------------------------------------------------------------------
export const AuthCallbackRequestSchema = z.object({
  code: z.string().describe("Authorization code from Google OAuth redirect"),
  redirectUri: z.union([
    z.string().url(),
    z.literal("postmessage"),
  ]),
});

export type AuthCallbackRequest = z.infer<typeof AuthCallbackRequestSchema>;

export const AuthCallbackResponseSchema = z.object({
  session: SessionSchema,
});

export type AuthCallbackResponse = z.infer<typeof AuthCallbackResponseSchema>;


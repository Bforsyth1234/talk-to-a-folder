import { Injectable, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import {
  AuthCallbackRequestSchema,
  type AuthCallbackRequest,
  type AuthCallbackResponse,
  type Session,
  type GoogleToken,
} from "@talk-to-a-folder/shared";
import { randomUUID } from "node:crypto";

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? "";

@Injectable()
export class AuthService {
  /** In-memory session store – acceptable for single-user prototype. */
  private readonly sessions = new Map<string, Session>();

  constructor() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Add them to apps/api/.env or export them before starting the API.",
      );
    }

  }

  private createOAuthClient(redirectUri: string): OAuth2Client {
    return new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
  }

  /**
   * Exchange the authorization code from the frontend for tokens,
   * build a Session, and return it.
   */
  async handleCallback(raw: unknown): Promise<AuthCallbackResponse> {
    console.log('[AuthService] Raw request body:', JSON.stringify(raw));
    const parsed = AuthCallbackRequestSchema.safeParse(raw);
    if (!parsed.success) {
      throw new UnauthorizedException(
        `Invalid auth callback payload: ${parsed.error.message}`,
      );
    }
    const { code, redirectUri }: AuthCallbackRequest = parsed.data;

    // Debug: log the redirect URI being used for token exchange
    console.log('[AuthService] Token exchange redirect_uri:', redirectUri);

    const oauthClient = this.createOAuthClient(redirectUri);

    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.access_token) {
      throw new UnauthorizedException("Google did not return an access token");
    }

    // Verify the id_token to extract user info
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token ?? "",
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException("Unable to verify Google identity");
    }

    const googleToken: GoogleToken = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ?? Date.now() + 3600 * 1000,
      scope: tokens.scope ?? "",
      tokenType: tokens.token_type ?? "Bearer",
    };

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const session: Session = {
      userId: randomUUID(),
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleToken,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.sessions.set(session.userId, session);

    return { session };
  }

  /**
   * Validate an access token by checking our session store
   * and verifying it hasn't expired.
   */
  getSessionByToken(accessToken: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.googleToken.accessToken === accessToken) {
        if (new Date(session.expiresAt) < new Date()) {
          this.sessions.delete(session.userId);
          return null;
        }
        return session;
      }
    }
    return null;
  }
}


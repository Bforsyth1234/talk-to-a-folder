import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AuthCallbackResponse, Session } from "@talk-to-a-folder/shared";
import { AuthGuard } from "./auth.guard";
import type { AuthenticatedRequest } from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/callback
   * Receives the Google authorization code from the frontend and exchanges
   * it for tokens, returning a session.
   */
  @Post("callback")
  async callback(@Body() body: unknown): Promise<AuthCallbackResponse> {
    return this.authService.handleCallback(body);
  }

  /**
   * GET /auth/me
   * Returns the current session. Protected by AuthGuard.
   */
  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() req: AuthenticatedRequest): { session: Session } {
    return { session: req.session };
  }
}


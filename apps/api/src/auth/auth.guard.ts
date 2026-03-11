import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { Session } from "@talk-to-a-folder/shared";
import { AuthService } from "./auth.service";

export interface AuthenticatedRequest extends Request {
  session: Session;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }

    const token = authHeader.slice(7);
    const session = this.authService.getSessionByToken(token);
    if (!session) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Attach session to request for downstream handlers
    (req as AuthenticatedRequest).session = session;
    return true;
  }
}


import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { FoldersService } from "./folders.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import type { SavedFolder } from "@talk-to-a-folder/shared";

@Controller("folders")
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  /** GET /folders – list saved folders for the authenticated user */
  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: AuthenticatedRequest): SavedFolder[] {
    return this.foldersService.list(req.session.email);
  }

  /** DELETE /folders/:id – remove a saved folder */
  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest,
  ): { success: boolean } {
    const deleted = this.foldersService.delete(req.session.email, id);
    if (!deleted) {
      throw new NotFoundException("Saved folder not found");
    }
    return { success: true };
  }
}


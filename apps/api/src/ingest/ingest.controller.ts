import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { IngestService } from "./ingest.service";
import { FoldersService } from "../folders/folders.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import {
  IngestRequestSchema,
  type IngestResponse,
} from "@talk-to-a-folder/shared";
import { BadRequestException } from "@nestjs/common";

@Controller("ingest")
export class IngestController {
  constructor(
    private readonly ingestService: IngestService,
    private readonly foldersService: FoldersService,
  ) {}

  /**
   * POST /ingest
   * Accepts a Google Drive folder URL or folder ID.
   * The user's Google access token is pulled from the authenticated session.
   */
  @Post()
  @UseGuards(AuthGuard)
  async ingest(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<IngestResponse> {
    const parsed = IngestRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid ingest request: ${parsed.error.message}`,
      );
    }

    const accessToken = req.session.googleToken.accessToken;
    const result = await this.ingestService.ingestFolder(parsed.data.folderId, accessToken);

    // Auto-save the folder for the user
    this.foldersService.save(
      req.session.email,
      result.folderId,
      parsed.data.folderId, // preserve original input (URL or ID) as name
      result.processedFiles,
      result.allFileNames,
    );

    return result;
  }
}


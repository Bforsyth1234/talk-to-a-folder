import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ChatService } from "./chat.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { ChatRequestSchema } from "@talk-to-a-folder/shared";
import { FoldersService } from "../folders/folders.service";

@Controller("chat")
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly foldersService: FoldersService,
  ) {}

  /**
   * POST /chat
   * Accepts a ChatRequest body and streams back newline-delimited JSON
   * ChatStreamEvent objects.
   */
  @Post()
  @UseGuards(AuthGuard)
  async chat(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid chat request: ${parsed.error.message}`,
      );
    }

    const { message, folderId, history } = parsed.data;

    this.logger.log(
      `Chat request from ${req.session.email} for folder ${folderId}`,
    );

    // Look up saved folder to get allFileNames (includes unsupported files)
    const savedFolder = this.foldersService.findByFolderId(req.session.email, folderId);
    const allFileNames = savedFolder?.allFileNames;

    // Set headers for newline-delimited JSON streaming
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Content-Type-Options", "nosniff");

    try {
      for await (const event of this.chatService.streamChat(
        message,
        folderId,
        history,
        allFileNames,
      )) {
        res.write(JSON.stringify(event) + "\n");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      this.logger.error(`Chat stream error: ${errorMessage}`);
      const errorEvent = JSON.stringify({
        type: "error",
        error: errorMessage,
      });
      res.write(errorEvent + "\n");
    }

    res.end();
  }
}


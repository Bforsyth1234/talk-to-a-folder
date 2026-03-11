import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import {
  CreateFileRequestSchema,
  CreateFolderRequestSchema,
  UpdateFileRequestSchema,
  CopyFileRequestSchema,
  MoveFileRequestSchema,
  type DriveFileInfo,
  type ListFolderContentsResponse,
  type FileContentResponse,
} from "@talk-to-a-folder/shared";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /** GET /files?folderId=xxx – list files in a folder */
  @Get()
  @UseGuards(AuthGuard)
  async list(
    @Query("folderId") folderId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ListFolderContentsResponse> {
    if (!folderId) {
      throw new BadRequestException("folderId query parameter is required");
    }
    return this.filesService.listContents(
      folderId,
      req.session.googleToken.accessToken,
    );
  }

  /** GET /files/:fileId/content – get file content for editing */
  @Get(":fileId/content")
  @UseGuards(AuthGuard)
  async getContent(
    @Param("fileId") fileId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<FileContentResponse> {
    return this.filesService.getContent(
      fileId,
      req.session.googleToken.accessToken,
    );
  }

  /** POST /files – create a new file */
  @Post()
  @UseGuards(AuthGuard)
  async createFile(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<DriveFileInfo> {
    const parsed = CreateFileRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return this.filesService.createFile(
      parsed.data.parentFolderId,
      parsed.data.name,
      parsed.data.mimeType,
      parsed.data.content,
      req.session.googleToken.accessToken,
    );
  }

  /** POST /files/folder – create a new folder */
  @Post("folder")
  @UseGuards(AuthGuard)
  async createFolder(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<DriveFileInfo> {
    const parsed = CreateFolderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return this.filesService.createFolder(
      parsed.data.parentFolderId,
      parsed.data.name,
      req.session.googleToken.accessToken,
    );
  }

  /** PATCH /files/:fileId – update file name and/or content */
  @Patch(":fileId")
  @UseGuards(AuthGuard)
  async updateFile(
    @Param("fileId") fileId: string,
    @Query("folderId") folderId: string | undefined,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<DriveFileInfo> {
    const parsed = UpdateFileRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return this.filesService.updateFile(
      fileId,
      parsed.data,
      folderId,
      req.session.googleToken.accessToken,
    );
  }

  /** POST /files/:fileId/copy – copy a file */
  @Post(":fileId/copy")
  @UseGuards(AuthGuard)
  async copyFile(
    @Param("fileId") fileId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<DriveFileInfo> {
    const parsed = CopyFileRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return this.filesService.copyFile(
      fileId,
      parsed.data,
      req.session.googleToken.accessToken,
    );
  }

  /** POST /files/:fileId/move – move a file or folder */
  @Post(":fileId/move")
  @UseGuards(AuthGuard)
  async moveFile(
    @Param("fileId") fileId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<DriveFileInfo> {
    const parsed = MoveFileRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return this.filesService.moveFile(
      fileId,
      parsed.data.destinationFolderId,
      req.session.googleToken.accessToken,
    );
  }
}


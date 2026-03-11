import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { EvalService } from "./eval.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { FoldersService } from "../folders/folders.service";
import type { EvalTestCase } from "@talk-to-a-folder/shared";

@Controller("eval")
export class EvalController {
  private readonly logger = new Logger(EvalController.name);

  constructor(
    private readonly evalService: EvalService,
    private readonly foldersService: FoldersService,
  ) {}

  /** GET /eval/tests – list all available test cases */
  @Get("tests")
  @UseGuards(AuthGuard)
  getTests(): EvalTestCase[] {
    return this.evalService.getTests();
  }

  /** POST /eval/run – stream eval results as NDJSON (one JSON line per test result) */
  @Post("run")
  @UseGuards(AuthGuard)
  async run(
    @Body() body: { folderId: string; testIds?: string[] },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const { folderId, testIds } = body;
    if (!folderId) {
      throw new BadRequestException("folderId is required");
    }

    const accessToken = req.session.googleToken.accessToken;
    const userEmail = req.session.email;

    const savedFolder = this.foldersService.findByFolderId(userEmail, folderId);
    const allFileNames = savedFolder?.allFileNames ?? [];

    this.logger.log(
      `Running eval (streaming): ${testIds ? testIds.length + " tests" : "all tests"} on folder ${folderId}`,
    );

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = this.evalService.streamResults(
      folderId, accessToken, allFileNames, userEmail, testIds,
    );

    for await (const result of stream) {
      res.write(JSON.stringify(result) + "\n");
    }

    res.end();
  }
}


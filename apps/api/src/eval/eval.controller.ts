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
import type { Request, Response } from "express";
import { z } from "zod";
import { EvalService } from "./eval.service";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { FoldersService } from "../folders/folders.service";
import type { EvalTestCase } from "@talk-to-a-folder/shared";

/** Zod schema for the POST /eval/run request body. */
const EvalRunRequestSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
  testIds: z.array(z.string().min(1)).optional(),
});

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
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const parsed = EvalRunRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid eval run request: ${parsed.error.message}`,
      );
    }

    const { folderId, testIds } = parsed.data;
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

    // Track client disconnection so we can abort remaining tests
    let clientDisconnected = false;
    (req as unknown as Request).on("close", () => {
      clientDisconnected = true;
      this.logger.log("Client disconnected — aborting eval stream");
    });

    const stream = this.evalService.streamResults(
      folderId, accessToken, allFileNames, userEmail, testIds,
    );

    for await (const result of stream) {
      if (clientDisconnected) {
        this.logger.log("Stopping eval stream — client disconnected");
        break;
      }
      res.write(JSON.stringify(result) + "\n");
    }

    res.end();
  }
}


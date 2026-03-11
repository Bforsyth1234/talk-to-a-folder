import { Module } from "@nestjs/common";
import { EvalController } from "./eval.controller";
import { EvalService } from "./eval.service";
import { ChatModule } from "../chat/chat.module";
import { AuthModule } from "../auth/auth.module";
import { FoldersModule } from "../folders/folders.module";

@Module({
  imports: [ChatModule, AuthModule, FoldersModule],
  controllers: [EvalController],
  providers: [EvalService],
})
export class EvalModule {}


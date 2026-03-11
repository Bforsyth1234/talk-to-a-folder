import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { IngestModule } from "../ingest/ingest.module";
import { AuthModule } from "../auth/auth.module";
import { FoldersModule } from "../folders/folders.module";

@Module({
  imports: [IngestModule, AuthModule, FoldersModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}


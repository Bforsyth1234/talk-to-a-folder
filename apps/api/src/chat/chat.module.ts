import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { IngestModule } from "../ingest/ingest.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [IngestModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}


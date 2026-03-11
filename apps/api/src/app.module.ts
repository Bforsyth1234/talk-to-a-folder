import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { IngestModule } from "./ingest/ingest.module";
import { ChatModule } from "./chat/chat.module";
import { FoldersModule } from "./folders/folders.module";

@Module({
  imports: [AuthModule, IngestModule, ChatModule, FoldersModule],
  controllers: [AppController],
})
export class AppModule {}


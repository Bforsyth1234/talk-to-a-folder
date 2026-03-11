import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { IngestModule } from "./ingest/ingest.module";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [AuthModule, IngestModule, ChatModule],
  controllers: [AppController],
})
export class AppModule {}


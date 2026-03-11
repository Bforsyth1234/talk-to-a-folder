import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { IngestModule } from "./ingest/ingest.module";
import { ChatModule } from "./chat/chat.module";
import { DatabaseModule } from "./database/database.module";
import { FoldersModule } from "./folders/folders.module";
import { FilesModule } from "./files/files.module";

@Module({
  imports: [DatabaseModule, AuthModule, IngestModule, ChatModule, FoldersModule, FilesModule],
  controllers: [AppController],
})
export class AppModule {}


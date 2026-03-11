import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { AuthModule } from "../auth/auth.module";
import { IngestModule } from "../ingest/ingest.module";

@Module({
  imports: [AuthModule, IngestModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}


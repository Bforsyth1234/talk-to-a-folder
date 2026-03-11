import { Module } from "@nestjs/common";
import { IngestController } from "./ingest.controller";
import { IngestService } from "./ingest.service";
import { DriveService } from "./drive.service";
import { ChromaDbService } from "./chromadb.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [IngestController],
  providers: [IngestService, DriveService, ChromaDbService],
  exports: [ChromaDbService],
})
export class IngestModule {}


import { Module } from "@nestjs/common";
import { FoldersController } from "./folders.controller";
import { FoldersService } from "./folders.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}


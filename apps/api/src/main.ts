import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env["PORT"] ?? 3001;
  const host = process.env["HOST"] ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`API running on ${await app.getUrl()}`);
}

void bootstrap();


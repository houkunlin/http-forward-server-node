import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import * as process from "process";

async function bootstrap() {
  const port = process.env.PORT || 80;
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(port);

  console.log(`server is running http://127.0.0.1:${port}`);
}

bootstrap();

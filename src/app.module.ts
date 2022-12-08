import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Config } from "./model/Config.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeOrmModule.forRoot({
    //   type: "postgres",
    //   host: "127.0.0.1",
    //   port: 5432,
    //   username: "user",
    //   password: "password",
    //   database: "db",
    //   schema: "public",
    //   // entities: ["**/*.entity{.ts,.js}"],
    //   // entities: [],
    //   autoLoadEntities: true,
    //   synchronize: false,
    // })
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST"),
        port: +configService.get<number>("DB_PORT"),
        username: configService.get("DB_USER"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_DATABASE"),
        schema: configService.get("DB_SCHEMA"),
        // entities: ["dist/**/*.entity{.ts,.js}"],
        entities: [Config],
        autoLoadEntities: true,
        synchronize: false
      }),
      inject: [ConfigService]
    }),
    TypeOrmModule.forFeature([Config])
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}

import { Dependencies, Injectable } from "@nestjs/common";
import { getRepositoryToken, InjectRepository } from "@nestjs/typeorm";
import { Config } from "./model/Config.entity";
import { Repository } from "typeorm";

@Injectable()
@Dependencies(getRepositoryToken(Config))
export class AppService {
  constructor(@InjectRepository(Config) private configRepository: Repository<Config>) {
  }

  async getHello(): Promise<string> {
    return "Hello World!";
  }
}

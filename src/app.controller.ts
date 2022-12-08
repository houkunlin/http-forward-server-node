import { All, Controller, Req } from "@nestjs/common";
import { AppService } from "./app.service";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Config } from "./model/Config.entity";
import { Repository } from "typeorm";
import { AxiosRequestConfig } from "axios";
import middles from "./middle";
import { renderObject, request } from "./utils";
import { TplData } from "./app";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @InjectRepository(Config) private configRepository: Repository<Config>) {
  }

  /**
   * 请求数据转发处理接口
   * @param req 当前请求对象
   */
  @All(":id")
  async getHello(@Req() req: Request): Promise<any> {
    // 获取关键的客户端请求数据
    const { path, ip, hostname, params, query, body, headers, cookies, method } = req;
    // 构建模板变量数据对象
    const tplData: TplData = { path, ip, hostname, params, query, body, headers, cookies, method };
    // 从数据库中查找转发配置信息
    const configs = await this.configRepository.findBy({ keyName: params["id"] });
    if (configs == null || configs.length === 0) {
      return { code: -1, msg: "找不到配置文件" };
    }

    for (const config of configs) {
      this.handleForward(config, tplData).finally(() => {
        console.log(`${config.id} - ${config.keyName} 处理完毕\n`);
      });
    }

    return { code: 0, msg: "ok, already processing asynchronously" };
  }

  /**
   * 根据配置文件执行转发操作
   * @param config 配置信息
   * @param tplData 模板变量数据
   */
  async handleForward(config: Config, tplData: any) {
    // 构建转发请求参数信息
    const reqConfig: AxiosRequestConfig = { method: config.method, url: config.url, responseType: config.responseType };
    reqConfig.timeout = config.timeout;

    // 解析处理配置模板信息中的变量信息，把变量替换成具体的值
    reqConfig.headers = renderObject(config.header, tplData);
    reqConfig.params = renderObject(config.query, tplData);
    reqConfig.data = renderObject(config.data, tplData);
    reqConfig.auth = renderObject(config.auth, tplData);

    // 中间件处理
    const middleKeys = Object.keys(config.middle || {});
    if (middleKeys.length > 0) {
      for (const middleKey of middleKeys) {
        const fun = middles[middleKey];
        if (fun) {
          // 处理中间件的数据处理
          const middleParams = config.middle[middleKey];
          await fun(reqConfig, tplData, renderObject(middleParams, tplData));
        }
      }
    }

    return request(reqConfig).then(res => {
      console.log("接收请求参数", JSON.stringify(tplData, null, null));
      console.log("发起请求参数", JSON.stringify(reqConfig, null, null));
      console.log("发起请求结果", JSON.stringify(res.data, null, null));
    }).catch(e => {
      console.log("接收请求参数", JSON.stringify(tplData, null, null));
      console.log("发起请求参数", JSON.stringify(reqConfig, null, null));
      console.error("发起请求出现错误", e.message, JSON.stringify(e.response?.data || {}, null, null));
    });
  }
}

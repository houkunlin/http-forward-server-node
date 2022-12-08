import { All, Controller, Req } from "@nestjs/common";
import { AppService } from "./app.service";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Config } from "./model/Config.entity";
import { Repository } from "typeorm";
import axios, { AxiosRequestConfig } from "axios";
import * as artTemplate from "art-template";
import middles from "./middle";

const request = axios.create({});

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
    const tplData = { path, ip, hostname, params, query, body, headers, cookies, method };
    // 从数据库中查找转发配置信息
    const configs = await this.configRepository.findBy({ keyName: params["id"] });
    if (configs == null || configs.length === 0) {
      return { code: -1, msg: "找不到配置文件" };
    }

    for (const config of configs) {
      this.handleForward(config, tplData);
    }

    return { code: 0, msg: "ok, already processing asynchronously" };
  }

  /**
   * 根据配置文件执行转发操作
   * @param config 配置信息
   * @param tplData 模板变量数据
   */
  handleForward(config: Config, tplData: any) {
    // 构建转发请求参数信息
    const reqConfig: AxiosRequestConfig = { method: config.method, url: config.url, responseType: config.responseType };
    reqConfig.timeout = config.timeout;

    // 配置中间件
    reqConfig.transformRequest = [(data, headers) => {
      const middleKeys = Object.keys(config.middle || {});
      if (middleKeys.length === 0) {
        return data;
      }
      return middleKeys.reduce((obj, middleKey) => {
        const fun = middles[middleKey];
        // 处理中间件的数据处理
        const middleParams = config.middle[middleKey];
        return fun ? fun(obj, headers, this.parseObj(middleParams, tplData)) : obj;
      }, data);
    }, (data) => {
      return typeof data === "string" ? data : JSON.stringify(data);
    }];

    // 解析处理配置模板信息中的变量信息，把变量替换成具体的值
    reqConfig.headers = this.parseObj(config.header, tplData);
    reqConfig.params = this.parseObj(config.query, tplData);
    reqConfig.data = this.parseObj(config.data, tplData);
    reqConfig.auth = this.parseObj(config.auth, tplData);

    request(reqConfig).then(res => {
      console.log("接收请求参数", JSON.stringify(tplData, null, null));
      console.log("发起请求参数", JSON.stringify(reqConfig, null, null));
      console.log("发起请求结果", JSON.stringify(res.data, null, null));
    }).catch(e => {
      console.log("接收请求参数", JSON.stringify(tplData, null, null));
      console.log("发起请求参数", JSON.stringify(reqConfig, null, null));
      console.error("发起请求出现错误", e.message, JSON.stringify(e.response?.data || {}, null, null));
    });
  }

  /**
   * 解析对象信息，对 对象 的模板内容进行处理
   * @param data 对象内容
   * @param tplData 模板变量数据
   */
  parseObj(data: any, tplData: any): any {
    if (data == null) {
      return data;
    }
    if (typeof data === "string") {
      return this.renderText(data, tplData);
    }
    if (data instanceof Array || Array.isArray(data)) {
      if (data.length === 0) {
        return [];
      }
      const items = [];
      for (const item of data) {
        items.push(this.parseObj(item, tplData));
      }
      return items;
    }

    const dataKeys = Object.keys(data);
    if (dataKeys.length === 0) {
      return undefined;
    }
    const obj = {};
    dataKeys.forEach((key) => {
      const rawValue = data[key];
      if (rawValue == null) {
        obj[key] = null;
      } else if (typeof rawValue === "string") {
        obj[key] = this.renderText(rawValue, tplData);
      } else if (typeof rawValue === "object") {
        obj[key] = this.parseObj(rawValue, tplData);
      } else {
        obj[key] = rawValue;
      }
    });
    return obj;
  }

  /**
   * 解析模板
   * @param tpl 模板内存
   * @param tplData 模板变量数据
   */
  renderText(tpl: string, tplData: any) {
    if (artTemplate == null) {
      return tpl;
    }
    return artTemplate.render(tpl, tplData);
  };
}

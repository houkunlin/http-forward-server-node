import * as core from "express-serve-static-core";
import { ParsedQs } from "qs";
import { IncomingHttpHeaders } from "http";

export type TplData = {
  // 当前请求的路径
  path: string;
  // 当前请求IP地址信息
  ip: string;
  // 当前请求主机
  hostname: string;
  // 当前请求方法：GET/POST/PUT/DELETE
  method: string;
  // 当前请求的内置路由参数
  params: any | core.ParamsDictionary;
  // 当前请求的GET参数
  query: any | ParsedQs;
  // 当前请求的 Body 内容（POST、PUT、DELETE），`application/json` 和 `application/x-www-form-urlencoded` 都会解析成 object
  body: any;
  // 当前请求头参数
  headers: any | IncomingHttpHeaders;
  // 当前请求 COOKIE 参数
  cookies: any;
}

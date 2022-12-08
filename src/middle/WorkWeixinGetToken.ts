import { AxiosRequestConfig } from "axios";
import { TplData } from "../app";
import { request } from "../utils";
import * as LRU from "lru-cache";

// accessToken 的缓存
const cache = new LRU({
  max: 20,
  maxSize: 50,
  ttl: 7000 * 1000,
  sizeCalculation: () => 1
});

type ParamsType = {
  // 企业ID，在【我的企业】中查看，一个企业只有一个ID
  corpid: string;
  // 应用的凭证密钥，从【企业应用】》【应用】》【自建】》在我的自建应用中查看 Secret，每个应用的 Secret 不同
  corpsecret: string;
}

/**
 * 获取凭证，凭证默认有效期为 7200 秒
 * @param params
 */
async function getAccessToken(params: ParamsType) {
  const { corpid = "", corpsecret = "" } = params;
  return request({
    url: "https://qyapi.weixin.qq.com/cgi-bin/gettoken",
    method: "get",
    params: { corpid, corpsecret }
  }).then(res => {
    console.log("获取 AccessToken 结果", JSON.stringify(res.data, null, 2));
    return res.data.access_token;
  });
}

/**
 * 企业微信自建应用API发送消息，处理获取 AccessToken 中间件
 * @param config axios 请求配置参数对象
 * @param tplData 当前请求的模板变量数据信息
 * @param params 中间件所需要的参数信息，已经经过模板处理的结果 {@link ParamsType}
 * @constructor
 * @see https://developer.work.weixin.qq.com/document/path/91039
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
async function WorkWeixinGetToken(config: AxiosRequestConfig, tplData: TplData, params: any | ParamsType = {}) {
  const { data } = config;
  if (data == null || Object.keys(data).length === 0) {
    return;
  }
  let accessToken = cache.get(params.corpsecret);
  if (accessToken == null) {
    accessToken = await getAccessToken(params);
  }
  if (accessToken == null) {
    console.log("无法获取到企业微信的 AccessToken 信息");
    return;
  }
  cache.set(params.corpsecret, accessToken);
  const query: any = config.params || {};
  if (config.params == null) {
    config.params = query;
  }
  // 添加 AccessToken 参数
  query["access_token"] = accessToken;
}

export default WorkWeixinGetToken;

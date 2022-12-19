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
  // 开发者ID(AppID)，在【微信公众号后台】》【基础配置】中查看，一个微信公众号只有一个ID
  appId: string;
  // 开发者密码(AppSecret)，在【微信公众号后台】》【基础配置】中查看，一个微信公众号只有一个Secret
  appSecret: string;
}

/**
 * 获取凭证，凭证默认有效期为 7200 秒
 * @param params
 * @see <a href="https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html">获取Access token</a>
 */
async function getAccessToken(params: ParamsType) {
  const { appId = "", appSecret = "" } = params;
  return request({
    url: "https://api.weixin.qq.com/cgi-bin/token",
    method: "get",
    params: { appid: appId, secret: appSecret, grant_type: "client_credential" }
  }).then(res => {
    console.log("获取 AccessToken 结果", JSON.stringify(res.data, null, 2));
    return res.data.access_token;
  });
}

/**
 * 微信公众号获取 AccessToken 中间件
 * @param config axios 请求配置参数对象
 * @param tplData 当前请求的模板变量数据信息
 * @param params 中间件所需要的参数信息，已经经过模板处理的结果 {@link ParamsType}
 * @constructor
 * @see <a href="https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html">获取Access token</a>
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
async function MpWeixinGetToken(config: AxiosRequestConfig, tplData: TplData, params: any | ParamsType = {}) {
  const { data } = config;
  if (data == null || Object.keys(data).length === 0) {
    return;
  }
  let accessToken = cache.get(params.corpsecret);
  if (accessToken == null) {
    accessToken = await getAccessToken(params);
  }
  if (accessToken == null) {
    console.log("无法获取到微信公众号的 AccessToken 信息");
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

export default MpWeixinGetToken;

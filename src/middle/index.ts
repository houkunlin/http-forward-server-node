import TencentSignatureV3 from "./TencentSignatureV3";
import WorkWeixinGetToken from "./WorkWeixinGetToken";

// 可用的中间件列表
const middles = {
  // 腾讯云签名方法 v3
  TencentSignatureV3: TencentSignatureV3,
  // 企业微信服务端获取 Token
  WorkWeixinGetToken: WorkWeixinGetToken,
};

export default middles;

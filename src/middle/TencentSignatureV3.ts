import * as crypto from "crypto";
import { BinaryToTextEncoding } from "crypto";

function sha256(message: string, secret = "", encoding?: BinaryToTextEncoding) {
  const hmac = crypto.createHmac("sha256", secret);
  return hmac.update(message).digest(encoding);
}

function getHash(message, encoding: BinaryToTextEncoding = "hex") {
  const hash = crypto.createHash("sha256");
  return hash.update(message).digest(encoding);
}

function getDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
  const day = ("0" + date.getUTCDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

/**
 * 腾讯云服务器签名方法 V3 版本
 * @param data 请求体数据
 * @param headers 请求头内存
 * @param params 中间件所需要的参数信息 <pre>
 *   {
 *     "SecretId": "API 密钥 SecretId",
 *     "SecretKey": "API 密钥 SecretKey",
 *     "endpoint": "请求服务主机，如：sms.tencentcloudapi.com",
 *     "region": "请求服务主机的区域，如：ap-guangzhou",
 *     "service": "请求服务的代码，如：sms",
 *     "action": "请求服务的操作，如：SendSms",
 *     "version": "版本号，如：2021-01-11",
 *   }
 * </pre>
 * @see https://cloud.tencent.com/document/api/213/30654
 */
function TencentSignatureV3(data?: any, headers: any = {}, params?: any | any[]) {
  if (data == null) {
    return data;
  }
  // 密钥参数，云API密匙查询: https://console.cloud.tencent.com/cam/capi
  const SECRET_ID = params.SecretId || "";
  const SECRET_KEY = params.SecretKey || "";

  const endpoint = params.endpoint || "sms.tencentcloudapi.com";
  const region = params.region || "ap-guangzhou";
  const service = params.service || "sms";
  const action = params.action || "SendSms";
  const version = params.version || "2021-01-11";
  const timestamp = Math.round(new Date().getTime() / 1000);
  //时间处理, 获取世界时间日期
  const date = getDate(timestamp);

  // ************* 步骤 1：拼接规范请求串 *************
  const signedHeaders = "content-type;host";
  // 实际调用需要更新参数，这里仅作为演示签名验证通过的例子
  const payload = JSON.stringify(data);

  const hashedRequestPayload = getHash(payload);
  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  const canonicalHeaders = "content-type:application/json; charset=utf-8\n" + "host:" + endpoint + "\n";

  const canonicalRequest = httpRequestMethod + "\n"
    + canonicalUri + "\n"
    + canonicalQueryString + "\n"
    + canonicalHeaders + "\n"
    + signedHeaders + "\n"
    + hashedRequestPayload;

  // ************* 步骤 2：拼接待签名字符串 *************
  const algorithm = "TC3-HMAC-SHA256";
  const hashedCanonicalRequest = getHash(canonicalRequest);
  const credentialScope = date + "/" + service + "/" + "tc3_request";
  const stringToSign = algorithm + "\n" +
    timestamp + "\n" +
    credentialScope + "\n" +
    hashedCanonicalRequest;

  // ************* 步骤 3：计算签名 *************
  const kDate = sha256(date, "TC3" + SECRET_KEY);
  const kService = sha256(service, kDate);
  const kSigning = sha256("tc3_request", kService);
  const signature = sha256(stringToSign, kSigning, "hex");

  // ************* 步骤 4：拼接 Authorization *************
  headers["Authorization"] = algorithm + " " +
    "Credential=" + SECRET_ID + "/" + credentialScope + ", " +
    "SignedHeaders=" + signedHeaders + ", " +
    "Signature=" + signature;
  headers["Content-Type"] = "application/json; charset=utf-8";
  headers["X-TC-Action"] = action;
  headers["X-TC-Timestamp"] = timestamp.toString();
  headers["X-TC-Version"] = version;
  headers["X-TC-Region"] = region;

  /// console.log("腾讯签名请求参数", data, headers);
  return data;
}

export default TencentSignatureV3;

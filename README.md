## 群晖 NAS 系统通知转发处理（中转服务器）

在群晖 NAS 的通知设置中可以发送短信，群晖虽然提供了自定义短信服务提供商功能，但是群晖提供的自定义功能只能处理简单数据请求，像国内的短信云服务提供商通常需要对请求进行签名，此时群晖的自定义提供商功能将无法满足签名的需求。

为此开发了这个中转处理服务器，中转服务器接收来自群晖的短信通知HTTP请求，然后把数据转发到具体的短信提供商。

还可以自行对这个中转服务进行扩展，例如把通知转发给微信公众号、钉钉机器人、企业微信机器人、WebHooks等

## 技术栈

| 技术类型     | 技术框架         |
|----------|--------------|
| WEB框架    | Nest         |
| 数据库ORM   | typeorm      |
| HTTP数据请求 | axios        |
| 模板引擎     | art-template |

## 配置

### 数据库表结构（Postgres）

```sql
CREATE TABLE "public"."http_turn_config" (
  "id" int4 NOT NULL,
  "key_name" varchar(255) COLLATE "pg_catalog"."default",
  "middle" json DEFAULT '[]'::json,
  "url" varchar(255) COLLATE "pg_catalog"."default",
  "method" varchar(255) COLLATE "pg_catalog"."default" DEFAULT 'GET'::character varying,
  "query" json,
  "data" json,
  "header" json,
  "timeout" int4 DEFAULT 3000,
  "auth" json,
  "response_type" varchar(255) COLLATE "pg_catalog"."default" DEFAULT 'json'::character varying,
  "create_time" date,
  "update_time" date,
  "middle_params" json,
  CONSTRAINT "http_turn_config_pkey" PRIMARY KEY ("id")
)
;

ALTER TABLE "public"."http_turn_config" 
  OWNER TO "postgres";
COMMENT ON COLUMN "public"."http_turn_config"."id" IS '主键';
COMMENT ON COLUMN "public"."http_turn_config"."key_name" IS 'KEY 名称';
COMMENT ON COLUMN "public"."http_turn_config"."middle" IS '请求处理中间件配置';
COMMENT ON COLUMN "public"."http_turn_config"."url" IS '请求路径 axios.url';
COMMENT ON COLUMN "public"."http_turn_config"."method" IS '请求方法 axios.method';
COMMENT ON COLUMN "public"."http_turn_config"."query" IS '请求查询参数 axios.params';
COMMENT ON COLUMN "public"."http_turn_config"."data" IS '请求体 axios.data';
COMMENT ON COLUMN "public"."http_turn_config"."header" IS '请求头 axios.headers';
COMMENT ON COLUMN "public"."http_turn_config"."timeout" IS '请求超时 axios.timeout';
COMMENT ON COLUMN "public"."http_turn_config"."auth" IS '请求认证 axios.auth';
COMMENT ON COLUMN "public"."http_turn_config"."response_type" IS '请求返回结果 axios.responseType';
COMMENT ON COLUMN "public"."http_turn_config"."create_time" IS '创建时间';
COMMENT ON COLUMN "public"."http_turn_config"."update_time" IS '更新时间';
COMMENT ON COLUMN "public"."http_turn_config"."middle_params" IS '中间件的参数';
COMMENT ON TABLE "public"."http_turn_config" IS 'NAS 短信、WebHooks通知请求转发配置';
```

### 具体配置说明（数据库记录）

具体的转发配置，对第三方的API参数做配置，以下对数据库表做具体的字段说明

**key_name** <br/>
类型：varchar <br/>
模板语法：不支持 <br/>
说明：KEY 名称，不同的KEY表示不同的转发服务 <br/>
示例：`tencent-sms-forward` 

**middle** <br/>
类型：json <br/>
模板语法：只有value值支持 <br/>
说明：请求处理中间件配置，主要用来配置处理第三方服务的签名验证问题，中间件请勿重复调用（重复配置），否则可能会导致请求的数据不正确，中间件所在路径 `src/middle/`，目前已支持：`TencentSignatureV3` <br/>
示例： KEY 中间件代码（不支持模板），VALUE 此中间件的参数配置（支持模板），具体参数请查看中间件说明

```json
{
  "KEY 中间件代码": {
    "中间件配置参数": "中间件配置参数值，具体参数请查看中间件说明"
  }
}
```
```json
{
  "TencentSignatureV3": {
    "SecretId": "",
    "SecretKey": "",
    "endpoint": "sms.tencentcloudapi.com",
    "region": "ap-guangzhou",
    "service": "sms",
    "action": "SendSms",
    "version": "2021-01-11"
  }
}
```

**url** <br/>
类型：varchar <br/>
模板语法：不支持 <br/>
说明：请求路径 axios.url，第三方服务的API地址 <br/>
示例：`https://sms.tencentcloudapi.com` 

**method** <br/>
类型：varchar <br/>
模板语法：不支持 <br/>
说明：请求方法 axios.method，第三方服务的API的请求方法：GET、POST、PUT、DELETE <br/>
示例：`GET` 

**query** <br/>
类型：json <br/>
模板语法：支持 <br/>
说明：请求查询参数 axios.params，第三方服务的API的查询参数列表 <br/>
示例：

```json
{
  "user": "{{query.user}}",
  "password": "{{body.password}}"
}
```

**data** <br/>
类型：json <br/>
模板语法：支持 <br/>
说明：请求体 axios.data，第三方服务的API的请求体内容 <br/>
示例：

```json
{
  "user": "{{query.user}}",
  "password": "{{body.password}}"
}
```

如果是字符串，请用双引号包裹：`"user=aaa&password=BBB"`

**headers** <br/>
类型：json <br/>
模板语法：支持 <br/>
说明：请求头 axios.headers，第三方服务的API的请求头内容 <br/>
示例：

```json
{
  "Content-Type": "application/json",
  "X-Token": "{{query.token}}"
}
```

**auth** <br/>
类型：json <br/>
模板语法：支持 <br/>
说明：请求认证 axios.auth <br/>
示例：

```
无
```

**timeout** <br/>
类型：int <br/>
模板语法：不支持 <br/>
说明：请求超时 axios.timeout， 默认 3000 ms <br/>
示例：`3000` 

**response_type** <br/>
类型：varchar <br/>
模板语法：不支持 <br/>
说明：请求返回结果 axios.responseType，默认：json <br/>
示例：`json` 

## 中间件

中间件配置（`middle` 字段配置）示例如下：

```json
{
    "MpWeixinGetToken":{
        "appId": "xxx",
        "appSecret": "xxx"
    }
}
```

下面列出已支持的中间件信息

**TencentSignatureV3** <br/>
说明：腾讯云签名方法 <br/>
相关地址：[腾讯：签名方法V3](https://cloud.tencent.com/document/api/213/30654) / [Github：Nodejs代码示例（短信签名）](https://github.com/TencentCloud/signature-process-demo/tree/main/sms/signature-v3/nodejs) <br/>
中间件参数：

```json
{
  "SecretId": "API 密钥 SecretId",
  "SecretKey": "API 密钥 SecretKey",
  "endpoint": "请求服务主机，如：sms.tencentcloudapi.com",
  "region": "请求服务主机的区域，如：ap-guangzhou",
  "service": "请求服务的代码，如：sms",
  "action": "请求服务的操作，如：SendSms",
  "version": "版本号，如：2021-01-11"
}
```

```json
{
  "SecretId": "",
  "SecretKey": "",
  "endpoint": "sms.tencentcloudapi.com",
  "region": "ap-guangzhou",
  "service": "sms",
  "action": "SendSms",
  "version": "2021-01-11"
}
```

**WorkWeixinGetToken**

说明：企业微信服务端API，处理Token认证参数 <br/>
相关地址：[企业微信服务端API：获取access_token](https://developer.work.weixin.qq.com/document/path/91039) <br/>
中间件参数：

```json
{
  "corpid": "企业ID，在【我的企业】中查看，一个企业只有一个ID",
  "corpsecret": "应用的凭证密钥，从【企业应用】》【应用】》【自建】》在我的自建应用中查看 Secret，每个应用的 Secret 不同"
}
```

**MpWeixinGetToken**

说明：获取微信公众号 AccessToken <br/>
相关地址：[微信公众号：获取Access token](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html) <br/>
中间件参数：

```json
{
  "appId": "开发者ID(AppID)，在【微信公众号后台】》【基础配置】中查看，一个微信公众号只有一个ID",
  "appSecret": "开发者密码(AppSecret)，在【微信公众号后台】》【基础配置】中查看，一个微信公众号只有一个Secret"
}
```



## 模板变量说明

**path** <br/>
类型：string <br/>
说明：当前请求的路径 <br/>
示例：`/tencent-sms` 

**ip** <br/>
类型：string <br/>
说明：当前请求IP地址信息 <br/>
示例：`::ffff:172.17.0.1` 

**hostname** <br/>
类型：string <br/>
说明：当前请求主机 <br/>
示例：`localhost` 

**method** <br/>
类型：string <br/>
说明：当前请求方法：GET/POST/PUT/DELETE <br/>
示例：`GET` 

**params** <br/>
类型：object <br/>
说明：当前请求的内置路由参数 <br/>
示例：`{id: 'tencent-sms'}` 

**query** <br/>
类型：object <br/>
说明：当前请求的GET参数 <br/>
示例：`{key1: 'test-key', key2: 'test-key'}` 

**body** <br/>
类型：object <br/>
说明：当前请求的 Body 内容（POST、PUT、DELETE），`application/json` 和 `application/x-www-form-urlencoded` 都会解析成 object  <br/>
示例：`{key1: 'test-key', key2: 'test-key'}` 

**headers** <br/>
类型：object <br/>
说明：当前请求头参数 <br/>
示例：`{key1: 'test-key', key2: 'test-key'}` 

**cookies** <br/>
类型：object <br/>
说明：当前请求 COOKIE 参数 <br/>
示例：`{key1: 'test-key', key2: 'test-key'}` 



## 示例数据库配置数据

```sql
-- 腾讯云短信服务
INSERT INTO "public"."http_turn_config" ("id", "key_name", "middle", "url", "method", "query", "data", "header", "timeout", "auth", "response_type", "create_time", "update_time") VALUES (1, 'tencent-sms', '{"TencentSignatureV3":{
  "SecretId": "",
  "SecretKey": "",
  "endpoint": "sms.tencentcloudapi.com",
  "region": "ap-guangzhou",
  "service": "sms",
  "action": "SendSms",
  "version": "2021-01-11"
}}', 'https://sms.tencentcloudapi.com', 'POST', NULL, '{
    "PhoneNumberSet": [
        "{{body.phone}}"
    ],
    "SmsSdkAppId": "应用ID",
    "SignName": "签名名称",
    "TemplateId": "模板ID",
    "TemplateParamSet": ["{{body.content}}"]
}', '{
  "Content-Type": "application/json"
}', 3000, NULL, 'json', NULL, NULL);
-- 云片网短信服务
INSERT INTO "public"."http_turn_config" ("id", "key_name", "middle", "url", "method", "query", "data", "header", "timeout", "auth", "response_type", "create_time", "update_time") VALUES (2, 'yunpian-sms', NULL, 'https://sms.yunpian.com/v2/sms/single_send.json', 'POST', NULL, '"apikey=应用KEY&mobile={{body.phone.substring(3)}}&text=【签名名称】您有一条系统消息：{{body.content}}(请勿回复)"', '{
  "Content-Type": "application/x-www-form-urlencoded"
}', 3000, NULL, 'json', NULL, NULL);
-- 短信宝服务
INSERT INTO "public"."http_turn_config" ("id", "key_name", "middle", "url", "method", "query", "data", "header", "timeout", "auth", "response_type", "create_time", "update_time") VALUES (3, 'smsbao-sms', NULL, 'https://api.smsbao.com/sms', 'GET', '{
    "u":"用户名",
    "p":"密钥",
    "m":"{{body.phone.substring(3)}}",
    "c":"【NAS】{{body.content}}"
}', NULL, '{"Content-Type": "application/x-www-form-urlencoded"}', 3000, NULL, 'text', NULL, NULL);
```



## 安装

```bash
$ npm install
```

## 运行

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Docker 运行

```bash
docker push houkunlin/http-forward-server
docker run -d -v /home/user/prod.env:/app/.env -p 3000:80 houkunlin/http-forward-server
```

## 环境变量

请在项目路径下增加一个环境变量配置文件 `.env` 内容格式如下，Docker 容器的启动运行环境变量文件应该放在容器内 `/app/.env` 文件中，请按实际情况修改：

```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres
DB_SCHEMA=public
PORT=80

```



## NestJs 打包说明

`NestJs` 默认的打包方式无法生成含全部依赖环境的构建结果，只能生成普通的编译结果（需要拥有 `node_modules` 依赖环境），如果想要在生产环境中直接运行，则需要自定义打包配置，我参考了 [掘金：Nest项目部署的最佳方式](https://juejin.cn/post/7065724860688760862) 文章的配置，由于我引入了 `pg` 数据库，根据项目实际情况在 `lazyImports` 中增加一行相关的配置，具体的代码请查看 `webpack.config.js` 文件

## NestJs 打包并运行（生产环境）

```bash
npm run build
```

打包成功后会生成一个 `./dist/main.js` 文件（包含所有的运行依赖），此时可使用命令 `node ./dist/main.js` 运行服务，有可能会出现一个异常信息

```
/home/user/http-server-node/dist/main.js:229652
(void 0)[template.defaults.extname] = extension;
                                    ^

TypeError: Cannot set properties of undefined (setting '.art')
    at Object.<anonymous> (/home/user/http-server-node/dist/main.js:229652:37)
    at __webpack_require__ (/home/user/http-server-node/dist/main.js:271956:42)
    at Object.<anonymous> (/home/user/http-server-node/dist/main.js:57762:21)
    at __webpack_require__ (/home/user/http-server-node/dist/main.js:271956:42)
    at Object.<anonymous> (/home/user/http-server-node/dist/main.js:57689:26)
    at __webpack_require__ (/home/user/http-server-node/dist/main.js:271956:42)
    at Object.<anonymous> (/home/user/http-server-node/dist/main.js:19:22)
    at __webpack_require__ (/home/user/http-server-node/dist/main.js:271956:42)
    at /home/user/http-server-node/dist/main.js:272020:37
    at Object.<anonymous> (/home/user/http-server-node/dist/main.js:272022:12)
```

这个异常是 `art-template` 模板引擎导致的，`art-template` 中有一行代码打包后无法在 node 下执行，此时需要魔改 `art-template` 代码，改动文件 `node_modules/art-template/index.js` ，原代码如下：

```js
const template = require('./lib/index');
const extension = require('./lib/extension');

template.extension = extension;
require.extensions[template.defaults.extname] = extension;

module.exports = template;

```

改动后的代码

```js
const template = require('./lib/index');
const extension = require('./lib/extension');

template.extension = extension;
// require.extensions[template.defaults.extname] = extension;// 只需要注释掉这行代码就行了

module.exports = template;

```

改完之后重新打包和运行，当我们正式部署的时候可能会报另外一个错误，无法连接数据库，异常信息如下：

```
[Nest] 21680  - 2022/12/08 09:03:41     LOG [NestFactory] Starting Nest application...
[Nest] 21680  - 2022/12/08 09:03:41     LOG [InstanceLoader] TypeOrmModule dependencies initialized +30ms
[Nest] 21680  - 2022/12/08 09:03:41     LOG [InstanceLoader] ConfigHostModule dependencies initialized +0ms
[Nest] 21680  - 2022/12/08 09:03:41     LOG [InstanceLoader] ConfigModule dependencies initialized +1ms
[Nest] 21680  - 2022/12/08 09:03:41     LOG [InstanceLoader] ConfigModule dependencies initialized +0ms
[Nest] 21680  - 2022/12/08 09:03:41   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (1)...
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1157:16)
[Nest] 21680  - 2022/12/08 09:03:44   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (2)...
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1157:16)


```

我们需要在执行 `node` 命令的路径（请注意，是执行 `node` 命令的路径，而不是 `main.js` 所在路径）增加一个环境变量配置文件 `.env` 内容格式如下，Docker 容器的启动运行环境变量文件应该放在容器内 `/app/.env` 文件中，请按实际情况修改：

```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres
DB_SCHEMA=public
PORT=80

```



## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If
you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

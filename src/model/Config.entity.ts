import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ResponseType } from "axios";

@Entity({ name: "http_turn_config", schema: "public" })
export class Config {
  // 主键
  @PrimaryGeneratedColumn()
  id: number;

  // KEY 名称
  @Column({ name: "key_name", type: "varchar", length: 255 })
  keyName: string;

  // 请求处理中间件列表
  @Column({ name: "middle", type: "json" })
  middle: any;

  // 请求路径 axios.url
  @Column({ name: "url", type: "varchar", length: 255 })
  url: string;

  // 请求方法 axios.method
  @Column({ name: "method", type: "varchar", length: 255 })
  method: string;

  // 请求查询参数 axios.params
  @Column({ name: "query", type: "json" })
  query: any;

  // 请求体 axios.data
  @Column({ name: "data", type: "json" })
  data: any;

  // 请求头 axios.headers
  @Column({ name: "header", type: "json" })
  header: any;

  // 请求超时 axios.timeout
  @Column({ name: "timeout", type: "int4" })
  timeout: number;

  // 请求认证 axios.auth
  @Column({ name: "auth", type: "json" })
  auth: any;

  // 请求返回结果 axios.responseType
  @Column({ name: "response_type", type: "varchar", length: 255 })
  responseType: ResponseType;

  // 创建时间
  @Column({ name: "create_time", type: "date" })
  createTime: string;

  // 更新时间
  @Column({ name: "update_time", type: "date" })
  updateTime: string;
}















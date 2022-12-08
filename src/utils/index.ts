import * as artTemplate from "art-template";

/**
 * 解析模板
 * @param tpl 模板内存
 * @param tplData 模板变量数据
 */
export function renderText(tpl: string, tplData: any) {
  if (artTemplate == null) {
    return tpl;
  }
  return artTemplate.render(tpl, tplData);
}

/**
 * 解析对象信息，对 对象 的模板内容进行处理
 * @param data 对象内容
 * @param tplData 模板变量数据
 */
export function renderObject(data: any, tplData: any): any {
  if (data == null) {
    return data;
  }
  if (typeof data === "string") {
    return renderText(data, tplData);
  }
  if (data instanceof Array || Array.isArray(data)) {
    if (data.length === 0) {
      return [];
    }
    const items = [];
    for (const item of data) {
      items.push(renderObject(item, tplData));
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
      obj[key] = renderText(rawValue, tplData);
    } else if (typeof rawValue === "object") {
      obj[key] = renderObject(rawValue, tplData);
    } else {
      obj[key] = rawValue;
    }
  });
  return obj;
}

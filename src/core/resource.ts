import { type PathExpression } from "../types/metric";

export type QueryParameter = Record<string, any>;


interface ResourceUrl {
  url: string;
  parse?: Function | PathExpression;
}

export class Resource {
  baseUrl: string;
  queryParams?: QueryParameter[];
  pathParams?: string[];
  parse?: Function | PathExpression;

  constructor(
    baseUrl: string,
    queryParams?: QueryParameter[],
    pathParams?: string[],
    parse?: Function | PathExpression
  ) {
    this.baseUrl = baseUrl;
    this.queryParams = queryParams;
    this.pathParams = pathParams;
    this.parse = parse;
  }

  get urls(): ResourceUrl[] {
    let urls: ResourceUrl[] = [];

    if (!this.pathParams && !this.queryParams) {
      const url = new URL(this.baseUrl);

      urls.push({
        url: url.href,
        ...(this.parse && { parseFunction: this.parse }),
      });
      return urls;
    }

    const count = this.pathParams?.length ?? this.queryParams?.length ?? 0;

    for (let i = 0; i < count; i++) {
      const url = new URL(this.baseUrl);

      if (this.pathParams?.[i]) {
        url.pathname += `${this.pathParams[i]}`;
      }

      if (this.queryParams?.[i]) {
        for (const [key, value] of Object.entries(this.queryParams[i])) {
          url.searchParams.append(key, String(value));
        }
      }

      urls.push({
        url: url.href,
        ...(this.parse && { parse: this.parse }),
      });
    }

    return urls;
  }
}

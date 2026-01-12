import type { PathExpression } from '../types';
import { isPathExpression } from '../types/metric';
import { DataContext } from '../types/readers';
import type { Body } from '../types/resource';
import { search } from '@jmespath-community/jmespath';

export type Parameters = Record<string, any>;

export type ParametersFunction = (data?: DataContext) => Parameters[];

interface ResourceUrl {
  url: string;
  body?: Body;
}

type ResourceConfig =
  {
      url: string;
      file?: never;
      parameters?: Parameters[] | ParametersFunction | PathExpression;
      body?: Body;
    }
  | {
      url?: never;
      file: File;
      parameters?: never;
      body?: never;
    };


export class Resource {
  #file?: File | Array<File>;
  #url?: string;
  #parameters?: Parameters[] | ParametersFunction | PathExpression;
  #body?: Body;
  #data: DataContext;

  constructor(config: ResourceConfig) {
    this.validateConfig(config);

    this.#file = config.file;
    this.#url = config.url;
    this.#parameters = config.parameters;
    this.#body = config.body;
  }

  private validateConfig(config: any): asserts config is ResourceConfig {
    const hasUrl = config.url !== undefined && config.url !== null;
    const hasFile = config.file !== undefined && config.file !== null;

    if (!hasUrl && !hasFile) {
      throw new TypeError('Either "url" or "file" must be provided');
    }

    if (hasUrl && hasFile) {
      throw new TypeError(
        'Cannot provide both "url" and "file" they are mutually exclusive'
      );
    }

    if (
      hasFile &&
      (config.parameters !== undefined || config.body !== undefined)
    ) {
      throw new TypeError(
        '"parameters" and "body" can only be used with "url", not "file"'
      );
    }

    if (hasUrl && typeof config.url !== 'string') {
      throw new TypeError('"url" must be a string');
    }

    if (hasFile && !(config.file instanceof File)) {
      throw new TypeError('"file" must be a File object');
    }
  }

  isFileResource(): this is Resource & { file: File } {
    return this.#file !== undefined;
  }

  isUrlResource(): this is Resource & { url: string } {
    return this.#url !== undefined;
  }

  get protocol(): string {
    const url = new URL(this.urls[0].url)
    return url.protocol;
  }

  get files(): Array<File> | undefined {
    return this.#file ? Array.isArray(this.#file) ? this.#file : [this.#file] : undefined;
  }

  private static replaceTemplateVariables(
    text: string,
    parameters: Parameters
  ): string {
    return text.replace(/:(\w+)/g, (match, key) => {
      const value = parameters[key];
      return value !== undefined ? String(value) : match;
    });
  }

  private buildUrl(parameters: Parameters): string {
    if (!this.#url) {
      throw new TypeError(
        'Cannot build URL: resource is file-based, not URL-based'
      );
    }
    const replaced = this.#url.replace(/:(\w+)/g, (_match, key) => {
      const value = parameters[key];
      if (value === undefined) {
        throw new Error(`Missing required parameter: ${key}`);
      }
      return encodeURIComponent(String(value));
    });

    try {
      const url = new URL(replaced);
      return url.href;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new TypeError(
        `Invalid URL after template substitution: ${replaced}. ${message}`
      );
    }
  }

  private static buildBody(body: Body, parameters: Parameters): Body {
    if (typeof body === 'string') {
      return Resource.replaceTemplateVariables(body, parameters);
    }

    if (body instanceof URLSearchParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of body.entries()) {
        searchParams.append(
          Resource.replaceTemplateVariables(key, parameters),
          Resource.replaceTemplateVariables(value, parameters)
        );
      }
      return searchParams;
    }

    if (body instanceof FormData) {
      const formData = new FormData();
      for (const [key, value] of body.entries()) {
        if (typeof value === 'string') {
          formData.append(
            Resource.replaceTemplateVariables(key, parameters),
            Resource.replaceTemplateVariables(value, parameters)
          );
        } else {
          formData.append(
            Resource.replaceTemplateVariables(key, parameters),
            value
          );
        }
      }
      return formData;
    }

    if (
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      body instanceof ReadableStream
    ) {
      return body;
    }
    return body;
  }

  set data(data: DataContext) {
    this.#data = JSON.parse(JSON.stringify(data));
  }

  get urls(): ResourceUrl[] {
    if (!this.#url) {
      throw new TypeError(
        'Cannot get URLs: resource is file-based, not URL-based'
      );
    }

    let urls: ResourceUrl[] = [];

    if (this.#parameters !== undefined) {
      const parameters = this.resolveParameters();

      for (const params of parameters) {
        const url = this.buildUrl(params);
        let body;
        if (this.#body !== undefined) {
          body = Resource.buildBody(this.#body, params);
        }
        urls.push({
          url,
          ...(body && { body: body }),
        });
      }
    } else {
      urls.push({
        url: this.#url,
        ...(this.#body && { body: this.#body }),
      });
    }

    return urls;
  }

  private resolveParameters(): Parameters[] {
    if (!this.#parameters) {
      return [];
    }

    if (Array.isArray(this.#parameters)) {
      return this.#parameters;
    }

    if (isPathExpression(this.#parameters)) {
      if (this.#parameters.type === 'jmespath') {
        const value = search(this.#data, this.#parameters.expression);
        return value as Parameters[];
      } else {
        throw TypeError(
          'TypeError: unsupported path expression type, supported syntaxes include: jmespath'
        );
      }
    }

    return this.#parameters(this.#data);
  }
}

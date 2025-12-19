import type { PathExpression } from '../types';
import { isPathExpression } from '../types/metric';
import type {  Body } from '../types/resource';
import {type JSONValue, search } from '@jmespath-community/jmespath';


export type Parameters = Record<string, any>;

export type ParametersFunction = (data?: JSONValue) => Parameters[];

interface ResourceUrl {
  url: string;
  body?: Body;
}

export class Resource {
  url: string;
  parameters?: Parameters[] | ParametersFunction | PathExpression;
  body?: Body;
  #data: JSONValue;

  constructor(url: string, parameters?: Parameters[] | ParametersFunction, body?: Body) {
    this.url = url;
    this.parameters = parameters;
    this.body = body;
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
    const replaced = this.url.replace(/:(\w+)/g, (_match, key) => {
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
      throw new Error(
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


    set data(data: JSONValue) {
        this.#data = data;
    }

    get urls(): ResourceUrl[] {
    let urls: ResourceUrl[] = [];

    if (this.parameters !== undefined) {
      const parameters = this.resolveParameters();
      
      for (const params of parameters) {
        const url = this.buildUrl(params);
        let body;
        if (this.body !== undefined) {
          body = Resource.buildBody(this.body, params);
        }
        urls.push({
          url,
          ...(body && { body: body }),
        });
      }
    } else {
        urls.push({
          url: this.url,
          ...(this.body && { body: this.body }),
        });
    }

    return urls;
  }


  private resolveParameters(): Parameters[] {
    if (!this.parameters) {
      return [];
    }

    if (Array.isArray(this.parameters)) {
      return this.parameters;
    }

    if (isPathExpression(this.parameters)) {
        if (this.parameters.type === 'jmespath') {
            const value = search(this.#data, this.parameters.expression);
            return value as Parameters[];
        } else {
            throw TypeError(
            'TypeError: unsupported path expression type, supported syntaxes include: jmespath'
            );
        }
    }
    
    return this.parameters(this.#data);
  }
}


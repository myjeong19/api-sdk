import { parse } from 'node-html-parser';
import type { MetadataParser } from './parser';

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error);
    return null;
  }
}

export const titleParser: MetadataParser<string> = {
  parse: async html => {
    const root = parse(html);
    const selectors = ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'title'];

    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element) {
        return (element.getAttribute('content') || element.text).trim();
      }
    }
    return '';
  },
};

export const descriptionParser: MetadataParser<string> = {
  parse: async html => {
    const root = parse(html);
    const selectors = [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ];

    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element) {
        return (element.getAttribute('content') || element.text).trim();
      }
    }
    return '';
  },
};

export const imageParser: MetadataParser<string> = {
  parse: async html => {
    const root = parse(html);
    const selectors = ['meta[property="og:image"]', 'meta[name="twitter:image"]'];

    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content');
        if (content) return content.trim();
      }
    }
    return '';
  },
};

export const faviconParser: MetadataParser<string> = {
  parse: async (html, url) => {
    const root = parse(html);
    const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'];

    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element) {
        const href = element.getAttribute('href');
        if (href) {
          return href.startsWith('http') ? href : new URL(href, new URL(url).origin).toString();
        }
      }
    }

    return new URL('/favicon.ico', new URL(url).origin).toString();
  },
};

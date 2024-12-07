import { parse, type HTMLElement } from 'node-html-parser';

export interface Metadata {
  title: string;
  description: string;
  image: string;
  favicon: string;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error);
    return null;
  }
}

function extractMetaContent(root: HTMLElement, selectors: string[]): string {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) {
      return (element.getAttribute('content') || element.text).trim();
    }
  }
  return '';
}

function resolveFavicon(url: string, favicon: string): string {
  if (!favicon) return '/favicon.ico'; 

  if (favicon.startsWith('http')) return favicon;

  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  return favicon.startsWith('/')
    ? `${baseUrl}${favicon}` 
    : `${baseUrl}/${favicon}`;
}

export async function extractMetadata(url: string): Promise<Metadata> {
  const html = await fetchHtml(url);
  if (!html) {
    return {
      title: '',
      description: '',
      image: '',
      favicon: ''
    };
  }

  const root = parse(html);

  const title = extractMetaContent(root, [
    'meta[property="og:title"]',
    'title',
    'h1'
  ]);

  const description = extractMetaContent(root, [
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]'
  ]);

  const image = extractMetaContent(root, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'link[rel="image_src"]'
  ]);

  const favicon = resolveFavicon(url, extractMetaContent(root, [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ]));

  return {
    title,
    description,
    image,
    favicon
  };
}

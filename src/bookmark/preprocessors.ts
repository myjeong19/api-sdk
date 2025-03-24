import * as cheerio from 'cheerio';
import type { NotionpressoBookmarkBlock } from './types.js';

export type PreprocessorFn = (value: string) => string;

export const cleanWhitespace = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const defaultPreprocessors: Record<string, PreprocessorFn> = {
  title: value => cleanWhitespace(stripHtml(value)),
  description: value => cleanWhitespace(stripHtml(value)),
  image: value => value.trim(),
  favicon: value => value.trim(),
  site_name: value => cleanWhitespace(value),
  url: value => value.trim(),
  domain: extractDomain,
  author: cleanWhitespace,
};

export async function extractMetadata(html: string, url?: string): Promise<Record<string, string>> {
  const $ = cheerio.load(html);
  const metadata: Record<string, string> = {};

  if (url) {
    metadata.url = url;
    try {
      metadata.domain = new URL(url).hostname;
    } catch {}
  }

  const title = $('title').text().trim();
  if (title) {
    metadata.title = title;
  }

  $('meta').each((_, element) => {
    const meta = $(element);
    const name = meta.attr('name') || meta.attr('property');
    const content = meta.attr('content');

    if (name && content) {
      const key = name.replace(/^(og:|twitter:)/, '');
      metadata[key] = content;
    }
  });

  if (url) {
    try {
      const baseUrl = new URL(url);
      const origin = baseUrl.origin;

      const iconLinks = $(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );
      if (iconLinks.length > 0) {
        let faviconUrl = $(iconLinks[0]).attr('href');
        if (faviconUrl) {
          if (faviconUrl.startsWith('/')) {
            faviconUrl = `${origin}${faviconUrl}`;
          } else if (!faviconUrl.startsWith('http')) {
            faviconUrl = `${origin}/${faviconUrl}`;
          }
          metadata.favicon = faviconUrl;
        }
      }

      if (!metadata.favicon) {
        metadata.favicon = `${origin}/favicon.ico`;
      }
    } catch {}
  }

  if (!metadata.image) {
    const largeImages = $('img').filter((_, img) => {
      const width = parseInt($(img).attr('width') || '0', 10);
      const height = parseInt($(img).attr('height') || '0', 10);
      return width > 200 && height > 200;
    });

    if (largeImages.length > 0) {
      const imgSrc = $(largeImages[0]).attr('src');
      if (imgSrc) {
        metadata.image = imgSrc;
      }
    }
  }

  if (!metadata.description) {
    const firstParagraph = $('p').first().text().trim();
    if (firstParagraph) {
      metadata.description = firstParagraph;
    }
  }

  return metadata;
}

export async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionDump/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Error fetching URL: ${(error as Error).message}`);
  }
}

export function applyPreprocessors(
  metadata: Record<string, string>,
  preprocessors: Record<string, PreprocessorFn> = defaultPreprocessors,
  fields?: string[]
): Record<string, string> {
  const processed: Record<string, string> = {};

  const keysToProcess = fields
    ? Object.keys(metadata).filter(key => fields.includes(key))
    : Object.keys(metadata).filter(key => DEFAULT_BOOKMARK_FIELDS.includes(key as any));

  for (const key of keysToProcess) {
    const value = metadata[key];
    if (preprocessors[key]) {
      processed[key] = preprocessors[key](value);
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

export const DEFAULT_BOOKMARK_FIELDS = ['title', 'url', 'description', 'favicon', 'image'] as const;

export function transformBookmarkBlock(
  block: any,
  options: {
    meta?: boolean;
    preprocessors?: Record<string, PreprocessorFn>;
    fields?: string[];
  } = {}
): Promise<NotionpressoBookmarkBlock | any> {
  if (block.type !== 'bookmark') {
    return Promise.resolve(block);
  }

  const newBlock = JSON.parse(JSON.stringify(block)) as NotionpressoBookmarkBlock;
  const originalBookmark = { ...block.bookmark };

  newBlock.type = 'notionpresso_bookmark';

  const basicMetadata = Object.fromEntries(
    DEFAULT_BOOKMARK_FIELDS.filter(field => originalBookmark[field] !== undefined).map(field => [
      field,
      originalBookmark[field],
    ])
  );

  newBlock.notionpresso_bookmark = {
    metadata: basicMetadata,
    caption: originalBookmark.caption,
  };

  if (options.meta && originalBookmark?.url) {
    return fetchUrl(originalBookmark.url)
      .then(html => extractMetadata(html, originalBookmark.url))
      .then(metadata => {
        const processed = applyPreprocessors(
          metadata,
          options.preprocessors,
          options.fields || undefined
        );

        newBlock.notionpresso_bookmark = {
          metadata: processed,
          caption: originalBookmark.caption,
        };

        return newBlock;
      })
      .catch(error => {
        newBlock.notionpresso_bookmark = {
          metadata: basicMetadata,
          caption: originalBookmark.caption,
          error: error.message,
        };
        return newBlock;
      });
  }

  return Promise.resolve(newBlock);
}

export async function processBlocks(
  blocks: any[],
  options: {
    meta?: boolean;
    fields?: string[];
  } = {}
): Promise<any[]> {
  const preprocessors = { ...defaultPreprocessors };

  async function processBlocksRecursively(blocks: any[]): Promise<any[]> {
    const results = [];

    for (const block of blocks) {
      const processedBlock = await transformBookmarkBlock(block, {
        meta: options.meta,
        preprocessors,
        fields: options.fields,
      });

      if (processedBlock.blocks) {
        processedBlock.blocks = await processBlocksRecursively(processedBlock.blocks);
      }

      results.push(processedBlock);
    }

    return results;
  }

  return processBlocksRecursively(blocks);
}

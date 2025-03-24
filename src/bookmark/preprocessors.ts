import { cleanWhitespace, extractDomain, stripHtml } from './utils.js';
import { transformBookmarkBlock } from './transform.js';

interface PreprocessorFn {
  (value: string): string;
}

export const DEFAULT_BOOKMARK_FIELDS = ['title', 'url', 'description', 'favicon', 'image'] as const;

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

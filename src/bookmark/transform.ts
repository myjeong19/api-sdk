import type { NotionpressoBookmarkBlock } from "./types.js";
import {
  DEFAULT_BOOKMARK_FIELDS,
  applyPreprocessors,
} from "./preprocessors.js";
import { fetchUrl } from "./fetch.js";
import { extractMetadata } from "./metadata.js";
import type { Block } from "../index.js";

interface OriginalBookmark {
  url: string;
  caption: Array<unknown>;
  [key: string]: unknown;
}

interface PreprocessorFn {
  (value: string): string;
}

function createBookmarkBlock(
  originalBlock: Block,
  metadata: Record<string, string>,
  caption: Array<unknown>,
  error?: string
): NotionpressoBookmarkBlock {
  const newBlock = JSON.parse(
    JSON.stringify(originalBlock)
  ) as NotionpressoBookmarkBlock;
  newBlock.type = "notionpresso_bookmark";

  newBlock.notionpresso_bookmark = {
    metadata,
    caption,
  };

  if (error) {
    newBlock.notionpresso_bookmark.error = error;
  }

  return newBlock;
}

export function setBasicMetadata(
  originalBookmark: OriginalBookmark
): Record<string, string> {
  return Object.fromEntries(
    DEFAULT_BOOKMARK_FIELDS.filter(
      (field) => originalBookmark[field] !== undefined
    ).map((field) => [field, originalBookmark[field] as string])
  );
}

export async function transformBookmarkBlock(
  block: Block,
  options: {
    meta?: boolean;
    preprocessors?: Record<string, PreprocessorFn>;
    fields?: string[];
  } = {}
): Promise<NotionpressoBookmarkBlock | Block> {
  if (block.type !== "bookmark") {
    return block;
  }

  const originalBookmark = { ...block.bookmark } as OriginalBookmark;
  const basicMetadata = setBasicMetadata(originalBookmark);

  if (!options.meta || !originalBookmark?.url) {
    return createBookmarkBlock(block, basicMetadata, originalBookmark.caption);
  }

  try {
    const html = await fetchUrl(originalBookmark.url);
    const metadata = await extractMetadata(html, originalBookmark.url);
    const processed = applyPreprocessors(
      metadata,
      options.preprocessors,
      options.fields
    );

    return createBookmarkBlock(block, processed, originalBookmark.caption);
  } catch (error) {
    return createBookmarkBlock(
      block,
      basicMetadata,
      originalBookmark.caption,
      (error as Error).message
    );
  }
}

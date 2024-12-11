import { Client as _Client } from '@notionhq/client';
import type { ClientOptions } from '@notionhq/client/build/src/Client';
import {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

import {
  MetadataParser,
  MetadataParserRegistry,
  MetadataParserRegistryImpl,
  fetchHtml,
  BookmarkPreprocessor,
  BookmarkPreprocessorRegistry,
  BookmarkField,
} from './bookmark';

export class Client extends _Client {
  private metadataRegistry: MetadataParserRegistry;
  private preprocessorRegistry: BookmarkPreprocessor;

  constructor(options: ClientOptions = {}) {
    super(options);
    this.metadataRegistry = new MetadataParserRegistryImpl();
    this.preprocessorRegistry = new BookmarkPreprocessorRegistry();
  }

  registerMetadataParser<T>(key: string, parser: MetadataParser<T>): void {
    this.metadataRegistry.register(key, parser);
  }

  async fetchBlocks(parentId: string): Promise<Block[]> {
    const rawBlocks = await this.blocks.children.list({
      block_id: parentId,
      page_size: 100,
    });
    let blocks = rawBlocks.results;

    if (rawBlocks.has_more) {
      let cursor = rawBlocks.next_cursor;
      do {
        const additional = await this.blocks.children.list({
          block_id: parentId,
          page_size: 100,
          start_cursor: cursor ?? undefined,
        });
        blocks = [...blocks, ...additional.results];
        cursor = additional.next_cursor;
      } while (cursor);
    }

    const result = await Promise.all(
      (blocks as BlockObjectResponse[]).map(async block => {
        const processedBlock = await this.processBlock(block);

        if (processedBlock.has_children) {
          const blockId =
            processedBlock.type === 'synced_block' &&
            processedBlock.synced_block.synced_from != null
              ? processedBlock.synced_block.synced_from.block_id
              : processedBlock.id;

          const response = await this.fetchBlocks(blockId);
          return { ...processedBlock, blocks: response };
        }
        return { ...processedBlock, blocks: [] };
      })
    );

    return result;
  }

  async fetchFullPage(pageId: string): Promise<ContentfulPage> {
    const [page, blocks] = await Promise.all([
      this.pages.retrieve({ page_id: pageId }) as Promise<PageObjectResponse>,
      this.fetchBlocks(pageId),
    ]);

    return { ...page, blocks };
  }

  async fetchPageListFromDatabase(params: QueryDatabaseParameters): Promise<QueryDatabaseResults> {
    const response = await this.databases.query(params);
    const result = [...response.results];

    if (response.has_more && response.next_cursor) {
      const nextParams = {
        ...params,
        start_cursor: response.next_cursor,
      };
      const nextResult = await this.fetchPageListFromDatabase(nextParams);
      result.push(...nextResult);
    }

    return result;
  }

  private async processBlock(block: BlockObjectResponse): Promise<BlockObjectResponse> {
    if (block.type !== 'bookmark' || !block.bookmark?.url) return block;

    const html = await fetchHtml(block.bookmark.url);
    if (!html) return block;

    const metadata = await this.metadataRegistry.parse(html, block.bookmark.url);
    const processedMetadata = await this.processBookmarkMetadata(metadata);
    return {
      ...block,
      bookmark: { ...block.bookmark, ...processedMetadata },
      type: 'notionpresso_bookmark',
    };
  }

  private async processBookmarkMetadata(
    data: Partial<BookmarkField>
  ): Promise<Partial<BookmarkField>> {
    const processed: Partial<BookmarkField> = {};

    for (const [key, value] of Object.entries(data) as [keyof BookmarkField, string][]) {
      if (value !== undefined) {
        processed[key] = await this.preprocessorRegistry.process(key, value);
      }
    }

    return processed;
  }
}

export type Block = BlockObjectResponse & { blocks: Block[] };
export type ContentfulPage = PageObjectResponse & { blocks: Block[] };
export type QueryDatabaseResults = QueryDatabaseResponse['results'];
export { ClientOptions };
export default Client;

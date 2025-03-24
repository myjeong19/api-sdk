import type { EmbedBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { convertToNotionpressoTweet } from './tweet';

/**
 * 블록 배열에서 트위터/X 임베드를 notionpresso_tweet 형식으로 변환합니다.
 * @param blocks 변환할 블록 배열
 * @returns 변환된 블록 배열
 */
export function processTwitterEmbeds(blocks: any[]): any[] {
  return blocks.map(block => {
    if ('type' in block) {
      if (block.type === 'embed') {
        const embedBlock = block as EmbedBlockObjectResponse;

        if (
          embedBlock.embed.url &&
          (embedBlock.embed.url.includes('twitter') || embedBlock.embed.url.includes('x.com'))
        ) {
          console.log('트위터/X 임베드 변환:', embedBlock.embed.url);
          return convertToNotionpressoTweet(embedBlock);
        }
      }
    }
    return block;
  });
}

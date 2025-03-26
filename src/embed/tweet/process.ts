import type { EmbedBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { convertToNotionpressoTweet } from "./tweet";

export function processTwitterEmbeds(blocks: any[]): any[] {
  return blocks.map((block) => {
    if ("type" in block) {
      if (block.type === "embed") {
        const embedBlock = block as EmbedBlockObjectResponse;

        if (
          embedBlock.embed.url &&
          (embedBlock.embed.url.includes("twitter") ||
            embedBlock.embed.url.includes("x.com"))
        ) {
          console.log("트위터/X 임베드 변환:", embedBlock.embed.url);
          return convertToNotionpressoTweet(embedBlock);
        }
      }
    }
    return block;
  });
}

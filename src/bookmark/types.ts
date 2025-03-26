import { Block } from "./../index";

export interface NotionpressoBookmarkBlock {
  type: "notionpresso_bookmark";
  notionpresso_bookmark: {
    metadata: Record<string, string>;
    caption?: any[];
    error?: string;
  };
  blocks?: Block[];
}

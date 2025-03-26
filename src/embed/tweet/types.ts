export interface OEmbedResponse {
  type: string;
  version?: string;
  title?: string;
  url?: string;
  provider_name: string;
  provider_url?: string;

  width?: number;
  height?: number;
  html?: string;

  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;

  author_name?: string;
  author_url?: string;

  cache_age?: number;
  description?: string;
}

export interface NotionpressoTweetBlock {
  type: "notionpresso_tweet";
  notionpresso_tweet: {
    url: string;
    iframe_url: string;
    source: string;
    tweet_id?: string;
    html: string;
  };
}

import type { OEmbedResponse } from './types.js';
import { themeScript } from './script.js';

export async function fetchOEmbedData(url: string): Promise<OEmbedResponse | null> {
  try {
    const isTwitterUrl = isTwitter(url);

    if (isTwitterUrl) {
      return await handleTwitterEmbed(url);
    }

    return {
      type: 'link',
      provider_name: safeGetHostname(url),
      title: 'View Link',
      url: url,
    };
  } catch (error) {
    console.error('Failed to fetch OEmbed data:', error);

    return {
      type: 'link',
      provider_name: safeGetHostname(url),
      title: 'View Link',
      url: url,
    };
  }
}

function isTwitter(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('twitter.com') || hostname.includes('x.com');
  } catch (e) {
    return false;
  }
}

export function convertToNotionpressoTweet(embedData: any): any {
  if (embedData.type === 'embed') {
    const embedUrl = embedData.embed?.url;

    if (embedUrl && (embedUrl.includes('twitter') || embedUrl.includes('x.com'))) {
      const { embed, ...rest } = embedData;

      const tweetId = extractTweetId(embedUrl);

      if (!tweetId) {
        console.error('Cannot extract tweet ID:', embedUrl);
        return embedData;
      }

      const iframeUrl = createTwitterEmbedUrl(tweetId, 'light');

      const html = `
      <div class="notionpresso-tweet-container" data-tweet-id="${tweetId}">
        <iframe 
          id="twitter-widget-${tweetId}" 
          class="notionpresso-tweet-iframe"
          scrolling="no" 
          frameborder="0" 
          allowtransparency="true" 
          allowfullscreen="true" 
          style="position: static; visibility: visible; width: 420px; height: 592px; display: block; flex-grow: 1;" 
          title="Twitter Tweet" 
          src="${iframeUrl}" 
          data-tweet-id="${tweetId}">
        </iframe>
      </div>
      ${themeScript}`;

      return {
        ...rest,
        type: 'notionpresso_tweet',
        notionpresso_tweet: {
          url: embedUrl,
          iframe_url: iframeUrl,
          source: 'twitter',
          tweet_id: tweetId,
          html: html,
          theme: 'auto',
        },
      };
    }
  }

  return embedData;
}

async function handleTwitterEmbed(url: string): Promise<OEmbedResponse> {
  try {
    const tweetId = extractTweetId(url);

    if (!tweetId) {
      throw new Error('Cannot extract tweet ID.');
    }

    const iframeUrl = createTwitterEmbedUrl(tweetId, 'light');

    const html = `
    <div class="notionpresso-tweet-container" data-tweet-id="${tweetId}">
      <iframe 
        id="twitter-widget-${tweetId}" 
        class="notionpresso-tweet-iframe"
        scrolling="no" 
        frameborder="0" 
        allowtransparency="true" 
        allowfullscreen="true" 
        style="position: static; visibility: visible; width: 420px; height: 592px; display: block; flex-grow: 1;" 
        title="Twitter Tweet" 
        src="${iframeUrl}" 
        data-tweet-id="${tweetId}">
      </iframe>
    </div>
    ${themeScript}`;

    return {
      type: 'notionpresso_tweet',
      provider_name: 'Twitter',
      provider_url: 'https://twitter.com',
      url: url,
      html: html,
      width: 420,
      height: 592,
      title: 'Twitter Tweet',
      notionpresso_tweet: {
        url: url,
        iframe_url: iframeUrl,
        source: 'twitter',
        tweet_id: tweetId,
        theme: 'auto',
      },
    } as OEmbedResponse;
  } catch (error) {
    console.error('Error processing Twitter embed:', error);

    return {
      type: 'link',
      provider_name: 'Twitter',
      provider_url: 'https://twitter.com',
      url: url,
      title: 'View Tweet',
    };
  }
}

function extractTweetId(twitterUrl: string): string | null {
  try {
    const url = new URL(twitterUrl);
    const pathname = url.pathname;

    const statusMatch = pathname.match(/\/status\/(\d+)/);
    if (statusMatch && statusMatch[1]) {
      return statusMatch[1];
    }

    const xMatch = pathname.match(/\/(\w+)\/status\/(\d+)/);
    if (xMatch && xMatch[2]) {
      return xMatch[2];
    }

    return null;
  } catch (e) {
    console.error('Error extracting tweet ID:', e);
    return null;
  }
}

function createTwitterEmbedUrl(tweetId: string, theme: string = 'light'): string {
  const baseUrl = 'https://platform.twitter.com/embed/Tweet.html';

  const params = new URLSearchParams({
    id: tweetId,
    dnt: 'true',
    embedId: 'twitter-widget-0',
    frame: 'false',
    hideCard: 'false',
    hideThread: 'false',
    lang: 'en',
    theme: theme,
    siteScreenName: 'NotionpressoHQ',
    widgetsVersion: '2b959255e8896:1673658205745',
    width: '100%',
  });

  const features =
    'eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfZm9zbnJfc29mdF9pbnRlcnZlbnRpb25zX2VuYWJsZWQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X21peGVkX21lZGlhXzE1ODk3Ijp7ImJ1Y2tldCI6InRyZWF0bWVudCIsInZlcnNpb24iOm51bGx9LCJ0ZndfdXNlX3Byb2ZpbGVfaW1hZ2Vfc2hhcGVfZW5hYmxlZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfdmlkZW9faGxzX2R5bmFtaWNfbWFuaWZlc3RzXzE1MDgyIjp7ImJ1Y2tldCI6InRydWVfYml0cmF0ZSIsInZlcnNpb24iOm51bGx9LCJ0ZndfbGVnYWN5X3RpbWVsaW5lX3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9mcm9udGVuZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9fQ';
  params.set('features', features);

  return `${baseUrl}?${params.toString()}`;
}

function safeGetHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return 'link';
  }
}

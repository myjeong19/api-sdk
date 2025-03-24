import * as cheerio from 'cheerio';

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

function extractTitleFromHtml(cheerioHTML: cheerio.Root): string | undefined {
  const title = cheerioHTML('title').text().trim();
  return title || undefined;
}

function extractMetaTagsFromHtml(cheerioHTML: cheerio.Root): Record<string, string> {
  const metaTags: Record<string, string> = {};

  cheerioHTML('meta').each((_, element) => {
    const meta = cheerioHTML(element);
    const name = meta.attr('name') || meta.attr('property');
    const content = meta.attr('content');

    if (name && content) {
      const key = name.replace(/^(og:|twitter:)/, '');
      metaTags[key] = content;
    }
  });

  return metaTags;
}

function extractFaviconFromHtml(cheerioHTML: cheerio.Root, url: string): string {
  try {
    const baseUrl = new URL(url);
    const origin = baseUrl.origin;

    const iconLinks = cheerioHTML(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    if (iconLinks.length > 0) {
      const faviconUrl = cheerioHTML(iconLinks[0]).attr('href');
      if (faviconUrl) {
        if (faviconUrl.startsWith('/')) {
          return `${origin}${faviconUrl}`;
        } else if (!faviconUrl.startsWith('http')) {
          return `${origin}/${faviconUrl}`;
        }
        return faviconUrl;
      }
    }

    return `${origin}/favicon.ico`;
  } catch (error) {
    throw new Error(`Error extracting favicon: ${(error as Error).message}`);
  }
}

function findLargeImageInHtml(cheerioHTML: cheerio.Root): string | undefined {
  const largeImages = cheerioHTML('img').filter((_, img) => {
    const width = parseInt(cheerioHTML(img).attr('width') || '0', 10);
    const height = parseInt(cheerioHTML(img).attr('height') || '0', 10);
    return width > 200 && height > 200;
  });

  if (largeImages.length > 0) {
    return cheerioHTML(largeImages[0]).attr('src') || undefined;
  }

  return undefined;
}

function extractFirstParagraphFromHtml(cheerioHTML: cheerio.Root): string | undefined {
  const firstParagraph = cheerioHTML('p').first().text().trim();
  return firstParagraph || undefined;
}

export async function extractMetadata(html: string, url?: string): Promise<Record<string, string>> {
  const cheerioHTML = cheerio.load(html);
  const metadata: Record<string, string> = {};

  if (url) {
    metadata.url = url;
    metadata.domain = extractDomainFromUrl(url);
    metadata.favicon = extractFaviconFromHtml(cheerioHTML, url);
  }

  const title = extractTitleFromHtml(cheerioHTML);
  if (title) {
    metadata.title = title;
  }

  const metaTags = extractMetaTagsFromHtml(cheerioHTML);
  Object.assign(metadata, metaTags);

  if (!metadata.image) {
    const largeImage = findLargeImageInHtml(cheerioHTML);
    if (largeImage) {
      metadata.image = largeImage;
    }
  }

  if (!metadata.description) {
    const firstParagraph = extractFirstParagraphFromHtml(cheerioHTML);
    if (firstParagraph) {
      metadata.description = firstParagraph;
    }
  }

  return metadata;
}

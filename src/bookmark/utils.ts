export const cleanWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

export const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, "");

export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch {
    return url;
  }
};

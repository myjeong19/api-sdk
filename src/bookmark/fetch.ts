export async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionDump/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Error fetching URL: ${(error as Error).message}`);
  }
}

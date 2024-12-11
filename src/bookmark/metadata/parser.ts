export interface MetadataParser<T = any> {
  parse: (html: string, url: string) => Promise<T>;
}

export interface MetadataParserRegistry {
  register: <T>(key: string, parser: MetadataParser<T>) => void;
  parse: (html: string, url: string) => Promise<Record<string, any>>;
}

export class MetadataParserRegistryImpl implements MetadataParserRegistry {
  private parsers: Map<string, MetadataParser> = new Map();

  register<T>(key: string, parser: MetadataParser<T>): void {
    this.parsers.set(key, parser);
  }

  async parse(html: string, url: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const [key, parser] of this.parsers.entries()) {
      result[key] = await parser.parse(html, url);
    }
    
    return result;
  }
}

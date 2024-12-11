import type {
  BookmarkField,
  BookmarkPreprocessor,
  BookmarkPreprocessorKey,
  PreprocessorFn,
} from './types';

export class PreprocessorRegistry implements BookmarkPreprocessor {
  private processors: Map<BookmarkPreprocessorKey, PreprocessorFn<any>>;

  constructor() {
    this.processors = new Map();
  }

  register<K extends BookmarkPreprocessorKey>(
    field: K,
    fn: PreprocessorFn<BookmarkField[K]>
  ): void {
    this.processors.set(field, fn);
  }

  async process<K extends BookmarkPreprocessorKey>(
    field: K,
    value: BookmarkField[K]
  ): Promise<BookmarkField[K]> {
    const processor = this.processors.get(field);
    if (!processor) {
      return value;
    }
    return processor(value);
  }
}

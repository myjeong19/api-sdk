export interface BookmarkField {
  title?: string;
  description?: string;
  url: string;
  favicon?: string;
  image?: string;
}

export type BookmarkPreprocessorKey = keyof BookmarkField;

export type PreprocessorFn<T = string> = (value: T) => T | Promise<T>;

export interface BookmarkPreprocessor {
  register<K extends BookmarkPreprocessorKey>(field: K, fn: PreprocessorFn<BookmarkField[K]>): void;

  process<K extends BookmarkPreprocessorKey>(
    field: K,
    value: BookmarkField[K]
  ): Promise<BookmarkField[K]>;
}

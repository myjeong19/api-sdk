import { PreprocessorFn } from './types';

export const createPreprocessor = <T>(fn: PreprocessorFn<T>): PreprocessorFn<T> => {
  return async (value: T) => {
    return fn(value);
  };
};

export const stringProcessors = {
  identity: createPreprocessor((value: string) => value),
  trim: createPreprocessor((value: string) => value?.trim() ?? ''),
  normalize: createPreprocessor((value: string) => value?.toLowerCase() ?? ''),
  truncate: (length: number) =>
    createPreprocessor((value: string) => value?.slice(0, length) ?? ''),
} as const;

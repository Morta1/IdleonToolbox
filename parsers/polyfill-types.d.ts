declare global {
  interface Array<T> {
    toSimpleObject(val?: boolean): Record<string | number, boolean>;
    toChunks(perChunk: number): T[][];
    toObjectByIndex(): Record<string, T>;
  }
  interface String {
    capitalize(): string;
    camelToTitleCase(): string;
    capitalizeAllWords(): string;
    capitalizeAll(): string;
    firstCharLowerCase(): string;
    toCamelCase(): string;
  }
  interface Date {
    stdTimezoneOffset(): number;
    isDstObserved(): boolean;
  }
}
export {};

export interface DefaultResponse<T> {
  results: T[];
  more: boolean;
  count: number;
}

// Re-export all VNDB types
export * from "./vndb.js";

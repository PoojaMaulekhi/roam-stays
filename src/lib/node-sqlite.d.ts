declare module "node:sqlite" {
  export type SQLInputValue = null | number | bigint | string | Uint8Array;

  export interface StatementSync {
    all(...values: SQLInputValue[]): Record<string, unknown>[];
    get(...values: SQLInputValue[]): Record<string, unknown> | undefined;
    run(...values: SQLInputValue[]): { changes: number; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
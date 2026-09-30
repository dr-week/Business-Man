// utils/csvStream.ts
// Simple CSV streaming parser that emits one row at a time as an array of strings.
// This is a lightweight implementation for demonstration; for production use a robust library like csv-parser.

import { Transform } from "stream";

export class CSVLineTransformer extends Transform {
  private leftover = "";
  constructor(public delimiter: string = ",") {
    super({ objectMode: true });
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null, data?: any) => void) {
    const data = this.leftover + chunk.toString();
    const lines = data.split(/\r?\n/);
    this.leftover = lines.pop() ?? ""; // keep incomplete line for next chunk
    for (const line of lines) {
      if (line.trim() === "") continue;
      const cols = line.split(this.delimiter).map(col => col.trim());
      this.push(cols);
    }
    callback();
  }
  _flush(callback: (error?: Error | null, data?: any) => void) {
    if (this.leftover) {
      const cols = this.leftover.split(this.delimiter).map(col => col.trim());
      this.push(cols);
    }
    callback();
  }
}

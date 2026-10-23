/** TOOLBOX v0.14.91 — CSV to SQL INSERT UI adapter. */
import { renderPackTool } from "../../shared/pack-v0.14.91.ts";
import { fields } from "./manifest.ts";
export function render(mount: HTMLElement): void { renderPackTool(mount, "CSV to SQL INSERT", fields, "csv-to-sql-insert"); }

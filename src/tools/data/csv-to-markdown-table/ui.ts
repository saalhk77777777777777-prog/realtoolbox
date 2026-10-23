/** TOOLBOX v0.14.90 — CSV to Markdown Table UI adapter. */
import { renderPackTool } from "../../shared/pack-v0.14.90.ts";
import { fields } from "./manifest.ts";
export function render(mount: HTMLElement): void { renderPackTool(mount, "CSV to Markdown Table", fields, "csv-to-markdown-table"); }

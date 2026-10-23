/** TOOLBOX v0.14.91 — JSON to Zod UI adapter. */
import { renderPackTool } from "../../shared/pack-v0.14.91.ts";
import { fields } from "./manifest.ts";
export function render(mount: HTMLElement): void { renderPackTool(mount, "JSON to Zod Schema", fields, "json-to-zod"); }

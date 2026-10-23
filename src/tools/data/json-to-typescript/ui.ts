/** TOOLBOX v0.14.90 — JSON to TypeScript UI adapter. */
import { renderPackTool } from "../../shared/pack-v0.14.90.ts";
import { fields } from "./manifest.ts";
export function render(mount: HTMLElement): void { renderPackTool(mount, "JSON to TypeScript", fields, "json-to-typescript"); }

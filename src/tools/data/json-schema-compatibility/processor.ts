/** TOOLBOX v0.15.0 — JSON Schema Compatibility Checker processor. */
import type { ToolError } from "../../../core/types.ts";
type Obj = Record<string, unknown>;
export function validate(input: unknown): ToolError | null {
  const v = input as { before?: unknown; after?: unknown } | null;
  if (!v || typeof v.before !== "string" || typeof v.after !== "string" || !v.before.trim() || !v.after.trim())
    return { code: "USER_INPUT", what: "두 스키마가 필요합니다.", why: "비교할 이전·이후 JSON Schema가 입력되지 않았습니다.", how: "양쪽에 유효한 JSON Schema를 붙여 넣으세요." };
  if (v.before.length + v.after.length > 1_000_000)
    return { code: "UNSUPPORTED", what: "입력이 너무 큽니다.", why: "두 입력의 합계가 1MB를 초과합니다.", how: "더 작은 스키마를 비교하세요." };
  return null;
}
function parse(text: string): Obj {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("각 스키마의 최상위 값은 JSON 객체여야 합니다.");
  return value as Obj;
}
function typeName(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (typeof value === "object") return "object";
  return typeof value;
}
export function process(input: unknown): unknown {
  const error = validate(input); if (error) throw Error(error.what + " " + error.how);
  const v = input as { before: string; after: string };
  let oldSchema: Obj, newSchema: Obj;
  try { oldSchema = parse(v.before); newSchema = parse(v.after); }
  catch (e) { throw Error(e instanceof Error ? e.message : "유효하지 않은 JSON입니다."); }
  const changes: Array<{ path: string; kind: string; breaking: boolean; before?: unknown; after?: unknown; note: string }> = [];
  const walk = (oldS: Obj, newS: Obj, path: string) => {
    const oldType = oldS.type, newType = newS.type;
    if (oldType !== undefined && newType !== undefined && JSON.stringify(oldType) !== JSON.stringify(newType))
      changes.push({ path: path || "$", kind: "type-changed", breaking: true, before: oldType, after: newType, note: "기존 데이터가 새 타입 제약을 만족하지 않을 수 있습니다." });
    const oldProps = (oldS.properties && typeof oldS.properties === "object" && !Array.isArray(oldS.properties) ? oldS.properties : {}) as Obj;
    const newProps = (newS.properties && typeof newS.properties === "object" && !Array.isArray(newS.properties) ? newS.properties : {}) as Obj;
    for (const key of Object.keys(oldProps)) {
      const p = path + ".properties." + key;
      if (!(key in newProps)) changes.push({ path: p, kind: "property-removed", breaking: true, before: oldProps[key], note: "기존 필드가 새 스키마에서 제거되었습니다." });
      else if (oldProps[key] && newProps[key] && typeof oldProps[key] === "object" && typeof newProps[key] === "object")
        walk(oldProps[key] as Obj, newProps[key] as Obj, p);
    }
    for (const key of Object.keys(newProps)) if (!(key in oldProps))
      changes.push({ path: path + ".properties." + key, kind: "property-added", breaking: false, after: newProps[key], note: "새 필드가 추가되었습니다." });
    const oldRequired = new Set(Array.isArray(oldS.required) ? oldS.required.filter((x): x is string => typeof x === "string") : []);
    const newRequired = new Set(Array.isArray(newS.required) ? newS.required.filter((x): x is string => typeof x === "string") : []);
    for (const key of newRequired) if (!oldRequired.has(key))
      changes.push({ path: path + ".required." + key, kind: "required-added", breaking: true, note: "이전에는 선택 사항이던 필드가 필수가 되었습니다." });
    for (const key of oldRequired) if (!newRequired.has(key))
      changes.push({ path: path + ".required." + key, kind: "required-removed", breaking: false, note: "필수 조건이 완화되었습니다." });
    if (oldS.items && newS.items && typeof oldS.items === "object" && typeof newS.items === "object")
      walk(oldS.items as Obj, newS.items as Obj, path + ".items");
  };
  walk(oldSchema, newSchema, "$");
  return { compatible: !changes.some(c => c.breaking), breakingChanges: changes.filter(c => c.breaking).length, changeCount: changes.length, changes, note: "기본 비교기입니다. 모든 JSON Schema 키워드·조합 규칙을 완전히 평가하지는 않습니다." };
}

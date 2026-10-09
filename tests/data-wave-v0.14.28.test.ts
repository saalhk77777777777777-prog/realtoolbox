/** TOOLBOX v0.14.28 — Data Wave contract tests */
import { describe, expect, it } from "vitest";
import { process as jsonToXml, validate as validateJsonToXml } from "../src/tools/data/json-to-xml/processor.ts";
import { process as transpose, validate as validateTranspose } from "../src/tools/data/csv-transpose/processor.ts";
import { process as filterCsv } from "../src/tools/data/csv-filter/processor.ts";
import { process as sortCsv } from "../src/tools/data/csv-sorter/processor.ts";
import { process as selectColumns } from "../src/tools/data/csv-column-selector/processor.ts";
import { process as jsonPath, validate as validatePath } from "../src/tools/data/json-path-query/processor.ts";
import { process as flatten } from "../src/tools/data/json-flatten-unflatten/processor.ts";

describe("v0.14.28 data wave", () => {
  it("converts JSON to escaped XML", () => {
    expect(jsonToXml({ text: '{"name":"A&B <C>"}', rootName: "person" }).xml).toContain("A&amp;B &lt;C&gt;");
    expect(validateJsonToXml({ text: "{bad}" })).not.toBeNull();
    expect(validateJsonToXml({ text: "{}", rootName: "bad root" })).not.toBeNull();
  });
  it("transposes rows and columns", () => {
    expect(transpose({ text: "a,b\n1,2\n3,4" }).csv).toBe("a,1,3\r\nb,2,4");
    expect(validateTranspose({ text: "" })).not.toBeNull();
  });
  it("filters rows by exact value or substring", () => {
    const csv = "name,city\nMina,Seoul\nJin,Incheon\nMin,Seoul";
    expect(filterCsv({ text: csv, column: "city", value: "Seoul" }).matchedRows).toBe(2);
    expect(filterCsv({ text: csv, column: "name", value: "Min", contains: true }).matchedRows).toBe(2);
    expect(() => filterCsv({ text: csv, column: "missing", value: "x" })).toThrow();
  });
  it("sorts numeric CSV values and selects requested columns", () => {
    expect(sortCsv({ text: "name,score\nA,10\nB,2", column: "score", numeric: true }).csv).toBe("name,score\r\nB,2\r\nA,10");
    expect(selectColumns({ text: "name,score,city\nA,10,Seoul", columns: ["city", "name"] }).csv).toBe("city,name\r\nSeoul,A");
    expect(() => selectColumns({ text: "a,b\n1,2", columns: ["missing"] })).toThrow();
  });
  it("queries nested JSON paths and handles missing paths", () => {
    const data = '{"users":[{"name":"Mina"}]}';
    expect(jsonPath({ text: data, path: "$.users[0].name" })).toMatchObject({ found: true, value: "Mina" });
    expect(jsonPath({ text: data, path: "$.users[4].name" }).found).toBe(false);
    expect(validatePath({ text: "not json", path: "$" })).not.toBeNull();
  });
  it("flattens nested objects and unflattens them", () => {
    const flat = flatten({ text: '{"user":{"name":"Mina","active":true}}' });
    expect(flat.json).toEqual({ "user.name": "Mina", "user.active": true });
    const nested = flatten({ text: '{"user.name":"Mina","user.active":true}', mode: "unflatten" });
    expect(nested.json).toEqual({ user: { name: "Mina", active: true } });
  });
});

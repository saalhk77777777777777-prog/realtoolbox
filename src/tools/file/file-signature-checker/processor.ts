/** TOOLBOX v0.13.3 */
import type { ToolError } from "../../../core/types.ts";
export interface Input { files:File[]; }
export interface Row {name:string;extension:string;detected:string;match:boolean;hex:string;}
export interface Output {rows:Row[];}
const SIG:Array<[number[],string,string[]]>=[
[[0x89,0x50,0x4e,0x47],"PNG",["png"]],[[0xff,0xd8,0xff],"JPEG",["jpg","jpeg"]],[[0x25,0x50,0x44,0x46],"PDF",["pdf"]],[[0x47,0x49,0x46,0x38],"GIF",["gif"]],[[0x52,0x49,0x46,0x46],"RIFF",["wav","webp"]],[[0x50,0x4b,0x03,0x04],"ZIP/OOXML",["zip","docx","xlsx","pptx"]],[[0x1f,0x8b],"GZIP",["gz"]]];
export function validate(input:unknown):ToolError|null{const v=input as Partial<Input>|null;if(!v||!Array.isArray(v.files)||!v.files.length)return {code:"USER_INPUT",what:"파일이 선택되지 않았습니다.",why:"입력 목록이 비어 있습니다.",how:"파일을 선택하세요."};if(v.files.some(f=>!(f instanceof File)))return {code:"FILE_INVALID",what:"유효하지 않은 파일입니다.",why:"File 객체가 아닙니다.",how:"파일을 다시 선택하세요."};return null;}
export async function process(input:Input):Promise<Output>{const rows:Row[]=[];for(const f of input.files){const bytes=new Uint8Array(await f.slice(0,16).arrayBuffer());const dot=f.name.lastIndexOf(".");const extension=dot>=0?f.name.slice(dot+1).toLowerCase():"";let detected="Unknown",allowed:string[]=[];for(const [sig,name,exts] of SIG){if(sig.every((b,i)=>bytes[i]===b)){detected=name;allowed=exts;break;}}rows.push({name:f.name,extension,detected,match:detected==="Unknown"||allowed.includes(extension),hex:[...bytes].map(b=>b.toString(16).padStart(2,"0")).join(" ")});}return {rows};}

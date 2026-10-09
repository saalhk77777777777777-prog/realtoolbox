/** TOOLBOX v0.14.1 — PDF Page Rotate */
import { degrees } from "pdf-lib";
import { loadPdf, PDF_MIME } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";
export type Rotation=0|90|180|270;
export interface RotateInput { file:File; rotation:Rotation }
export interface RotateOutput { pageCount:number; rotation:Rotation; blob:Blob; fileName:string }
export function validateRotate(input:unknown):ToolError|null {const v=input as Partial<RotateInput>|null;if(!v||!(v.file instanceof File))return {code:"USER_INPUT",what:"PDF 파일이 필요합니다.",why:"입력 파일이 없습니다.",how:"PDF를 선택하세요."};if(v.file.size===0)return {code:"FILE_INVALID",what:"빈 파일입니다.",why:"파일 크기가 0바이트입니다.",how:"내용이 있는 PDF를 선택하세요."};if(v.file.size>100*1024*1024)return {code:"UNSUPPORTED",what:"PDF가 너무 큽니다.",why:"최대 100MB입니다.",how:"더 작은 PDF를 사용하세요."};if(v.rotation!==0&&v.rotation!==90&&v.rotation!==180&&v.rotation!==270)return {code:"USER_INPUT",what:"회전 각도가 올바르지 않습니다.",why:"0, 90, 180, 270도만 지원합니다.",how:"지원되는 각도를 선택하세요."};return null;}
export async function processRotate(input:RotateInput):Promise<RotateOutput>{const doc=await loadPdf(await input.file.arrayBuffer());const pages=doc.getPages();for(const page of pages)page.setRotation(degrees(input.rotation));doc.setProducer("TOOLBOX");const bytes=await doc.save();return {pageCount:pages.length,rotation:input.rotation,blob:new Blob([bytes as BlobPart],{type:PDF_MIME}),fileName:"rotated.pdf"};}

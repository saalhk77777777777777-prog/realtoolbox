/**
 * TOOLBOX v0.7.0 — Image to PDF
 * 이미지 파일을 실제 PDF 문서로 변환합니다. 서버 전송 없음.
 * pdf-lib: JPEG는 원본 바이트를 직접 embed, 그 외는 Canvas로 PNG 인코딩 후 embed.
 * 이미지 1개 = 페이지 1개. pageSize=a4/letter면 여백 안에 축소 배치, image면 원본 크기.
 */
import { PDFDocument, degrees } from "pdf-lib";
import { PDF_MIME } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";

export type PageSize = "a4" | "letter" | "image";

export interface ImageToPdfInput {
  files: File[];
  pageSize: PageSize;
  margin: number;
}

export interface ImageToPdfOutput {
  pageCount: number;
  pageSize: PageSize;
  blob: Blob;
  fileName: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGES = 20;

export function validateImageToPdf(input: unknown): ToolError | null {
  const v = input as Partial<ImageToPdfInput> | null;
  if (!v || !Array.isArray(v.files) || v.files.length === 0) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일 배열이 필요합니다.",
      how: "이미지 파일을 업로드하세요.",
    };
  }
  if (v.files.length > MAX_IMAGES) {
    return {
      code: "UNSUPPORTED",
      what: `최대 ${MAX_IMAGES}개 이미지까지 변환할 수 있습니다.`,
      why: `현재 ${v.files.length}개입니다.`,
      how: "이미지 수를 줄이세요.",
    };
  }
  if (v.pageSize !== "a4" && v.pageSize !== "letter" && v.pageSize !== "image") {
    return {
      code: "USER_INPUT",
      what: "페이지 크기가 올바르지 않습니다.",
      why: "a4, letter, image만 허용합니다.",
      how: "올바른 페이지 크기를 선택하세요.",
    };
  }
  if (typeof v.margin !== "number" || v.margin < 0 || v.margin > 100) {
    return {
      code: "USER_INPUT",
      what: "여백은 0~100 사이여야 합니다.",
      why: `현재 ${v.margin}입니다.`,
      how: "0~100 사이의 값을 입력하세요.",
    };
  }
  for (const f of v.files) {
    if (!(f instanceof File)) {
      return {
        code: "USER_INPUT",
        what: "유효하지 않은 파일입니다.",
        why: "File 객체가 아닌 값이 포함되어 있습니다.",
        how: "이미지 파일만 업로드하세요.",
      };
    }
    if (f.size > MAX_IMAGE_BYTES) {
      return {
        code: "UNSUPPORTED",
        what: `이미지가 너무 큽니다: ${f.name}`,
        why: `최대 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB입니다.`,
        how: "더 작은 이미지를 사용하세요.",
      };
    }
  }
  return null;
}

/**
 * JPEG의 EXIF Orientation(1~8). 없으면 1.
 * PDF 뷰어는 이미지 XObject에 EXIF를 적용하지 않아서, 여기서 읽어 직접 회전시켜야 한다.
 * 앱1(APP1) → TIFF 헤더 → IFD0의 태그 0x0112 만 따라간다.
 */
function exifOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let off = 2; off + 4 <= bytes.length; ) {
    if (dv.getUint8(off) !== 0xff) {
      off++;
      continue;
    }
    const marker = dv.getUint8(off + 1);
    const size = dv.getUint16(off + 2);
    if (marker === 0xe1 && off + 10 <= bytes.length) {
      // "Exif\0\0" 확인
      if (dv.getUint32(off + 4) === 0x45786966 && dv.getUint16(off + 8) === 0) {
        return readTiffOrientation(dv, off + 10);
      }
    }
    if (marker === 0xda) return 1; // SOS 이후는 이미지 데이터
    off += 2 + size;
  }
  return 1;
}

function readTiffOrientation(dv: DataView, tiff: number): number {
  if (tiff + 8 > dv.byteLength) return 1;
  const le = dv.getUint16(tiff) === 0x4949;
  if (!le && dv.getUint16(tiff) !== 0x4d4d) return 1;
  const u16 = (p: number) => dv.getUint16(p, le);
  const u32 = (p: number) => dv.getUint32(p, le);
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > dv.byteLength) return 1;
  for (let i = 0, n = u16(ifd); i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > dv.byteLength) break;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8); // SHORT 1개는 값 필드 앞 2바이트에 들어있다
      return v >= 1 && v <= 8 ? v : 1;
    }
  }
  return 1;
}

const PAGE_POINTS: Record<Exclude<PageSize, "image">, { w: number; h: number }> = {
  a4: { w: 595, h: 842 },
  letter: { w: 612, h: 792 },
};

async function toPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw {
      code: "BROWSER_LIMIT",
      what: "Canvas를 사용할 수 없습니다.",
      why: "브라우저가 Canvas를 지원하지 않습니다.",
      how: "최신 브라우저를 사용하세요.",
    };
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG 인코딩 실패");
  return new Uint8Array(await blob.arrayBuffer());
}

export async function processImageToPdf(input: ImageToPdfInput): Promise<ImageToPdfOutput> {
  const doc = await PDFDocument.create();

  for (const file of input.files) {
    // JPEG는 압축된 원본 바이트를 그대로 넣을 수 있어 재인코딩 손실이 없다.
    const isJpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);
    const bytes = isJpeg ? new Uint8Array(await file.arrayBuffer()) : await toPngBytes(file);

    const o = isJpeg ? exifOrientation(bytes) : 1;
    // 5/7은 거울 전치라 회전만으로는 안 되고, createImageBitmap가 EXIF를 적용하는 캔버스 경로로 보낸다.
    const viaCanvas = o === 5 || o === 7;
    // EXIF 6 = 시계방향 90°(=반시계 -90), 8 = 시계방향 270°(=반시계 90)
    const rotate = o === 6 ? -90 : o === 8 ? 90 : 0;
    // 2/3/4는 축이 그대로인 미러·180°다. pdf.js는 JPEG EXIF를 적용하지 않으므로 여기서
    // 무시하면 오류 없이 잘못된 방향으로 나간다. pdf-lib의 scale()은 음수 크기를 그대로
    // cm(sx,0,0,sy,0,0)로 내보내므로 부호로 미러를 표현할 수 있다.
    const mirror = o === 2 ? [-1, 1] : o === 3 ? [-1, -1] : o === 4 ? [1, -1] : [1, 1];

    const payload = !isJpeg || viaCanvas ? await toPngBytes(file) : bytes;
    const image = !isJpeg || viaCanvas ? await doc.embedPng(payload) : await doc.embedJpg(payload);

    // 회전하면 표시 치수가 축과 바뀐다. 스케일은 표시 기준으로 계산한다.
    const swap = rotate !== 0;
    const dispW = swap ? image.height : image.width;
    const dispH = swap ? image.width : image.height;

    let pageW: number;
    let pageH: number;
    let s: number;
    if (input.pageSize === "image") {
      pageW = dispW;
      pageH = dispH;
      s = 1;
    } else {
      const box = PAGE_POINTS[input.pageSize];
      pageW = box.w;
      pageH = box.h;
      const availW = pageW - input.margin * 2;
      const availH = pageH - input.margin * 2;
      s = Math.min(availW / dispW, availH / dispH);
    }

    const w = image.width * s;
    const h = image.height * s;
    const page = doc.addPage([pageW, pageH]);
    const cx = pageW / 2;
    const cy = pageH / 2;

    if (swap) {
      // pdf-lib은 (x,y)를 원점으로 회전시킨다: 회전 후 bounding box는
      // θ=-90이면 x∈[0,h]·y∈[-w,0], θ=+90이면 x∈[-h,0]·y∈[0,w].
      // 이걸 페이지 중앙에 오도록 원점을 밀어준다.
      const [x, y] = rotate < 0 ? [cx - h / 2, cy + w / 2] : [cx + h / 2, cy - w / 2];
      page.drawImage(image, { x, y, width: w, height: h, rotate: degrees(rotate) });
    } else {
      // 미러는 원점을 반대쪽 끝으로 옮겨야 페이지 안에서 뒤집힌다.
      // o=1이면 left/bottom + 양수 크기가 되어 기존 동작과 완전히 동일하다.
      const left = (pageW - w) / 2;
      const bottom = (pageH - h) / 2;
      page.drawImage(image, {
        x: mirror[0] > 0 ? left : pageW - left,
        y: mirror[1] > 0 ? bottom : pageH - bottom,
        width: mirror[0] * w,
        height: mirror[1] * h,
      });
    }
  }

  doc.setProducer("TOOLBOX");
  const out = await doc.save();
  return {
    pageCount: input.files.length,
    pageSize: input.pageSize,
    blob: new Blob([out as BlobPart], { type: PDF_MIME }),
    fileName: "images.pdf",
  };
}

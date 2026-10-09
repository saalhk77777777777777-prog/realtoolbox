import { PDFDocument } from "pdf-lib";

/** 실제 동작 검증용 PDF 생성. 텍스트/페이지수를 넣은 유효한 PDF 바이트를 만든다. */
export async function makePdf(
  pageCount = 1,
  opts: { title?: string; author?: string; text?: string } = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(opts.text ?? `page ${i + 1}`, { x: 10, y: 100 });
  }
  doc.setTitle(opts.title ?? "TOOLBOX fixture");
  doc.setAuthor(opts.author ?? "tests");
  doc.setProducer("tests");
  return doc.save();
}

export async function pdfFile(pageCount = 1, opts = {}): Promise<File> {
  const bytes = await makePdf(pageCount, opts);
  return new File([bytes as BlobPart], "fixture.pdf", { type: "application/pdf" });
}

/** 최소 유효 PNG (2×2 빨강). */
export const PNG_2x2_RED = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z4AATAxIYBQMEQAAeNAB0m+P5q0AAAAASUVORK5CYII=",
  ),
  (c) => c.charCodeAt(0),
);
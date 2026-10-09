/**
 * TOOLBOX v0.3.2 — CSV→Chart
 * Canvas 기반 차트 렌더링. dependency 0. 서버 전송 없음.
 * bar/line/pie 지원. scatter/area는 v0.3.3 예정.
 */
import type { ToolError } from "../../../core/types.ts";

export type ChartType = "bar" | "line" | "pie";

export interface ChartInput {
  text: string;
  xColumn: string;
  yColumn: string;
  chartType: ChartType;
}

export interface ChartOutput {
  chartType: ChartType;
  labels: string[];
  values: number[];
  xColumn: string;
  yColumn: string;
  rowCount: number;
}

export const MAX_CHART_CHARS = 1_000_000;

export function validateChart(input: unknown): ToolError | null {
  const v = input as Partial<ChartInput> | null;
  if (
    !v ||
    typeof v.text !== "string" ||
    typeof v.xColumn !== "string" ||
    typeof v.yColumn !== "string" ||
    (v.chartType !== "bar" && v.chartType !== "line" && v.chartType !== "pie")
  ) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "CSV 텍스트, X/Y 열 이름, 차트 타입이 필요합니다.",
      how: "CSV를 입력하고 열과 차트 타입을 선택하세요.",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "CSV가 비어 있습니다.",
      why: "빈 문자열은 처리할 수 없습니다.",
      how: "CSV 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_CHART_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `CSV가 너무 깁니다 (최대 ${MAX_CHART_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "CSV를 나누어 여러 번 처리하세요.",
    };
  }
  return null;
}

export async function processChart(input: ChartInput): Promise<ChartOutput> {
  const lines = input.text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    throw {
      code: "USER_INPUT",
      what: "CSV에 데이터 행이 없습니다.",
      why: "헤더 + 최소 1개 데이터 행이 필요합니다.",
      how: "CSV에 데이터를 추가하세요.",
    };
  }
  const headers = parseCsvLine(lines[0]!);
  const xIdx = headers.indexOf(input.xColumn);
  const yIdx = headers.indexOf(input.yColumn);
  if (xIdx === -1 || yIdx === -1) {
    throw {
      code: "USER_INPUT",
      what: `열을 찾을 수 없습니다: ${xIdx === -1 ? input.xColumn : input.yColumn}`,
      why: "CSV 헤더에 해당 열이 없습니다.",
      how: `헤더: ${headers.join(", ")}`,
    };
  }
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    labels.push(cells[xIdx] ?? "");
    const v = Number(cells[yIdx]);
    if (!Number.isFinite(v)) {
      throw {
        code: "FILE_INVALID",
        what: `Y축 값이 숫자가 아닙니다: "${cells[yIdx]}"`,
        why: `행 ${i + 1}의 "${input.yColumn}" 값이 숫자로 변환되지 않습니다.`,
        how: "숫자 값을 입력하세요.",
      };
    }
    values.push(v);
  }
  return {
    chartType: input.chartType,
    labels,
    values,
    xColumn: input.xColumn,
    yColumn: input.yColumn,
    rowCount: values.length,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

export function renderChart(
  canvas: HTMLCanvasElement,
  data: ChartOutput,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const pad = 40;
  const chartW = W - pad * 2;
  const chartH = H - pad * 2;
  const max = Math.max(...data.values, 1);
  const min = Math.min(...data.values, 0);
  const range = max - min || 1;
  ctx.strokeStyle = "#e5e7eb";
  ctx.strokeRect(pad, pad, chartW, chartH);
  ctx.fillStyle = "#111827";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  if (data.chartType === "bar") {
    const bw = chartW / data.values.length;
    data.values.forEach((v, i) => {
      const bh = ((v - min) / range) * chartH;
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(pad + i * bw + 2, pad + chartH - bh, bw - 4, bh);
      ctx.fillStyle = "#111827";
      ctx.fillText(data.labels[i] ?? "", pad + i * bw + bw / 2, pad + chartH + 16);
    });
  } else if (data.chartType === "line") {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.values.forEach((v, i) => {
      const x = pad + (i / Math.max(data.values.length - 1, 1)) * chartW;
      const y = pad + chartH - ((v - min) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#111827";
    data.labels.forEach((l, i) => {
      const x = pad + (i / Math.max(data.values.length - 1, 1)) * chartW;
      ctx.fillText(l, x, pad + chartH + 16);
    });
  } else if (data.chartType === "pie") {
    const total = data.values.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(chartW, chartH) / 2;
    const colors = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2"];
    let angle = -Math.PI / 2;
    data.values.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2;
      ctx.fillStyle = colors[i % colors.length]!;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fill();
      angle += slice;
    });
  }
  ctx.fillStyle = "#6b7280";
  ctx.textAlign = "left";
  ctx.fillText(`${data.yColumn} (n=${data.rowCount})`, pad, 20);
}

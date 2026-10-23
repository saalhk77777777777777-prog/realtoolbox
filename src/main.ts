/** TOOLBOX v0.16.0 — text, JSON, and log analysis utilities. */
import { APP_VERSION } from "./version.ts";
import { installAdsense } from "./adsense.ts";
import { installTabiEasterEggs } from "./easter-eggs/tabi-easter-eggs.ts";
import { registerFileSizeChecker } from "./tools/file/file-size-checker/manifest.ts";
import { registerFileNameAnalyzer } from "./tools/file/file-name-analyzer/manifest.ts";
import { registerFileSignatureChecker } from "./tools/file/file-signature-checker/manifest.ts";
import { registerDuplicateFinder } from "./tools/file/duplicate-finder/manifest.ts";
import { registerFileChecksum } from "./tools/file/file-checksum/manifest.ts";
import { registerFileEncodingDetector } from "./tools/file/file-encoding-detector/manifest.ts";
import { registerLineEndingDetector } from "./tools/file/line-ending-detector/manifest.ts";
import { registerFileEntropyAnalyzer } from "./tools/file/file-entropy-analyzer/manifest.ts";
import { registerFileContentPreviewer } from "./tools/file/file-content-previewer/manifest.ts";
import { registerBatchFileZipCreator } from "./tools/file/batch-file-zip-creator/manifest.ts";
import { registerZipInspector } from "./tools/file/zip-inspector/manifest.ts";
import { registerApkEditor } from "./tools/file/apk-editor/manifest.ts";
import { registerTextCounter } from "./tools/text/text-counter/manifest.ts";
import { registerBase64 } from "./tools/developer/base64/manifest.ts";
import { registerUrlCoder } from "./tools/developer/url-encoder/manifest.ts";
import { registerTimestamp } from "./tools/developer/timestamp-converter/manifest.ts";
import { registerHash } from "./tools/developer/hash-generator/manifest.ts";
import { registerJson } from "./tools/developer/json-formatter/manifest.ts";
import { registerUuid } from "./tools/developer/uuid-generator/manifest.ts";
import { registerEntity } from "./tools/developer/html-entity/manifest.ts";
import { registerUrlParser } from "./tools/developer/url-parser/manifest.ts";
import { registerJwt } from "./tools/developer/jwt-decoder/manifest.ts";
import { registerRegex } from "./tools/developer/regex-tester/manifest.ts";
import { registerCsv } from "./tools/data/csv-cleaner/manifest.ts";
import { registerChart } from "./tools/data/csv-chart/manifest.ts";
import { registerImageCompressor } from "./tools/image/image-compressor/manifest.ts";
import { registerImageResizer } from "./tools/image/image-resizer/manifest.ts";
import { registerImageConverter } from "./tools/image/image-converter/manifest.ts";
import { registerVideoToWebP } from "./tools/image/video-to-webp/manifest.ts";
import { registerTarget } from "./tools/image/target-size-compressor/manifest.ts";
import { registerColor } from "./tools/image/color-extractor/manifest.ts";
import { register as registerImageMetadataViewer } from "./tools/image/image-metadata-viewer/manifest.ts";
import { register as registerImageGrayscale } from "./tools/image/image-grayscale/manifest.ts";
import { register as registerImageBlur } from "./tools/image/image-blur/manifest.ts";
import { register as registerImagePixelate } from "./tools/image/image-pixelate/manifest.ts";
import { register as registerImageHistogram } from "./tools/image/image-histogram/manifest.ts";
import { register as registerImageDataUri } from "./tools/image/image-data-uri/manifest.ts";
import { registerCropFlip } from "./tools/image/crop-rotate-flip/manifest.ts";
import { registerPdfMeta } from "./tools/pdf/pdf-metadata/manifest.ts";
import { registerPdfMerge } from "./tools/pdf/pdf-merge/manifest.ts";
import { registerPdfSplit } from "./tools/pdf/pdf-split/manifest.ts";
import { registerPdfCompress } from "./tools/pdf/pdf-compress/manifest.ts";
import { registerPdfToImage } from "./tools/pdf/pdf-to-image/manifest.ts";
import { registerPdfText } from "./tools/pdf/pdf-text-extractor/manifest.ts";
import { registerPdfPageReorder } from "./tools/pdf/pdf-page-reorder/manifest.ts";
import { registerPdfPageRotate } from "./tools/pdf/pdf-page-rotate/manifest.ts";
import { registerPdfWatermark } from "./tools/pdf/pdf-watermark/manifest.ts";
import { registerPdfImageExtractor } from "./tools/pdf/pdf-image-extractor/manifest.ts";
import { registerPdfTextSearch } from "./tools/pdf/pdf-text-search/manifest.ts";
import { registerPdfPagePreview } from "./tools/pdf/pdf-page-preview/manifest.ts";
import { registerPdfCompare } from "./tools/pdf/pdf-compare/manifest.ts";
import { registerPdfPageNumberer } from "./tools/pdf/pdf-page-numberer/manifest.ts";
import { registerImageToPdf } from "./tools/pdf/image-to-pdf/manifest.ts";
import { registerCase } from "./tools/text/case-converter/manifest.ts";
import { registerWhitespace } from "./tools/text/whitespace-cleaner/manifest.ts";
import { registerLineSort } from "./tools/text/line-sorter/manifest.ts";
import { registerDuplicate } from "./tools/text/duplicate-line-remover/manifest.ts";
import { registerSlug } from "./tools/text/slug-generator/manifest.ts";
import { registerDiff } from "./tools/text/text-diff/manifest.ts";
import { registerNumberBaseConverter } from "./tools/developer/number-base-converter/manifest.ts";
import { registerHtmlFormatter } from "./tools/developer/html-formatter/manifest.ts";
import { registerJsonToCsv } from "./tools/data/json-to-csv/manifest.ts";
import { registerCsvToJson } from "./tools/data/csv-to-json/manifest.ts";
import { registerJsonMinifier } from "./tools/developer/json-minifier/manifest.ts";
import { registerQueryStringBuilder } from "./tools/developer/query-string-builder/manifest.ts";
import { registerJsonLines } from "./tools/data/json-lines/manifest.ts";
import { registerLineNumberer } from "./tools/text/line-numberer/manifest.ts";
import { registerNumberExtractor } from "./tools/text/number-extractor/manifest.ts";
import { registerUrlExtractor } from "./tools/text/url-extractor/manifest.ts";
import { registerHtmlTagRemover } from "./tools/developer/html-tag-remover/manifest.ts";
import { registerWhitespaceVisualizer } from "./tools/text/whitespace-visualizer/manifest.ts";
import { registerMarkdownTableGenerator } from "./tools/developer/markdown-table-generator/manifest.ts";
import { registerRegexEscape } from "./tools/developer/regex-escape/manifest.ts";
import { registerHtmlEntityDecoder } from "./tools/developer/html-entity-decoder/manifest.ts";
import { registerTextLineNumberer } from "./tools/text/text-line-numberer/manifest.ts";
import { registerTextRepeater } from "./tools/text/text-repeater/manifest.ts";
import { registerTextPrefixSuffix } from "./tools/text/text-prefix-suffix/manifest.ts";
import { registerTextWrap } from "./tools/text/text-wrap/manifest.ts";
import { registerTextToJsonArray } from "./tools/text/text-to-json-array/manifest.ts";
import { registerJsonArrayToLines } from "./tools/text/json-array-to-lines/manifest.ts";
import { registerCharacterFrequency } from "./tools/text/character-frequency/manifest.ts";
import { registerTextReverser } from "./tools/text/text-reverser/manifest.ts";
import { registerWordFrequencyAnalyzer } from "./tools/text/word-frequency-analyzer/manifest.ts";
import { registerSentenceCounter } from "./tools/text/sentence-counter/manifest.ts";
import { registerReadingTimeCalculator } from "./tools/text/reading-time-calculator/manifest.ts";
import { registerLineTrimTool } from "./tools/text/line-trim-tool/manifest.ts";
import { registerIndentUnindent } from "./tools/text/indent-unindent/manifest.ts";
import { registerPrefixSuffixAdder } from "./tools/text/prefix-suffix-adder/manifest.ts";
import { registerNewlineConverter } from "./tools/text/newline-converter/manifest.ts";
import { registerUnicodeInspector } from "./tools/text/unicode-inspector/manifest.ts";
import { registerJsonToXml } from "./tools/data/json-to-xml/manifest.ts";
import { registerXmlToJson } from "./tools/data/xml-to-json/manifest.ts";
import { registerCsvTranspose } from "./tools/data/csv-transpose/manifest.ts";
import { registerCsvFilter } from "./tools/data/csv-filter/manifest.ts";
import { registerCsvSorter } from "./tools/data/csv-sorter/manifest.ts";
import { registerCsvColumnSelector } from "./tools/data/csv-column-selector/manifest.ts";
import { registerJsonPathQuery } from "./tools/data/json-path-query/manifest.ts";
import { registerJsonFlattenUnflatten } from "./tools/data/json-flatten-unflatten/manifest.ts";
import { registerExifRemover } from "./tools/image/exif-remover/manifest.ts";
import { registerYamlFormatter } from "./tools/developer/yaml-formatter/manifest.ts";
import { registerXmlFormatter } from "./tools/developer/xml-formatter/manifest.ts";
import { registerCssFormatterMinifier } from "./tools/developer/css-formatter-minifier/manifest.ts";
import { registerJsTsFormatter } from "./tools/developer/js-ts-formatter/manifest.ts";
import { registerCronExpressionGenerator } from "./tools/developer/cron-expression-generator/manifest.ts";
import { registerColorConverter } from "./tools/developer/color-converter/manifest.ts";
import { registerHttpStatusAnalyzer } from "./tools/developer/http-status-analyzer/manifest.ts";
import { registerDateCalculator } from "./tools/utility/date-calculator/manifest.ts";
import { registerUnitConverter } from "./tools/utility/unit-converter/manifest.ts";
import { registerPasswordGenerator } from "./tools/developer/password-generator/manifest.ts";
import { registerRandomNumberGenerator } from "./tools/utility/random-number-generator/manifest.ts";
import { registerPercentageCalculator } from "./tools/utility/percentage-calculator/manifest.ts";
import { registerAspectRatioCalculator } from "./tools/utility/aspect-ratio-calculator/manifest.ts";
import { registerLoremIpsumGenerator } from "./tools/text/lorem-ipsum-generator/manifest.ts";
import { registerPxRemConverter } from "./tools/developer/px-rem-converter/manifest.ts";
import { registerRomanNumeralConverter } from "./tools/developer/roman-numeral-converter/manifest.ts";
import { registerBinaryTextConverter } from "./tools/developer/binary-text-converter/manifest.ts";
import { registerTipCalculator } from "./tools/utility/tip-calculator/manifest.ts";
import { registerLoanCalculator } from "./tools/utility/loan-calculator/manifest.ts";
import { registerColorContrastChecker } from "./tools/design/color-contrast-checker/manifest.ts";
import { registerUuidValidator } from "./tools/developer/uuid-validator/manifest.ts";
import { registerJsonPathFinder } from "./tools/developer/json-path-finder/manifest.ts";
import { registerMarkdownLinkExtractor } from "./tools/text/markdown-link-extractor/manifest.ts";
import { registerCsvDelimiterDetector } from "./tools/data/csv-delimiter-detector/manifest.ts";
import { registerMimeTypeChecker } from "./tools/file/mime-type-checker/manifest.ts";
import { registerGitignoreGenerator } from "./tools/developer/gitignore-generator/manifest.ts";
import { registerSemverParser } from "./tools/developer/semver-parser/manifest.ts";
import { registerUnixPermissionCalculator } from "./tools/developer/unix-permission-calculator/manifest.ts";
import { registerHtmlEscapeConverter } from "./tools/developer/html-escape-converter/manifest.ts";
import { registerCssGradientGenerator } from "./tools/design/css-gradient-generator/manifest.ts";
import { registerJsonSchemaInfer } from "./tools/data/json-schema-infer/manifest.ts";
import { registerRegexReplace } from "./tools/text/regex-replace/manifest.ts";
import { registerEnvFileValidator } from "./tools/developer/env-file-validator/manifest.ts";
import { registerMarkdownTocGenerator } from "./tools/developer/markdown-toc-generator/manifest.ts";
import { registerSqlInClauseGenerator } from "./tools/developer/sql-in-clause-generator/manifest.ts";
import { registerJsonDiff } from "./tools/data/json-diff/manifest.ts";
import { registerCsvColumnStats } from "./tools/data/csv-column-stats/manifest.ts";
import { registerTextHexConverter } from "./tools/developer/text-hex-converter/manifest.ts";
import { registerDockerfileGenerator } from "./tools/developer/dockerfile-generator/manifest.ts";
import { registerDockerComposeGenerator } from "./tools/developer/docker-compose-generator/manifest.ts";
import { registerJsonMockDataGenerator } from "./tools/data/json-mock-data-generator/manifest.ts";
import { registerJsonToTypeScript } from "./tools/data/json-to-typescript/manifest.ts";
import { registerHtmlTableToCsv } from "./tools/data/html-table-to-csv/manifest.ts";
import { registerCsvToMarkdownTable } from "./tools/data/csv-to-markdown-table/manifest.ts";
import { registerCssBoxShadowGenerator } from "./tools/design/css-box-shadow-generator/manifest.ts";
import { registerNginxConfigGenerator } from "./tools/developer/nginx-config-generator/manifest.ts";
import { registerGitCommitMessageBuilder } from "./tools/developer/git-commit-message-builder/manifest.ts";
import { registerJsonArrayFieldPicker } from "./tools/data/json-array-field-picker/manifest.ts";
import { registerSvgMinifier } from "./tools/developer/svg-minifier/manifest.ts";
import { registerJsonToZod } from "./tools/data/json-to-zod/manifest.ts";
import { registerJsonKeySorter } from "./tools/data/json-key-sorter/manifest.ts";
import { registerTsvToCsv } from "./tools/data/tsv-to-csv/manifest.ts";
import { registerUrlListValidator } from "./tools/developer/url-list-validator/manifest.ts";
import { registerHttpHeaderFormatter } from "./tools/developer/http-header-formatter/manifest.ts";
import { registerHtmlAttributeExtractor } from "./tools/developer/html-attribute-extractor/manifest.ts";
import { registerJsonToYaml } from "./tools/data/json-to-yaml/manifest.ts";
import { registerCssClampGenerator } from "./tools/design/css-clamp-generator/manifest.ts";
import { registerCssMediaQueryGenerator } from "./tools/design/css-media-query-generator/manifest.ts";
import { registerCsvRowFilter } from "./tools/data/csv-row-filter/manifest.ts";
import { registerHtmlToText } from "./tools/data/html-to-text/manifest.ts";
import { registerXmlEscape } from "./tools/developer/xml-escape/manifest.ts";
import { registerUrlQueryBuilder } from "./tools/developer/url-query-builder/manifest.ts";
import { registerUrlQueryParser } from "./tools/developer/url-query-parser/manifest.ts";
import { registerJsonFlattener } from "./tools/data/json-flattener/manifest.ts";
import { registerMarkdownHeadingExtractor } from "./tools/text/markdown-heading-extractor/manifest.ts";
import { registerCsvRowCounter } from "./tools/data/csv-row-counter/manifest.ts";
import { registerJsonArraySorter } from "./tools/data/json-array-sorter/manifest.ts";
import { registerHtmlLinkExtractor } from "./tools/developer/html-link-extractor/manifest.ts";
import { registerJsonStringEscaper } from "./tools/developer/json-string-escaper/manifest.ts";
import { registerCsvToTsv } from "./tools/data/csv-to-tsv/manifest.ts";
import { registerCssSpecificityCalculator } from "./tools/design/css-specificity-calculator/manifest.ts";
import { registerJsonSchemaCompatibility } from "./tools/data/json-schema-compatibility/manifest.ts";
import { registerBitFieldInspector } from "./tools/developer/bit-field-inspector/manifest.ts";
import { registerRetryBackoffSimulator } from "./tools/utility/retry-backoff-simulator/manifest.ts";
import { registerLogTimelineCorrelator } from "./tools/developer/log-timeline-correlator/manifest.ts";
import { registerCurlRequestBuilder } from "./tools/developer/curl-request-builder/manifest.ts";
import { registerGitDiffAnalyzer } from "./tools/developer/git-diff-analyzer/manifest.ts";
import { registerCspHeaderBuilder } from "./tools/developer/csp-header-builder/manifest.ts";
import { registerRobotsTxtBuilder } from "./tools/developer/robots-txt-builder/manifest.ts";
import { registerJsonPatchBuilder } from "./tools/developer/json-patch-builder/manifest.ts";
import { getTool, getToolBySlug, listTools } from "./core/toolRegistry.ts";
import { applyMeta } from "./seo/meta.ts";
import { track } from "./analytics/analytics.ts";
import { searchTools } from "./search/searchIndex.ts";

registerJsonSchemaCompatibility();
registerBitFieldInspector();
registerRetryBackoffSimulator();
registerLogTimelineCorrelator();
registerCurlRequestBuilder();
registerGitDiffAnalyzer();
registerCspHeaderBuilder();
registerRobotsTxtBuilder();
registerJsonPatchBuilder();
registerFileSizeChecker();
registerFileNameAnalyzer();
registerFileSignatureChecker();
registerDuplicateFinder();
registerFileChecksum();
registerFileEncodingDetector();
registerLineEndingDetector();
registerFileEntropyAnalyzer();
registerFileContentPreviewer();
registerBatchFileZipCreator();
registerZipInspector();
registerApkEditor();
registerTextCounter();
registerBase64();
registerUrlCoder();
registerTimestamp();
registerHash();
registerJson();
registerUuid();
registerEntity();
registerUrlParser();
registerJwt();
registerRegex();
registerCsv();
registerChart();
registerImageCompressor();
registerImageResizer();
registerImageConverter();
registerVideoToWebP();
registerTarget();
registerColor();
registerImageMetadataViewer();
registerImageGrayscale();
registerImageBlur();
registerImagePixelate();
registerImageHistogram();
registerImageDataUri();
registerCropFlip();
registerPdfMeta();
registerPdfMerge();
registerPdfSplit();
registerPdfCompress();
registerPdfToImage();
registerPdfText();
registerPdfPageReorder();
registerPdfPageRotate();
registerPdfWatermark();
registerPdfImageExtractor();
registerPdfTextSearch();
registerPdfPagePreview();
registerPdfCompare();
registerPdfPageNumberer();
registerImageToPdf();
registerCase();
registerWhitespace();
registerLineSort();
registerDuplicate();
registerSlug();
registerDiff();
registerWhitespaceVisualizer();
registerHtmlTagRemover();
registerUrlExtractor();
registerNumberExtractor();
registerLineNumberer();
registerJsonLines();
registerQueryStringBuilder();
registerJsonMinifier();
registerCsvToJson();
registerJsonToCsv();
registerHtmlFormatter();
registerNumberBaseConverter();
registerMarkdownTableGenerator();
registerRegexEscape();
registerHtmlEntityDecoder();
registerTextLineNumberer();
registerTextRepeater();
registerTextPrefixSuffix();
registerTextWrap();
registerTextToJsonArray();
registerJsonArrayToLines();
registerCharacterFrequency();
registerTextReverser();
registerUnicodeInspector();
registerUnitConverter();
registerDateCalculator();
registerHttpStatusAnalyzer();
registerColorConverter();
registerCronExpressionGenerator();
registerJsTsFormatter();
registerCssFormatterMinifier();
registerXmlFormatter();
registerYamlFormatter();
registerExifRemover();
registerJsonFlattenUnflatten();
registerJsonPathQuery();
registerCsvColumnSelector();
registerCsvSorter();
registerCsvFilter();
registerCsvTranspose();
registerXmlToJson();
registerJsonToXml();
registerNewlineConverter();
registerPrefixSuffixAdder();
registerIndentUnindent();
registerLineTrimTool();
registerReadingTimeCalculator();
registerSentenceCounter();
registerWordFrequencyAnalyzer();

registerTipCalculator();
registerLoanCalculator();
registerColorContrastChecker();
registerUuidValidator();
registerJsonPathFinder();
registerMarkdownLinkExtractor();
registerCsvDelimiterDetector();
registerMimeTypeChecker();
registerGitignoreGenerator();
registerSemverParser();
registerUnixPermissionCalculator();
registerHtmlEscapeConverter();
registerCssGradientGenerator();
registerJsonSchemaInfer();
registerRegexReplace();
registerEnvFileValidator();
registerMarkdownTocGenerator();
registerSqlInClauseGenerator();
registerJsonDiff();
registerCsvColumnStats();
registerTextHexConverter();
registerDockerfileGenerator();
registerDockerComposeGenerator();
registerJsonMockDataGenerator();
registerJsonToTypeScript();
registerHtmlTableToCsv();
registerCsvToMarkdownTable();
registerCssBoxShadowGenerator();
registerNginxConfigGenerator();
registerGitCommitMessageBuilder();
registerJsonArrayFieldPicker();
registerSvgMinifier();
registerJsonToZod();
registerJsonKeySorter();
registerTsvToCsv();
registerUrlListValidator();
registerHttpHeaderFormatter();
registerHtmlAttributeExtractor();
registerJsonToYaml();
registerCssClampGenerator();
registerCssMediaQueryGenerator();
registerCsvRowFilter();
registerHtmlToText();
registerXmlEscape();
registerUrlQueryBuilder();
registerUrlQueryParser();
registerJsonFlattener();
registerCssSpecificityCalculator();
registerCsvToTsv();
registerJsonStringEscaper();
registerHtmlLinkExtractor();
registerJsonArraySorter();
registerCsvRowCounter();
registerMarkdownHeadingExtractor();


registerPasswordGenerator();
registerRandomNumberGenerator();
registerPercentageCalculator();
registerAspectRatioCalculator();
registerLoremIpsumGenerator();
registerPxRemConverter();
registerRomanNumeralConverter();
registerBinaryTextConverter();
const app = document.getElementById("app")!;
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const appPath = (path: string) => path.startsWith(BASE_PATH + "/") || path === BASE_PATH ? (path.slice(BASE_PATH.length) || "/") : path;
const publicPath = (path: string) => `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  file: { label: "파일", icon: "▣" }, image: { label: "이미지", icon: "◈" }, pdf: { label: "PDF", icon: "▤" },
  data: { label: "데이터", icon: "◆" }, developer: { label: "개발자", icon: "⌘" }, text: { label: "텍스트", icon: "T" }, utility: { label: "유틸리티", icon: "⚙" },
};
const FAVORITES_KEY = "toolbox:favorites:v1";
const RECENTS_KEY = "toolbox:recents:v1";
function readStoredSlugs(key: string): string[] { try { const v = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } }
function writeStoredSlugs(key: string, values: string[]): void { try { localStorage.setItem(key, JSON.stringify(values.slice(0, 12))); } catch { /* private mode */ } }
function categoryLabel(category: string): string { return CATEGORY_META[category]?.label ?? category; }
function categoryIcon(category: string): string { return CATEGORY_META[category]?.icon ?? "•"; }
function toolCard(t: ReturnType<typeof listTools>[number]): string {
  const favorite = readStoredSlugs(FAVORITES_KEY).includes(t.slug);
  return `<article class="tool-card"><a class="tool-card-main" href="/tools/${t.slug}" data-link><span class="tool-icon">${categoryIcon(t.category)}</span><span class="tool-card-copy"><strong>${t.title}</strong><span>${t.description}</span></span><span class="tool-arrow">→</span></a><button class="favorite-btn ${favorite ? "is-favorite" : ""}" type="button" data-favorite="${t.slug}" aria-label="${favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}">${favorite ? "★" : "☆"}</button></article>`;
}
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  document.querySelector("header.top")?.classList.toggle("scrolled", y > 80);
}, { passive: true });

function shell(inner: string): string {
  return `
  <header class="top"><div class="top-inner"><a class="brand" href="/" data-link data-tabi-brand><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><path d="M6 10.5 16 5l10 5.5v11L16 27 6 21.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 10.8 16 16l9.5-5.2M16 16v10.5M11 7.8l10 5.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 18.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><span>TOOLBOX</span><small>v${APP_VERSION}</small></a><div class="global-search"><span class="search-symbol">⌕</span><input type="search" id="gs" placeholder="어떤 작업이 필요하신가요? 예: JPG 압축, JSON 정리" aria-label="도구 검색" autocomplete="off" /><kbd>/</kbd></div><div class="top-actions"><a href="/" data-link class="top-link">홈</a><a href="/about" data-link class="top-link">소개</a></div></div><div id="gsout" class="search-popover" aria-live="polite"></div></header>
  <main class="wrap" id="main">${inner}</main>
  <footer class="site"><div class="wrap footer-inner"><div><strong>TOOLBOX</strong><span class="muted" data-tabi-footer-secret> · Local-first 웹 작업공간</span></div><button class="tabi-no-meaning" type="button" data-tabi-no-meaning>아무 의미 없는 버튼</button><nav><a href="/about" data-link>소개</a><a href="/privacy" data-link>개인정보</a><a href="/terms" data-link>약관</a><a href="/contact" data-link>문의</a></nav></div></footer>
  <div class="feedback-overlay" id="feedback-overlay" hidden><section class="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title" aria-describedby="feedback-description"><button class="feedback-close" type="button" data-feedback-dismiss aria-label="닫기">×</button><span class="eyebrow">TOOLBOX · EARLY ACCESS</span><h2 id="feedback-title">툴박스, 써보니까 어때요?</h2><p id="feedback-description">초기 버전을 함께 다듬고 있어요. 불편했던 점이나 새로 있으면 좋을 도구를 알려주세요. 의견은 다음 업데이트의 도구 제작 목록에 반영할게요.</p><form id="feedback-form" name="toolbox-feedback" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="toolbox-feedback"><input type="hidden" name="subject" value="TOOLBOX 사용자 피드백"><p class="feedback-honeypot"><label>비워 두세요 <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><label class="feedback-label" for="feedback-pain">사용하면서 불편했던 점</label><textarea id="feedback-pain" name="pain-points" rows="3" placeholder="예: 원하는 도구를 찾기 어려워요 / 버튼이 작아요"></textarea><label class="feedback-label" for="feedback-tools">생기면 좋을 것 같은 도구</label><textarea id="feedback-tools" name="suggested-tools" rows="3" placeholder="예: 이미지 여러 장 이름 한꺼번에 바꾸기"></textarea><label class="feedback-label" for="feedback-extra">그 외 의견 (선택)</label><textarea id="feedback-extra" name="other-feedback" rows="2" placeholder="자유롭게 적어주세요"></textarea><label class="feedback-label" for="feedback-email">답변 받을 이메일 (선택)</label><input id="feedback-email" name="email" type="email" placeholder="you@example.com" autocomplete="email"><div class="feedback-actions"><button class="secondary" type="button" data-feedback-dismiss>다음에 할게요</button><button type="submit" id="feedback-submit">의견 보내기</button></div><p class="feedback-status" id="feedback-status" role="status" aria-live="polite"></p><small>의견과 선택 입력한 이메일만 전송됩니다. 파일 내용은 보내지 마세요.</small></form></section></div>`;
}

function bindGlobal(): void {
  app.querySelectorAll("[data-link]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = (a as HTMLAnchorElement).getAttribute("href")!;
      e.preventDefault();
      navigate(href);
    });
  });
  const input = document.querySelector<HTMLInputElement>("#gs")!;
  const out = document.querySelector<HTMLDivElement>("#gsout")!;
  const doSearch = () => {
    const q = input.value;
    track("search", { qLength: q.length });
    const res = searchTools(q);
    out.innerHTML =
      res.length === 0
        ? `<div class="search-empty"><strong>검색 결과가 없어</strong><span>다른 키워드나 파일 형식으로 검색해봐.</span></div>`
        : `<div class="search-results-head"><strong>${res.length}개 결과</strong><span>상위 8개 표시</span></div><div class="search-results">${res.slice(0, 8).map((r) => `<a href="/tools/${r.slug}" data-link><span class="search-result-icon">${categoryIcon(r.category)}</span><span><strong>${r.title}</strong><small>${categoryLabel(r.category)} · ${getToolBySlug(r.slug)?.description ?? '도구 열기'}</small></span><b>→</b></a>`).join("")}</div>`;
    out.querySelectorAll("[data-link]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        track("search_result_click", {});
        navigate((a as HTMLAnchorElement).getAttribute("href")!);
      });
    });
  };
  input.addEventListener("input", () => {
    if (input.value.trim()) doSearch();
    else out.innerHTML = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
    }
  });
}

function bindWorkspace(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-favorite]").forEach((button) => button.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const slug = button.dataset.favorite!;
    const values = readStoredSlugs(FAVORITES_KEY);
    writeStoredSlugs(FAVORITES_KEY, values.includes(slug) ? values.filter((v) => v !== slug) : [slug, ...values]);
    void render();
  }));
}

const FEEDBACK_SEEN_KEY = "toolbox:feedback:seen-tools:v1";
const FEEDBACK_DISMISSED_KEY = "toolbox:feedback:dismissed:v1";
function safeReadStringArray(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
  catch { return []; }
}
function recordFeedbackToolUse(slug: string): void {
  const seen = safeReadStringArray(FEEDBACK_SEEN_KEY);
  if (!seen.includes(slug)) {
    seen.push(slug);
    try { localStorage.setItem(FEEDBACK_SEEN_KEY, JSON.stringify(seen)); } catch { /* storage may be unavailable */ }
  }
  let dismissed = false;
  try { dismissed = localStorage.getItem(FEEDBACK_DISMISSED_KEY) === "1"; } catch { /* storage may be unavailable */ }
  if (seen.length >= 3 && !dismissed) {
    window.setTimeout(() => {
      const overlay = document.getElementById("feedback-overlay");
      if (overlay && !overlay.hidden) return;
      if (overlay) { overlay.hidden = false; document.body.classList.add("feedback-open"); document.getElementById("feedback-pain")?.focus(); }
    }, 450);
  }
}
function installFeedback(): void {
  const overlay = document.getElementById("feedback-overlay");
  const form = document.getElementById("feedback-form") as HTMLFormElement | null;
  if (!overlay || !form) return;
  overlay.querySelectorAll("[data-feedback-dismiss]").forEach((button) => button.addEventListener("click", () => {
    overlay.hidden = true; document.body.classList.remove("feedback-open");
    try { localStorage.setItem(FEEDBACK_DISMISSED_KEY, "1"); } catch { /* storage may be unavailable */ }
  }));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.querySelector<HTMLButtonElement>("[data-feedback-dismiss]")?.click();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = document.getElementById("feedback-submit") as HTMLButtonElement | null;
    const status = document.getElementById("feedback-status");
    const formData = new FormData(form);
    const pain = String(formData.get("pain-points") ?? "").trim();
    const suggestions = String(formData.get("suggested-tools") ?? "").trim();
    const extra = String(formData.get("other-feedback") ?? "").trim();
    if (!pain && !suggestions && !extra) {
      if (status) status.textContent = "불편했던 점이나 추가 도구 아이디어를 하나만 적어줘도 좋아요.";
      return;
    }
    if (submit) { submit.disabled = true; submit.textContent = "보내는 중…"; }
    if (status) status.textContent = "";
    try {
      const response = await fetch(publicPath("/__forms.html"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (status) status.textContent = "소중한 의견 고마워요! 다음 업데이트 도구 후보로 모아둘게요. 🩵";
      try { localStorage.setItem(FEEDBACK_DISMISSED_KEY, "1"); } catch { /* storage may be unavailable */ }
      window.setTimeout(() => { overlay.hidden = true; document.body.classList.remove("feedback-open"); }, 1400);
    } catch (error) {
      console.error("TOOLBOX feedback submission failed", error);
      if (status) status.textContent = "전송하지 못했어요. 잠시 후 다시 시도하거나 문의 페이지 이메일로 보내주세요.";
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = "의견 보내기"; }
    }
  });
}

export function navigate(path: string): void {
  const target = path.startsWith(BASE_PATH + "/") || path === BASE_PATH ? path : publicPath(path);
  history.pushState({}, "", target);
  render();
}

function homeView(): string {
  const category = new URLSearchParams(location.search).get("category");
  const allTools = listTools();
  const tools = category && category !== "all" && category !== "favorite" ? allTools.filter((t) => t.category === category) : allTools;
  const counts = Object.fromEntries(Object.keys(CATEGORY_META).map((c) => [c, allTools.filter((t) => t.category === c).length]));
  const favorites = readStoredSlugs(FAVORITES_KEY).map((slug) => getToolBySlug(slug)).filter(Boolean);
  const recents = readStoredSlugs(RECENTS_KEY).map((slug) => getToolBySlug(slug)).filter(Boolean);
  const featured = ["image-compressor", "json-formatter", "file-size-checker", "pdf-merge", "csv-cleaner", "regex-tester"].map((slug) => getToolBySlug(slug)).filter(Boolean);
  const visible = category === "favorite" ? favorites : tools;
  return `
    <div class="workspace-layout"><aside class="sidebar"><div class="sidebar-section"><div class="sidebar-label">도구 모음</div><a class="side-link ${!category ? "active" : ""}" href="/" data-link><span>⌂</span>전체 도구 <b>${allTools.length}</b></a><a class="side-link ${category === "favorite" ? "active" : ""}" href="/?category=favorite" data-link><span>★</span>즐겨찾기 <b>${favorites.length}</b></a></div><div class="sidebar-section"><div class="sidebar-label">분류</div>${Object.entries(CATEGORY_META).map(([key, meta]) => `<a class="side-link ${category === key ? "active" : ""}" href="/?category=${key}" data-link><span>${meta.icon}</span>${meta.label}<b>${counts[key]}</b></a>`).join("")}</div></aside>
      <section class="workspace-main">${category === "favorite" ? `<div class="page-heading"><span class="eyebrow">즐겨찾기</span><h1>즐겨찾기</h1><p>저장해 둔 도구를 모아봤습니다.</p></div>` : category ? `<div class="page-heading"><span class="eyebrow">${categoryLabel(category)}</span><h1>${categoryLabel(category)} 도구</h1><p>${tools.length}개의 도구가 있습니다. 필요한 작업을 선택해 보세요.</p></div>` : ""}
        ${!category && favorites.length ? `<section class="tool-section"><div class="section-title"><div><h2>★ 즐겨찾기</h2><span>자주 사용하는 도구를 모았습니다</span></div><a href="/?category=favorite" data-link>전체 보기 →</a></div><div class="tool-grid compact">${favorites.slice(0, 4).map((t) => toolCard(t!)).join("")}</div></section>` : ""}
        ${!category && !favorites.length ? `<section class="tool-section"><div class="section-title"><div><h2>빠른 시작</h2><span>필요한 작업을 선택해 보세요</span></div></div><div class="tool-grid compact">${featured.map((t) => toolCard(t!)).join("")}</div></section>` : ""}
        ${!category && recents.length ? `<section class="tool-section"><div class="section-title"><div><h2>최근 사용</h2><span>최근에 사용한 도구입니다</span></div></div><div class="tool-grid compact">${recents.slice(0, 4).map((t) => toolCard(t!)).join("")}</div></section>` : ""}
        <section class="tool-section all-tools-section"><div class="section-title"><div><h2>${category === "favorite" ? "즐겨찾기" : category ? `${categoryLabel(category)} 도구` : "전체 도구"}</h2><span>${visible.length}개의 도구</span></div><div class="view-note">검색창에서 도구를 찾아보세요</div></div><div class="tool-grid">${visible.map((t) => toolCard(t!)).join("") || `<div class="empty-state"><strong>저장한 도구가 없습니다.</strong><span>도구 카드의 ☆를 눌러 즐겨찾기에 추가하세요.</span></div>`}</div></section>
      </section></div>`;
}

function staticView(h1: string, body: string): string {
  return `<h1>${h1}</h1>${body}`;
}

async function toolView(slug: string): Promise<string> {
  const tool = getToolBySlug(slug);
  if (!tool) return staticView("404 — 도구를 찾을 수 없습니다", `<p><a href="/" data-link>홈으로</a></p>`);
  applyMeta({
    title: `${tool.title} | 무료 온라인 도구 - TOOLBOX`,
    description: `${tool.description} 브라우저에서 무료로 사용하는 ${categoryLabel(tool.category)} 도구입니다.`,
    canonical: `/tools/${tool.slug}`,
    h1: tool.title,
    keywords: [...new Set([tool.title, ...tool.keywords, categoryLabel(tool.category), "무료 온라인 도구", "브라우저 도구"])].slice(0, 12),
  });
  track("tool_open", { tool: tool.id });
  return `
    <div class="tool-page"><a class="back-link" href="/?category=${tool.category}" data-link>← ${categoryLabel(tool.category)}로 돌아가기</a><div class="tool-heading"><div><div class="tool-breadcrumb"><span>${categoryIcon(tool.category)}</span>${categoryLabel(tool.category)}</div><h1>${tool.title}</h1><p>${tool.description}</p></div><button class="tool-favorite-large ${readStoredSlugs(FAVORITES_KEY).includes(tool.slug) ? "is-favorite" : ""}" type="button" data-favorite="${tool.slug}">★ 즐겨찾기</button></div><div class="tool-meta"><span class="local-badge"><i></i>${tool.localProcessing ? "브라우저에서 처리 · 파일 업로드 없음" : "서버 처리 필요"}</span><span>입력: ${tool.inputTypes.join(", ")}</span></div><div id="tool-mount" class="tool-mount"></div><section class="related-section"><div class="section-title"><div><h2>같이 쓰면 좋은 도구</h2><span>함께 사용하기 좋은 도구입니다</span></div></div><div class="tool-grid compact">${tool.relatedTools.map((rid) => getTool(rid)).filter(Boolean).map((t) => toolCard(t!)).join("") || `<p class="muted">아직 연결된 관련 도구가 없습니다.</p>`}</div></section></div>`;
}

export async function render(): Promise<void> {
  const path = appPath(location.pathname);
  let inner = "";
  if (path === "/") {
    applyMeta({
      title: "무료 온라인 도구 모음 | 파일·이미지·PDF·JSON·CSV 변환 - TOOLBOX",
      description: "설치 없이 브라우저에서 파일 관리, 이미지 압축·변환, PDF 편집, JSON·CSV 변환, 텍스트 정리와 개발자 도구를 무료로 사용하세요. 민감한 파일은 가능한 한 브라우저 안에서 처리합니다.",
      canonical: "/",
      h1: "TOOLBOX",
      keywords: ["무료 온라인 도구", "온라인 유틸리티", "파일 변환", "파일 크기 확인", "이미지 압축", "이미지 변환", "PDF 도구", "JSON 포맷터", "CSV 변환", "텍스트 도구", "개발자 도구", "브라우저 도구"],
    });
    track("page_view", { path });
    inner = homeView();
  } else if (path.startsWith("/tools/")) {
    track("page_view", { path });
    inner = await toolView(path.replace("/tools/", ""));
  } else if (path === "/about") {
    applyMeta({ title: "소개 | TOOLBOX", description: "TOOLBOX는 Local-first 범용 웹 작업공간입니다.", canonical: "/about", h1: "소개" });
    inner = staticView("소개", `<p>TOOLBOX는 파일·이미지·PDF·데이터·텍스트 작업을 브라우저 하나에서 처리하는 Local-first 작업공간입니다.</p>`);
  } else if (path === "/privacy") {
    applyMeta({ title: "개인정보처리방침 | TOOLBOX", description: "TOOLBOX 개인정보 처리 및 로컬 처리 원칙.", canonical: "/privacy", h1: "개인정보" });
    inner = staticView("개인정보처리방침", `<ul><li>로컬 처리 우선: 지원 도구의 파일은 가능한 한 브라우저 안에서 처리하며, 파일 내용은 분석을 위해 서버로 전송하지 않습니다.</li><li>수집하지 않는 정보: 도구가 처리하는 파일 내용, 비밀번호, 토큰.</li><li>Analytics: 최소 사용 이벤트를 수집할 수 있습니다.</li><li>광고: Google AdSense를 활성화하면 Google 및 광고 파트너가 쿠키 또는 유사 기술을 사용해 광고를 제공·측정할 수 있습니다. 광고 개인 최적화와 데이터 사용은 Google 광고 설정 및 개인정보 정책을 확인하세요.</li><li>문의: /contact 경로를 이용하세요.</li></ul>`);
  } else if (path === "/terms") {
    applyMeta({ title: "이용약관 | TOOLBOX", description: "TOOLBOX 이용약관.", canonical: "/terms", h1: "이용약관" });
    inner = staticView("이용약관", `<p>도구 결과는 참고용이며, 중요한 파일은 원본을 보관하세요. 악성 파일 검사를 우회하는 용도로 사용하지 마세요.</p>`);
  } else if (path === "/contact") {
    applyMeta({ title: "문의 | TOOLBOX", description: "오류·정책·권리 관련 문의.", canonical: "/contact", h1: "문의" });
    inner = staticView("문의", `<section class="contact-card"><p>도구 오류, 개선 제안, 새로운 도구 요청은 이메일로 보내주세요.</p><p><strong>이메일</strong><br><a href="mailto:saalhk77777777777777@gmail.com">saalhk77777777777777@gmail.com</a></p><a class="contact-mail-button" href="mailto:saalhk77777777777777@gmail.com?subject=TOOLBOX%20문의">✉ 메일로 문의하기</a><p class="muted">오류 제보 시 사용 브라우저, 도구 URL, 오류 메시지를 함께 보내주면 확인하기 쉬워요. 파일 내용이나 비밀번호 등 민감한 정보는 보내지 마세요.</p></section>`);
  } else {
    inner = staticView("404", `<p>페이지를 찾을 수 없습니다. <a href="/" data-link>홈으로</a></p>`);
  }
  const html = BASE_PATH ? shell(inner).replace(/(href|src)="\/(?!\/)/g, `$1="${BASE_PATH}/`) : shell(inner);
  app.innerHTML = html;
  bindGlobal();
  bindWorkspace();
  installFeedback();
  installAdsense();
  installTabiEasterEggs();

  // mount tool UI
  if (path.startsWith("/tools/")) {
    const slug = path.replace("/tools/", "");
    const tool = getToolBySlug(slug);
    if (tool) {
      const mount = document.getElementById("tool-mount")!;
      try {
        const mod = await tool.load();
        mod.render(mount);
        const recent = readStoredSlugs(RECENTS_KEY).filter((s) => s !== tool.slug);
        writeStoredSlugs(RECENTS_KEY, [tool.slug, ...recent]);
        recordFeedbackToolUse(tool.slug);
      } catch (error) {
        console.error("TOOLBOX tool load failed", error);
        mount.innerHTML = `<div class="error"><strong>도구를 불러오지 못했습니다.</strong><p>일시적인 브라우저 오류일 수 있습니다. 페이지를 새로고침한 뒤 다시 시도하세요.</p></div>`;
      }
    }
  }
  // keyboard: "/" focuses search, Esc closes
  document.onkeydown = (e) => {
    if (e.key === "/" && (document.activeElement?.tagName !== "INPUT")) {
      e.preventDefault();
      document.getElementById("gs")?.focus();
    }
  };
}

// TOOLBOX v0.14.67 — feedback collection and responsive UI scale.
try {
  const redirectedPath = sessionStorage.getItem("toolbox:github-pages-redirect");
  if (redirectedPath) {
    sessionStorage.removeItem("toolbox:github-pages-redirect");
    if (redirectedPath.startsWith("/") && !redirectedPath.startsWith("//")) {
      history.replaceState({}, "", redirectedPath);
    }
  }
} catch {
  // Private browsing/storage restrictions should not prevent the app from starting.
}

window.addEventListener("popstate", () => void render());
void render();
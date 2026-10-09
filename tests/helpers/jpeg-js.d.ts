/**
 * jpeg-js는 타입을 제공하지 않는다. fixture 생성/검증에 쓰는 최소 표면만 선언한다.
 */
declare module "jpeg-js" {
  export interface EncodedJpeg {
    data: Buffer;
    width: number;
    height: number;
  }
  export interface DecodedImage {
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
  }
  export interface EncodeOptions {
    width: number;
    height: number;
    data: Uint8Array | Uint8ClampedArray;
    quality?: number;
    useTArray?: boolean;
    format?: unknown;
  }
  export interface DecodeOptions {
    useTArray?: boolean;
    formatAsRGBA?: boolean;
    tolerantDecoding?: boolean;
  }
  export function encode(options: EncodeOptions): EncodedJpeg;
  export function decode(jpegData: Uint8Array, options?: DecodeOptions): DecodedImage;
}

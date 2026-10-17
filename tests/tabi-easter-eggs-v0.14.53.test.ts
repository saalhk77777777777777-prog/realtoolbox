import { describe, expect, it } from "vitest";
import { getNoMeaningState } from "../src/easter-eggs/tabi-easter-eggs.ts";

describe("TOOLBOX v0.14.74 — Tabi Easter Egg click progression", () => {
  it("starts as a completely meaningless button", () => {
    expect(getNoMeaningState(0)).toEqual({
      clicks: 0,
      message: "아무 의미 없는 버튼",
      unlocked: false,
      finished: false,
    });
  });

  it.each([
    [10, "아무 의미 없다니깐요"],
    [30, "계속할 거예요?"],
    [50, "그만해요"],
    [51, "그만하라고"],
    [61, "진짜 궁금해요?"],
    [64, "진짜?"],
  ])("shows the correct message at click %i", (clicks, message) => {
    expect(getNoMeaningState(clicks).message).toBe(message);
    expect(getNoMeaningState(clicks).unlocked).toBe(false);
  });

  it("unlocks at exactly 66 clicks and stays finished afterward", () => {
    expect(getNoMeaningState(65).unlocked).toBe(false);
    expect(getNoMeaningState(66)).toEqual({
      clicks: 66,
      message: "(더 이상 눌러봤자 의미가 없음)",
      unlocked: true,
      finished: true,
    });
    expect(getNoMeaningState(100).clicks).toBe(66);
    expect(getNoMeaningState(100).finished).toBe(true);
  });

  it("normalizes invalid and negative click counts safely", () => {
    expect(getNoMeaningState(-9).clicks).toBe(0);
    expect(getNoMeaningState(Number.NaN).clicks).toBe(0);
    expect(getNoMeaningState(10.9).clicks).toBe(10);
  });
});
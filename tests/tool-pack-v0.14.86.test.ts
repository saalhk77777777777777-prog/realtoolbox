/** TOOLBOX v0.14.86 — regression tests for the eight-tool expansion. */
import{describe,it,expect}from"vitest";
import{process as run,validate,toRoman,fromRoman,type ToolId}from"../src/tools/utility/tool-pack/processor.ts";
describe("TOOLBOX v0.14.86 tool pack",()=>{
 it("generates secure passwords with the requested length",()=>{const x={length:24,count:3,upper:true,lower:true,digits:true,symbols:false};const r=run("password-generator",x) as {passwords:string[]};expect(r.passwords).toHaveLength(3);expect(r.passwords.every(p=>p.length===24)).toBe(true)});
 it("validates number ranges and generates in-range numbers",()=>{const x={min:2,max:5,count:50,unique:false};const r=run("random-number-generator",x) as {numbers:number[]};expect(r.numbers).toHaveLength(50);expect(r.numbers.every(n=>n>=2&&n<=5)).toBe(true);expect(validate("random-number-generator",{min:5,max:2,count:1,unique:false})).not.toBeNull()});
 it("calculates percentages and change rates",()=>{expect((run("percentage-calculator",{mode:"of",a:200,b:15}) as any).result).toBe(30);expect((run("percentage-calculator",{mode:"change",a:100,b:125}) as any).result).toBe(25);expect(validate("percentage-calculator",{mode:"ratio",a:1,b:0})).not.toBeNull()});
 it("simplifies aspect ratios and scales dimensions",()=>{const r=run("aspect-ratio-calculator",{width:1920,height:1080,targetWidth:1280}) as any;expect(r.ratio).toBe("16:9");expect(r.heightAtTargetWidth).toBe(720)});
 it("creates bounded lorem ipsum paragraphs",()=>{const r=run("lorem-ipsum-generator",{paragraphs:2,sentences:2,startWithLorem:true}) as any;expect(r.text.startsWith("Lorem ipsum")).toBe(true);expect(r.text.split("\n\n")).toHaveLength(2);expect(r.wordCount).toBeGreaterThan(10)});
 it("converts px and rem",()=>{expect((run("px-rem-converter",{value:24,base:16,direction:"px-to-rem"}) as any).css).toBe("1.5rem");expect((run("px-rem-converter",{value:1.5,base:16,direction:"rem-to-px"}) as any).css).toBe("24px")});
 it("round-trips canonical roman numerals",()=>{expect(toRoman(2026)).toBe("MMXXVI");expect(fromRoman("MMXXVI")).toBe(2026);expect(validate("roman-numeral-converter",{value:"IIII",direction:"to-number"})).not.toBeNull()});
 it("round-trips UTF-8 text through binary",()=>{const binary=(run("binary-text-converter",{text:"안녕 Tabi",direction:"to-binary"}) as any).result;expect((run("binary-text-converter",{text:binary,direction:"to-text"}) as any).result).toBe("안녕 Tabi")});
});

/** TOOLBOX v0.14.99 — text-to-json-array processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.99.ts";
export function validate(input:unknown){return validateGeneric("text-to-json-array",input)}
export function process(input:unknown):unknown{return processGeneric("text-to-json-array",input)}

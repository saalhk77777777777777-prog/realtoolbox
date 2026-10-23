/** TOOLBOX v0.14.99 — json-array-to-lines processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.99.ts";
export function validate(input:unknown){return validateGeneric("json-array-to-lines",input)}
export function process(input:unknown):unknown{return processGeneric("json-array-to-lines",input)}

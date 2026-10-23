/** TOOLBOX v0.14.97 — text-repeater processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.97.ts";
export function validate(input:unknown){return validateGeneric("text-repeater",input)}
export function process(input:unknown):unknown{return processGeneric("text-repeater",input)}

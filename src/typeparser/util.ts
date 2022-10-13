import { Brackets } from './brackets';

/**
 * Splits a string using only separators not enclosed in parentheses.
 * ex. splitTopmost("a%(b%c)%d", "%") returns ["a", "(b%c)", "d"]
 */
export function splitTopmost(t: string, separator: string | string[] | RegExp) {
  const result: string[] = [];
  let stack = '';
  let depth = 0;
  for(let i = 0; i < t.length; i++) {
    if(Brackets.startSymbols.includes(t[i])) {
      depth++;
    }
    if(Brackets.endSymbols.includes(t[i])) {
      depth--;
    }
    if(depth === 0) {
      if(
        (typeof separator === 'string' && t[i] === separator) ||
        (Array.isArray(separator) && separator.includes(t[i])) ||
        (separator instanceof RegExp && separator.test(t[i]))
      ){
        result.push(stack);
        stack = '';
        continue;
      }
    }
    stack += t[i];
  }
  result.push(stack);
  return result;
}
  
import { Brackets } from './brackets';

function* iterateByChar(data: string) {
  yield* data;
}



export function* iterateByTopmostSeparator(data: string, separator: string | string[] | RegExp) {
  let stack = '';
  let depth = 0;

  const characters = iterateByChar(data);
  for(const char of characters) {
    if(Brackets.startSymbols.includes(char)) depth++;
    if(Brackets.endSymbols.includes(char)) depth--;
    if(depth === 0) {
      if(
        (typeof separator === 'string' && char === separator) ||
        (Array.isArray(separator) && separator.includes(char)) ||
        (separator instanceof RegExp && separator.test(char))
      ){
        yield stack;
        stack = '';
        continue;
      }
    }
    stack += char;
  }
  yield stack;
}

/**
 * Splits a string using only separators not enclosed in parentheses.
 * ex. splitTopmost("a%(b%c)%d", "%") returns ["a", "(b%c)", "d"]
 */
export const splitTopmost = 
  (data: string, separator: string | string[] | RegExp) => [...iterateByTopmostSeparator(data, separator)];

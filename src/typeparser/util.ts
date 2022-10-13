import { Brackets } from './brackets';

class StringStack {
  data = '';
  put(data: string) {
    this.data += data;
  }

  remain() {
    return this.data !== '';
  }

  get() {
    const result = this.data;
    this.data = '';
    return result;
  }
}

export function* iterateByChar(data: string) {
  yield* data;
}

/**
 * ex. "abc'string'def" => [a, b, c, 'string', d, e, f]
 */
export function* iterateGroupingStrings(data: string) {
  const stack = new StringStack();
  let escaped = false;
  const grouper = ['\'', '"'];
  let inLiteral: null | string = null;
  for (const char of iterateByChar(data)) {
    stack.put(char);
    if (inLiteral === null) {
      if (!escaped && grouper.includes(char)) { inLiteral = char; } else { yield stack.get(); }
      continue;
    }
    if (!escaped && inLiteral === char) {
      yield stack.get();
      inLiteral = null;
    }
    if (escaped) { escaped = false;  }
    if (char === '\\') { escaped = true; }
  }
  if(stack.remain()) yield stack.get();
}

export function* iterateByTopmostSeparator(data: string, separator: string | string[] | RegExp) {
  const stack = new StringStack();
  let depth = 0;

  for(const char of iterateGroupingStrings(data)) {
    if(Brackets.startSymbols.includes(char)) depth++;
    if(Brackets.endSymbols.includes(char)) depth--;
    if(
      depth === 0 &&
      (
        (typeof separator === 'string' && char === separator) ||
        (Array.isArray(separator) && separator.includes(char)) ||
        (separator instanceof RegExp && separator.test(char))
      )
    ) {
      yield stack.get();
      continue;
    }
    stack.put(char);
  }
  yield stack.get();
}

/**
 * Splits a string using only separators not enclosed in parentheses.
 * ex. splitTopmost("a%(b%c)%d", "%") returns ["a", "(b%c)", "d"]
 */
export const splitTopmost = 
  (data: string, separator: string | string[] | RegExp) => [...iterateByTopmostSeparator(data, separator)];

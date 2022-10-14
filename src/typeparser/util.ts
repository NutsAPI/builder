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

export function removeBothEndsSpace(s: string) {
  return s.replace(/^(\s*)(.*?)(\s*)$/s, '$2');
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

/**
 * ex. "abc(st{ri}ng)def" => [a, b, c, '(st{ri}ng)', d, e, f]
 */
export function* iterateGroupingTopmost(data: string) {
  const stack = new StringStack();
  let depth = 0;
  for (const char of iterateGroupingStrings(data)) {
    stack.put(char);
    if(Brackets.openSymbols.includes(char)) depth++;
    if(Brackets.closeSymbols.includes(char)) depth--;
    if(depth === 0) yield stack.get();
  }
  if(stack.remain()) yield stack.get();
}

/**
 * Splits a string using only separators not enclosed in parentheses.
 * ex. splitTopmost("a%(b%c)%d", "%") returns ["a", "(b%c)", "d"]
 */
export function splitTopmost(data: string, separator: string | string[]) {
  const result: string[] = [];
  const stack = new StringStack();
  for(const char of iterateGroupingTopmost(data)) {
    if (
      (Array.isArray(separator) ? separator : [separator]).includes(char)
    ) {
      result.push(stack.get());
      continue;
    }
    stack.put(char);
  }
  result.push(stack.get());
  return result;
}

/**
 * ex. a & b | c => (a&b)|c
 */
export function leftEval(data: string): { evalable: true, result: string } | { evalable: false } {
  const operators = ['|', '&'];
  if(splitTopmost(data, operators).length <= 2) return { evalable: false };
  let result = '';
  const stack = new StringStack();
  let connector = '';
  for(const char of iterateGroupingTopmost(data)) {
    if(operators.includes(char)) {
      result = result === '' ? stack.get() : `(${result}${connector}${stack.get()})`;
      connector = char;
      continue;
    }
    stack.put(char);
  }
  result = `${result}${connector}${stack.get()}`;
  return { evalable: true, result };
}



export const isStringLiteral = (data: string) => [...iterateGroupingStrings(data)][0] === data;

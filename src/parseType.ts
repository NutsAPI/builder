import { removeBothEndsSpace } from './parseInterface';
import type { FileProvider} from './resolveSymbol';
import { resolveSymbol } from './resolveSymbol';

export async function parseType(type: string, provider: FileProvider): Promise<string> {
  if(type !== removeBothEndsSpace(type)) return parseType(removeBothEndsSpace(type), provider);

  /**
   * Simple object literals
   * 
   * ex. { username: string } => rt.Record({ username: rt.String })
   */
  if(type.startsWith('{') && type.endsWith('}')) {
    const content = type.slice(1).slice(0, -1);
    const typed = splitOutBracket(content, /,|;|\n/)
      .map(v => removeBothEndsSpace(v))
      .filter(v => v !== '')
      .map(v => splitOutBracket(v, ':'))
      .map(v => v.map(e => removeBothEndsSpace(e)))
      .map(v => ({
        key: v[0],
        value: v[1],
      }))
      
      .map(v => ({
        key: v.key,
        value: parseType(v.value, provider),
      }))
      .map(async v => `${v.key}:${await v.value}`);
    return `rt.Record({${(await Promise.all(typed)).join(',')}})`;
  }
  
  /**
   * Property reference
   * 
   * ex. { username: { first: string, last: string } }['username']
   *  => { first: string, last: string }
   */
  const refMatch = type.match(/^(.*?)\['(.*?)'\](.*)$/s);
  if(refMatch !== null) {

    /**
     * If it resolve a reference from another file,
     * the Provider needs to be changed because the file it is looking at changes.
     */
    const recordSearch: {
      record: string;
      provider: FileProvider;
  } | undefined = await (async () => {
    const objectLiteral = refMatch[1].match(/\{(.*)\}/s)?.[1];
    if(objectLiteral !== undefined) return { record: objectLiteral, provider };
    const symbol = await resolveSymbol(refMatch[1], provider);
    if(symbol === null) return undefined;
    const symbolContent = symbol.type.match(/\{(.*)\}/s)?.[1];
    if(symbolContent !== undefined) return { record: symbolContent, provider: symbol.provider };
    return undefined;
  })();

    if(recordSearch === undefined) {
      throw `Cannot reference ${refMatch[2]} because Record ${refMatch[1]} is Unknown`;
    }
    const data = splitOutBracket(recordSearch.record, /,|;|\n/)
      .map(v => removeBothEndsSpace(v))
      .filter(v => v !== '')
      .map(v => splitOutBracket(v, ':'))
      .map(v => v.map(e => removeBothEndsSpace(e)))
      .map(v => ({
        key: v[0],
        value: v[1],
      }))
      .find(v => v.key === refMatch[2]);
    if (data === undefined) {
      throw `Record ${refMatch[1]} = ${recordSearch.record} hasn't property ${refMatch[2]}`;
    }
    return parseType(`${data.value}${refMatch[3] ?? ''}`, recordSearch.provider);
  }

  /**
   * ex. Record<A, B> => rt.Record(A, B)
   */
  const recordMatch = type.match(/^Record<(.*),(.*)>$/s);
  if(recordMatch !== null) return `rt.Record(${await parseType(recordMatch[1], provider)},${await parseType(recordMatch[2], provider)})`;


  /**
   * Place brackets in the order in which they are to be evaluated.
   * ex. A & B | C => (((A) & B) | C)
   */
  const evalResult = leftEval(type);
  if(evalResult.evalable) return parseType(evalResult.result, provider);


  /**
   * Processes Operators(Union, Intersect).
   */
  if(outBracketContains(type, '|')) return `rt.Union(${(await Promise.all(splitOutBracket(type, '|').map(v => parseType(v, provider)))).join(',')})`;
  if(outBracketContains(type, '&')) return `rt.Intersect(${(await Promise.all(splitOutBracket(type, '&').map(v => parseType(v, provider)))).join(',')})`;


  /**
   * Remove meaningless brackets.
   * ex. (A) => A
   */
  if(type.startsWith('(') && type.endsWith(')')) return parseType(type.slice(1).slice(0, -1), provider);


  /**
   * Processes Basic Types.
   */
  if(type === 'string') return 'rt.String';
  if(type === 'number') return 'rt.Number';
  if(type === 'boolean') return 'rt.Boolean';
  if(type === 'null') return 'rt.Null';
  if(type === 'undefined') return 'rt.Undefined';
  if(type === 'never') return 'rt.Never';
  if(type === 'true') return 'rt.Literal(true)';
  if(type === 'false') return 'rt.Literal(false)';

  /**
   * Processes string literals.
   * ex. "abc" => rt.Literal("abc")
   */
  if(isStringLiteral(type)) {
    return `rt.Literal(${type})`;
  }

  /**
   * Processes number literals.
   * ex. 123 => rt.Literal(123)
   */
  if(!isNaN(parseInt(type))) {
    return `rt.Literal(${type})`;
  }

  /**
   * Processes arrays.
   * ex. A[] => rt.Array(A)
   */
  if(type.endsWith('[]')) return `rt.Array(${await parseType(type.slice(0, -2), provider)})`;  


  /**
   * If none of the above can be found, refer to an external file to see if it has been written.
   * If an external file is referenced, the file being looked at changes, so update `provider`.
   */
  const symbol = await resolveSymbol(type, provider);
  if(symbol !== null) return await parseType(symbol.type, symbol.provider);

  throw `Unknown Type: ${type}`;
}

export function isStringLiteral(type: string): boolean {
  const wrappers = ['"', '\''];
  const first = type.substring(0,1);
  if(!wrappers.includes(first)) return false;
  if(!type.endsWith(first)) return false;
  if(type.slice(1).slice(0, -1).replace(new RegExp(`\\\\\\${first}`), '').includes(first)) return false;
  return true;
}

export function outBracketContains(target: string, lookup: string) {
  return countOutBracketContains(target, lookup) > 0;
}

export function countOutBracketContains(target: string, lookup: string) {
  return splitOutBracket(target, lookup).length - 1;
}

export function splitOutBracket(t: string, lookup: string | RegExp) {
  const result: string[] = [];
  let stack = '';
  let brackets = 0;
  for(let i = 0; i < t.length; i++) {
    if(t[i] === '(' || t[i] === '{') {
      brackets++;
    }
    if(t[i] === ')'|| t[i] === '}') {
      brackets--;
    }
    if(brackets === 0 && (typeof lookup === 'string' ? t[i] === lookup : lookup.test(t[i]))) {
      result.push(stack);
      stack = '';
      continue;
    }
    stack = `${stack}${t[i]}`;
  }
  result.push(stack);
  return result;
}

export function leftEval(t: string): { evalable: true, result: string } | { evalable: false } {
  const datas = ['|', '&'];
  if(datas.map(v => countOutBracketContains(t, v)).reduce((a, b) => a + b) <= 1) return { evalable: false };
  let result = '';
  let stack = '';
  let connector = '';
  let brackets = 0;
  for(let i = 0; i < t.length; i++) {
    if(t[i] === '(') {
      brackets++;
    }
    if(t[i] === ')') {
      brackets--;
    }
    if(brackets === 0 && datas.includes(t[i])) {
      result = `(${result}${connector}${stack})`;
      connector = t[i];
      stack = '';
      continue;
    }
    stack = `${stack}${t[i]}`;
  }
  result = `(${result}${connector}${stack})`;
  return { evalable: true, result };
}



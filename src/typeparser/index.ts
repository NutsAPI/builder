import { isStringLiteral, leftEval, promiseJoin, removeBothEndsSpace, splitTopmost } from '@src/typeparser/util';
import { Brackets } from './brackets';
import type { FileProvider } from './resolveSymbol';
import { resolveSymbol } from './resolveSymbol';

export async function parseType(type: string, provider: FileProvider): Promise<string> {

  const recursive = (nextType: string, nextProvider?: FileProvider) => parseType(nextType, nextProvider ?? provider);

  const spaceRemoved = removeBothEndsSpace(type);
  if(type !== spaceRemoved) return recursive(spaceRemoved, provider);

  /**
   * Simple object literals
   * 
   * ex. { username: string } => rt.Record({ username: rt.String })
   */
  const objectLiteral = Brackets.extract(type, Brackets.objectBracket);
  if(objectLiteral.match) {
    const typed = splitTopmost(objectLiteral.content, [',', ';', '\n'])
      .map(v => removeBothEndsSpace(v))
      .filter(v => v !== '')
      .map(v => splitTopmost(v, ':'))
      .map(v => v.map(e => removeBothEndsSpace(e)))
      .map(v => ({
        key: v[0],
        value: v[1],
      }))
      .map(v => ({
        key: v.key,
        value: recursive(v.value),
      }))
      .map(async v => `${v.key}:${await v.value}`);
    return `rt.Record({${await promiseJoin(typed, ',')})`;
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

    if(recordSearch === undefined) 
      throw `Cannot reference ${refMatch[2]} because Record ${refMatch[1]} is Unknown`;
    
    const data = splitTopmost(recordSearch.record, [',', ';', '\n'])
      .map(v => removeBothEndsSpace(v))
      .filter(v => v !== '')
      .map(v => splitTopmost(v, ':'))
      .map(v => v.map(e => removeBothEndsSpace(e)))
      .map(v => ({
        key: v[0],
        value: v[1],
      }))
      .find(v => v.key === refMatch[2]);

    if (data === undefined)
      throw `Record ${refMatch[1]} = ${recordSearch.record} hasn't property ${refMatch[2]}`;

    return recursive(`${data.value}${refMatch[3] ?? ''}`, recordSearch.provider);
  }

  /**
   * ex. Record<A, B> => rt.Record(A, B)
   */
  const recordLiteral = Brackets.extract(type, { open: 'Record<', close: '>' });
  if(recordLiteral.match) {
    const args = splitTopmost(recordLiteral.content, ',');
    if (args.length !== 2)
      throw '';
    return `rt.Record(${await promiseJoin(args.map(t => recursive(t)), ',')})`;
  }


  /**
   * Place brackets in the order in which they are to be evaluated.
   * ex. A & B | C => (((A) & B) | C)
   */
  const evalResult = leftEval(type);
  if(evalResult.evalable) return recursive(evalResult.result);


  /**
   * Processes Operators(Union, Intersect).
   */
  if(splitTopmost(type, '|').length > 1)
    return `rt.Union(${await promiseJoin(splitTopmost(type, '|').map(t => recursive(t)), ',')})`;

  if(splitTopmost(type, '&').length > 1)
    return `rt.Intersect(${await promiseJoin(splitTopmost(type, '&').map(t => recursive(t)), ',')})`;


  /**
   * Remove meaningless brackets.
   * ex. (A) => A
   */
  const bracketedType =  Brackets.extract(type, Brackets.parenthesisBracket);
  if(bracketedType.match) return recursive(bracketedType.content);


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
  if(isStringLiteral(type)) return `rt.Literal(${type})`;

  /**
   * Processes number literals.
   * ex. 123 => rt.Literal(123)
   */
  if(!isNaN(parseInt(type))) return `rt.Literal(${type})`;

  /**
   * Processes arrays.
   * ex. A[] => rt.Array(A)
   */
  const arrayLiteral = Brackets.extract(type, { open: '', close: '[]' });
  if(arrayLiteral.match) return `rt.Array(${await recursive(arrayLiteral.content)})`;  


  /**
   * If none of the above can be found, refer to an external file to see if it has been written.
   * If an external file is referenced, the file being looked at changes, so update `provider`.
   */
  const symbol = await resolveSymbol(type, provider);
  if(symbol !== null)
    return await recursive(symbol.type, symbol.provider);

  throw `Unknown Type: ${type}`;
}

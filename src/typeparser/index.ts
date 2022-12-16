import { isStringLiteral, leftEval, promiseJoin, removeBothEndsSpace, splitTopmost } from '@src/typeparser/util';
import { Brackets } from './brackets';
import type { CustomResolver, FileProvider } from './resolveSymbol';
import { resolveSymbol } from './resolveSymbol';

export interface TypeParserConfig {
  provider: FileProvider,
  customResolvers: CustomResolver[],
}

export async function parseType(type: string, config: TypeParserConfig): Promise<string> {

  const recursive = (nextType: string, nextConfig?: TypeParserConfig) => parseType(nextType, nextConfig ?? config);

  const spaceRemoved = removeBothEndsSpace(type);
  if(type !== spaceRemoved) return recursive(spaceRemoved, config);

  /**
   * Simple object literals
   * 
   * ex. { username: string } => zod.object({ username: zod.string() })
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
    return `zod.object({${await promiseJoin(typed, ',')}})`;
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
      if(objectLiteral !== undefined) return { record: objectLiteral, provider: config.provider };
      const symbol = await resolveSymbol(refMatch[1], config);
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

    return recursive(`${data.value}${refMatch[3] ?? ''}`, {  ...config, provider: recordSearch.provider });
  }

  /**
   * ex. Record<A, B> => zod.record(A, B)
   */
  const recordLiteral = Brackets.extract(type, { open: 'Record<', close: '>' });
  if(recordLiteral.match) {
    const args = splitTopmost(recordLiteral.content, ',');
    if (args.length !== 2)
      throw '';
    return `zod.record(${await promiseJoin(args.map(t => recursive(t)), ',')})`;
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
  const union = splitTopmost(type, '|');
  if(union.length === 2)
    return `${await recursive(union[0])}.or(${await recursive(union[1])})`;

  const intersect = splitTopmost(type, '&');
  if(intersect.length === 2)
    return `${await recursive(intersect[0])}.and(${await recursive(intersect[1])})`;


  /**
   * Remove meaningless brackets.
   * ex. (A) => A
   */
  const bracketedType =  Brackets.extract(type, Brackets.parenthesisBracket);
  if(bracketedType.match) return recursive(bracketedType.content);


  /**
   * Processes Basic Types.
   */
  if(type === 'string') return 'zod.string()';
  if(type === 'number') return 'zod.number()';
  if(type === 'boolean') return 'zod.boolean()';
  if(type === 'null') return 'zod.null()';
  if(type === 'undefined') return 'zod.undefined()';
  if(type === 'never') return 'zod.never()';
  if(type === 'true') return 'zod.literal(true)';
  if(type === 'false') return 'zod.literal(false)';

  /**
   * Processes string literals.
   * ex. "abc" => zod.literal("abc")
   */
  if(isStringLiteral(type)) return `zod.literal(${type})`;

  /**
   * Processes number literals.
   * ex. 123 => zod.literal(123)
   */
  if(!isNaN(parseInt(type))) return `zod.literal(${type})`;

  /**
   * Processes arrays.
   * ex. A[] => A.array()
   */
  const arrayLiteral = Brackets.extract(type, { open: '', close: '[]' });
  if(arrayLiteral.match) return `${await recursive(arrayLiteral.content)}.array()`;  


  /**
   * If none of the above can be found, refer to an external file to see if it has been written.
   * If an external file is referenced, the file being looked at changes, so update `provider`.
   */
  const symbol = await resolveSymbol(type, config);
  if(symbol !== null)
    return await recursive(symbol.type, { ...config, provider: symbol.provider });

  throw `Unknown Type: ${type}`;
}

import { join } from 'path';
import { parseInterface } from '../parseInterface';
import { isStringLiteral, removeBothEndsSpace } from './util';
import type { TypeParserConfig } from '.';

export type FileProvider = (filePath: string) => Promise<{ data: string, path: string } | undefined>;
export type CustomResolver = (v: string) => string | null;

export async function resolveSymbol(name: string, config: TypeParserConfig): Promise<{ type: string, provider: FileProvider } | null> {
  FileResolver:
  {
    const data = await config.provider('');
    if(data === undefined) break FileResolver;
    const inFileDatas = parseInterface(data.data);
    const inFileSymbol = inFileDatas.find(v => v.name === name);
    if(inFileSymbol !== undefined) return { type: inFileSymbol.value, provider: config.provider };

    const imports = parseImport(data.data);
    const target = imports.find(v => v.types.includes(name));
    if(target === undefined) break FileResolver;
    const files = await Promise.all(resolveFileName(target.path).map(v => config.provider(v)));
    const external = files.find((v): v is { data: string, path: string } => v?.data !== undefined);
    if(external === undefined) break FileResolver;
    const externalDatas = parseInterface(external.data);
    const externalSymbol = externalDatas.find(v => v.name === name);
    if(externalSymbol !== undefined) return {
      type: externalSymbol.value,
      provider: async (path) => path === '' ? { path: external.path, data: external.data } :
        config.provider(path.startsWith('.') ? join(external.path, '../', path) : path),
    };
  }

  CustomResolver:
  {
    const customResolved = config.customResolvers.map(v => v(name)).find((v): v is string => v !== null);
    if(customResolved === undefined) break CustomResolver;

    return {
      type: customResolved,
      provider: config.provider,
    };
  }
  
  return null;
}

export function parseImport(data: string): { path: string, types: string[] }[] {
  return data.split(/[\n;]/)
    .map(v => v.match(/import( type|) {(.*)} from (.*)/))
    .filter((v): v is Exclude<typeof v, null> => v !== null)
    .map(v => [v[2], removeBothEndsSpace(v[3])])
    .filter(v => isStringLiteral(v[1]))
    .map(v => ({ path: v[1].slice(1).slice(0, -1), types: v[0].split(',').map(e => removeBothEndsSpace(e)) }));
}

export function resolveFileName(name: string): string[] {
  const v = name.endsWith('/') ? name.slice(0, -1) : name;
  return v.endsWith('ts') ? [v] : [
    v,
    `${v}.ts`,
    `${v}/index.ts`,
  ];
}

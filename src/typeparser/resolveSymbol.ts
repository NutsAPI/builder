import { join } from 'path';
import { parseInterface, removeBothEndsSpace } from '../parseInterface';
import { isStringLiteral } from '.';

export type FileProvider = (filePath: string) => Promise<string | undefined>;

export async function resolveSymbol(name: string, provider: FileProvider): Promise<{ type: string, provider: FileProvider } | null> {
  const data = await provider('');
  if(data === undefined) return null;
  const inFileDatas = parseInterface(data);
  const inFileSymbol = inFileDatas.find(v => v.name === name);
  if(inFileSymbol !== undefined) return { type: inFileSymbol.value, provider };

  const imports = parseImport(data);
  const target = imports.find(v => v.types.includes(name));
  if(target === undefined) return null;
  const files = await Promise.all(resolveFileName(target.path).map(async v => ({
    path: v,
    data: await provider(v),
  })));
  const external = files.find((v): v is { data: string, path: string } => v.data !== undefined);
  if(external === undefined) return null;
  const externalDatas = parseInterface(external.data);
  const externalSymbol = externalDatas.find(v => v.name === name);
  if(externalSymbol !== undefined) return {
    type: externalSymbol.value,
    provider: async (path) => path === '' ? external.data : provider(join(external.path, '../', path)),
  };

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

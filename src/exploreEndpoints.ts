import type { HttpRequestMethod } from '@nutsapi/types';
import { HTTP_REQUEST_METHODS } from '@nutsapi/types';
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { EndpointFiles } from './interfaces/endpoint';

const sorter = (a: string, b:string) => {
  const upperedA = a.toUpperCase();
  const upperedB = b.toUpperCase();
  if(upperedA === upperedB) return 0;
  return upperedA > upperedB ? 1 : -1;
};

export function isHttpRequestMethod(method: string): method is HttpRequestMethod {
  return HTTP_REQUEST_METHODS.includes(method as HttpRequestMethod);
}

export async function exploreEndpoint(directoryRoot: string, uriRoot: `/${string}/` | '/'): Promise<EndpointFiles[]> {
  const stats = [...(await readdir(directoryRoot, { withFileTypes: true }))];
  const dirEndpoints = 
    stats
      .filter(v => v.isDirectory())
      .sort((a, b) => sorter(a.name, b.name))
      .map(async v => await exploreEndpoint(join(directoryRoot, v.name), `${uriRoot}${v.name}/`));
  const rootFiles = 
    stats
      .filter(v => v.isFile())
      .sort((a, b) => sorter(a.name, b.name))
      .map(v => v.name)
      .map(v => v.match(/^(.+)\.(.+)\.ts$/))
      .flatMap(v => v === null ? [] : [{ name: v[1], method: v[2].toUpperCase(), fileName: v[0] }])
      .filter((v): v is { method: HttpRequestMethod, name: string, fileName: string } => isHttpRequestMethod(v.method));
  const fileEndpoints = 
    [...new Set(rootFiles.map(v => v.name))]
      .map(v => ({
        uri: `${uriRoot}${v}`, 
        files: rootFiles
          .filter(e => v === e.name)
          .sort((a, b) => HTTP_REQUEST_METHODS.indexOf(a.method) - HTTP_REQUEST_METHODS.indexOf(b.method))
          .map(e => ({ method: e.method, filePath: join(directoryRoot, e.fileName) })),
      }));
  return [...fileEndpoints, ...(await Promise.all(dirEndpoints)).reduce((a, b) => [...a, ...b], [])];
}


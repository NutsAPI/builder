import { resolve } from 'path';
import type { CustomPath } from './parseEndpoint';

export function atSignAilas(alias: string, route: string): CustomPath {
  return (v: string) => {
    const str = v.replace(new RegExp(`^@${alias}/`), '');
    if(str === v) return v;
    return resolve(route, str);
  };
}
  
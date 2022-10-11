import type { FileProvider } from './resolveSymbol';
import { readFile } from 'fs/promises';
import { RequestTypeNotFoundError, ResponseTypeNotFoundError } from './error/invaildEndpoint';
import type { EndpointTypes } from './interfaces/endpoint';
import { parseInterface } from './parseInterface';
import { parseType } from './parseType';
import { join } from 'path';

export async function parseEndpoint(path: string): Promise<EndpointTypes> {
  const data = (await readFile(path)).toString();
  const interfaces = parseInterface(data);

  const request = interfaces.find(v => v.name.toLowerCase() === 'request');
  if(request === undefined) {
    throw new RequestTypeNotFoundError(path);
  }

  const responses = interfaces
    .map(v => ({ match: v.name.match(/^response([0-9][0-9][0-9])$/i), value: v.value }))
    .filter((v): v is { match: RegExpMatchArray, value: string } => v.match !== null)
    .map(v => ({ returnCode: parseInt(v.match[1]), value: v.value }));

  if(responses.length < 1) {
    throw new ResponseTypeNotFoundError(path);
  }

  const provider: FileProvider = async file => file === '' ? data : (await readFile(join(path, '../', file))).toString();

  return {
    request: {
      type: await parseType(request.value, provider),
    },
    response: await Promise.all(
      responses.map(async r => ({
        returnCode: r.returnCode,
        type: await parseType(r.value, provider),
      })),
    ),
  };

}

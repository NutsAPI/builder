import { exploreEndpoint } from './exploreEndpoints';
import type { CustomPath} from './parseEndpoint';
import { parseEndpoint } from './parseEndpoint';

export { atSignAilas } from '@src/util';

interface BuilderOptions {

  /**The path to the root of the directory where the .ts files of schema are stored. */
  schemaRoot: string;

  /**URI of the HTTP server to which the root of the schema corresponds (default: '/') */
  uriRoot?: `/${string}/` | '/';

  /**If you are using paths in tsconfig.json and the paths are not resolved correctly, you can use this to make changes. */
  customPaths?: CustomPath[]
}

export async function buildNutsAPISchema(options: BuilderOptions): Promise<string> {
  const optionsWithDefaults: Required<BuilderOptions> = {
    ...{
      uriRoot: '/',
      customPaths: [],
    },
    ...options,
  };

  const types = await Promise.all(
    (await exploreEndpoint(optionsWithDefaults.schemaRoot, optionsWithDefaults.uriRoot))
      .map(async v => ({
        uri: v.uri,
        methods: await Promise.all(
          v.files.map(async e => ({
            method: e.method,
            type: await parseEndpoint(e.filePath, optionsWithDefaults.customPaths),
          })),
        ),
      })),
  );

  return [
    'import { z as zod } from \'zod\';',
    `export const apiSchema = {${
      types.map(v => `'${v.uri}':{${
        v.methods.map(e => `'${e.method}':{request:${e.type.request.type},response:{${e.type.response.map(v => `${v.returnCode}: ${v.type}`).join(',')}}}`).join(',')
      }}`).join(',')
    }} as const;`,
    'export type ApiSchemaType = typeof apiSchema;',
  ].join('\n');
  
}


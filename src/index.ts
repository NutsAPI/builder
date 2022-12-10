import { exploreEndpoint } from './exploreEndpoints';
import { parseEndpoint } from './parseEndpoint';

interface BuilderOptions {

  /**The path to the root of the directory where the .ts files of schema are stored. */
  schemaRoot: string;

  /**URI of the HTTP server to which the root of the schema corresponds (default: '/') */
  uriRoot?: `/${string}/` | '/';
}

export async function buildNutsAPISchema(options: BuilderOptions): Promise<string> {
  const optionsWithDefaults: Required<BuilderOptions> = {
    ...options,
    ...{
      uriRoot: '/',
    },
  };

  const types = await Promise.all(
    (await exploreEndpoint(optionsWithDefaults.schemaRoot, optionsWithDefaults.uriRoot))
      .map(async v => ({
        uri: v.uri,
        methods: await Promise.all(
          v.files.map(async e => ({
            method: e.method,
            type: await parseEndpoint(e.filePath),
          })),
        ),
      })),
  );

  return [
    'import { z as zod } from \'zod\'',
    `const apiSchema = {${
      types.map(v => `'${v.uri}':{${
        v.methods.map(e => `'${e.method}':{request:${e.type.request.type},response:{${e.type.response.map(v => `${v.returnCode}: ${v.type}`).join(',')}}}`).join(',')
      }}`).join(',')
    }} as const;`,
    'type ApiSchemaType = typeof apiSchema;',
  ].join('\n');
  
}

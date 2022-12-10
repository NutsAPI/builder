import { resolve } from 'path';
import { buildNutsAPISchema } from '@src/index';

it('all', async () => {
  expect(await buildNutsAPISchema(
    {
      schemaRoot: resolve('./test/mocks/parseEndpoint'),
    },
  )).toBe([
    'import { z as zod } from \'zod\'',
    'const apiSchema = {\'/deleteUsers\':{\'POST\':{request:zod.object({_id:zod.string()}),response:{200: zod.record(zod.string(),zod.never()),503: zod.object({reason:zod.literal(\'a\').or(zod.literal(\'b\')).or(zod.literal(\'c\'))})}}},\'/getUsers\':{\'POST\':{request:zod.object({_id:zod.string()}),response:{200: zod.object({user:zod.object({username:zod.string(),email:zod.string()}),empty:zod.record(zod.string(),zod.never())}),404: zod.record(zod.string(),zod.never())}}}} as const;',
    'type ApiSchemaType = typeof apiSchema;',
  ].join('\n'));
});

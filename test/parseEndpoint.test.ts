import { resolve } from 'path';
import { parseEndpoint } from '@src/parseEndpoint';

it('getUsers(mock)', async () => {
  expect(await parseEndpoint(resolve('./test/mocks/parseEndpoint/getUsers.post.ts'), [], [])).toStrictEqual({
    request: { type: 'zod.object({_id:zod.string()})' },
    response: [
      {
        returnCode: 200,
        type: 'zod.object({user:zod.object({username:zod.string(),email:zod.string()}),empty:zod.record(zod.string(),zod.never())})',
      },
      { returnCode: 404, type: 'zod.record(zod.string(),zod.never())' },
    ],
  });
});

it('deleteUsers(mock)', async () => {
  expect(await parseEndpoint(resolve('./test/mocks/parseEndpoint/deleteUsers.post.ts'), [], [])).toStrictEqual({
    request: { type: 'zod.object({_id:zod.string()})' },
    response: [
      {
        returnCode: 200,
        type: 'zod.record(zod.string(),zod.never())',
      },
      { returnCode: 503, type: 'zod.object({reason:zod.literal(\'a\').or(zod.literal(\'b\')).or(zod.literal(\'c\'))})' },
    ],
  });
});


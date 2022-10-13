import { resolve } from 'path';
import { parseEndpoint } from '@src/parseEndpoint';

it('getUsers(mock)', async () => {
  expect(await parseEndpoint(resolve('./test/mocks/parseEndpoint/getUsers.post.ts'))).toStrictEqual({
    request: { type: 'rt.Record({_id:rt.String})' },
    response: [
      {
        returnCode: 200,
        type: 'rt.Record({user:rt.Record({username:rt.String,email:rt.String}),empty:rt.Record(rt.String,rt.Never)})',
      },
      { returnCode: 404, type: 'rt.Record(rt.String,rt.Never)' },
    ],
  });
});

it('deleteUsers(mock)', async () => {
  expect(await parseEndpoint(resolve('./test/mocks/parseEndpoint/deleteUsers.post.ts'))).toStrictEqual({
    request: { type: 'rt.Record({_id:rt.String})' },
    response: [
      {
        returnCode: 200,
        type: 'rt.Record(rt.String,rt.Never)',
      },
      { returnCode: 503, type: 'rt.Record({reason:rt.Union(rt.Union(rt.Literal(\'a\'),rt.Literal(\'b\')),rt.Literal(\'c\'))})' },
    ],
  });
});


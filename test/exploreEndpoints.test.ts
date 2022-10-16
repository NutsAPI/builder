import { exploreEndpoint } from '@src/exploreEndpoints';
import { join, resolve } from 'path';

it('exploreEndpoint(mock)', async () => {
  const pathRoot = resolve('./test/mocks/exploreEndpoints');
  expect(
    await exploreEndpoint(pathRoot, '/'),
  ).toStrictEqual([
    { 
      uri: '/reset',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'reset.post.ts') },
      ],
    },
  ]);
});

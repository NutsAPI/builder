import { resolveFileName } from '@src/typeparser/resolveSymbol';

it('resolveFilename', () => {
  expect(resolveFileName('./a')).toStrictEqual(['./a', './a.ts', './a/index.ts']);
  expect(resolveFileName('./a/')).toStrictEqual(['./a', './a.ts', './a/index.ts']);
  expect(resolveFileName('./a.ts')).toStrictEqual(['./a.ts']);
});

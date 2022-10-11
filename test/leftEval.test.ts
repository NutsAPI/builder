import { leftEval } from '../src/parseType';

it('leftEval', () => {
  const evaluated = leftEval('a & b | c');
  expect(evaluated.evalable).toBe(true);
  if(evaluated.evalable) {
    expect(evaluated.result.replaceAll(' ', '')).toBe('(((a)&b)|c)');
  }
});

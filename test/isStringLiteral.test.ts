import { isStringLiteral } from '../src/parseType';

it('isStringLiteral', () => {
  expect(isStringLiteral('\'aaa\'')).toBe(true);
  expect(isStringLiteral('\'aa\' | \'bb\'')).toBe(false);
  expect(isStringLiteral('\'aa\\\'aa\'')).toBe(true);
});

import { splitTopmost } from '@src/typeparser/util';


it('splitTopmost', () => {
  expect(splitTopmost('aa(c|d)e', '|')).toStrictEqual(['aa(c|d)e']);
  expect(splitTopmost('a|a(c|d)e', '|')).toStrictEqual(['a','a(c|d)e']);
  //expect(splitTopmost('a|a(\'c)\'|d)e', '|')).toStrictEqual(['a','a(\'c)\'|d)e']);
  expect(splitTopmost('a|a(c%d)|e', '|')).toStrictEqual(['a','a(c%d)','e']);
});

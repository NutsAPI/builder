import { iterateByChar, iterateGroupingStrings, splitTopmost } from '@src/typeparser/util';


describe('typeparserUtils', () => {

  it('iterators', () => {
    expect([...iterateByChar('abcde')]).toStrictEqual(['a', 'b', 'c', 'd', 'e']);
    expect([...iterateGroupingStrings('abcde')]).toStrictEqual(['a', 'b', 'c', 'd', 'e']);
    expect([...iterateGroupingStrings('ab"cd"e')]).toStrictEqual(['a', 'b', '"cd"', 'e']);
    expect([...iterateGroupingStrings('ab"c\\"d"e')]).toStrictEqual(['a', 'b', '"c\\"d"', 'e']);
    expect([...iterateGroupingStrings('ab"c\'d"e')]).toStrictEqual(['a', 'b', '"c\'d"', 'e']);
  });

  it('splitTopmost', () => {
    expect(splitTopmost('aa(c|d)e', '|')).toStrictEqual(['aa(c|d)e']);
    expect(splitTopmost('a|a(c|d)e', '|')).toStrictEqual(['a','a(c|d)e']);
    expect(splitTopmost('a|a(\'c)\'|d)e', '|')).toStrictEqual(['a','a(\'c)\'|d)e']);
    expect(splitTopmost('a|a(c%d)|e', '|')).toStrictEqual(['a','a(c%d)','e']);
  });

});

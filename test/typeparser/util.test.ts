import { iterateByChar, iterateGroupingStrings, removeBothEndsSpace, splitTopmost } from '@src/typeparser/util';


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

  it('removeBothEndsSpace', () => {
    expect(removeBothEndsSpace('  a')).toBe('a');
    expect(removeBothEndsSpace('a')).toBe('a');
    expect(removeBothEndsSpace('a ')).toBe('a');
    expect(removeBothEndsSpace(' a ')).toBe('a');
    expect(removeBothEndsSpace(' a b ')).toBe('a b');
    expect(removeBothEndsSpace('  \na')).toBe('a');
    expect(removeBothEndsSpace('a\n')).toBe('a');
    expect(removeBothEndsSpace('a\n ')).toBe('a');
    expect(removeBothEndsSpace(' \na ')).toBe('a');
    expect(removeBothEndsSpace(' a\n \nb ')).toBe('a\n \nb');
  });
  
});

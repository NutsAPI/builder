interface BracketPair {
  start: string,
  end: string
}

export class Brackets {

  public static objectBracket: BracketPair
    = { start: '{', end: '}' }; 

  public static referenceBracket: BracketPair
    = { start: '[', end: ']' };

  public static parenthesisBracket: BracketPair
    = { start: '(', end: ')' };

  
  public static bracketPairs = [
    this.objectBracket,
    this.referenceBracket,
    this.parenthesisBracket,
  ];

  public static startSymbols = this.bracketPairs.map(v => v.start);
  public static endSymbols = this.bracketPairs.map(v => v.end);

}

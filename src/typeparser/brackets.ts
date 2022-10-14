interface BracketPair {
  open: string,
  close: string
}

export class Brackets {

  public static objectBracket: BracketPair
    = { open: '{', close: '}' }; 

  public static referenceBracket: BracketPair
    = { open: '[', close: ']' };

  public static parenthesisBracket: BracketPair
    = { open: '(', close: ')' };

  
  public static bracketPairs = [
    this.objectBracket,
    this.referenceBracket,
    this.parenthesisBracket,
  ];

  public static openSymbols = this.bracketPairs.map(v => v.open);
  public static closeSymbols = this.bracketPairs.map(v => v.close);

  public static extract(string: string, pair: BracketPair): ({ match: false } | { match: true, content: string }) {
    if( string.startsWith(pair.open) && string.endsWith(pair.close) ) 
      return { match: true, content: string.slice(pair.open.length).slice(0, -pair.close.length) };

    return { match: false };
  }
}

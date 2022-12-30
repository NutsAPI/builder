import { parseInterface } from '@src/parseInterface';
import type { TypeParserConfig} from '@src/typeparser';
import { parseType } from '@src/typeparser';

const original = `
import type { ExternalInterfaceMarto } from './a'; 

export type POSTRequest = {
  a: string[]
  f: 200,
  d: number;
  hello: ('world')[],
}

export interface POSTResponse {
  b: string;
  style: 'js' | 'ts'
};

export interface UnionOuter {

  /** This is out */
  out: (string | number)[]

  /** This is in */
  in: string[] | number[]

  // Split
  split: string | number[]
}

// Test Comment

export type Cross = string | number & boolean;
export type Cross2 = string & number | boolean;
export type Cross3 = string & (number | boolean) & null;

export interface Marto {
  a: {
    b: string;
  }
}

export interface RefTest {
  a: {
    b: { c: boolean };
  }['b']['c'];
}

export type WithBraceUnion = ({ x: 'a' }) | ({ y: 'b' });
export type NoBraceUnion = { x: 'a' } | { y: 'b' };
export type Optional = { x?: string };

export type RecordTest = Record<string, never>;

export type ResolveTest1 = Marto['a']['b'];

export type ResolveTest2 = ExternalInterfaceMarto['a']['b'];

`;

const external = `
export interface ExternalInterfaceMarto {
  a: {
    b: string;
  }
}
`;

export const p: TypeParserConfig = { customResolvers: [], provider: async p => p === './a.ts' ? { path: './a.ts', data: external } : p === '' ? { path: './', data: original } : undefined };

const parse = parseInterface(original);
const i = (name: string) => parse.find(v => v.name === name)?.value ?? '';


test('parsePostRequest', async () => {
  expect(await parseType(i('POSTRequest'), p)).toBe(
    'zod.object({a:zod.string().array(),f:zod.literal(200),d:zod.number(),hello:zod.literal(\'world\').array()})',
  );
});

test('parsePostResponse', async () => {
  expect(await parseType(i('POSTResponse'), p)).toBe(
    'zod.object({b:zod.string(),style:zod.literal(\'js\').or(zod.literal(\'ts\'))})',
  );
});

test('parseUnionOuter', async () => {
  expect(await parseType(i('UnionOuter'), p)).toBe(
    'zod.object({out:zod.string().or(zod.number()).array(),in:zod.string().array().or(zod.number().array()),split:zod.string().or(zod.number().array())})',
  );
});

test('parseCross', async () => {
  expect(await parseType(i('Cross'), p)).toBe(
    'zod.string().or(zod.number()).and(zod.boolean())',
  );
});

test('parseCross2', async () => {
  expect(await parseType(i('Cross2'), p)).toBe(
    'zod.string().and(zod.number()).or(zod.boolean())',
  );
});

test('parseCross3', async () => {
  expect(await parseType(i('Cross3'), p)).toBe(
    'zod.string().and(zod.number().or(zod.boolean())).and(zod.null())',
  );
});

test('parseMarto', async () => {
  expect(await parseType(i('Marto'), p)).toBe(
    'zod.object({a:zod.object({b:zod.string()})})',
  );
});

test('parseRefTest', async () => {
  expect(await parseType(i('RefTest'), p)).toBe(
    'zod.object({a:zod.boolean()})',
  );
});

test('parseNoBraceUnion', async () => {
  expect(await parseType(i('NoBraceUnion'), p)).toBe(
    'zod.object({x:zod.literal(\'a\')}).or(zod.object({y:zod.literal(\'b\')}))',
  );
});

test('parseWithBraceUnion', async () => {
  expect(await parseType(i('WithBraceUnion'), p)).toBe(
    'zod.object({x:zod.literal(\'a\')}).or(zod.object({y:zod.literal(\'b\')}))',
  );
});

test('parseOptional', async () => {
  expect(await parseType(i('Optional'), p)).toBe(
    'zod.object({x:zod.string().optional()})',
  );
});


test('parseRecordTest', async () => {
  expect(await parseType(i('RecordTest'), p)).toBe(
    'zod.record(zod.string(),zod.never())',
  );
});

test('parseResolveTest1', async () => {
  expect(await parseType(i('ResolveTest1'), p)).toBe(
    'zod.string()',
  );
});


test('parseResolveTest2', async () => {
  expect(await parseType(i('ResolveTest2'), p)).toBe(
    'zod.string()',
  );
});

import * as acorn from 'acorn';

export interface ParseResult {
  ast: acorn.Node;
  error?: string;
}

export function parseCode(code: string): ParseResult {
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'script',
      locations: true,
    });
    return { ast };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return {
      ast: null as unknown as acorn.Node,
      error: err.message ?? 'Failed to parse code',
    };
  }
}

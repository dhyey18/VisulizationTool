import type { SimulationResult } from '../types/simulation';
import { parseCode } from './parser';
import { Interpreter } from './interpreter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ASTNode = any;

export function runSimulation(code: string): SimulationResult {
  const { ast, error } = parseCode(code);
  if (error || !ast) {
    return { steps: [], error: error ?? 'Unknown parse error' };
  }

  try {
    const interpreter = new Interpreter();
    const steps = interpreter.run(ast as ASTNode);
    return { steps };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { steps: [], error: `Runtime error: ${msg}` };
  }
}

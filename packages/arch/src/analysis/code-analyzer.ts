import type { Codebase } from "../codebase/index.ts";
import type { Config } from "../config/index.ts";

export abstract class CodeAnalyzer {
	public abstract analyze(config: Config): Codebase;
}

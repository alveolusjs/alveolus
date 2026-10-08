import { SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";

import { Throw } from "../../../model/index.ts";

export class ThrowReader {
	public read(file: SourceFile): Throw[] {
		const throws: Throw[] = [];
		for (const statement of file.getDescendantsOfKind(SyntaxKind.ThrowStatement)) {
			throws.push(new Throw(statement.getStartLineNumber(), "throw"));
		}
		for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
			if (call.getExpression().getText() === "Promise.reject") {
				throws.push(new Throw(call.getStartLineNumber(), "Promise.reject"));
			}
		}
		return throws.sort((left, right) => left.line - right.line);
	}
}

import type { SourceFile } from "ts-morph";

import { DisableComment } from "../../../model/index.ts";

/** The marker, then what the comment says. */
const marker = /^\s*\/\/\s*alveolus-disable-next-line\b\s*(.*?)\s*$/;

/** Reads the `// alveolus-disable-next-line …` comments of a file, line by line. */
export class DisableReader {
	public read(file: SourceFile): DisableComment[] {
		const comments: DisableComment[] = [];
		const lines = file.getFullText().split(/\r?\n/);
		for (const [index, line] of lines.entries()) {
			const text = marker.exec(line)?.[1];
			if (text !== undefined) {
				comments.push(new DisableComment(index + 1, text));
			}
		}
		return comments;
	}
}

import type { SourceFile } from "ts-morph";

import { DisableComment } from "../../../model/index.ts";

const marker = /^\s*\/\/\s*alveolus-disable-next-line\b\s*(.*?)\s*$/;

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

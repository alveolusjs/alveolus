import { createHash } from "node:crypto";

/** Eight hexadecimal characters: enough to tell apart the lines of one file, short enough to read. */
const length = 8;

/** A short hash of a line of code, blind to indentation and spacing, so that a baseline survives formatting and moves. */
export class Fingerprint {
	public of(text: string): string {
		const normalized = text.trim().replace(/\s+/g, " ");
		return createHash("sha1").update(normalized).digest("hex").slice(0, length);
	}
}

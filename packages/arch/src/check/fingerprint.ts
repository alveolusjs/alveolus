import { createHash } from "node:crypto";

const length = 8;

export class Fingerprint {
	public of(text: string): string {
		const normalized = text.trim().replace(/\s+/g, " ");
		return createHash("sha1").update(normalized).digest("hex").slice(0, length);
	}
}

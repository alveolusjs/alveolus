import type { Port } from "@alveolus/core";

export interface IdGenerator extends Port {
	next(): string;
}

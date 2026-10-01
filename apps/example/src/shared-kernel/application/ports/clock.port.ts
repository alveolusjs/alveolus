import type { Port } from "@alveolus/core";

export interface Clock extends Port {
	now(): Date;
}

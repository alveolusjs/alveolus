import type { Port } from "@alveolus/core";

export interface Notifier extends Port {
	notify(message: string): Promise<void>;
}

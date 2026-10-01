import type { Port } from "@alveolus/core";

export interface Mailer extends Port {
	send(to: string, body: string): Promise<void>;
}

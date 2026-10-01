import type { Mailer } from "./ports/mailer.ts";

export class SmtpMailer implements Mailer {
	public send(): Promise<void> {
		return Promise.resolve();
	}
}

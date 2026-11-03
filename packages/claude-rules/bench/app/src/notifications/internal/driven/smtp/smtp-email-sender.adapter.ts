import { createTransport, type Transporter } from 'nodemailer';

import { EmailSender, type ReceiptEmail } from '../../application/email-sender.port';

export class SmtpEmailSender extends EmailSender {
	readonly #transport: Transporter;
	readonly #from: string;

	constructor(smtpUrl: string, from: string) {
		super();
		this.#transport = createTransport(smtpUrl);
		this.#from = from;
	}

	async sendReceipt(email: ReceiptEmail): Promise<void> {
		await this.#transport.sendMail({
			from: this.#from,
			to: email.to,
			subject: this.#subjectOf(email),
			text: this.#textOf(email),
		});
	}

	// #subjectOf(email) and #textOf(email): the template of each kind, with amounts written in units of their currency
}

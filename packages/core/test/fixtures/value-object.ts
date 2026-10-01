import { DomainError } from "../../src/domain/domain-errors/index.ts";
import { ValueObject } from "../../src/domain/value-objects/index.ts";
import type { Result } from "../../src/utilities/result/index.ts";
import { err, ok } from "../../src/utilities/result/index.ts";

export class InvalidEmail extends DomainError<{ raw: string }> {}

export class Email extends ValueObject<{ value: string }> {
	private constructor(props: { value: string }) {
		super(props);
	}

	public static create(raw: string): Result<Email, InvalidEmail> {
		return raw.includes("@") ? ok(new Email({ value: raw.toLowerCase() })) : err(new InvalidEmail({ raw }));
	}

	public get value(): string {
		return this.props.value;
	}
}

export class Username extends ValueObject<{ value: string }> {
	public constructor(value: string) {
		super({ value });
	}
}

export class Contact extends ValueObject<{ email: Email; tags: string[]; since: Date; address: { city: string } }> {
	public constructor(props: { email: Email; tags: string[]; since: Date; address: { city: string } }) {
		super(props);
	}

	public get tags(): readonly string[] {
		return this.props.tags;
	}
}

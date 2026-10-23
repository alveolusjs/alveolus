export abstract class DomainError<Payload = undefined> {
	public readonly payload: Payload;

	public constructor(...[payload]: Payload extends undefined ? [] : [payload: Payload]) {
		this.payload = payload as Payload;
	}

	public get type(): string {
		return this.constructor.name;
	}
}

export type AnyDomainError = DomainError<unknown>;

import type { FactoryProvider } from '@nestjs/common';

type Token<T> = abstract new (...args: never[]) => T;

type Tokens<Args extends unknown[]> = { readonly [K in keyof Args]: Token<Args[K]> };

export class Wiring {
	static construct<T, Args extends unknown[]>(
		type: new (...args: Args) => T,
		tokens: Tokens<Args>,
	): FactoryProvider<T> {
		return { provide: type, useFactory: (...args: Args) => new type(...args), inject: [...tokens] };
	}
}

import type { AnyDomainEvent } from '../../domain/domain-events/index.ts';
import { ok } from '../../utilities/result/index.ts';
import type { Correlation, CorrelationContext } from '../correlation-contexts/index.ts';
import type {
	AnyAsyncDomainEventHandlerClass,
	DomainEventHandlerResolver,
	DomainEventHandlers,
} from '../domain-event-handlers/index.ts';
import { NestedWorkRefused, type UnitOfWork } from '../unit-of-work/index.ts';
import type { Outbox } from './outbox.ts';
import type { StoredDomainEvent } from './stored-domain-event.ts';

type ResolvedHandler = { readonly handle: (event: AnyDomainEvent) => Promise<void> };

export interface DomainEventForwarderOptions {
	readonly batchSize?: number;
	readonly maxAttempts?: number;
}

const defaultBatchSize = 100;
const defaultMaxAttempts = 5;

export class DomainEventForwarder<Event extends AnyDomainEvent> {
	readonly #source: string;
	readonly #handlers: DomainEventHandlers<Event>;
	readonly #instances: ReadonlyMap<AnyAsyncDomainEventHandlerClass, ResolvedHandler>;
	readonly #outbox: Outbox;
	readonly #unitOfWork: UnitOfWork;
	readonly #correlation: CorrelationContext;
	readonly #batchSize: number;
	readonly #maxAttempts: number;

	public constructor(
		source: string,
		handlers: DomainEventHandlers<Event>,
		resolve: DomainEventHandlerResolver,
		outbox: Outbox,
		unitOfWork: UnitOfWork,
		correlation: CorrelationContext,
		options: DomainEventForwarderOptions = {},
	) {
		this.#source = source;
		this.#handlers = handlers;
		this.#instances = new Map(
			handlers.asynchronousHandlers().map((handler) => [handler, resolve(handler) as ResolvedHandler]),
		);
		this.#outbox = outbox;
		this.#unitOfWork = unitOfWork;
		this.#correlation = correlation;
		this.#batchSize = options.batchSize ?? defaultBatchSize;
		this.#maxAttempts = options.maxAttempts ?? defaultMaxAttempts;
	}

	public async forward(): Promise<number> {
		let delivered = 0;

		for (const [handler, instance] of this.#instances) {
			delivered += await this.#forwardTo(handler, instance);
		}

		return delivered;
	}

	async #forwardTo(handler: AnyAsyncDomainEventHandlerClass, instance: ResolvedHandler): Promise<number> {
		const after = await this.#outbox.lastPublished(handler.channel);
		const entries = await this.#outbox.pendingDomainEvents(this.#source, after, this.#batchSize);
		let delivered = 0;
		let skipped = after;

		for (const entry of entries) {
			if (!this.#handlers.subscribes(handler, entry.event.type)) {
				skipped = entry.sequence;
				continue;
			}

			if (!(await this.#deliver(handler.channel, instance, entry))) {
				return delivered;
			}

			delivered += 1;
		}

		const last = entries.at(-1);

		if (last !== undefined && skipped === last.sequence) {
			await this.#outbox.recordPublished(handler.channel, last.sequence);
		}

		return delivered;
	}

	async #deliver(channel: string, instance: ResolvedHandler, entry: StoredDomainEvent): Promise<boolean> {
		try {
			await this.#unitOfWork.run(async () => {
				const event = this.#handlers.restore(entry.event.type, entry.event.snapshot);
				await this.#correlation.run(this.#correlationOf(entry), () => instance.handle(event));
				await this.#outbox.recordPublished(channel, entry.sequence);

				return ok();
			});

			return true;
		} catch (error) {
			if (error instanceof NestedWorkRefused) {
				await this.#outbox.recordPublished(channel, entry.sequence);

				return true;
			}

			return this.#giveUpAfterTooManyAttempts(channel, entry.sequence);
		}
	}

	async #giveUpAfterTooManyAttempts(channel: string, sequence: number): Promise<boolean> {
		const attempts = await this.#outbox.recordFailure(channel, sequence);

		if (attempts < this.#maxAttempts) {
			return false;
		}

		await this.#outbox.recordDeadLetter(channel, sequence);
		await this.#outbox.recordPublished(channel, sequence);

		return true;
	}

	#correlationOf({ event }: StoredDomainEvent): Correlation {
		return {
			...(event.causationId === undefined ? {} : { causationId: event.causationId }),
			correlationId: event.correlationId,
		};
	}
}

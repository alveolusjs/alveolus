import type { CorrelationContext } from '../../src/application/correlation-contexts/index.ts';
import type { DomainEventHandlerResolver } from '../../src/application/domain-event-handlers/index.ts';
import { DomainEventHandler } from '../../src/application/domain-event-handlers/index.ts';
import type { UnitOfWork } from '../../src/application/unit-of-work/index.ts';
import { type AnyDomainEvent, DomainEvent } from '../../src/domain/domain-events/index.ts';
import { err } from '../../src/utilities/result/index.ts';
import { InvalidTotal, type OrderEvent, type OrderId, type OrderPaid, type OrderPlaced } from './application.ts';

export class HandlingLog {
	public readonly entries: string[] = [];
}

abstract class LoggingHandler<Event extends AnyDomainEvent> extends DomainEventHandler<Event> {
	protected abstract readonly label: string;
	readonly #log: HandlingLog;

	public constructor(log: HandlingLog) {
		super();
		this.#log = log;
	}

	public handle(event: Event): Promise<void> {
		this.#log.entries.push(`${this.label}:${event.type}`);
		return Promise.resolve();
	}
}

export class UpdateOrderSummary extends LoggingHandler<OrderEvent> {
	protected readonly label = 'summary';
}

export class AuditOrders extends LoggingHandler<OrderEvent> {
	protected readonly label = 'audit';
}

export class NotifyCustomer extends LoggingHandler<OrderPlaced> {
	public static readonly channel = 'ordering.notify-customer';
	protected readonly label = 'notify';
}

export class ReserveStock extends LoggingHandler<OrderPlaced> {
	public static readonly channel = 'ordering.reserve-stock';
	protected readonly label = 'reserve';
}

export class SendReceipt extends LoggingHandler<OrderPaid> {
	protected readonly label = 'receipt';
}

export class RejectingHandler extends DomainEventHandler<OrderEvent> {
	public static readonly channel = 'ordering.rejecting';

	public handle(): Promise<void> {
		return Promise.reject(new Error('handler failed'));
	}
}

export class RecordCorrelation extends DomainEventHandler<OrderPlaced> {
	public static readonly channel = 'ordering.record-correlation';
	readonly #log: HandlingLog;
	readonly #correlation: CorrelationContext;

	public constructor(log: HandlingLog, correlation: CorrelationContext) {
		super();
		this.#log = log;
		this.#correlation = correlation;
	}

	public handle(event: OrderPlaced): Promise<void> {
		const { causationId, correlationId } = this.#correlation.current();
		this.#log.entries.push(`${event.payload.total}:${correlationId}:${causationId ?? 'none'}`);
		return Promise.resolve();
	}
}

export class RefuseOrder extends DomainEventHandler<OrderPlaced> {
	public static readonly channel = 'ordering.refuse-order';
	readonly #unitOfWork: UnitOfWork;

	public constructor(unitOfWork: UnitOfWork) {
		super();
		this.#unitOfWork = unitOfWork;
	}

	public async handle(): Promise<void> {
		await this.#unitOfWork.run(() => Promise.resolve(err(new InvalidTotal({ total: 0 }))));
	}
}

export class Instances {
	readonly #byClass = new Map<unknown, unknown>();

	public constructor(instances: readonly object[]) {
		for (const instance of instances) {
			this.#byClass.set(instance.constructor, instance);
		}
	}

	public readonly resolve: DomainEventHandlerResolver = <Handler>(type: new (...args: never[]) => Handler) => {
		const instance = this.#byClass.get(type);

		if (instance === undefined) {
			throw new Error(`${type.name} is not provided`);
		}

		return instance as Handler;
	};
}

export class InvoiceIssued extends DomainEvent<OrderId, { number: string }> {}

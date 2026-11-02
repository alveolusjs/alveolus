export type DomainEventHandlerResolver = <Handler>(type: new (...args: never[]) => Handler) => Handler;

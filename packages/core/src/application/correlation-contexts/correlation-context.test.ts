import { describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../test/fixtures/application.ts';
import { ScopedCorrelationContext } from '../../../test/fixtures/utilities.ts';
import { Port } from '../../domain/ports/index.ts';
import { CorrelationContext } from './correlation-context.ts';

describe('CorrelationContext', () => {
	it('gives the correlation of the running operation', async () => {
		const context = new ScopedCorrelationContext(new SequentialIdGenerator());

		const current = await context.run({ causationId: 'cmd_1', correlationId: 'c1' }, () =>
			Promise.resolve(context.current()),
		);

		expect(current).toEqual({ causationId: 'cmd_1', correlationId: 'c1' });
		expect(context).toBeInstanceOf(CorrelationContext);
		expect(context).toBeInstanceOf(Port);
	});

	it('starts a new correlation when no operation is running', () => {
		const context = new ScopedCorrelationContext(new SequentialIdGenerator());

		expect(context.current()).toEqual({ correlationId: 'evt_1' });
	});
});

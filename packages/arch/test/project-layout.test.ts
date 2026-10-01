import { describe, expect, it } from "vitest";

import { reported } from "./fixtures.ts";

describe("location rules", () => {
	it.each([
		[
			"application/misplaced.aggregate.ts",
			"aggregate/location",
			5,
			"Wallet is an aggregate; declare it in a domain/aggregates/ folder.",
		],
		[
			"domain/entities/misfiled.aggregate.ts",
			"aggregate/location",
			5,
			"Warehouse is an aggregate; declare it in a domain/aggregates/ folder.",
		],
		[
			"application/misplaced.entity.ts",
			"entity/location",
			5,
			"Session is an entity; declare it in a domain/entities/ folder.",
		],
		[
			"application/misplaced.value-object.ts",
			"value-object/location",
			3,
			"Label is a value object; declare it in a domain/value-objects/ folder.",
		],
		[
			"domain/events/misfiled.identifier.ts",
			"identifier/location",
			3,
			"ParcelId is an identifier; declare it in a domain/value-objects/ folder.",
		],
		[
			"domain/stray.event.ts",
			"domain-event/location",
			5,
			"ParcelLost is a domain event; declare it in a domain/events/ folder.",
		],
		[
			"domain/value-objects/misfiled.error.ts",
			"domain-error/location",
			3,
			"ParcelMissing is a domain error; declare it in a domain/errors/ folder.",
		],
		[
			"application/misplaced.service.ts",
			"domain-service/location",
			3,
			"TariffService is a domain service; declare it in a domain/services/ folder.",
		],
		[
			"application/misplaced.policy.ts",
			"policy/location",
			6,
			"RefundPolicy is a policy; declare it in a domain/policies/ folder.",
		],
		[
			"application/customer.repository.ts",
			"repository/location",
			5,
			"CustomerRepository is a repository port; declare it in a domain/repositories/ folder.",
		],
	])("reports %s", (file, rule, line, message) => {
		expect(reported(file)).toEqual([{ line, message, rule }]);
	});
});

describe("file suffix rules", () => {
	it.each([
		[
			"domain/aggregates/crate.ts",
			"aggregate/file-suffix",
			5,
			"Crate is an aggregate; name its file <name>.aggregate.ts.",
		],
		[
			"domain/value-objects/tracking-number.ts",
			"identifier/file-suffix",
			3,
			"TrackingNumber is an identifier; name its file <name>.identifier.ts.",
		],
		[
			"domain/repositories/crate-store.ts",
			"repository/file-suffix",
			5,
			"CrateStore is a repository port; name its file <name>.repository.ts.",
		],
		[
			"application/commands/restore-order.ts",
			"command-handler/file-suffix",
			4,
			"RestoreOrderHandler is a command handler; name its file <name>.command.ts.",
		],
		[
			"application/queries/list-orders.ts",
			"query-handler/file-suffix",
			4,
			"ListOrdersHandler is a query handler; name its file <name>.query.ts.",
		],
	])("reports %s", (file, rule, line, message) => {
		expect(reported(file)).toEqual([{ line, message, rule }]);
	});
});

describe("application rules", () => {
	it.each([
		[
			"application/archive-order.command.ts",
			"command-handler/location",
			4,
			"ArchiveOrderHandler is a command handler; declare it in an application/commands/ folder.",
		],
		[
			"application/count-orders.query.ts",
			"query-handler/location",
			4,
			"CountOrdersHandler is a query handler; declare it in an application/queries/ folder.",
		],
	])("reports %s", (file, rule, line, message) => {
		expect(reported(file)).toEqual([{ line, message, rule }]);
	});
});

type Expected = readonly [line: number, rule: string, message: string];

describe("view, port, command, query and metadata rules", () => {
	it.each<readonly [string, readonly Expected[]]>([
		[
			"domain/parcel-summary.ts",
			[
				[1, "view/location", "ParcelSummary is a view; declare it in a domain/views/ folder."],
				[1, "view/file-suffix", "ParcelSummary is a view; name its file <name>.view.ts."],
			],
		],
		[
			"application/parcel-tracking-repository.ts",
			[
				[
					5,
					"view-repository/location",
					"ParcelTrackingRepository is a view repository; declare it in a domain/repositories/ folder.",
				],
				[
					5,
					"view-repository/file-suffix",
					"ParcelTrackingRepository is a view repository; name its file <name>.repository.ts.",
				],
			],
		],
		[
			"application/sql-parcel-summary-repository.ts",
			[
				[
					4,
					"view-repository/adapter-location",
					"SqlParcelSummaryRepository implements a view repository; declare it in a driven/ folder.",
				],
			],
		],
		[
			"application/notifier.ts",
			[
				[3, "port/location", "Notifier is a port; declare it in an application/ports/ folder."],
				[3, "port/file-suffix", "Notifier is a port; name its file <name>.port.ts."],
			],
		],
		["application/ports/mailer.ts", [[3, "port/file-suffix", "Mailer is a port; name its file <name>.port.ts."]]],
		[
			"application/smtp-mailer.ts",
			[[3, "port/adapter-location", "SmtpMailer implements a port; declare it in a driven/ folder."]],
		],
		[
			"application/ship-order.ts",
			[
				[1, "command/location", "ShipOrder is a command; declare it in an application/commands/ folder."],
				[1, "command/file-suffix", "ShipOrder is a command; name its file <name>.command.ts."],
			],
		],
		[
			"application/queries/find-parcel-input.ts",
			[[1, "query/file-suffix", "FindParcel is a query; name its file <name>.query.ts."]],
		],
		[
			"application/trace.ts",
			[
				[1, "metadata/location", "Trace is notification metadata; declare it in an application/metadata/ folder."],
				[1, "metadata/file-suffix", "Trace is notification metadata; name its file <name>.metadata.ts."],
			],
		],
	])("reports %s", (file, expected) => {
		expect(reported(file)).toEqual(expected.map(([line, rule, message]) => ({ line, message, rule })));
	});
});

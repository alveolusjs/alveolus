# @alveolus/claude-rules

## 0.5.0

### Minor Changes

- 1fd8162: Two rules are approved and ship. EVT-08: a domain event is read only in its bounded context, through a registry typed by its domain events and a dispatcher that is never exported, with no global event bus; another bounded context reacts to the integration event. EVT-09: an event handler does not trigger a chain of event handlers; a sequence the business needs becomes an explicit process.
- 7c61bcb: A bounded context holds three folders: `composition/` (its module, its config, and the `*.composition.ts` pieces of a module that grows), `internal/` (its layers: `domain`, `application`, `driving`, `driven`) and `public/`. `shared` keeps its layers and moves its module and config into `composition/`. The ESLint and dependency-cruiser configs and the path scopes of the installed rules only match this layout: move each layer folder under `internal/` and the module and config under `composition/` when upgrading. The pieces of a module are named `*.composition.ts`, no longer `*.wiring.ts`.
- 4b007ea: The rules tell a domain event from an integration event. A domain event stays in its bounded context; the use case calls `dispatch` once, after `save`, and each event handler declares whether it runs in the transaction of the use case or after the commit. EVT-07 now says what a synchronous event handler may do: translate into an integration event, update a read projection, or write an audit trail. AGG-08, EVT-03, MSG-01, MSG-03, MSG-04, PLC-08, UC-04 and PUB-04 follow this model; PLC-03 adds the `.event-handler` role and drops `.listener`; AGG-09 and EVT-05 let other bounded contexts read the integration event only; ENT-17 keeps the history through a synchronous audit event handler. Two new rules, EVT-08 (a domain event is read only in its bounded context) and EVT-09 (no chain of event handlers), ship once they are approved.

### Patch Changes

- 2873e4f: MSG-03 asks the forwarder never to read past an event whose transaction is still open. A sequence number is given when the row is written, not when it commits: a forwarder that publishes number 11 and records it would never read number 10 if its transaction commits later. With PostgreSQL, each outbox row keeps the transaction that wrote it, and the forwarder reads only the rows written before the oldest transaction still open.
- 7be9215: The integration event examples use the envelope of `@alveolus/core`: `id` instead of `eventId`, `occurredAt` instead of `occurredOn`, and the `source`, `correlationId` and optional `causationId` fields. A consumer that followed PUB-05 or MSG-04 validated an `eventId` the core never sends. ACL-04 names the date of the fact `occurredAt` too.
- 623bf4d: ESLint checks EVT-08 with `alveolus/evt-08`: an event handler of `driving` (`*.event-handler.ts`) that imports the `public` folder of its own bounded context reacts to its own published language instead of the domain event. EVT-08 lists ESLint in its detection.
- 53ce554: The examples call `dispatch` once, after `save`, instead of adding translated events to the outbox, and the command handlers of the wiring rules take the dispatcher of their bounded context. Where a rule meant one kind of event, it now says domain event or integration event, and an event handler or a consumer instead of a handler or a subscriber.

## 0.4.0

### Minor Changes

- decda8a: Every rule has a kind: a safeguard (a defect can lose or corrupt money, data or a message, open a security hole, or hide such a loss), a structure rule (a defect makes the code diverge from the model, breaks a boundary or creates costly coupling), or a convention (one valid form among several). Each packaged rule carries `kind`, the generated rule files print it under the severity, and the reviewer agent explains it. Severities now follow the kind: every safeguard is blocking, every structure rule major, every convention minor, so 64 rules change severity or note; a note keeps a lower level only for a signal that belongs to another concern.

### Patch Changes

- decda8a: Twenty rules give, in their Adaptation, the form or the signal to check under the other choice of their pack: business refusals thrown as named exceptions instead of `Result`, or a transaction opened by the use case and passed explicitly instead of the Unit of Work. Five safeguard notes (AGG-15, ENT-09, MSG-04, MSG-05, REP-06) that lowered the same defect to major are removed, so these rules are blocking throughout; MSG-03 stays major only for a forwarder placed in the domain.
- decda8a: Five rules are narrowed so that each one holds a single concern. TXS-02 keeps one transaction per script, and the ban on calling another script moves to TXS-09. SEC-02 keeps the caller's identity from authentication, and the caller carried by the command moves to UC-13. PLC-07 keeps a technology imported only in its folder, and the split of adapters by technology moves to PLC-13. PER-06 keeps bounded lists, and reading by pages without skipping a row moves to PER-13. TXS-06 hands raw SQL to SEC-05. The new rules ship once they are approved. The ESLint message of PLC-07 follows its new title.

## 0.3.2

### Patch Changes

- 2a9b327: Severities are recalibrated by consequence: blocking for lost or corrupted data, a security hole or a lost message; major for a broken boundary or invariant, or coupling that is expensive to undo; minor for a local deviation. About fifty rules change severity or note, and three cross-references are fixed (CTX-05, WIR-03, WIR-11).
  
  A sixth part, Exploitation, ships with it: OBS-01 to OBS-05 (structured logs, one log per failure, a correlation id kept to the consumer, liveness and readiness, outbox and dead letters measured) and SEC-01 to SEC-04 (inputs validated at the edge, the caller's identity from authentication, secrets kept in configuration, personal data only where it serves).
- bc71704: The testing rules move to their own part, at `/rules/testing/writing-tests/`. TST-01 to TST-03 are grouped as Principes, TST-04 to TST-06 as Forme, place et nom. TST-01 now asks for the real adapter rather than the real third party: a local server that speaks the provider's protocol in the merge request suite, stubs generated from its committed OpenAPI contract with MSW, contract tests against its sandbox beside it, and one port replaced only to provoke a failure (TST-03). REP-16 points to the disposable database rules. TST-05 and TST-06 place and name the new test files and a provider's stubs and recorded responses, and keep end-to-end rule tests for the rules the domain cannot hold alone.
  
  New rules ship with it: TST-07 and TST-08 (deterministic tests, none disabled or retried), INF-01 to INF-05 (a disposable PostgreSQL built by the migrations, a third party simulated from its pinned OpenAPI contract, contract tests on the consumed fields), and COV-01 to COV-03 (the domain covered at 100 %, a business rule proven at the lowest level that holds it, a command test that checks its events).

## 0.3.1

### Patch Changes

- c54007e: UC-11 says that its ESLint checks look only at a `Result`, and let an assignment through.

## 0.3.0

### Minor Changes

- cf56a9e: Add UC-11, a `Result` is tested or returned, never dropped, and NAM-09, a private member is written `#`, declared in the body of the class.

### Patch Changes

- cf56a9e: REP-08 reads the aggregate through `toSnapshot()`, and the examples declare `AggregateRoot` with its identity, events and snapshot, and pull events with `pullDomainEvents()`.
- cf56a9e: The examples declare domain events as classes of `@alveolus/core`, record them with `record(new …)`, and translate them before adding them to the outbox. MSG-01 says the outbox keeps integration events only.
- cf56a9e: REP-04 asks every repository of the domain to extend `CommandRepository`, and gives the contract of `findByIds`.
- cf56a9e: ENT-03 reads identities with `UuidIdentifier` and says why they carry no prefix. ENT-05 takes the next identity from the repository, through `nextIdentity()`, generated by `IdGenerator` in `driven`.
- cf56a9e: REP-13 flags a nested refusal that the transaction would still commit, and shows the Unit of Work adapter for Prisma.
- cf56a9e: REP-03 gives each outcome one channel, for every port: a refusal is a `Result`, an absence `undefined`, a failure an exception. `save` returns a `Result` even with `never`, and a batch finder says which identities it did not find.
- cf56a9e: The rules checked by `@alveolus/lint-config` name ESLint in their `detection`, which replaces oxlint, and LAY-01, LAY-04 and PUB-01 are checked in the editor.

## 0.2.2

### Patch Changes

- 070c526: LAY-02 now names cycles between sibling modules of any layer, and the rules checked by `@alveolus/lint-config` list `oxlint` or `dependency-cruiser` in their `detection`.

## 0.2.1

### Patch Changes

- 1a1e8b3: UC-02 and UC-07 say how `driving` turns a refusal into an HTTP status: by its `type`, without importing `domain`.
- 189d8fa: Drop the detection mode from the rules: each rule now carries an empty `detection` list, filled when a check automates it, one rule at a time.

## 0.2.0

### Minor Changes

- 22ac859: The design cuts a user story into small increments, one pull request each, that merge on their own without breaking anything: `/alveolus-implement` builds one increment per run on its own branch, and `/alveolus-review` checks it before its pull request.
- f8f6e51: `install` writes one folder per style (`tactical/domain.md`, `transaction-script/driven.md`, `big-ball-of-mud/<context>.md`), each rules file starts with its contents and groups its rules by theme, and the index lists each bounded context with the count and themes of its rules files.

### Patch Changes

- 6da206c: The npm page shows the license, the repository and the site, and the package declares Node.js 24 or later.

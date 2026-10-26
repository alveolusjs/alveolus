# Triage

Which rules of the site a fitness function can check, and with which facts about the code. It orders the work: a rule is automated when the facts it needs exist, and its fitness function declares the coverage given here.

196 rules: 12 full, 116 partial, 68 no.

## Verdicts

- `full`: a static check decides every case of the rule's Signal section, without false positives.
- `partial`: a clear subset of the signals can be checked without false positives; the rest stays for review.
- `no`: judgement, business meaning, team organisation or runtime behaviour.

## Facts

- `paths`: file location, name, suffix, folder structure.
- `imports`: the resolved import graph.
- `syntax`: what one file declares or does: classes, members, decorators, exports, calls, `new`, `throw`, literals.
- `heritage`: a name followed to its declaration in another file: class hierarchies, which class an import designates.
- `types`: the TypeScript type checker.
- `config`: a file that is not TypeScript: `architecture.json`, `package.json`, `tsconfig.json`, the Prisma schema, the context map, `CODEOWNERS`.

## Keeping it true

- Each rule of the site has one row. A new rule gets a row when it is approved.
- An automated rule declares in its `Rule` the coverage of its row, `full` or `partial`. The registry test checks both.
- When writing a fitness function shows that a row is wrong, fix the row in the same pull request.

## Strategic design

### bounded-contexts

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| CTX-01 | partial | paths, imports, heritage | Report a file of one bounded context importing a file of another bounded context outside its `public`, and a class in `src/shared` extending an `@alveolus/core` `AggregateRoot` or `Entity`; DRY merges of homonyms stay for review. |
| CTX-02 | no | - | Whether one class or status mixes several business meanings needs the domain expert. |
| CTX-03 | no | - | Rejected terms are listed in the team's spoken language and collide with technical words (`transaction`), so matching them against identifiers gives false positives; synonyms are judgement. |
| CTX-04 | partial | paths, imports | Report a `domain` file importing an authentication or authorization package (`passport`, `@nestjs/passport`, `@casl/ability`, `jsonwebtoken`…); other foreign-subdomain concepts and features grafted onto another model stay for review. |
| CTX-05 | no | - | Detached attributes passed instead of a local concept, and the allowed shared identity, can only be told apart by reading the model. |
| CTX-06 | partial | paths, imports | Report a `domain` file that imports any package other than `@alveolus/core` and Node built-ins; an upstream shape copied by hand or generated into `src/shared` stays for review. |
| CTX-07 | no | - | The rule itself calls an identical copy a probable, not certain, error, and a central model is a judgement on meaning. |
| CTX-08 | no | - | A context-name prefix can be a real business term (`BillingAddress` in `billing`), which the exception allows. |
| CTX-09 | no | - | Schema vocabulary versus model vocabulary needs the glossary's spoken terms and judgement on abbreviations and legacy schemas. |
| CTX-10 | partial | paths, imports, syntax | Report a `driving` class that injects a repository port (a `domain/**/*.repository.ts` type in its constructor) instead of going through a use case; business decisions in adapters stay for review. |
| CTX-11 | no | - | Whether two bounded contexts speak the same language is a business question. |
| CTX-12 | partial | paths, config | Report a CODEOWNERS entry covering a bounded context folder (from `architecture.json`) that names more than one `@org/team` owner, or two entries giving parts of one context to different teams; merge requests by another team stay for review. |
| CTX-13 | no | - | Whether the tactical investment matches the domain's complexity is a judgement. |
| CTX-14 | partial | paths, config | Report a folder of `src/` missing from `architecture.json` or an invalid style, and a style that contradicts the subdomain type declared in the context map (core versus supporting/generic); a context mixing both styles stays for review. |
| CTX-15 | no | - | Whether the vocabulary shows two languages is a business question. |
| CTX-16 | no | - | Whether a pattern answers a named quality risk lives in ADRs and discussion, not in code. |

### context-maps

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| MAP-01 | partial | paths, imports, config | Report an import from one bounded context into another's `public` when the context map lists no relation between them, or lists it in the opposite direction; HTTP clients, consumers and contradicted patterns stay for review. |
| MAP-02 | partial | paths, syntax, config | Report a Prisma delegate call (`x.<model>.findMany(...)`) or a raw SQL table name in a bounded context's files when the context map assigns that model's table (Prisma `@@map`) to another bounded context; replication stays for review. |
| MAP-03 | partial | config | Report a CODEOWNERS entry declared as a shared kernel (`# shared kernel:` comment) that names fewer than two team owners; kernel growth and CI coverage of both consumers stay for review. |
| MAP-04 | partial | paths, imports, config | Report a file of another bounded context importing from a folder declared `big-ball-of-mud` in `architecture.json` outside its `driven` folder; table access and new features inside the mud stay for review. |

## Domain logic

### transaction-scripts

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| TXS-01 | partial | paths | In a transaction-script context, report `.command.ts` / `.query.ts` files under `application` (use cases are methods of a `.service.ts`); mode/action branching, concept mixing and split use cases stay for review. |
| TXS-02 | partial | paths, syntax, imports | In a transaction-script `.service.ts`, report a method that calls `unitOfWork.run` twice, a call `this.x()` to another public (non-`#`) method of the same service, or a call on an injected field whose type resolves to another `.service.ts`; writes outside `run` reached through private helpers stay for review. |
| TXS-03 | no | - | Whether a check in a controller, consumer, ORM extension or trigger is a business rule or boundary validation is a judgement on meaning. |
| TXS-04 | partial | syntax, imports, heritage | In a transaction-script application service, report `throw new X` where X comes from `@nestjs/common` or extends `DomainError`; the load-check-write order stays for review. |
| TXS-05 | full | paths, imports, config | For a context declared transaction-script in architecture.json, report any `domain` folder (and `driven/prisma`), any `application` file importing a `driven` file, and any `driving` file importing the database client or the Prisma Unit of Work. |
| TXS-06 | partial | syntax, imports | In a transaction-script `application` file, report an import or constructor parameter of `PrismaClient`, a `$transaction(` call, and `$queryRawUnsafe` / `$executeRawUnsafe` called with a concatenated or interpolated string. |
| TXS-07 | partial | imports, config | Report a `public` file or a `driving` `.representation.ts` that imports from `@prisma/client` or the generated client (output path read from the Prisma schema); getter/setter wrapper classes and returned rows (inferred types) stay for review. |
| TXS-08 | partial | config | Report a context declared transaction-script in architecture.json whose subdomain is typed core in the app's machine-readable context map (CML), when one exists; repeated rules and status branching stay for review. |

### aggregates

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| AGG-01 | partial | paths, syntax, heritage | On an aggregate root (`.aggregate.ts` or extends `AggregateRoot`), report a public non-readonly field or a public `set` accessor, and a `throw` of a `DomainError` subclass instead of returning `err(...)`; tell-don't-ask decisions in callers stay for review. |
| AGG-02 | partial | paths, syntax | On an aggregate root, report a public getter or method that returns a private field declared as a mutable array, `Set` or `Map` without copying it; external mutation through `aggregate.items.push(...)` needs types and stays for review. |
| AGG-03 | partial | paths, syntax, imports, heritage | In `domain`, report a field or constructor property of an aggregate whose annotated type (including arrays, maps, unions) resolves to a class in an `.aggregate.ts` or extending `AggregateRoot`; unannotated (inferred) fields stay for review. |
| AGG-04 | partial | paths, syntax, imports, heritage | In an aggregate file, report imports of a repository, a driven/application file, `@nestjs/*` or an I/O package, Nest decorators, and constructor parameters or fields typed by a port, repository or service; I/O done through an object passed in stays for review (a domain service as method parameter is allowed). |
| AGG-05 | partial | paths, syntax | Report an aggregate root whose identity (the `AggregateRoot` type argument or its `id` member) is typed `string`, `number` or `bigint`; database-generated identity and id/technical-id conflation stay for review. |
| AGG-06 | no | - | Which instances a transaction modifies is runtime behaviour, with creation exceptions; the rule itself points to a runtime guard in the Unit of Work. |
| AGG-07 | partial | syntax, imports, heritage | In an aggregate method, report a call on a parameter typed by another aggregate when the called method's declaration (followed to its file) directly assigns a field or calls `this.record(...)`; indirect mutation stays for review. |
| AGG-08 | partial | paths, syntax | In a `driving` `.listener.ts` / `.consumer.ts`, report a `catch` block whose body only logs (calls on a logger or `console`) and neither rethrows nor returns; multi-aggregate handlers and retry limits stay for review. |
| AGG-09 | partial | paths, syntax, imports, heritage | In a domain event (`.events.ts` or extends `DomainEvent`), report a field or payload member whose annotated type resolves to an aggregate, an entity or a `@prisma/client` type; payload types reached through generics or inferred aliases stay for review. |
| AGG-10 | no | - | Choosing transactional versus eventual consistency is a business question for domain experts. |
| AGG-11 | no | - | Whether a boundary follows a true invariant is a judgement on business meaning. |
| AGG-12 | no | - | Whether a collection is bounded depends on business limits and realistic size estimates. |
| AGG-13 | no | - | Whether two pieces of data must stay consistent is a business judgement. |
| AGG-14 | no | - | Whether a part is always replaced whole and never referenced is a modelling judgement. |
| AGG-15 | partial | paths, syntax, heritage | In a driven repository implementing `CommandRepository`, report a `save` that runs a Prisma `update` / `upsert` / `updateMany` with no `version` condition anywhere in its `where`; where the version belongs and the exceptions stay for review. |
| AGG-16 | partial | paths, syntax | In `domain` aggregates and entities, report any write to a member named `version` (`this.version++`, `this.#version += 1`, assignment outside the constructor); back-references added for versioning stay for review. |

### entities

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| ENT-01 | no | - | Whether instances must be tracked individually over time is a modelling judgement. |
| ENT-02 | no | - | Whether a use case writes or reads an attribute, or it belongs to another context, is a judgement on meaning. |
| ENT-03 | partial | paths, syntax | In domain aggregates, entities and events, report an `id` member or a member/parameter named `*Id` typed `string`, `number` or `bigint`; callers parsing an identity's raw format stay for review. |
| ENT-04 | no | - | Whether a user-entered value is stable enough to serve as identity is a business judgement. |
| ENT-05 | no | - | Linking a database-generated id in the schema to an entity that needs its identity before persistence cannot be done without false positives; with `@alveolus/core` the entity constructor already requires the id. |
| ENT-06 | partial | paths, syntax, heritage | On entities, report a redeclared non-readonly `id`, a `set id` accessor, or an assignment to `this.id` outside the constructor; which other attributes are part of the identity stays for review. |
| ENT-07 | partial | types | Report `===` / `!==` (and `Object.is`) whose two operands' types extend `Entity`; deep-equality comparisons through other helpers stay for review. |
| ENT-08 | no | - | A technical id is not reliably recognisable: the Prisma schema mixes tactical, transaction-script and shared tables, and legacy tables are allowed by waiver. |
| ENT-09 | no | - | Applies only to multi-tenant systems, which the app does not declare, and which entities and queries are tenant-scoped is a judgement. |
| ENT-10 | no | - | Anemia is a ratio of accessors to behaviour across a class and its callers; individual setters are allowed (ENT-12) and domain views may be getter-only. |
| ENT-11 | partial | paths, syntax | In `domain`, report classes suffixed `Manager`, `Helper`, `Data` or `Info`, and public methods named `set[A-Z]*`, `update*`, `save*`, `process*`, `handle*` or `manage*`; missing concepts stay for review. |
| ENT-12 | no | - | Setters are explicitly allowed when the language justifies them, so neither a setter nor a missing event can be reported without judgement. |
| ENT-13 | no | - | What counts as a secret is only guessable from names, which yields false positives and misses. |
| ENT-14 | partial | paths, syntax, heritage | On entities and aggregates, report a public `init` / `initialize` method; empty or optional-parameter constructors and uncontrolled creation stay for review. |
| ENT-15 | no | - | Which values make no sense for an attribute is a business judgement. |
| ENT-16 | no | - | Where whole-object validation lives and whether it collects every error is a judgement on behaviour. |
| ENT-17 | no | - | Which history matters to the business is a question for domain experts. |

### value-objects

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| VO-01 | no | - | Whether a primitive hides a domain concept is a modelling judgement, with an explicit exception for simple isolated attributes. |
| VO-02 | partial | paths, syntax | In aggregates and entities, report a member named `amount` or `*Amount` typed `number` / `bigint` / `string`, or a pair of members named `amount` and `currency`; periods, addresses and rates stay for review. |
| VO-03 | partial | paths, syntax, heritage | On value objects (`.value-object.ts` or extends `ValueObject`), report public `set` accessors, non-readonly fields, assignments to `this.*` outside the constructor, and fields typed by an entity; nested mutation through method calls stays for review. |
| VO-04 | partial | syntax, imports, heritage | In `domain`, report an assignment to a property of a field whose annotated type resolves to a value object (`this.address.city = ...`); field-by-field copies by callers stay for review. |
| VO-05 | partial | paths, syntax, heritage | In value-object methods, report assignments to `this.*` members or to properties of parameters; entity parameters (an allowed exception) and `getX` naming stay for review. |
| VO-06 | partial | paths, syntax, heritage, types | Report a value object that neither extends `ValueObject` nor declares `equals`, and `===` / `!==` between two operands typed as value objects; equality that ignores attributes stays for review. |
| VO-07 | no | - | Whether a local copy suffices or synchronisation is needed is a judgement on the upstream relationship. |
| VO-08 | partial | paths, syntax | In `domain`, report a member or property named `status`, `currency`, `*Status` or `*Currency` typed `string`; value objects that only check a value's shape stay for review. |
| VO-09 | no | - | Whether tests prove immutability is a judgement on test content. |
| VO-10 | no | - | Whether the data model shaped the domain model is a design judgement. |
| VO-11 | no | - | A repository writing child rows without deleting is compliant when nothing is ever removed from the collection, which a static check cannot tell. |

### domain-events

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| EVT-01 | no | - | Whether a fact matters to the business, and whether a requirement or a nightly batch should have been an event, is domain judgement. |
| EVT-02 | partial | paths, syntax, heritage | Report a DomainEvent subclass with a generic technical name (`EntityUpdated`, `Row*`/`*Inserted`); ORM hooks, triggers and CDC stay for review because the monitoring exception makes them legitimate. |
| EVT-03 | partial | paths, syntax, heritage | Report `new X()` in `application` or `driving` where X extends DomainEvent (directly or through a base); an emit/publish of an event built elsewhere stays for review. |
| EVT-04 | partial | paths, syntax, heritage | Report a DomainEvent subclass whose last word ends in `-ing` or is a technical term (`Updated`, `Saved`, `Persisted`, `Inserted`); imperative names and fit with the language stay for review, as irregular participles make a positive check unsafe. |
| EVT-05 | partial | paths, syntax, heritage | Report an event type in `domain` (`*.events.ts`) that neither extends the core DomainEvent nor declares an id and an occurrence date; what else a subscriber needs, tenant and correlated identities stay for review. |
| EVT-06 | partial | paths, syntax, heritage | Report a DomainEvent subclass with a non-readonly field, a `set` accessor, or a method assigning to `this`; mutation by a handler after creation and mutable payload types stay for review. |
| EVT-07 | partial | paths, syntax, heritage, types | Report an in-process listener (`@OnEvent` method or domain publisher subscriber) that calls `save` on an injected CommandRepository subclass; writes reached through a called handler and whether the emit happens inside the command stay for review. |

### repositories

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| REP-01 | partial | paths, syntax, heritage | Report a CommandRepository subclass whose managed type does not extend AggregateRoot, or two repository ports for the same aggregate type; DAO/table-gateway style per table stays for review. |
| REP-02 | partial | paths, syntax, heritage | Report a repository port or implementation method named `update*` or `set*`; finders returning partial aggregates and deletes forgetting child rows stay for review. |
| REP-03 | partial | paths, imports, syntax | Report ORM imports in repository port files or ORM types in a repository's public signatures, Prisma error classes or codes (`P2002`, `23505`) referenced outside `driven`, and a repository `add`/`save` declared to return `boolean`. |
| REP-04 | no | - | Linking each aggregate to its Prisma model and deciding whether the domain identity is the key or under a unique constraint needs a mapping the code does not state; Prisma already forces some unique key. |
| REP-05 | partial | paths, syntax, heritage, types | Report a command handler that loads an aggregate through `findById`, calls one of its methods that records an event or assigns a field, and never passes it to that repository's `save` in the same method (skipped when the variable escapes to another call). |
| REP-06 | partial | paths, syntax, heritage | Report a `remove`/`delete` method on a repository port with no call by that name anywhere in the context's `application`; which aggregates must be kept is business knowledge. |
| REP-07 | partial | paths, imports, syntax, heritage | Report a domain class extending a class imported from an ORM package, or an aggregate declaring its own `save`; ORM hooks and Prisma `$extends` stay for review because purely technical hooks are allowed. |
| REP-08 | partial | paths, syntax, heritage | Report an Entity/AggregateRoot subclass with a public `set` accessor, a public non-readonly field, or a parameterless constructor, and a call to its `restore` outside `driven`; whether a member exists only for hydration stays for review. |
| REP-09 | no | - | Detecting a renamed stored field without a migration or tolerant read needs history (a diff) and knowledge of which documents are already stored. |
| REP-10 | partial | paths, syntax, heritage | Report a repository method whose declared return type is an Entity subclass that is not an aggregate root (or a collection of it); value-object parts cannot be told apart from decision values (REP-11). |
| REP-11 | partial | paths, syntax, heritage | Report a query handler that injects repository ports of two or more aggregate types; a command assembling a response from several aggregates and screen-only finders stay for review. |
| REP-12 | no | - | Triggers, functions and `CASE`/`WHERE` clauses can be technical or covered by a documented non-functional requirement; telling a business rule apart is judgement. |
| REP-13 | partial | paths, syntax | Report `$transaction(` or `.transaction(` calls in a driven `*.repository.ts` or anywhere in `domain`; a use case writing several things without the Unit of Work stays for review. |
| REP-14 | partial | paths, imports, syntax, heritage | Report a write call (`create`, `update`, `upsert`, `delete*`, `$executeRaw`) in a driven `*.repository.ts` made on an injected `PrismaClient` or a class extending it, instead of the transaction client; a wrapper that proxies to the context stays for review. |
| REP-15 | partial | paths, syntax, heritage | Report a repository port with finders returning two or more distinct subclasses of the same aggregate base; identity-encoded types and caller switching stay for review because isolated switching is allowed. |
| REP-16 | partial | paths, syntax, heritage | Report a driven `*.repository.ts` without a matching `.integration-spec.ts`, and any `InMemory*Repository` or repository subclass declared under `__test__`; save-only assertions and missing cleanup stay for review. |

### factories

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| FAC-01 | no | - | Which identities are protected, whether a creation carries a rule, and which aggregate owns that rule are design judgements; `new` in a use case is allowed when no rule applies. |
| FAC-02 | no | - | Whether the language names who creates what is a ubiquitous-language judgement. |
| FAC-03 | partial | paths, syntax, heritage | When a domain method (static on X, or on another aggregate) contains `new X(` for an AggregateRoot X, report `new X(` in `application` or `driving`; creations elsewhere in `domain` stay for review. |
| FAC-04 | partial | paths, syntax, heritage | Report an aggregate method that contains `new Y(` for another aggregate Y and also assigns or pushes into `this` or calls `this.record`; factory methods saving through a repository fall under AGG-04's import check, and forgotten saves under REP-05. |

### services

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| SRV-01 | partial | paths, syntax | Report top-level functions (declarations or arrow constants) outside wiring files, and classes made only of static members; whether an operation belongs to an object stays for review. |
| SRV-02 | full | paths, syntax, heritage | Report a static method on an AggregateRoot subclass whose parameters are, or collect, other aggregate types, unless its declared return type is its own class (or a Result of it). |
| SRV-03 | no | - | Telling a business rule or a business calculation in a use case from coordination code, mapping or pagination arithmetic is judgement. |
| SRV-04 | partial | paths, syntax, heritage | Report a domain service (`*.service.ts` in `domain` or a DomainService subclass) with a non-readonly instance field or an assignment to `this` outside the constructor; naming stays for review. |
| SRV-05 | partial | paths, imports, syntax | Report a domain service importing the Unit of Work or transaction types, an ORM, or an authorization library, or calling `$transaction`; hand-written rights checks stay for review because of the fraud exception. |
| SRV-06 | partial | paths, syntax | Report a class named `*Impl`; whether a technical service should be an interface in `domain` stays for review. |
| SRV-07 | no | - | Whether a smaller value would suffice, and whether the caller needs the aggregate to call a method on it, is judgement. |
| SRV-08 | partial | paths | Report a domain service file without a matching `.spec.ts`; whether the tests cover each failure and the correctness of calculations stays for review. |

## Architecture and placement

### layers

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| LAY-01 | partial | paths, imports, heritage | Report a `domain` file importing any package other than `@alveolus/core`, a tactical `application` file importing `@prisma/client` or a `driven` file, and a concrete class in `domain`/`application` that extends a repository port; ORM-typed signatures that slip through other imports stay for review. |
| LAY-02 | full | paths, imports | Report a cycle in the import graph between sibling concept folders of `domain` (folder A imports B and B imports A, type-only imports included). |
| LAY-03 | no | - | Whether a `string` or generic identity was chosen "to avoid an import" is intent; external references legitimately stay strings, so a name/type heuristic would misfire. |
| LAY-04 | partial | paths, imports, syntax | Report an import from another bounded context outside its `public` folder (static, type-only, re-export, literal dynamic) and a `public` file importing `domain`; whether a `public` class carries behaviour stays for review (calibration: the import part is already automated). |

### placement

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| PLC-01 | full | paths | Report a declared tactical or transaction-script context folder without `<context>.module.ts`, or with a subfolder other than its style's layers and `__test__`; undeclared top-level `src` folders other than `shared` already fail the loader. |
| PLC-02 | partial | paths | Report a `shared/domain` folder or a file with a domain role suffix (`.aggregate`, `.entity`, `.value-object`, `.id`, `.events`, `.errors`) under `shared`; whether other `shared` code is business logic stays for review. |
| PLC-03 | full | paths | Report a file whose role suffix is not accepted by the layer it sits in (PLC-03 table, with `.service`/`.errors`/`.value-object` in `application` allowed only for transaction-script contexts), and a non-wiring role at the context root. |
| PLC-04 | partial | paths | Report a folder of `domain` or `application` named after a file type (`entities`, `value-objects`, `services`, `repositories`, `events`, `errors`, `ports`, `commands`, `queries`, `views`) and a bare `errors.ts`; whether a file sits in the right concept folder stays for review. |
| PLC-05 | partial | paths | Report a `domain`/`application` module folder named from a fixed deny list (`common`, `utils`, `helpers`, `core`, `misc`, `manager`); brand names and names missing from the language stay for review. |
| PLC-06 | no | - | Needs the diff and the meaning of a rename: whether a module name still fits its concept is judgement. |
| PLC-07 | partial | paths, imports | Report `driving`/`driven` subfolders named after a file type, and a known technology package imported outside its folder (`@prisma/client` outside `driven/prisma` and transaction-script `application`, `@nestjs/swagger` and HTTP decorators outside `driving/http`), wiring files exempt. |
| PLC-08 | partial | paths, imports | Report a `.consumer`/`.listener` file outside `driving` and a `.command` file importing another `.command` file; translation of events inside an aggregate or use case stays for review. |
| PLC-09 | partial | paths, syntax, imports | Report a `toRow`/`toJson`/`toJSON`/`toPersistence` method on a class in an `.aggregate`/`.entity` file, a tactical `domain`/`application` file importing `@prisma/client` or a `driving/http` schema, and a `driven` mapper imported from `driving`. |
| PLC-10 | partial | paths, imports | Report a file outside `src` importing the Prisma client, and a `.scheduler`/`.cli` file importing `@prisma/client` or a `driven` file instead of an application handler; business rules inside a job and manual SQL stay for review. |
| PLC-11 | partial | paths, imports | Report an import of a file under a `driven/http/<upstream>/generated/` folder from outside that upstream folder; hand edits and generated code without a `generated/` folder need regeneration or judgement. |
| PLC-12 | no | - | An adapter no module binds may be a replacement not yet switched in; config-driven `if`s and port changes made for the new adapter are judgement over time. |

### naming

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| NAM-01 | full | paths | Report a `.ts` file outside `generated/` and `__test__` whose name does not end with a role from the closed PLC-03 list. |
| NAM-02 | full | paths | Report a file name that is not one kebab-case concept followed by exactly one known role and `.ts`. |
| NAM-03 | partial | paths, syntax, imports | Report an `.aggregate`/`.entity`/`.value-object` file whose main export is not a class, and a `.repository` file in `driven` that also imports an HTTP client package; whether contents match the role (a command that reads a view) mostly stays for review. |
| NAM-04 | partial | paths, syntax | Report a singular-role file (`.aggregate`, `.entity`, `.value-object`, `.id`, `.repository`, `.port`, `.controller`, `.mapper`, `.module`, `.command`, `.query`) that does not export the PascalCase name its concept and role dictate; plural roles and ambiguous ones (`.adapter`, `.request`) stay for review. |
| NAM-05 | partial | paths, syntax | Report a type declared in `domain` whose name ends with `Aggregate`, `Entity`, `ValueObject` or `VO`; `Event`, `Error` and `Model` suffixes can be business words and stay for review. |
| NAM-06 | partial | paths, syntax | Report a class in `driving`/`driven` named only after a role (`Controller`, `Handler`, `Mapper`, `Repository`), prefixed `Default`, or ending in a digit; whether the technology prefix is right stays for review (`WalletsFacadeAdapter` is the accepted pattern). |
| NAM-07 | full | paths, syntax | Report an interface or abstract class in a port file (`.repository`, `.port`, `.facade`) of `domain`/`application`/`public`, or any interface there, named `I` + uppercase + lowercase (`IClock` flagged, `Iban` not). |
| NAM-08 | partial | paths, syntax | Report a `.id` file whose exported identity is not named `<Concept>Id`; generic error types with a `code` field are indistinguishable from errors carrying a business code (a currency code) and stay for review. |

### wiring

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| WIR-01 | partial | paths, syntax, imports, heritage | Report `new X()` of a class declared in `driven` from a non-wiring file of `domain`/`application`/`driving`, a `provide:` port declared in a context bound in `app.module.ts`, `shared.module.ts` or another context's module, and the same token provided in two modules; runtime selection inside a class stays for review. |
| WIR-02 | partial | paths, syntax, imports | Report an `@Module` in `app.module.ts` with any key other than `imports`, and `main.bootstrap.ts` importing a context's `domain`/`application`/`driven` file or calling `app.get`/`app.resolve`; other side effects before `listen` stay for review. |
| WIR-03 | full | paths, syntax, imports | Report an entry of a context module's `exports` that does not resolve to a declaration in that context's `public` folder (`shared.module.ts` exempt); another context importing the module is already an import outside `public`. |
| WIR-04 | partial | paths, syntax, imports, heritage | Report `ModuleRef` used outside wiring files, an exported module-level `const x = new Y()` outside wiring files, and `new X()` inside a method where X resolves to a port implementation in `driven`; registries and post-construction assignment stay for review. |
| WIR-05 | full | paths, syntax, imports | Report `@Injectable`, `@Inject` or `@Optional` from `@nestjs/common` on any class or parameter outside `driving/http` and wiring files (`.module`, `.wiring`, `.bootstrap`, `.config`). |
| WIR-06 | full | paths, syntax, heritage | Report a constructor parameter without `@Inject` in a class NestJS instantiates (decorated `@Controller`, guard, pipe, filter, interceptor), and a `useClass` or bare provider class whose own or inherited constructor takes parameters. |
| WIR-07 | full | syntax, heritage, imports | Report a `provide:` value or `@Inject()` argument that is a string or template literal, or an identifier resolving to a string constant or `Symbol()` declared in the app; tokens imported from `@nestjs/*` are exempt. |
| WIR-08 | partial | paths, syntax | Report `scope: Scope.REQUEST`, and an assignment to a `this` field outside the constructor and the NestJS lifecycle hooks in classes of `application`/`driving`/`driven`; caches and other started-once state stay for review. |
| WIR-09 | partial | syntax, imports | Report a Prisma write call (`create`, `upsert`, `update*`, `delete*`, `$executeRaw`) inside a startup lifecycle hook (`onModuleInit`, `onApplicationBootstrap`); swallowed refusals and non-idempotent steps are runtime behaviour. |
| WIR-10 | partial | paths, syntax | Report a `main.bootstrap.ts` that never calls `enableShutdownHooks()`, and a class that calls `setInterval` without a `clearInterval` in a shutdown hook; clients left open and shutdown ordering stay for review. |
| WIR-11 | partial | paths, syntax | Report any read of `process.env` (member, destructuring, `node:process` import) outside a `.config.ts` file; detecting the same default repeated across config files means interpreting Zod schemas and stays for review. |

### use-cases

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| UC-01 | partial | paths, syntax, heritage | In tactical contexts, report `Partial<…>` in a command message type and a `CommandHandler`/`QueryHandler` subclass with a public method other than `handle`; generic save/update methods and generic `PATCH` endpoints are judgement. |
| UC-02 | partial | paths, imports | Report a `domain`/`application` file importing `express`, `fastify`, Node `http` types, broker packages, or HTTP exceptions and request decorators (`*Exception`, `HttpStatus`, `Req`, `Res`, `Headers`) from `@nestjs/common`; duplicated methods and fat driving adapters stay for review. |
| UC-03 | partial | syntax, heritage | In tactical contexts, report one command or query message type used by two handlers; the length of a primitive parameter list is a team threshold the rule itself leaves open. |
| UC-04 | no | - | Whether a use case decides instead of coordinating is a reading of business logic; complexity metrics are only a hint. |
| UC-05 | partial | paths, imports, heritage | Report a `CommandHandler` subclass whose constructor takes, or whose file imports, another command handler, and a `.consumer` file importing another consumer; the same coupling between transaction-script service methods stays for review. |
| UC-06 | no | - | Which operations are reserved to a role, and whether every entry point checks it, is business and security knowledge; a missing guard is not wrong by itself. |
| UC-07 | partial | config, syntax | Report a `tsconfig.json` without `strictNullChecks` (or `strict`), and a non-null assertion `!` on the awaited result of a repository or port call in `application`; with strict null checks the compiler covers unchecked calls. |
| UC-08 | partial | paths, imports, heritage, syntax | Report a `.command` file importing a `.view` or `*-views.port` file, a `.query` file importing a `.repository` or `.aggregate` file, and a `CommandHandler<C, R, E>` whose `R` is neither `void` nor a type declared in an `.id` file; unannotated return types need the type checker. |
| UC-09 | partial | paths, imports | Report a `driving` file importing an `.aggregate` or `.entity` file; aggregates exposing internals for display and per-screen getters stay for review. |
| UC-10 | partial | paths, syntax | Report locale formatting (`Intl.*Format`, `toLocale*String`) in `domain`; display-oriented property names (`label`, `color`, `displayName`) can be business terms and stay for review. |

### http-api

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| API-01 | partial | paths, imports | Report a `driving` file importing `domain`, and a `domain` file importing `class-transformer`, `class-validator` or `@nestjs/swagger`; returning an aggregate through an inferred type needs the type checker. |
| API-02 | partial | paths, syntax, imports, heritage | Report a `@Get` controller method that calls `handle` on a field whose type resolves to a command handler, and use of `@Session()` or `express-session`; idempotency of `PUT`/`DELETE` and CRUD-shaped routes stay for review. |

### persistence

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| PER-01 | partial | config | Report a Prisma model without `@@schema`, a model in `<context>.prisma` whose `@@schema` is not that context (outbox tables copied included), models in `schema.prisma` when several contexts exist, and an `@@map` prefixed with a context name; database roles are outside the code. |
| PER-02 | partial | config | Report a Prisma `DateTime` without `@db.Date` or `@db.Timestamptz`, an `@id` `String` without `@db.Uuid`, and a `status` field typed `String`; a `Float` may not be an amount and a date stored at midnight is judgement. |
| PER-03 | partial | config | Report a `<model>Id` field referencing a model of the same context file without a `@relation`; which uniqueness the business states and which columns the model always fills need business knowledge. |
| PER-04 | partial | paths, syntax, heritage | Report a `driven` mapper that does not extend `RowMapper`, `new X()` of a domain class inside a mapper, and `??`/`\|\|` with a non-null literal fallback in a mapper; a logged-then-replaced refusal stays for review. |
| PER-05 | partial | paths, syntax, imports, heritage | Report a mapper whose constructor takes a repository or Prisma client, or that imports a runtime value from `@prisma/client`; whether a field mapping computes a rule or converts a format is judgement. |
| PER-06 | partial | paths, syntax, config | Report a Prisma `skip` without `cursor`, and a `findMany` with `take` whose `orderBy` contains no `@id`/`@unique` field of the model; a `findMany` without `take` may be a business-bounded list (exception) and stays for review. |
| PER-07 | no | - | Which reads need an index depends on volumes and frequency (small-table exception); production-only indexes are outside the code. |
| PER-08 | partial | paths, syntax, imports, heritage | Report a call, inside a `unitOfWork.run` callback, on a port whose module binding resolves to an implementation in `driven/http`; e-mails behind other ports and long batch transactions stay for review. |
| PER-09 | no | - | A `max + 1` read is safe under a lock, a counter row or an aggregate version taken elsewhere; the protection is not visible in one function. |
| PER-10 | no | - | Needs a database (`prisma migrate diff`), git history of applied migrations or production state, not static code facts. |
| PER-11 | no | - | `DROP`, `RENAME` and `SET NOT NULL` are legitimate at the contract step or for a context with no version in service; whether the running version still needs the column is deployment knowledge. |
| PER-12 | no | - | An `UPDATE` in a migration may be a legitimate backfill of a derived column (exception); telling a fact correction from a backfill is business meaning. |

### tests

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| TST-01 | partial | paths, syntax, imports, heritage | Report `vi.mock`/`jest.mock` of `@prisma/client` or an HTTP library, `nock`/`msw` imports, a test class extending a repository or port, and a domain `.spec.ts` importing Testcontainers or Prisma; the package must then read `__test__` folders, which it leaves out today. |
| TST-02 | no | - | Realistic data and business-sentence test names are judgement. |
| TST-03 | partial | paths, syntax, imports | Report `overrideProvider`, `Test.createTestingModule` with a `providers` key outside `.integration-spec` files, and a domain `.spec.ts` importing `@nestjs/testing`; requires reading `__test__` folders. |
| TST-04 | partial | syntax | Report a test body without `// Arrange`, `// Act`, `// Assert` comments in that order, or with more than one `// Act`; whether an `expect` triggers the behaviour and repeated setup stay for review. |
| TST-05 | partial | paths, imports | Report a test file outside a `__test__` folder (a global `test/`), a `.spec.ts` whose tested file is not in the parent folder, and a `shared/__test__` file importing a bounded context; requires reading `__test__` folders. |
| TST-06 | partial | paths, imports | Report a `.test.ts` file, `helpers.ts`/`utils.ts` in `__test__`, and a `.spec.ts` importing Testcontainers or the database setup; the names of `support/`, `contract/` and `scenarios/` files are not fixed, so a closed naming check would misfire. |

## Integration

### contracts

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| PUB-01 | partial | paths, imports | Report a `public` file that imports from its context's `domain`, `application` or `driven`, or from `@prisma/client`; entities serialized as API responses and undocumented schemas stay for review. |
| PUB-02 | partial | paths, syntax | Report a `public` file that declares a class or a function (behaviour) rather than types and constants; recomputing the producer's calculations in a consumer stays for review. |
| PUB-03 | partial | paths, syntax, heritage | Report a published message type (the `type` given to `EventTranslator.wrap`, followed to its constant in `public`, or an `IntegrationEvent<'...'>` type argument) that is not `<own context>.<aggregate>.<Event>`, and a type built from `constructor.name`; subscriptions by short name stay for review. |
| PUB-04 | no | - | A breaking change without a new version needs the previously published contract (history), not one snapshot. |
| PUB-05 | partial | paths, imports, syntax | Report a `driving` `.consumer.ts` file, or a schema it imports, that validates with Zod `z.strictObject` or `.strict()`; required unused fields and recently added fields stay for review. |
| PUB-06 | no | - | Whether a field or endpoint serves one consumer or several is organisational knowledge. |
| PUB-07 | no | - | Whether an API answers integrators' use cases or exposes navigable model resources is judgement. |

### translation

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| ACL-01 | partial | paths, imports, config | Report a `domain` or `application` file that imports anything from another bounded context (its `public` included) unless the context map declares a conformist relation between the two; duplicated translations and adapters returning upstream types stay for review. |
| ACL-02 | no | - | Whether a translation copies "too much" of the upstream is a modelling judgement. |
| ACL-03 | no | - | Knowing which aggregate fields are copies of foreign data, and which upstream events change them, needs business knowledge. |
| ACL-04 | no | - | Telling a command drawn from a foreign event that must compare fact dates from one that need not (e.g. a notification) is a judgement; per-attribute date tracking is behaviour. |

### messaging

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| MSG-01 | partial | imports, heritage | Report a class extending `@alveolus/core` `CommandHandler` that depends on `EventPublisher` (or a subclass) or on a broker client package instead of the `Outbox`; publishing before commit through other ports stays for review. |
| MSG-02 | partial | paths, syntax, heritage | In the `driven` class extending `@alveolus/core` `Outbox`, report a delete (`delete`, `deleteMany`, raw `DELETE`) and any update outside `markPublished`; note that core's `markPublished` itself updates rows, so the rule and core must agree first. |
| MSG-03 | partial | paths, imports | Report a `domain` file that imports `OutboxRelay` or declares a `.relay.ts` forwarder; ordering and tracking after broker confirmation are behaviour. |
| MSG-04 | no | - | Consumer deduplication is an app-side pattern (`IntegrationConsumer` is not in core), and the exception for naturally idempotent operations needs judgement. |
| MSG-05 | no | - | Whether a handler looks up by business key or state before creating is behaviour, not syntax. |
| MSG-06 | no | - | Whether order matters to a consumer, and how it is tolerated, is runtime and business behaviour. |
| MSG-07 | no | - | Back-off, resubscription and lag alerting are runtime and operations concerns. |

### remote-calls

| Code | Verdict | Facts | Check |
| --- | --- | --- | --- |
| PRC-01 | partial | paths, syntax | Report in `driven` a `fetch` call whose options are missing or an object literal without `signal` and without spread, and an `axios.create` or `HttpModule.register` literal without `timeout`; loops, retries, hosts and authentication stay for review. |
| PRC-02 | no | - | Whether a synchronous call could be local state is a design trade-off the exception allows when chosen on purpose. |
| PRC-03 | no | - | Which optional fields reference another context's resource is business meaning. |
| PRC-04 | no | - | Whether a foreign event has real meaning for the receiver is a trade-off the rule calls not absolute. |
| PRC-05 | no | - | Process identity, tracking, timeout and compensation are design and runtime behaviour. |
| PRC-06 | no | - | Whether a composition layer has started taking business decisions is judgement. |

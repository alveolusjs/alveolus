export type PackId =
	| 'errors'
	| 'persistence-and-messaging'
	| 'wiring-and-naming'
	| 'architecture-and-modeling'
	| 'testing'
	| 'operations';

export interface Pack {
	readonly id: PackId;
	readonly title: string;
	readonly summary: string;
}

export interface ConventionGroup {
	readonly id: string;
	readonly pack: PackId;
	readonly label: string;
	readonly alternativeTo?: string;
	readonly carriedBy?: readonly string[];
}

export const packs: Pack[] = [
	{
		id: 'errors',
		title: 'Erreurs et refus',
		summary:
			'Comment un refus métier va du modèle à l’appelant, puis à HTTP, et comment une entrée atteint un use case.',
	},
	{
		id: 'persistence-and-messaging',
		title: 'Persistance et messages',
		summary: 'La base, la transaction, les identités, et la façon dont les events quittent le bounded context.',
	},
	{
		id: 'wiring-and-naming',
		title: 'Wiring, nommage et rangement',
		summary:
			'Comment les classes se construisent et se lient, comment se nomment fichiers, types et membres, où vont les fichiers, et comment s’écrit un waiver.',
	},
	{
		id: 'architecture-and-modeling',
		title: 'Architecture et forme du modèle',
		summary:
			'Le style de chaque bounded context, la séparation des handlers, et la forme des value objects, des services et des scripts.',
	},
	{
		id: 'testing',
		title: 'Tests',
		summary: 'L’infrastructure des tests, et la façon d’écrire et de ranger un test.',
	},
	{
		id: 'operations',
		title: 'Exploitation',
		summary: 'Les logs, les sondes de santé et l’arrêt.',
	},
];

export const conventionGroups: ConventionGroup[] = [
	{
		id: 'errors.result',
		carriedBy: ['AGG-01', 'UC-02', 'UC-08', 'UC-07', 'ENT-15', 'ENT-16', 'REP-03', 'TXS-04'],
		pack: 'errors',
		label: 'Les refus métier en `Result<T, E>`, l’absence en `undefined`, les exceptions réservées aux pannes',
	},
	{
		id: 'errors.exceptions',
		pack: 'errors',
		label: 'Les refus métier levés comme des exceptions nommées, traduites en statut HTTP par un exception filter, sans catch qui avale un refus',
		alternativeTo: 'errors.result',
	},
	{
		id: 'http.refusal-mapping',
		carriedBy: ['UC-02', 'UC-07', 'API-01'],
		pack: 'errors',
		label: 'Un refus devient un statut HTTP par son `type`, sans importer le domaine',
	},
	{
		id: 'validation.in-model',
		pack: 'errors',
		label: 'La validation de l’objet entier à part, qui collecte toutes les erreurs',
	},
	{
		id: 'usecase.command-input',
		pack: 'errors',
		label: 'Un objet command par opération, la requête validée à la frontière, l’appelant porté par la command',
	},
	{
		id: 'persistence.prisma',
		carriedBy: ['LAY-01', 'AGG-15', 'REP-02', 'REP-05', 'REP-07', 'REP-08', 'VO-11'],
		pack: 'persistence-and-messaging',
		label: 'PostgreSQL et Prisma, les modèles Prisma séparés du domaine',
	},
	{
		id: 'persistence.unit-of-work',
		carriedBy: ['REP-13', 'REP-14'],
		pack: 'persistence-and-messaging',
		label: 'Le Unit of Work dans `application`, la transaction portée par `AsyncLocalStorage`',
	},
	{
		id: 'persistence.explicit-transaction',
		pack: 'persistence-and-messaging',
		label: 'Le use case ouvre `prisma.$transaction` et passe son client à chaque écriture',
		alternativeTo: 'persistence.unit-of-work',
	},
	{
		id: 'persistence.no-cascade',
		carriedBy: ['REP-02'],
		pack: 'persistence-and-messaging',
		label: 'Aucune suppression en cascade dans la base : le repository supprime les parties, puis l’aggregate root',
	},
	{
		id: 'persistence.postgres-schema',
		carriedBy: ['PER-01', 'PER-02', 'VO-08'],
		pack: 'persistence-and-messaging',
		label: 'Un schéma PostgreSQL par bounded context, les montants en `BigInt` d’unités mineures, les statuts en enums Prisma',
	},
	{
		id: 'persistence.row-mapper',
		carriedBy: ['PER-04'],
		pack: 'persistence-and-messaging',
		label: 'Les mappers étendent `RowMapper` : une ligne corrompue lève une erreur à la lecture',
	},
	{
		id: 'persistence.read-performance',
		pack: 'persistence-and-messaging',
		label: 'Des listes bornées, des lectures appuyées sur un index déclaré dans le schéma',
	},
	{
		id: 'scripts.prisma-direct',
		carriedBy: ['TXS-06', 'TXS-07'],
		pack: 'persistence-and-messaging',
		label: 'Les transaction scripts utilisent Prisma directement, à travers le client du Unit of Work',
	},
	{
		id: 'identity.uuid-class',
		carriedBy: ['ENT-03', 'ENT-05', 'ENT-08'],
		pack: 'persistence-and-messaging',
		label: 'Une classe par identité, l’identité suivante donnée par le repository, des UUIDv7 générés dans `driven`',
	},
	{
		id: 'messaging.outbox-forwarder',
		carriedBy: ['AGG-08', 'MSG-01', 'MSG-03', 'MSG-07'],
		pack: 'persistence-and-messaging',
		label: 'Outbox et forwarder interne, pas de broker au départ',
	},
	{
		id: 'messaging.event-handler-registry',
		carriedBy: ['EVT-07', 'EVT-08'],
		pack: 'persistence-and-messaging',
		label: 'Un registre des event handlers par bounded context, chacun déclaré synchrone ou asynchrone',
	},
	{
		id: 'contracts.message-versioning',
		carriedBy: ['PUB-04'],
		pack: 'persistence-and-messaging',
		label: 'Un message publié porte sa `version`, un fichier par version dans `public`',
	},
	{
		id: 'contracts.message-naming',
		pack: 'persistence-and-messaging',
		label: 'Le type d’un message publié s’écrit `<context>.<aggregate>.<Event>`',
	},
	{
		id: 'wiring.no-nest-decorators',
		carriedBy: ['WIR-05'],
		pack: 'wiring-and-naming',
		label: 'Des classes simples construites par le module avec `construct`, aucun décorateur NestJS hors de `driving/http` et des modules',
	},
	{
		id: 'wiring.composition-root',
		pack: 'wiring-and-naming',
		label: 'Un niveau de wiring par fichier : bootstrap, module de l’application, module de chaque bounded context',
	},
	{
		id: 'wiring.explicit-tokens',
		pack: 'wiring-and-naming',
		label: 'Des injection tokens explicites, un port qui est son propre token',
	},
	{
		id: 'wiring.config-files',
		pack: 'wiring-and-naming',
		label: 'La configuration lue et vérifiée une fois dans `*.config.ts`, puis passée en valeurs',
	},
	{
		id: 'naming.private-fields',
		carriedBy: ['NAM-09'],
		pack: 'wiring-and-naming',
		label: 'Les membres privés en `#`, sans parameter property',
	},
	{
		id: 'naming.files',
		pack: 'wiring-and-naming',
		label: 'Un fichier `<concept>.<role>.ts` en kebab-case, dont le rôle et l’export principal suivent le nom',
	},
	{
		id: 'naming.types',
		pack: 'wiring-and-naming',
		label: 'Des noms de types fixes : `<Technology><Port>`, pas de préfixe `I`, `<Concept>Id`, un type d’erreur par refus',
	},
	{
		id: 'layout.by-concept-and-technology',
		carriedBy: ['PLC-04', 'NAM-01', 'NAM-05', 'ACL-01'],
		pack: 'wiring-and-naming',
		label: '`domain` et `application` par concept, `driving` et `driven` par technologie, le suffixe du fichier nomme le rôle',
	},
	{
		id: 'layout.generated-code',
		pack: 'wiring-and-naming',
		label: 'Le code généré dans `generated/`, reconstruit par une commande, vérifié en CI',
	},
	{
		id: 'waivers.comment-adr',
		pack: 'wiring-and-naming',
		label: 'Le waiver signalé par un commentaire, avec une ADR s’il est structurel',
	},
	{
		id: 'style.per-context',
		carriedBy: ['CTX-14', 'TXS-05', 'TXS-08'],
		pack: 'architecture-and-modeling',
		label: 'Un style par bounded context, déclaré dans `architecture.json`',
	},
	{
		id: 'architecture.no-cqrs-es',
		carriedBy: ['CTX-16'],
		pack: 'architecture-and-modeling',
		label: 'Pas de CQRS ni d’event sourcing au départ',
	},
	{
		id: 'cqrs.handler-split',
		carriedBy: ['UC-01', 'UC-08'],
		pack: 'architecture-and-modeling',
		label: 'Les command handlers sur les aggregates, les query handlers sur les views, mêmes tables',
	},
	{
		id: 'domain.classes',
		carriedBy: ['SRV-01'],
		pack: 'architecture-and-modeling',
		label: 'Le comportement dans des classes : aggregate, value object, puis domain service',
	},
	{
		id: 'modeling.value-objects',
		pack: 'architecture-and-modeling',
		label: 'La forme d’un value object : remplacé en entier, méthodes sans effet de bord, égalité par attributs',
	},
	{
		id: 'design.interface-when-needed',
		pack: 'architecture-and-modeling',
		label: 'Une interface séparée seulement quand elle sert, pas de suffixe `Impl`',
	},
	{
		id: 'scripts.service-per-concept',
		pack: 'architecture-and-modeling',
		label: 'Un application service par concept, une méthode par use case, aucun script qui en appelle un autre',
	},
	{
		id: 'testing.testcontainers',
		carriedBy: ['TST-01', 'REP-16', 'INF-01', 'INF-02'],
		pack: 'testing',
		label: 'Pas de test double in-memory : un PostgreSQL jetable (Testcontainers), construit par les migrations',
	},
	{
		id: 'testing.msw-contracts',
		carriedBy: ['TST-01', 'INF-03', 'INF-05'],
		pack: 'testing',
		label: 'Un système tiers simulé par MSW depuis son contrat OpenAPI figé, testé contre sa sandbox',
	},
	{
		id: 'testing.vitest-coverage',
		carriedBy: ['COV-01'],
		pack: 'testing',
		label: 'Vitest, le domaine couvert à 100 % par ses seuls tests unitaires',
	},
	{
		id: 'testing.time-and-order',
		carriedBy: ['TST-07'],
		pack: 'testing',
		label: 'L’heure fixée par `vi.setSystemTime`, l’ordre des tests mélangé en CI',
	},
	{
		id: 'testing.real-modules',
		carriedBy: ['TST-03'],
		pack: 'testing',
		label: 'Les tests démarrent les vrais modules, sans port remplacé',
	},
	{
		id: 'testing.test-style',
		pack: 'testing',
		label: 'Des tests écrits en phrases métier, en Arrange/Act/Assert, un describe par règle métier',
	},
	{
		id: 'testing.layout',
		pack: 'testing',
		label: 'Les tests dans `__test__`, à côté du code, le suffixe du fichier donne le niveau du test',
	},
	{
		id: 'operations.logging',
		pack: 'operations',
		label: 'Des logs JSON aux noms d’events fixes, une panne loguée une fois, là où elle est traitée',
	},
	{
		id: 'operations.health-probes',
		pack: 'operations',
		label: 'Une sonde « vivante » et une sonde « prête », distinctes',
	},
	{
		id: 'operations.graceful-shutdown',
		pack: 'operations',
		label: 'Ce que le wiring ouvre, il le ferme et l’attend',
	},
];

const groupIds = new Set(conventionGroups.map((group) => group.id));

export function isConventionGroup(value: unknown): value is string {
	return typeof value === 'string' && groupIds.has(value);
}

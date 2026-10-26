---
code: WIR-09
title: Le travail au démarrage passe par des use cases, et un échec arrête le démarrage
group: Durée de vie
scope: [structure, application]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# WIR-09 · Le travail au démarrage passe par des use cases, et un échec arrête le démarrage

<RuleMeta />

## Signal

- Au démarrage, dans `onModuleInit`, du code qui écrit des données de référence directement en base avec Prisma, au lieu d’appeler le use case qui les gère. Par exemple, les devises qu’un wallet peut tenir.
- Un refus au démarrage simplement écrit dans les logs, et l’application qui continue de démarrer.
- Une étape de démarrage qui échoue au deuxième démarrage, parce que les données sont déjà là.

## Pourquoi

Écrire directement en base contourne les règles et les events du use case. Une devise ajoutée à la main dans une table ne déclenche pas l’event que les autres bounded contexts attendent.

Une application qui démarre malgré un échec sert des requêtes sur des données qui manquent. C’est le premier titulaire qui s’en aperçoit.

L’étape tourne à chaque démarrage, sur chaque instance. Elle doit donner le même résultat la deuxième fois.

## Exceptions

Les migrations du schéma, qui tournent avant l’application, avec leur propre outil.

## Correction

Le module du bounded context appelle la command dans un hook de cycle de vie, et lève une exception si elle refuse : le processus s’arrête, et la plateforme le redémarre ou lève une alerte. La command traite ce qui est déjà fait comme un succès : activer une devise déjà active renvoie `ok`.

```ts
export class WalletsModule implements OnModuleInit {
	readonly #enableCurrency: EnableCurrencyHandler;

	constructor(@Inject(EnableCurrencyHandler) enableCurrency: EnableCurrencyHandler) {
		this.#enableCurrency = enableCurrency;
	}

	async onModuleInit(): Promise<void> {
		for (const currency of walletsConfig.currencies) {
			const enabled = await this.#enableCurrency.handle({ currency });

			if (!enabled.ok) {
				throw new Error(`Currency ${currency} could not be enabled: ${enabled.error.type}`);
			}
		}
	}
}
```

## Voir aussi

MSG-05 rend une opération sûre à rejouer. WIR-11 lit la liste des devises dans la configuration. PLC-10 fait passer de la même façon les traitements planifiés et ponctuels par des use cases.

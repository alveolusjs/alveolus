---
code: WIR-01
title: Le module du bounded context est le seul endroit qui lie un port à son implémentation
group: La composition root
scope: [structure, application, driving, driven]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Dependency Inversion Principle"
  - "Hexagonal or Ports and Adapters"
  - "Infrastructure"
---

# WIR-01 · Le module du bounded context est le seul endroit qui lie un port à son implémentation

<RuleMeta />

## Signal

- `new PrismaWalletRepository(…)` dans un handler, un domain service ou un controller.
- Une classe qui choisit elle-même son implémentation : `if (config.sandbox) { this.rates = new FixedRates() }`.
- Le port d’un bounded context lié dans `app.module.ts`, dans `shared.module.ts` ou dans le module d’un autre bounded context.
- Le même port lié dans deux modules.

## Pourquoi

Le lien est une décision : quelle base, quel provider, quelle horloge. Prise dans un seul fichier par bounded context, elle se lit à un seul endroit et se change à un seul endroit. Répartie dans les classes, elle attache chacune à une technologie, et personne ne sait quelle implémentation tourne sans toutes les lire.

Le domaine et l’application ne connaissent que le port. Le module est le seul fichier du bounded context autorisé à connaître les deux côtés.

## Exceptions

Les ports techniques partagés par tous les bounded contexts (Unit of Work, outbox, horloge) sont liés une seule fois, dans `shared.module.ts` (PLC-02).

## Correction

Un `<context>.module.ts` à la racine du bounded context (PLC-01) lie chaque port du bounded context à son implémentation. Un choix qui dépend de l’environnement se fait là, d’après la configuration (WIR-11).

```ts
// wallets.module.ts
{ ...construct(PrismaWalletRepository, [PrismaUnitOfWork]), provide: WalletRepository },
{
	provide: ExchangeRates,
	useFactory: () => new HttpExchangeRates(walletsConfig.ratesUrl, new RatesProviderTranslator()),
},
```

## Voir aussi

LAY-01 place le port dans le domaine et l’implémentation dans `driven`. WIR-04 dit comment une classe reçoit ce que le module a construit. PLC-12 s’appuie sur ce choix pour remplacer un adapter.

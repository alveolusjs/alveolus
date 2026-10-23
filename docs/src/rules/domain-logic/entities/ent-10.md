---
code: ENT-10
title: Pas d’anemic model
group: Comportement
scope: [domain, application]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Un lint repère les setters et les propriétés publiques modifiables dans domain/ ; la logique dans les services se juge en revue.
review: approved
sources:
  - "Why You Should Do DDD › Anemia and Memory Loss (Table 1.2)"
  - "The Challenges of Applying DDD"
---

# ENT-10 · Pas d’anemic model

<RuleMeta />

## Signal

- Une classe du domaine faite surtout de getters, de setters et de propriétés publiques, avec peu ou pas de logique métier. Les services qui l’utilisent portent les règles et enchaînent ses setters.
- Un appelant qui doit appeler plusieurs setters dans le bon ordre pour mener à bien une seule intention métier.
- Un setter auquel on a ajouté des préconditions, et qui doit alors connaître tout l’état de l’objet : le problème n’a fait que se déplacer.

## Pourquoi

On paie un modèle du domaine (mapping, couches) sans en avoir le bénéfice. C’est un modèle de données déguisé en objets, plus proche d’Active Record que d’un modèle du domaine.

Chaque appelant doit savoir garder l’objet cohérent. Une vérification oubliée, et c’est un bug : un wallet se ferme alors qu’il garde un solde.

## Exceptions

Les DTO, les read models et les classes de l’ORM tenus à l’écart du domaine ne sont pas le modèle. Un bounded context construit en transaction scripts par choix est déclaré comme tel (CTX-14), et c’est TXS-07 qui s’applique.

## Correction

Remplacer chaque groupe de setters par une méthode métier, nommée dans le langage du métier. Elle porte les préconditions et enregistre les events.

Le test tient en deux questions :

1. Le « modèle » est-il fait surtout de getters et de setters ?
2. Ses appelants portent-ils la logique métier en appelant ces setters ?

Deux oui : le modèle est anémique.

## Voir aussi

AGG-01 vise une règle métier décidée hors de l’aggregate. ENT-10 vise la classe entière. Si les deux s’appliquent aux mêmes lignes, ne relever qu’un finding, qui cite les deux.

## Exemple

```ts
// Avoid: the client holds the rule and rebuilds the intent with setters
if (wallet.getBalance().isZero() && wallet.getBlocks().length === 0) {
	wallet.setStatus('closed');
	wallet.setClosedAt(this.#clock.now());
}
```

```ts
// Preferred: one intent, one method
const closed = wallet.close(this.#clock.now());

if (!closed.ok) {
	return closed;
}
```

Dans le premier bloc, la règle de fermeture vit chez l’appelant, et rien n’enregistre `WalletClosed`. `close()` vérifie que le solde est nul et qu’aucun blocage ne reste, change le statut et enregistre l’event.

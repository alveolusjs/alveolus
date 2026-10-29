---
code: COV-01
title: Le domaine est couvert à 100 %
group: Preuves
scope: [domain, tests]
style: [tactical]
severity: major
detection: []
review: approved
sources: []
---

# COV-01 · Le domaine est couvert à 100 %

<RuleMeta />

## Signal

- Une branche du domaine sans test unitaire : un refus, un cas limite.
- Une couverture du domaine mesurée avec les tests end-to-end.
- Un seuil abaissé, un fichier exclu de la mesure, un hint `v8 ignore`.

## Pourquoi

Le domaine se teste sans infrastructure, en une milliseconde : rien ne justifie une branche sans test. Un seuil sous 100 % se négocie, et la branche suivante passe sans bruit. Seuls les tests unitaires comptent : un test end-to-end traverse une branche sans la vérifier. Une ligne que rien n’atteint, même exigée par le compilateur, signale un modèle incohérent.

## Exceptions

Aucune.

## Correction

- Un test unitaire par branche : le succès, chaque refus, chaque cas limite.
- Une ligne qu’aucun test n’atteint se supprime, ou son type se resserre jusqu’à ce qu’elle disparaisse.

## Adaptation

**Notre choix** : Vitest et son provider `v8`. La CI lance les seuls tests unitaires avec `vitest run --project unit --coverage`, et échoue sous 100 %.

```ts
export default defineConfig({
	test: {
		projects: [
			{ test: { name: 'unit', include: ['src/**/*.spec.ts'] } },
			{ test: { name: 'integration', include: ['src/**/*.integration-spec.ts', 'src/**/*.e2e-spec.ts'] } },
		],
		coverage: { provider: 'v8', include: ['src/*/domain/**/*.ts'], thresholds: { 100: true } },
	},
});
```

## Voir aussi

COV-02 dit où prouver une règle métier. SRV-08 et VO-09 disent ce que prouvent les tests d’un domain service et d’un value object.

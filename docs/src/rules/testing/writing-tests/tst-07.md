---
code: TST-07
title: Un test est déterministe
group: Fiabilité
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# TST-07 · Un test est déterministe

<RuleMeta />

## Signal

- `new Date()`, `Date.now()` ou `Math.random()` dans un test.
- Une assertion sur une identité générée, ou sur une date que le test n’a pas fixée.
- `await sleep(500)`, pour laisser un traitement asynchrone finir.
- Un test qui ne passe qu’après un autre.

## Pourquoi

Un test qui dépend de l’heure, du hasard ou de l’ordre échoue un jour sans que le code ait changé. On le relance, puis on l’ignore. Une attente fixe est trop courte sur une machine chargée, et du temps perdu partout ailleurs.

## Exceptions

Aucune.

## Correction

- Un test du domaine passe l’instant (`at`) et les identités au modèle.
- Un test end-to-end fixe l’heure, sans remplacer le port `Clock` (TST-03), et lit les identités dans les réponses.
- Un test driver déclenche le travail asynchrone, et rend la main quand il a fini.
- Un stub répond les exemples du contrat, jamais des valeurs tirées au hasard (INF-03).
- Chaque test prépare ce dont il a besoin (INF-02).

## Adaptation

**Notre choix** : `vi.useFakeTimers({ toFake: ['Date'] })` et `vi.setSystemTime`, qui ne simulent que l’horloge. La CI mélange l’ordre des tests (`sequence.shuffle: true`).

## Voir aussi

TST-08 interdit de relancer un test instable.

## Exemple

```ts
// Avoid: today's date, and a fixed wait for the forwarder
await wallets.debit(wallet, euros(100n));
await sleep(500);

expect((await messages.all()).at(-1)?.occurredAt).toBe(new Date().toISOString());
```

```ts
// Preferred: a fixed instant, and a driver that returns once the forwarder is done
vi.setSystemTime(new Date('2026-03-31T23:59:00Z'));
await wallets.debit(wallet, euros(100n));

const published = await messages.forward();

expect(published.map((message) => message.occurredAt)).toContain('2026-03-31T23:59:00.000Z');
```

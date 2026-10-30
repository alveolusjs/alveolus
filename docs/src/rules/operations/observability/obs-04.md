---
code: OBS-04
title: L’application dit si elle est vivante, et si elle est prête
group: Santé
scope: [driving]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# OBS-04 · L’application dit si elle est vivante, et si elle est prête

<RuleMeta />

## Signal

- Aucun endpoint de santé : l’orchestrateur envoie du trafic à une instance qui démarre encore.
- Un liveness check qui interroge la base : une panne de la base redémarre toutes les instances.
- Un readiness check qui reste vert pendant l’arrêt.

## Pourquoi

L’orchestrateur pose deux questions. Vivante : faut-il redémarrer le processus ? Prête : peut-on lui envoyer du trafic ? Confondues, une panne de la base devient une boucle de redémarrages, et un déploiement coupe des requêtes.

## Exceptions

Aucune.

## Correction

- Le liveness check répond tant que le processus tourne, sans toucher à aucune dépendance.
- Le readiness check vérifie la base, et que le démarrage est fini (WIR-05).
- Il passe au rouge dès le début de l’arrêt, avant que les connexions se ferment (WIR-10).
- Les deux endpoints vivent dans `driving/http`, hors du contrat de l’API.

## Voir aussi

WIR-05 fait échouer un démarrage incomplet. WIR-10 ferme ce que le wiring a ouvert.

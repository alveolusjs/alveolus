---
menu: Vue d’ensemble
---

# Exploitation

Un code qui passe ses tests doit encore tourner en production. Cette partie répond à deux questions :

- Sait-on ce qui se passe, et ce qui ne se passe plus ? (OBS)
- Que laisse-t-on entrer, et que laisse-t-on sortir ? (SEC)

Les règles disent quoi logger, mesurer, valider ou masquer. Elles n’imposent aucun outil : le logger, le collecteur de métriques et l’orchestrateur restent le choix de l’équipe.

## En revue de code {#reviewing-a-change}

1. Un log est-il structuré, sans phrase construite, et absent du domaine ? (OBS-01)
2. Une panne est-elle loguée une seule fois, et un refus métier hors du niveau `error` ? (OBS-02)
3. L’identifiant de corrélation suit-il l’opération jusque dans l’outbox et le consumer ? (OBS-03)
4. Chaque entrée a-t-elle un schéma, avec des bornes ? (SEC-01)
5. L’identité de l’appelant vient-elle de l’authentification, et pas de la requête ? (SEC-02)
6. Un secret ou une donnée personnelle part-il dans un log, un message ou une réponse ? (SEC-03, SEC-04)

## Thèmes {#themes}

<ThemeTable part="operations" />

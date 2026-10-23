---
code: PER-11
title: Une migration reste compatible avec la version qui tourne
group: Migrations
scope: [schema]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PER-11 · Une migration reste compatible avec la version qui tourne

<RuleMeta />

## Signal

- Une colonne renommée dans une migration, déployée avec le code qui utilise le nouveau nom.
- Une colonne supprimée alors que la version qui tourne la lit encore.
- Une colonne `NOT NULL` ajoutée sans valeur par défaut à une table qui a déjà des lignes.

## Pourquoi

La migration tourne avant la nouvelle version, pendant que l’ancienne sert encore des requêtes. Ensuite, pendant un temps, les deux versions tournent côte à côte sur le même schéma. Une migration qui casse l’ancienne version casse la production le temps du déploiement, et rend un retour arrière impossible.

## Exceptions

Un bounded context qui n’a encore aucune version en service.

## Correction

Élargir, puis resserrer, sur plusieurs livraisons :

1. ajouter la nouvelle colonne, optionnelle ;
2. écrire les deux, et remplir les anciennes lignes ;
3. lire la nouvelle ;
4. supprimer l’ancienne, une fois qu’aucune version en service ne la lit.

Un renommage est un ajout, une copie et une suppression.

## Voir aussi

REP-09 gère les anciennes formes d’un document stocké. PUB-04 fait évoluer un contrat publié par versions.

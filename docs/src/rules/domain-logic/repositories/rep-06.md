---
code: REP-06
title: Pas de suppression physique des aggregates que le métier doit garder
group: Écritures
scope: [domain, driven]
style: [tactical]
severity: blocking
severityNote: Bloquante si une obligation de conservation s’applique. Majeure sinon.
detection: []
review: approved
sources:
  - "Hibernate Implementation (paragraph on aggregates that are never deleted)"
---

# REP-06 · Pas de suppression physique des aggregates que le métier doit garder

<RuleMeta />

## Signal

- Une méthode `remove` ou `delete` sur le repository d’un aggregate qui doit être gardé : virement, paiement, écriture comptable, client qui a un historique.
- Un `DELETE` SQL sur ces tables.
- Une suppression exposée alors qu’aucun use case ne la demande.

## Pourquoi

Certains aggregates doivent survivre à leur dernier usage, pour les références ou l’historique. Les supprimer peut être imprudent, voire illégal. Les marquer plutôt comme désactivés ou retirés, d’une façon qui convient au domaine.

Le plus simple est de n’exposer aucune suppression. Un développeur considère une méthode publique comme sûre à appeler. Si elle reste publique alors que la suppression est interdite, ce doit être une suppression logique. La revue de code peut faire respecter ce choix.

## Exceptions

Les aggregates sans contrainte de conservation.

## Correction

Pas de `remove`. Un état du domaine nommé dans le langage (`closed`, `cancelled`, `revoked`), posé par une méthode métier de l’aggregate. Par exemple, un wallet fermé par `close()` reste en base.

## Adaptation

Dans les services financiers, les obligations de conservation (comptabilité, lutte contre le blanchiment) rendent ce cas fréquent. Faire confirmer les durées de conservation par la conformité.

Une demande d’effacement de données personnelles peut entrer en conflit avec ces obligations. La trancher avec la conformité, pas dans le repository.

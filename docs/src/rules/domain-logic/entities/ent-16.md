---
code: ENT-16
title: La validation de l’objet entier est à part et collecte toutes les erreurs
group: Construction et validation
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Validation › Validating Whole Objects"
  - "Validation › Validating Object Compositions"
---

# ENT-16 · La validation de l’objet entier est à part et collecte toutes les erreurs

<RuleMeta />

## Signal

- Une validation de l’objet entier enfouie dans l’entity, au milieu de ses méthodes métier.
- Une validation de l’objet entier qui s’arrête à la première erreur, au lieu de toutes les signaler.
- Une entity qui charge d’autres aggregates pour valider une composition.

## Pourquoi

Des attributs valides ne font pas un objet valide, et des objets valides ne font pas une composition valide.

La validation de l’objet entier change souvent plus vite que l’entity. L’intégrer à l’entity lui donne trop de responsabilités. La placer dans une classe à part (specification ou strategy), qui signale chaque problème à un objet de notification chargé de les collecter.

Un domain service valide une composition. Il peut attendre un event qui signale la fin d’un état intermédiaire.

## Exceptions

Les préconditions des attributs (ENT-15), qui refusent immédiatement.

## Correction

Un validateur par entity, appelé par `validate()`, et un domain service pour les compositions.

## Adaptation

**Notre choix** : le validateur renvoie un `Result`, comme tout refus métier. Il vérifie toutes les règles avant de répondre, et son erreur porte la liste complète des problèmes. L’appelant reçoit tout d’un coup, sans objet de notification à passer en paramètre.

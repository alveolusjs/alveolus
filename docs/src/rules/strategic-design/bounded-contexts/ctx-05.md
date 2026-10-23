---
code: CTX-05
title: À la frontière, traduire en un concept local
group: Langage et frontière
scope: [application, domain]
style: [tactical, transaction-script]
severity: major
detection: LLM
review: approved
sources:
  - "Making Sense of Bounded Contexts (Figure 2.6)"
  - "Sample Contexts › Collaboration Context"
---

# CTX-05 · À la frontière, traduire en un concept local

<RuleMeta />

## Signal

Une méthode du domaine reçoit un objet d’un autre bounded context (`User`, la réponse d’un autre service), ou quelques attributs détachés qui en viennent (`username`, `name`, `email`), au lieu d’un concept du langage local.

Cas typique : trois attributs de l’approbateur d’un virement passés séparément, alors que personne n’a modélisé le concept `Approver`.

## Pourquoi

Un approbateur ou un titulaire de compte ne vient pas de nulle part. On vérifie dans l’autre bounded context qu’une personne tient le rôle requis (titulaire du compte, signataire autorisé à approuver les virements). Puis on construit le concept local à partir de quelques-uns de ses attributs et du nom du rôle.

Sans cette traduction, le langage étranger s’infiltre, et le concept local reste invisible.

## Exceptions

Une identité partagée entre bounded contexts pour les relier.

## Correction

Un value object local (`AccountHolder`, `Approver`, `Payee`), construit à la frontière par le use case ou par un service dédié, puis passé au domaine. ACL-01 et PUB-02 détaillent comment traduire.

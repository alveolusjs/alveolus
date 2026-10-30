---
code: OBS-02
title: Une panne se logue une fois, là où elle est traitée
group: Logs
scope: [application, driving, driven]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# OBS-02 · Une panne se logue une fois, là où elle est traitée

<RuleMeta />

## Signal

- Un `catch` qui logue l’erreur, puis la relance.
- Un refus métier logué en `error` : `InsufficientFunds` n’est pas une panne.
- Une erreur loguée sans sa cause ni sa stack trace.

## Pourquoi

Loguée à chaque couche, une panne apparaît trois fois, et les alertes comptent trois incidents. Un refus métier est une issue prévue du use case : logué en erreur, il noie les vraies pannes.

## Exceptions

Aucune.

## Correction

- L’erreur remonte sans log jusqu’au point d’entrée, qui la logue une fois, avec sa cause.
- Un refus métier se logue au niveau normal, ou pas du tout.
- Une tentative qui échoue se logue en `warn`, le dernier échec en `error` (PRC-01).

## Adaptation

Côté HTTP, un `ExceptionFilter` global logue les pannes qui atteignent le controller. Le consumer et le scheduler, qui n’en profitent pas, loguent les leurs.

## Voir aussi

OBS-01 structure le log. OBS-05 compte les pannes au lieu de les relire.

---
menu: Vue d’ensemble
---

# Architecture et placement

Un bon modèle pourrit quand même si personne ne sait où va le code. Cette partie répond à trois questions, dans cet ordre.

| Axe | La question | Thèmes |
| --- | --- | --- |
| **Structure** | Où vit le code, et comment il tient ensemble ? | Le sens des dépendances (LAY), le dossier de chaque fichier (PLC), le nom de chaque fichier et de chaque type (NAM), l’assemblage des pièces (WIR) |
| **Flux** | Que fait une opération ? | Une command modifie des aggregates, une query lit des views (UC), l’API HTTP les appelle (API), la base garde ce que le modèle décide (PER) |
| **Preuve** | Comment le code est-il testé ? | Sur une infrastructure réelle, depuis les vrais modules, à côté de ce que les tests prouvent (TST) |

L’[architecture de référence](../../start/reference-architecture) donne l’organisation que toutes les règles supposent. Les thèmes de cette partie donnent les règles qui la fondent.

## En revue de code {#reviewing-a-change}

1. Le domaine n’importe-t-il aucune technologie, et chaque import va-t-il vers l’intérieur ? (LAY-01, LAY-02)
2. Chaque fichier est-il dans le dossier de son concept et de sa technologie, et son nom dit-il son rôle ? (PLC-04, PLC-07, NAM-01)
3. Le module du bounded context est-il le seul à lier un port à son implémentation ? (WIR-01)
4. Le use case reste-t-il mince, et une query lit-elle une view sans charger d’aggregate ? (UC-04, UC-08)
5. Les tests tournent-ils sur la vraie infrastructure, depuis les vrais modules ? (TST-01, TST-03)

## Thèmes {#themes}

<ThemeTable part="architecture-and-placement" />

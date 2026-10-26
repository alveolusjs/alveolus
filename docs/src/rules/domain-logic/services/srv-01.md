---
code: SRV-01
title: Un domain service seulement quand l’opération n’appartient à aucun objet
group: Quand créer un domain service
scope: [domain]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Chapter introduction"
  - "What a Domain Service Is (but First, What It Is Not)"
  - "Make Sure You Need a Service"
  - "Using a Mini-Layer of Domain Services"
---

# SRV-01 · Un domain service seulement quand l’opération n’appartient à aucun objet

<RuleMeta />

## Signal

- Un domain service qui ne manipule qu’un aggregate, et fait ce qu’une méthode de cet aggregate devrait faire.
- Une couche de services qui porte la logique, pendant que les entities ne portent que des données.
- Un « domain service » qui est en réalité un client d’API externe ou un use case.

## Pourquoi

Un domain service est une opération sans état qui accomplit une tâche du domaine. On s’en sert quand cette tâche n’appartient à aucune entity ni à aucun value object.

Trois cas s’y prêtent :

- un processus métier significatif ;
- la transformation d’un objet du domaine en un autre ;
- un calcul qui a besoin de plusieurs objets du domaine.

Trop de services rendent le modèle anémique : la logique part dans les services, et les entities ne gardent que des données.

## Exceptions

Certains domaines admettent une mini-couche de domain services sans que le modèle devienne anémique : un bounded context tactique dont le métier est le contrôle lui-même, comme la détection de la fraude.

## Correction

Remettre l’opération dans l’entity ou le value object qui la possède. Garder le service pour ce qui porte sur plusieurs objets.

## Adaptation

Un module TypeScript accepte les fonctions libres, et elles ont l’air inoffensives : `checkBalanced(postings)`, `requirePostable(accounts, currencies, uses)`. Chacune retire un comportement à l’objet qui le possède, et le modèle devient un ensemble de structures de données entourées de helpers.

**Notre choix** : le comportement vit dans des classes. Dans le domaine, chercher dans cet ordre :

1. une méthode de l’aggregate, quand la règle porte sur son état ;
2. une méthode d’un value object : une règle sur une valeur est une méthode de cette valeur, la lecture d’une entrée brute est une factory method statique (`of`, `read`) qui renvoie un `Result`, et un calcul sur une collection est un value object qui porte cette collection ;
3. une classe de domain service, quand l’opération n’appartient à aucun objet ou a besoin d’un port : ses dépendances arrivent par son constructeur, et elle est injectée.

Hors du domaine, chaque artefact est une classe qui a un rôle (mapper, adapter, translator, controller), et un petit helper est une méthode privée `#` de la classe qui s’en sert. Un mapper sans état reste une instance, tenue par la classe qui l’utilise : pas de classe faite seulement de membres statiques. Les fonctions libres restent dans les fichiers de wiring (`*.wiring.ts`, `*.module.ts`, `*.bootstrap.ts`, `*.config.ts`).

## Voir aussi

ENT-10 refuse l’anemic model. Un domain service peut utiliser des repositories, contrairement à un aggregate (AGG-04) : ce n’est pas un défaut.

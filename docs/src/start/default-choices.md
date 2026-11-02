# Packs et choix par défaut

Une convention fixe une forme parmi plusieurs valables (voir la [nature d’une règle](./overview#kind)). Alveolus en choisit une par défaut, marquée **Notre choix** dans la section Adaptation des règles concernées. Les exemples de code suivent ces choix.

Les choix sont regroupés en six packs. Une équipe adopte un pack d’un bloc, ou s’en écarte par une ADR (voir les [prérequis du projet](./prerequisites#decisions-adr)). S’écarter d’un choix ne retire aucun garde-fou : ceux qui en dépendent restent bloquants, seul leur moyen change.

Deux choix ont déjà leur alternative décrite : des exceptions plutôt que `Result`, une transaction explicite plutôt que le Unit of Work. Chaque règle concernée donne, dans son Adaptation, la forme ou le signal à vérifier avec l’autre choix.

Pour chaque choix, le tableau donne ses conventions, les autres règles dont le paragraphe **Notre choix** le porte, et les garde-fous dont le moyen en dépend. Le waiver se signale comme le décrit la [présentation](./overview#waivers).

## Erreurs et refus {#errors}

<PackTable pack="errors" />

## Persistance et messages {#persistence-and-messaging}

<PackTable pack="persistence-and-messaging" />

## Wiring, nommage et rangement {#wiring-and-naming}

<PackTable pack="wiring-and-naming" />

## Architecture et forme du modèle {#architecture-and-modeling}

<PackTable pack="architecture-and-modeling" />

## Tests {#testing}

<PackTable pack="testing" />

## Exploitation {#operations}

<PackTable pack="operations" />

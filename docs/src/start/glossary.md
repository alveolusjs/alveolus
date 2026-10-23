# Glossaire

Alveolus est écrit en français. Les termes techniques et ceux de la littérature (Domain-Driven Design, architecture hexagonale, CQRS…) restent en anglais : ce sont les mots que l’on retrouve dans le code, les livres et les revues de code. Cette page fixe la liste de ces termes et la façon de les écrire.

## Conventions

| Sujet | Convention | Exemple |
| --- | --- | --- |
| Casse | En minuscules dans la prose, sans italique, comme un mot français. Majuscules pour les sigles et pour Unit of Work. | « l’aggregate protège ses invariants » |
| Genre | Celui que donne la colonne Genre des tableaux ci-dessous. | un aggregate, un outbox, une entity |
| Pluriel | Le pluriel anglais. | des entities, des repositories, des value objects |
| Élision | Comme en français, devant une voyelle prononcée. | l’aggregate, l’outbox, le Unit of Work |
| Adjectifs | Les adjectifs anglais sont invariables et suivent le nom. | un bounded context upstream, des bounded contexts downstream, un adapter driving |
| Termes composés | Jamais traduits à moitié. | un domain service, pas « un service de domaine » |
| Termes du métier de développeur | Le mot qu’un développeur emploie en revue de code reste en anglais, et entre dans ce glossaire. Jamais de périphrase française. | un trigger, pas « un déclencheur » ; la validation des DTO, pas « les vérifications de forme » |
| Bounded context | Toujours écrit en entier, jamais abrégé en « contexte ». | « chaque bounded context a son glossaire » |
| Code | En police de code uniquement ce qui est écrit dans le code : un dossier, un type, un fichier, un mot-clé. | `domain` est le dossier, « le domaine » est le métier ; `Result`, `*.command.ts`, `waiver` |
| Typographie | Apostrophe typographique (’), guillemets français (« »), espace simple avant `:` `;` `?` `!`. | « Ce que la règle refuse : … » |
| Frontmatter | Les clés, les codes de règle et les valeurs (`blocking`, `tactical`, `to-review`…) ne changent pas. `title` et `group` sont traduits. | `title: Une transaction ne modifie qu’une instance d’aggregate` |

## Sections d’une règle

| Anglais | Français |
| --- | --- |
| Signal | Signal |
| Why | Pourquoi |
| Exceptions | Exceptions |
| Fix | Correction |
| Adaptation | Adaptation |
| Our choice | Notre choix |
| Related | Voir aussi |
| Example | Exemple |

## Termes gardés en anglais

### Conception stratégique

| Terme | Genre | Sens |
| --- | --- | --- |
| problem space | m. | L’activité telle qu’elle est, avant tout logiciel : là où vivent les subdomains. |
| solution space | m. | Ce que l’on construit pour répondre au problem space : là où vivent les bounded contexts. |
| bounded context | m. | La frontière dans laquelle un modèle et son langage s’appliquent, avec un seul sens par terme. |
| subdomain | m. | Une part de l’activité : core, supporting ou generic. |
| core, supporting, generic | adj. | Le subdomain qui distingue l’entreprise, celui qui la sert sans la distinguer, celui que tout le monde a. |
| ubiquitous language | m. | Le langage commun à l’équipe et aux experts métier dans un bounded context, jusque dans le code. |
| context map | f. | La carte des bounded contexts et de leurs relations. |
| pattern | m. | La forme que prend un côté d’une relation entre bounded contexts : open host service, anticorruption layer… |
| upstream, downstream | adj. | Le bounded context upstream influence le bounded context downstream, qui dépend de lui. |
| open host service | m. | Le protocole qu’un bounded context upstream ouvre à tous ses clients. |
| published language | m. | Le langage documenté des échanges entre bounded contexts. |
| anticorruption layer | f. | La couche d’un bounded context downstream qui traduit le modèle d’un autre bounded context dans le sien. |
| conformist | adj. | Se dit d’un bounded context downstream qui reprend le modèle upstream tel quel. |
| customer-supplier | f. | Une relation où le bounded context downstream pèse sur les priorités du bounded context upstream. |
| partnership | m. | Deux équipes qui réussissent ou échouent ensemble, et coordonnent leurs changements. |
| shared kernel | m. | Une part du modèle partagée par deux équipes, qui la changent ensemble. |
| separate ways | f. | Une relation sans intégration : chaque bounded context fait sans l’autre. |
| segregated core | m. | Le core isolé dans ses propres modules, à l’écart des concepts d’autres subdomains : une étape vers un bounded context séparé. |
| big ball of mud | m. | Une zone sans frontière claire, que l’on contient au lieu de la modéliser. |

### Logique du domaine

| Terme | Genre | Sens |
| --- | --- | --- |
| entity | f. | Un objet défini par une identité stable, qui change au fil du temps. |
| value object | m. | Une valeur immuable, comparée par son contenu, qui porte sa propre logique. |
| aggregate | m. | Un groupe d’objets modifié d’un bloc, dans une transaction, autour de vrais invariants. |
| aggregate root | m. | L’entity par laquelle on accède à l’aggregate et qui garde ses invariants. |
| domain event | m. | Un fait métier passé, né dans le modèle et nommé dans le langage. |
| domain service | m. | Une opération métier sans état, qui n’appartient à aucun objet. |
| factory | f. | Ce qui crée un objet du modèle quand un constructeur ne suffit pas. |
| factory method | f. | Une méthode qui crée un objet du modèle, sur sa classe ou sur un autre aggregate. |
| repository | m. | La collection d’aggregates entiers, chargés et enregistrés dans la transaction du use case. |
| transaction script | m. | Une procédure par use case, dans une transaction, pour les bounded contexts supporting et generic. |
| code smell | m. | Un indice dans le code qui laisse soupçonner un problème de conception, sans le prouver. |
| anti-pattern | m. | Une solution répandue qui crée plus de problèmes qu’elle n’en résout. |
| Smart UI | f. | L’anti-pattern qui met les décisions métier dans l’interface. |
| DAO | m. | Data Access Object : un objet qui lit et écrit une table, opération par opération. |
| Table Data Gateway | m. | Le pattern où un objet donne accès à toutes les lignes d’une table. |
| Active Record | m. | Le pattern où un objet porte à la fois ses données, ses requêtes et son enregistrement en base. |
| self-encapsulation | f. | L’habitude de passer par ses propres méthodes privées pour lire ou écrire ses champs, afin d’y placer les vérifications. |
| design by contract | m. | Une méthode décrite par ses préconditions, ses postconditions et ses invariants, vérifiés à chaque appel. |
| anemic model | m. | Un modèle fait de données sans comportement, dont les règles vivent ailleurs. |
| eventual consistency | f. | Une cohérence atteinte après coup, entre transactions, plutôt que dans la même transaction. |
| State | m. | Le pattern où un objet confie son comportement à un objet qui représente son état du moment. |
| specification | f. | Un prédicat métier nommé, que l’on combine et réutilise. |
| strategy | f. | Un algorithme isolé dans sa classe, que l’on peut remplacer par un autre sans toucher à l’appelant. |
| policy | f. | Une règle métier isolée dans sa classe, que le modèle consulte. |

### Architecture et placement

| Terme | Genre | Sens |
| --- | --- | --- |
| port | m. | L’interface que le domaine ou l’application déclare, et qu’un adapter implémente. |
| adapter | m. | Le code qui relie un port à une technologie. |
| driving, driven | adj. | Un adapter driving appelle l’application (HTTP, CLI, messages reçus) ; un adapter driven est appelé par elle (base de données, messages émis). |
| ports and adapters | m. | L’autre nom de l’architecture hexagonale. |
| use case | m. | Une opération demandée à l’application : une command ou une query en style tactique, une méthode d’un application service en transaction scripts. |
| application service | m. | En transaction scripts, la classe de `application` qui regroupe les use cases d’un concept, une méthode publique par use case. À ne pas confondre avec un domain service. |
| command | f. | Un use case qui modifie des aggregates, dans une transaction. |
| query | f. | Un use case qui lit des views sans rien modifier. |
| handler | m. | La classe qui exécute une command ou une query (command handler, query handler). |
| command bus | m. | Le composant qui achemine une command jusqu’à son handler, souvent de façon asynchrone. |
| container | m. | Le conteneur d’injection de dépendances de NestJS, qui construit les providers et les fournit. |
| injection token | m. | La clé par laquelle NestJS retrouve ce qu’il doit injecter. |
| provider | m. | Une classe que NestJS instancie et injecte, déclarée dans un module. |
| factory provider | m. | Un provider que NestJS obtient en appelant une fonction, avec les dépendances qu’on lui liste. |
| controller | m. | La classe NestJS qui reçoit une requête HTTP et appelle un use case : un adapter driving. |
| pipe | m. | La classe NestJS qui valide ou transforme une entrée avant qu’elle n’atteigne le controller. |
| guard | m. | La classe NestJS qui décide si une requête peut atteindre le controller. |
| filter | m. | La classe NestJS qui transforme une exception en réponse HTTP. |
| interceptor | m. | La classe NestJS qui s’exécute autour de l’appel d’un controller, avant et après. |
| view | f. | Une lecture préparée pour une query, lue à travers un view port. |
| read model | m. | Un modèle de lecture séparé du modèle d’écriture, en CQRS. |
| CRUD | m. | Créer, lire, mettre à jour, supprimer : des opérations sur des données, sans règle métier. |
| CQRS | m. | La séparation des modèles d’écriture et de lecture. |
| event sourcing | m. | L’état d’un aggregate reconstitué à partir de ses events. |
| commit | m. | La validation d’une transaction, qui rend ses écritures définitives. |
| Unit of Work | m. | La transaction d’un use case, que les repositories et l’outbox partagent. |
| optimistic concurrency | f. | Une écriture qui échoue si la version de l’aggregate a changé depuis sa lecture, sans verrou posé à l’avance. |
| versioning | m. | Le numéro de version qu’un aggregate porte en base, et qui avance à chaque écriture. |
| outbox | m. | La table où les events sont enregistrés dans la transaction, avant d’être publiés. |
| at least once | adj. | Se dit d’une livraison qui garantit qu’un message arrive, quitte à l’envoyer deux fois. |
| forwarder | m. | La classe de l’application qui lit l’outbox et publie ses messages, dans l’ordre. |
| relay | m. | L’adapter driving qui déclenche le forwarder à intervalle régulier. |
| mapping | m. | La correspondance entre deux représentations d’une même donnée, par exemple une ligne et un objet. |
| wrapper | m. | Une classe qui en enveloppe une autre, ou une ligne, sans rien y ajouter d’essentiel. |
| breaking change | m. | Un changement d’un contrat qui casse ceux qui l’utilisent. |
| finder | m. | Une méthode de repository qui cherche des objets selon un critère. |
| mapper | m. | La classe qui traduit une ligne de base en objet du modèle, et l’inverse. |
| translator | m. | La classe d’une anticorruption layer qui traduit un modèle étranger. |
| endpoint | m. | Une route d’une API, qu’un adapter driving expose. |
| media type | m. | Le format déclaré d’un contenu échangé en HTTP, comme `application/json`. |
| facade | f. | Le point d’entrée qu’un bounded context publie aux autres dans le même processus. |
| flag | m. | Un champ booléen qui marque un état ou active un comportement (`flag_blocked`). |
| DTO | m. | Un objet de données sans comportement, pour un transport. |
| payload | m. | Des données venues de l’extérieur, à valider avant usage. |
| wiring | m. | L’assemblage des objets d’un bounded context par son module. |
| composition root | f. | Le seul endroit qui assemble l’application. |
| refactoring | m. | Une transformation du code qui change sa structure sans changer son comportement. |
| deployment unit | f. | Ce que l’on déploie d’un bloc : un service, une fonction, un job. |
| getter, setter | m. | Une méthode ou une propriété qui lit, ou écrit, un champ de l’objet depuis l’extérieur. |
| decorator | m. | Une fonction appliquée avec `@` à une classe, une méthode ou une propriété (`@Injectable`). |
| double dispatch | m. | Un objet qui reçoit en paramètre celui à qui il confie une partie du travail. |
| mediator | m. | Un objet que le client passe à l’aggregate pour qu’il y publie son état, sans montrer sa structure. |
| presenter, assembler | m. | La classe d’un adapter driving qui met en forme ce qu’un écran ou une réponse affiche. |
| presentation model | m. | Un modèle propre à un écran, que l’adapter de présentation tire de l’état du domaine. |
| I/O | f. pl. | Les entrées-sorties : un accès à la base, au réseau ou aux fichiers. |
| id | m. | L’identifiant technique d’une ligne en base, propre à la persistance, distinct de l’identité métier. |
| branded type | m. | Un type primitif marqué pour que le compilateur ne le confonde pas avec un autre (`TransferId`, pas `string`). |
| batch | m. | Un traitement qui porte sur plusieurs éléments d’un coup. |
| allowlist | f. | La liste des cas qu’un contrôle laisse passer. |
| log | m. | Une ligne qu’une application écrit pour garder trace de ce qu’elle fait. |
| singleton | m. | Une classe qui n’a qu’une instance, partagée par toute l’application. |
| service locator | m. | Un objet global auquel une classe demande ses dépendances, au lieu de les recevoir. |
| PascalCase | m. | L’écriture où chaque mot commence par une majuscule, sans séparateur : `DebitWalletHandler`. |
| kebab-case | m. | L’écriture en minuscules, les mots séparés par des tirets : `debit-wallet`. |
| snake_case | m. | L’écriture en minuscules, les mots séparés par des tirets bas : `holder_id`. |
| parsing | m. | La lecture d’un texte brut pour en tirer une valeur typée, ou le refuser. |
| token | m. | Une chaîne qui prouve un droit d’accès, et qui doit rester secrète. |
| helper | m. | Une petite fonction ou méthode d’appoint, au service du code qui l’appelle. |
| scheduler | m. | Ce qui lance un traitement à une heure ou à un intervalle donnés. |
| tagged template | m. | Un template literal précédé d’une fonction, qui reçoit les valeurs à part : `$queryRaw` les envoie en paramètres, jamais dans le texte de la requête. |
| hook | m. | Une fonction qu’un outil appelle de lui-même à un moment donné, par exemple avant ou après une écriture. |
| shutdown hook | m. | Une méthode que NestJS appelle à l’arrêt de l’application, pour fermer ce qu’elle a ouvert. |
| bootstrap | m. | Le fichier qui démarre l’application : `main.bootstrap.ts`. |
| change data capture (CDC) | m. | La lecture des changements d’une base de données, ligne par ligne, pour les transmettre ailleurs. |
| cache | m. | Une copie de données gardée à portée de main, pour éviter de les relire à la source. |
| monitoring | m. | La surveillance d’un système en fonctionnement : métriques, alertes, état de santé. |
| provisioning | m. | La mise à disposition automatique des ressources d’infrastructure. |
| trigger | m. | Du code que la base de données exécute d’elle-même à chaque écriture sur une table. |
| reporting | m. | Les états et les tableaux de bord produits à partir des données, pour piloter l’activité. |
| driver | m. | La bibliothèque qui parle le protocole d’une base de données. |
| query builder | m. | Une API qui construit une requête SQL par appels successifs. |
| ORM | m. | La bibliothèque qui relie les objets aux tables. |
| lazy loading | m. | Le chargement d’une relation au moment où on la lit. |
| tenant | m. | Un client isolé dans une application qui en sert plusieurs (multi-tenant). |
| test double | m. | Un faux objet qui remplace une dépendance dans un test (mock, stub, fake). |
| fake | m. | Un test double qui fonctionne vraiment, mais simplifié : un repository in-memory, un serveur qui imite un provider. |
| mock, stub | m. | Des test doubles écrits d’avance : un stub renvoie des réponses fixées, un mock vérifie aussi comment on l’a appelé. |
| fixture | f. | Les données ou objets préparés pour un test. |
| test driver | m. | Un helper qui pilote l’application dans un test boîte noire, sans rien vérifier lui-même. |
| runner | m. | L’outil qui trouve les tests et les lance, comme Vitest. |
| end-to-end | adj. | Se dit d’un test qui traverse toute l’application démarrée, de son entrée à la base. |
| lint | m. | L’analyse statique du code, qui signale ce qui enfreint une règle sans l’exécuter. |
| fitness function | f. | Un contrôle automatique d’une règle d’architecture, en CI. |
| diff | m. | Les lignes qu’un changement ajoute, modifie ou retire, telles qu’on les relit. |
| ticket | m. | Une tâche ou un problème suivi dans l’outil de l’équipe. |
| finding | m. | Un écart relevé par une revue, rattaché à une règle. |
| merge request (MR) | f. | Une demande d’intégration de code, relue avant d’être fusionnée (pull request ailleurs). |
| waiver | m. | La dérogation documentée à une règle, signalée par un commentaire dans le code. |
| ADR | f. | Une décision d’architecture, numérotée, jamais réécrite. |
| building block | m. | Une classe de base fournie par un package (`AggregateRoot`, `ValueObject`), que le code du modèle étend. |
| package | m. | Une bibliothèque publiée sur npm, qu’un projet installe en dépendance. |
| user story | f. | Un besoin décrit du point de vue de celui qui l’exprime, avec ses critères d’acceptation. |
| skill | m. | Une commande de Claude Code qui guide une étape du travail, lancée par `/` suivi de son nom. |

### Intégration

| Terme | Genre | Sens |
| --- | --- | --- |
| integration event | m. | Un event publié à d’autres bounded contexts, dans le published language. |
| producer, publisher | m. | Le bounded context qui émet un message. |
| consumer, subscriber | m. | Le code qui reçoit les messages d’un autre bounded context. |
| queue | f. | Une file de messages, lus dans l’ordre par un consumer. |
| in-process | adj. | Qui s’exécute dans le même processus que l’appelant, sans passer par le réseau. |
| in-memory | adj. | Qui garde ses données dans la mémoire du processus, sans base : un repository in-memory. |
| call stack | f. | La pile des appels de fonction en cours, de l’appelant d’origine jusqu’à la fonction qui s’exécute. |
| messaging | m. | L’acheminement des messages entre processus, par un broker ou par l’outbox. |
| event emitter | m. | Un objet qui diffuse des events dans le processus, à ses listeners. |
| listener | m. | Une fonction abonnée à un event emitter, appelée à chaque event. |
| broker | m. | Le système qui transporte les messages entre processus. |
| tolerant reader | m. | Un consumer qui ne lit que ce dont il a besoin et ignore le reste. |
| retry, timeout | m. | Une nouvelle tentative ; un délai d’attente au-delà duquel l’appel échoue. |
| back-off | m. | L’espacement croissant des tentatives après un échec, jusqu’à un plafond. |
| RPC | m. | Un appel de procédure à distance : un client appelle une fonction d’un autre processus et attend sa réponse. |
| BFF (backend for frontend) | m. | Une couche serveur dédiée à une interface, qui assemble ce dont elle a besoin. |
| front end | m. | La partie d’une application qui tourne chez l’utilisateur : l’interface web ou mobile. |
| long-running process | m. | Un processus métier qui s’étend sur plusieurs transactions et plusieurs bounded contexts. |
| dead letter | f. | Un message mis de côté quand tous ses retries ont échoué, pour qu’on l’examine. |
| saga | f. | Un long-running process qui compense ses étapes en cas d’échec. |

## Termes traduits

Ces mots ont un équivalent français exact, d’usage courant : on écrit le français.

| Anglais | Français |
| --- | --- |
| domain (le métier) | domaine |
| domain expert | expert métier |
| strategic design | conception stratégique |
| tactical | tactique |
| invariant | invariant |
| transaction | transaction |
| transactional consistency | cohérence transactionnelle |
| identity | identité |
| layer | couche |
| hexagonal architecture | architecture hexagonale |
| module | module |
| contract | contrat |
| schema | schéma |
| persistence | persistance |
| dependency injection | injection de dépendances |
| dependency inversion (DIP) | inversion des dépendances (DIP) |
| notification | notification |
| idempotent | idempotent |
| black-box test | test boîte noire |
| integration test | test d’intégration |
| code review | revue de code |
| continuous integration (CI) | intégration continue (CI) |

## Noms du code

Les noms qui viennent du code ne se traduisent jamais et s’écrivent en police de code : les dossiers (`domain`, `application`, `driving`, `driven`, `public`), les types de l’outillage (`Result`, `Payload`, `Clock`, `RowMapper`…), les rôles de fichiers (`*.aggregate.ts`, `*.command.ts`), les mots-clés (`waiver`) et les exemples (`Wallet`, `deposit()`).

Je n'ai écrit aucun design : le ticket est une épopée, et la skill demande dans ce cas de proposer un découpage en stories, puis de s'arrêter. Rien n'a été créé dans `docs/designs/`.

## Stories proposées

| # | Story | Dépend de | Ce qu'elle construit |
| --- | --- | --- | --- |
| S1 | En tant que client, je veux créer un objectif d'épargne (un nom, un montant cible, une date cible facultative), afin de donner un but à mon épargne. | — | Le module `savings` dans `wallets`, l'aggregate `SavingsGoal`, sa table et la route de création. Aucun argent ne bouge. |
| S2 | En tant que client, je veux voir où en est un objectif (montant mis de côté, reste à atteindre, date cible), afin de suivre mon avancée. | S1 | Une lecture seule. Le montant mis de côté reste à 0 jusqu'à S3. |
| S3 | En tant que client, je veux mettre de l'argent de côté pour un objectif depuis l'un de mes wallets, afin de ne plus pouvoir le dépenser. | S1 | Une nouvelle opération sur `Wallet`, distincte d'un retrait, et le crédit de l'objectif. C'est la plus grosse story et la plus risquée. |
| S4 | En tant que client, je veux reprendre tout ou partie de l'argent d'un objectif vers un wallet, afin de pouvoir le dépenser à nouveau. | S3 | La première opération qui crédite un `Wallet`. C'est le chemin inverse de S3. |
| S5 | En tant que client, je veux clore un objectif, afin que l'argent restant revienne sur un wallet. | S4 | La clôture, qui réutilise le chemin de S4. Un objectif clos refuse tout nouvel apport. |

Ordre : S1, puis S2 et S3 en parallèle, puis S4, puis S5.

## Ce qui guide ce découpage

- **Un module dans `wallets`, pas un nouveau bounded context.** Objectif, wallet, montant et client parlent le langage de `wallets` (CTX-15, CTX-11). L'objectif hérite donc du sous-domaine core indiqué par le README.
- **Chaque mouvement d'argent modifie deux aggregates.** S3, S4 et S5 modifient un `Wallet` et un `SavingsGoal`. Or une transaction ne doit modifier qu'un seul aggregate (AGG-06).
  - Mon choix par défaut : débiter d'abord la source, puis créditer la cible par un domain event, avec un léger décalage (eventual consistency).
  - Si la cible refuse l'argent (wallet clos, objectif clos), l'argent revient à la source.
  - Ce choix revient au métier (AGG-10) : c'est Q-1.
- **Mettre de côté n'est pas un retrait.** `notifications` envoie un reçu par e-mail à chaque `MoneyWithdrawn`. S3 publie donc un autre event, qui reste interne à `wallets`. L'argent mis de côté quitte le solde du wallet : le retrait existant le refuse déjà avec `InsufficientFunds`, et il ne change pas.
- **Aujourd'hui, aucun wallet ne peut recevoir d'argent.** `Wallet` sait s'ouvrir, être débité et se clore. Il ne sait pas être crédité : S4 ajoute cette opération.
- **L'app n'a aucun contrôle d'accès.** Les routes de `wallets` acceptent n'importe quel identifiant. Au minimum, chaque story vérifie que l'objectif et le wallet appartiennent au même client.

## Questions à trancher avant les designs

| | Pour | Question | Hypothèse par défaut | Bloque |
| --- | --- | --- | --- | --- |
| Q-1 | Métier | Quel délai est acceptable entre le débit du wallet et le crédit de l'objectif ? | Quelques secondes, et l'argent n'est jamais compté deux fois. | S3, S4, S5 |
| Q-2 | Métier | Un objectif a-t-il une devise, que les wallets source et cible doivent partager ? | Oui, la devise du montant cible, sans conversion. | S1, S3 |
| Q-3 | Métier | Peut-on dépasser le montant cible ? Atteindre la cible déclenche-t-il quelque chose ? | Oui, le reste à atteindre vaut alors 0, et rien ne se déclenche. | S2, S3 |
| Q-4 | Métier | Une date cible passée est-elle refusée ? Que se passe-t-il à l'échéance ? | Refusée à la création, rien à l'échéance. | S1 |
| Q-5 | Métier | Le client voit-il la liste de ses objectifs, ou un objectif à la fois ? | Un objectif à la fois. La liste fera une story à part. | S2 |
| Q-6 | Métier | Peut-on clore un objectif vide ? Qui choisit le wallet qui reçoit le reste ? | Oui, et le client choisit le wallet. | S5 |
| Q-7 | Tech | Qui authentifie le client ? | Hors de cette épopée : seulement le contrôle de propriété. | Toutes |

Validez ou corrigez ce découpage. Je peux ensuite écrire les cinq tickets dans `tickets/`, puis lancer `/alveolus-design` sur S1. S1 dépend surtout de Q-2 et Q-4 ; Q-1 compte surtout pour S3.

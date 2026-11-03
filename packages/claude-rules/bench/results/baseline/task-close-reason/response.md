J'ai écrit le design dans `docs/designs/task-close-reason.md`. `alveolus-claude design check` passe et le statut reste `draft`. Je n'ai rien commité.

## Résumé

Quand un wallet se ferme, il garde maintenant pourquoi : à la demande du client, ou par la banque. Le support lit ce motif avec le reste du wallet, par une nouvelle route `GET /wallets/{id}` qui lui est réservée. Les wallets fermés avant cette livraison affichent « inconnu » : aucun motif n'est inventé pour eux. Le motif s'ajoute sans casser les appelants actuels de `POST /wallets/{id}/closure` : il reste optionnel, puis devient obligatoire quand plus aucun appelant ne ferme sans motif. Tout se passe dans `wallets`, en 6 incréments.

## Décisions à valider

Les trois qui pèsent le plus :
- **D-1 : je traite le ticket comme une story, pas comme une tâche.** Il a un rôle (le support), une action et un bénéfice, et il change le comportement de la fermeture.
- **D-5 : le motif s'ajoute en changement parallèle.** Il est optionnel en I4 et obligatoire en I6. Entre les deux, une fermeture sans motif garde un motif inconnu, comme aujourd'hui. Une ligne de log `wallet.closure.without_reason` (D-10) dit quand I6 peut partir.
- **D-6 et D-7 : l'application n'a aujourd'hui aucune lecture de wallet.** J'ajoute une query sur une view. La valeur `"unknown"` est calculée par la représentation HTTP, ni dans le modèle ni dans le mapper.

Les autres :
- **D-2 :** `ClosureReason` est un value object à deux valeurs fixes, `customer_request` et `bank_decision`.
- **D-3 :** le motif est rangé dans une colonne nullable de `wallets.wallet`.
- **D-4 :** on ne remplit jamais après coup le motif des wallets déjà fermés.
- **D-8 :** la requête HTTP liste les deux motifs.
- **D-9 :** `WalletClosed` porte le motif, et aucun integration event n'est publié.

## Questions ouvertes

**Métier**, à confirmer avant I1 :
- **Q-1 :** la banque ne peut-elle fermer qu'un wallet à solde nul ? Hypothèse : oui.
- **Q-2 :** « par la banque » se détaille-t-il (fraude, inactivité) ? Hypothèse : non.
- **Q-3 :** un conseiller qui ferme à la demande du client au téléphone, c'est le motif « à la demande du client » ? Hypothèse : oui, le motif dit pourquoi, pas qui.
- **Q-4 :** comment le support lit-il un wallet aujourd'hui ? Hypothèse : il ne le peut pas.

**Équipe technique :**
- **Q-5 :** qui appelle la route de fermeture ? Si tous les appelants partent avec l'application, I6 se fond dans I4.
- **Q-6 :** l'application n'a aucune authentification. Il faut savoir comment reconnaître le rôle support. Sans réponse, I5 ne part pas.
- **Q-7 :** le dépôt n'a ni `prisma/migrations` ni base de test jetable. Il les faut avant I2.

**Sur les règles :**
- **Q-8 :** UC-06 exige une autorisation pour chaque use case, et la route de fermeture n'en a aucune aujourd'hui. Ajouter le motif oblige-t-il à la corriger ici ? Hypothèse : non, ce manque se traite avec Q-6.
- **Q-9 :** VO-08 préfère une union de littéraux, mais le motif arrive en texte et doit être converti. Hypothèse : une classe à ensemble fixe d'instances, comme `Currency`.

## Incréments

| # | Contenu | Bloqué par |
| --- | --- | --- |
| I1 | domain et application | |
| I2 | colonne, migration et mapper | Q-7 |
| I3 | query de lecture | |
| I4 | la route de fermeture accepte le motif | |
| I5 | `GET` pour le support | Q-6 |
| I6 | le motif devient obligatoire | Q-5 |

**Waivers :** aucun.

Pouvez-vous relire le design et répondre aux questions ? Je passe le statut à `approved` une fois que vous l'avez validé.

# Déposer de l'argent sur un wallet

En tant que client, je veux déposer de l'argent sur mon wallet, pour pouvoir le dépenser ensuite.

## Critères d'acceptation

- Le client dépose un montant sur l'un de ses wallets ouverts : le solde augmente de ce montant.
- Un montant nul ou négatif est refusé.
- Un dépôt sur un wallet fermé est refusé.
- Le dépôt est dans la devise du wallet. Un dépôt dans une autre devise est refusé.
- Si l'application renvoie le même dépôt après une coupure réseau, il n'est crédité qu'une fois.

## Notes

L'application mobile affiche le nouveau solde juste après le dépôt.

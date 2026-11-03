# Alert on a large withdrawal

As a customer, I want an alert when a large withdrawal is made from one of my wallets, so that I can react quickly if it was not me.

## Acceptance criteria

- A customer can set an alert threshold on each of their wallets, and remove it.
- When a withdrawal is strictly above the threshold of its wallet, the customer receives an alert email with the wallet, the amount and the date.
- A withdrawal at or below the threshold sends no alert.
- A wallet without a threshold sends no alert.
- The withdrawal receipt the customer already receives is still sent, alert or not.

## Notes

Product would like the alert within a minute of the withdrawal.

# Task: speed up the list of a customer's wallets

Type: technical task

The mobile app lists the wallets of the signed-in customer on its home screen. Since the number of wallets grew, this call takes more than a second at busy hours. The query filters the wallet table on the customer, and the database reads the whole table to do it.

Make this list fast again, without changing what the call returns.

This ticket is an epic, so I haven't written a design. The skill says to propose the stories it splits into and stop there. Below is the split, based on what the code does today.

## What the code changes about the split

- **There are no deposits.** `wallets` can open a wallet, withdraw from it and close it. A balance starts at zero, so every withdrawal is refused for insufficient funds, and every statement would be empty.
- **No history is kept.** The `wallet` table holds only the current balance. A statement needs the balance on a past date and every movement of the month.
- **No customer login.** Routes take `customerId` from the request. Listing "my" statements needs to know who is calling, and the rules require that to come from authentication.
- **Email can only send withdrawal receipts.** `EmailSender` sends those and nothing else, with no attachment. The `notification` table requires `amount` and `balance`, which doesn't fit a statement.
- **No PDF library and no file storage** exist in the app.

## Proposed split

| # | Type | Item | Context | Depends on |
| --- | --- | --- | --- | --- |
| S0 | story, prerequisite | As a customer, I want to deposit money into my wallet, so that I have money to manage. | wallets | — |
| T1 | task | Keep a dated history of each wallet's movements: opening, deposits, withdrawals and closing, each with the balance after it. Why: a statement needs the balance at the start and end of a month, and only the current balance exists today. | wallets | before or alongside S0 |
| S1 | story | As a customer, I want a statement of each open wallet for the month before, issued on the first day of the month, so that I keep a record of my money. It shows the balance at the start and end, and each deposit and withdrawal with its date and amount. | wallets | T1 running in production for one full month |
| S2 | story | As a customer, I want a last statement for a wallet closed during the month, so that my record covers its last month. | wallets | S1 |
| S3 | story | As a customer, I want each new statement emailed to me as a PDF, so that I can check it without opening the app. | notifications, plus wallets (published event and PDF) | S1 |
| S4 | story | As a customer, I want to list and download my past statements in the app, so that I can find any of them again. | wallets | S1, plus authentication |

**Order:** T1 must be in production a full month before the first statement is issued, or that first month has no history. S1 can go live without the customer seeing anything: statements build up and show once S3 or S4 ships. S2, S3 and S4 don't depend on each other.

## Decisions to validate before designing the stories

| Decision | Why | Rejected alternative |
| --- | --- | --- |
| `wallets` issues and keeps the statements, and never deletes one. | The balance at a date and the movements are wallet facts, in the core subdomain. | A new context: its rules would read wallet data without owning it. |
| The PDF is produced in one place, in `wallets`, from the statement's saved data. S3 gets it through the `wallets` public interface, and S4 serves it to the app. | The emailed and downloaded documents can't drift apart. | Rendering in `notifications` from the event: S4 would need a second renderer. |
| `wallets` announces each new statement with a `wallets.statement.StatementIssued` event. `notifications` reacts and sends the email, the way it already sends withdrawal receipts. | It reuses the existing outbox path and pending-email scheduler. | Having `notifications` poll `wallets`. |

## Open questions

**For the business**
- Which time zone defines a month, and the date shown for each movement? This blocks S1.
- Are deposits planned somewhere else? If not, S0 joins this epic.
- Does a wallet with no movement in the month still get a statement? I'd assume yes, with an unchanged balance and an empty list. This blocks S1.
- Does a wallet opened during the month get a statement starting at zero from its opening date? I'd assume yes. This blocks S1.
- One email per statement, or one per customer with all their PDFs? I'd assume one per statement. This blocks S3.
- What happens for a customer with no email address? I'd assume the statement is only in the app. This blocks S3.
- How long must statements be kept? Must the PDF stay exactly the same document for good, or can it be regenerated from the saved data? This blocks the PDF decision, S3 and S4.

**For the tech team**
- Who provides customer authentication? This blocks S4.
- Which PDF library will we use? This blocks S3.

Once these are answered, I can run `/alveolus-design` on each item in order: T1, S0, S1, then S2, S3 and S4. I can also write each one to `tickets/` as a separate story ticket first.

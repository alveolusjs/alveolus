---
menu: Vue d’ensemble
---

# Value objects

Préférer un value object à une entity dès que possible. Il est plus simple à créer, à tester, à utiliser et à maintenir. Ces règles disent quand en créer un, et traitent de l’immuabilité, du comportement et de la persistance.

## En pratique {#in-practice}

Un montant n’est pas un nombre : il a une devise, et deux montants de devises différentes ne s’additionnent pas.

```ts
const SUPPORTED_CURRENCIES: ReadonlySet<string> = new Set(['EUR']);

export class Currency {
	readonly code: string;

	private constructor(code: string) {
		this.code = code;
	}

	static of(code: string): Result<Currency, UnsupportedCurrency> {
		if (!SUPPORTED_CURRENCIES.has(code)) {
			return err(new UnsupportedCurrency(code));
		}

		return ok(new Currency(code));
	}

	equals(other: Currency): boolean {
		return other.code === this.code;
	}
}
```

```ts
export class Money {
	readonly minor: bigint;
	readonly currency: Currency;

	private constructor(minor: bigint, currency: Currency) {
		this.minor = minor;
		this.currency = currency;
	}

	static of(minor: bigint, currency: Currency): Result<Money, InvalidMoney> {
		if (minor < 0n) {
			return err(new InvalidMoney(minor));
		}

		return ok(new Money(minor, currency));
	}

	static zero(currency: Currency): Money {
		return new Money(0n, currency);
	}

	sameCurrencyAs(other: Money): boolean {
		return other.currency.equals(this.currency);
	}

	isLessThan(other: Money): boolean {
		this.#assertSameCurrency(other);

		return this.minor < other.minor;
	}

	plus(other: Money): Money {
		this.#assertSameCurrency(other);

		return new Money(this.minor + other.minor, this.currency);
	}

	minus(other: Money): Money {
		if (this.isLessThan(other)) {
			throw new Error(`Cannot subtract ${other.minor} from ${this.minor}`);
		}

		return new Money(this.minor - other.minor, this.currency);
	}

	equals(other: Money): boolean {
		return other.minor === this.minor && other.currency.equals(this.currency);
	}

	toJSON(): { readonly minor: string; readonly currency: string } {
		return { minor: this.minor.toString(), currency: this.currency.code };
	}

	#assertSameCurrency(other: Money): void {
		if (!this.sameCurrencyAs(other)) {
			throw new Error(`Cannot combine ${this.currency.code} and ${other.currency.code}`);
		}
	}
}
```

- Un concept du domaine a son propre type, au lieu d’un `bigint` et d’un `string` passés côte à côte. La devise aussi : `Currency` n’accepte que les devises de la liste, et `Money` n’a plus à le vérifier (VO-01, VO-02, VO-08).
- Immuable et complet dès sa naissance : le constructeur est privé, `of` refuse un montant invalide, et `plus` renvoie un nouveau `Money` (VO-03, VO-04).
- Aucun effet de bord, et une égalité par valeur (VO-05, VO-06).

## Règles {#rules}

<RuleTable />

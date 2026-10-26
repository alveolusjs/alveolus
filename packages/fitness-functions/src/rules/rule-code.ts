type ThemePrefix =
	| 'ACL'
	| 'AGG'
	| 'API'
	| 'CTX'
	| 'ENT'
	| 'EVT'
	| 'FAC'
	| 'LAY'
	| 'MAP'
	| 'MSG'
	| 'NAM'
	| 'PER'
	| 'PLC'
	| 'PRC'
	| 'PUB'
	| 'REP'
	| 'SRV'
	| 'TST'
	| 'TXS'
	| 'UC'
	| 'VO'
	| 'WIR';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type RuleCode = `${ThemePrefix}-${Digit}${Digit}`;

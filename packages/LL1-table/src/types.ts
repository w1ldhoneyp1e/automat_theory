interface GrammarRule {
	left: string,
	right: string[],
}

interface Grammar {
	nonterminals: string[],
	terminals: string[],
	rules: GrammarRule[],
	startSymbol: string,
}

interface LL1Row {
	id: number,
	symbol: string,
	nm: string[],
	error: boolean,
	transition: number | null,
	shift: boolean,
	stack: boolean,
	end: boolean,
}

type TraceAction = 'dispatch' | 'shift' | 'call' | 'epsilon' | 'error' | 'accept'

interface TraceStep {
	rowId: number,
	tokenIndex: number,
	tokens: string[],
	stackSnapshot: number[],
	action: TraceAction,
	description: string,
}

export type {
	GrammarRule, Grammar, LL1Row, TraceAction, TraceStep,
}

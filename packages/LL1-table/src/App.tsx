import {useState} from 'react'
import {buildLL1Table} from './algorithms/buildTable'
import './App.css'
import {LL1TableView} from './components/LL1TableView'
import {Tracer} from './components/Tracer'
import {type Grammar, type LL1Row} from './types'
import {parseGrammar} from './utils/grammarParser'

const EXAMPLE_GRAMMAR = `S -> A B
A -> a | e
B -> b C | d
C -> c`

function App() {
	const [grammarText, setGrammarText] = useState(EXAMPLE_GRAMMAR)
	const [grammar, setGrammar] = useState<Grammar | null>(null)
	const [table, setTable] = useState<LL1Row[] | null>(null)
	const [error, setError] = useState<string | null>(null)

	function handleBuild() {
		try {
			setError(null)
			const g = parseGrammar(grammarText)

			if (g.nonterminals.length === 0) {
				setError('Грамматика пуста или не содержит правил')

				return
			}

			const t = buildLL1Table(g)
			setGrammar(g)
			setTable(t)
		}
		catch (e) {
			setError(e instanceof Error
				? e.message
				: String(e))
			setTable(null)
		}
	}

	return (
		<div className="app">
			<header className="app-header">
				<h1>LL(1) Таблица разбора</h1>
			</header>

			<main className="app-main">
				<section className="grammar-section">
					<h2>Грамматика</h2>
					<p className="hint">
						Каждое правило на отдельной строке: <code>A -&gt; a B | c</code>.
						Нетерминал — любой символ, стоящий в левой части хотя бы одного правила.
						Для e-правила используйте <code>e</code> или пустую альтернативу.
					</p>
					<textarea
						className="grammar-textarea"
						value={grammarText}
						onChange={e => setGrammarText(e.target.value)}
						rows={8}
						spellCheck={false}
					/>
					<div className="grammar-actions">
						<button className="btn btn-primary" onClick={handleBuild}>
							Построить таблицу
						</button>
					</div>
					{error && <div className="error-box">{error}</div>}
				</section>

				{grammar && table && (
					<>
						<section className="info-section">
							<div className="grammar-info">
								<div className="info-group">
									<span className="info-label">Нетерминалы:</span>
									<span>{grammar.nonterminals.join(', ')}</span>
								</div>
								<div className="info-group">
									<span className="info-label">Терминалы:</span>
									<span>{grammar.terminals.join(', ')}</span>
								</div>
								<div className="info-group">
									<span className="info-label">Аксиома:</span>
									<span>{grammar.startSymbol}</span>
								</div>
							</div>
						</section>

						<section className="table-section">
							<h2>Таблица LL(1)</h2>
							<LL1TableView table={table} />
						</section>

						<Tracer table={table} />
					</>
				)}
			</main>
		</div>
	)
}

export {App}

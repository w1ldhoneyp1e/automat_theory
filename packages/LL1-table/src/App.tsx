import {useState} from 'react'
import {buildLL1Table} from './algorithms/buildTable'
import {preprocessGrammar} from './algorithms/preprocess'
import {LL1TableView} from './components/LL1TableView'
import {Tracer} from './components/Tracer'
import {type Grammar, type LL1Row} from './types'
import {formatGrammar, parseGrammar} from './utils/grammarParser'
import './App.css'

const EXAMPLE_GRAMMAR = `S -> A B
A -> a | eps
B -> b C | d
C -> c`

interface BuildResult {
	originalGrammar: Grammar,
	processedGrammar: Grammar,
	table: LL1Row[],
	addedAxiom: boolean,
	addedAxiomName: string,
	eliminatedLeftRecursion: boolean,
	factorized: boolean,
}

function App() {
	const [grammarText, setGrammarText] = useState(EXAMPLE_GRAMMAR)
	const [result, setResult] = useState<BuildResult | null>(null)
	const [error, setError] = useState<string | null>(null)

	function handleBuild() {
		try {
			setError(null)
			const original = parseGrammar(grammarText)

			if (original.nonterminals.length === 0) {
				setError('Грамматика пуста или не содержит правил')

				return
			}

			const {
				grammar, addedAxiom, addedAxiomName, eliminatedLeftRecursion, factorized,
			} = preprocessGrammar(original)
			const table = buildLL1Table(grammar)

			setResult({
				originalGrammar: original,
				processedGrammar: grammar,
				table,
				addedAxiom,
				addedAxiomName,
				eliminatedLeftRecursion,
				factorized,
			})
		}
		catch (e) {
			setError(e instanceof Error
				? e.message
				: String(e))
			setResult(null)
		}
	}

	const preprocessed = result && (result.addedAxiom || result.eliminatedLeftRecursion || result.factorized)

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
						Для e-правила используйте <code>eps</code> или пустую альтернативу.
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

				{result && (
					<>
						{preprocessed && (
							<section className="preprocess-section">
								<h2>Предобработка грамматики</h2>

								<div className="preprocess-grammars">
									<div>
										<div className="grammar-block-label">Исходная</div>
										<pre className="grammar-code">{formatGrammar(result.originalGrammar)}</pre>
									</div>
									<div>
										<div className="grammar-block-label">После предобработки</div>
										<pre className="grammar-code">{formatGrammar(result.processedGrammar)}</pre>
									</div>
								</div>
							</section>
						)}

						<section className="info-section">
							<div className="grammar-info">
								<div className="info-group">
									<span className="info-label">Нетерминалы:</span>
									<span>{result.processedGrammar.nonterminals.join(', ')}</span>
								</div>
								<div className="info-group">
									<span className="info-label">Терминалы:</span>
									<span>{result.processedGrammar.terminals.join(', ')}</span>
								</div>
								<div className="info-group">
									<span className="info-label">Аксиома:</span>
									<span>{result.processedGrammar.startSymbol}</span>
								</div>
							</div>
						</section>

						<section className="table-section">
							<h2>Таблица LL(1)</h2>
							<LL1TableView table={result.table} />
						</section>

						<Tracer table={result.table} />
					</>
				)}
			</main>
		</div>
	)
}

export {App}

import {type LL1Row} from '../types'

interface Props {
	table: LL1Row[],
	highlightRow?: number,
}

function LL1TableView({table, highlightRow}: Props) {
	return (
		<div className="table-wrapper">
			<table className="ll1-table">
				<thead>
					<tr>
						<th>№</th>
						<th>Символ</th>
						<th>Н.М.</th>
						<th>Ошибка</th>
						<th>Переход</th>
						<th>Сдвиг</th>
						<th>Стек</th>
						<th>Конец</th>
					</tr>
				</thead>
				<tbody>
					{table.map(row => (
						<tr
							key={row.id}
							className={row.id === highlightRow
								? 'row-highlight'
								: ''}
						>
							<td className="cell-num">{row.id}</td>
							<td className="cell-symbol">
								<span className={isNonTerminal(row.symbol)
									? 'nonterminal'
									: 'terminal'}>
									{row.symbol}
								</span>
							</td>
							<td className="cell-nm">
								{row.nm.length > 0
									? <span className="nm-list">{`{${row.nm.join(', ')}}`}</span>
									: <span className="empty">—</span>
								}
							</td>
							<td className={`cell-bool ${row.error
								? 'bool-true'
								: 'bool-false'}`}>
								{row.error
									? 'true'
									: 'false'}
							</td>
							<td className="cell-transition">
								{row.transition !== null
									? row.transition
									: <span className="null">null</span>
								}
							</td>
							<td className={`cell-bool ${row.shift
								? 'bool-true'
								: ''}`}>
								{row.shift
									? 'true'
									: 'false'}
							</td>
							<td className={`cell-bool ${row.stack
								? 'bool-true'
								: ''}`}>
								{row.stack
									? 'true'
									: 'false'}
							</td>
							<td className={`cell-bool ${row.end
								? 'bool-end'
								: ''}`}>
								{row.end
									? 'true'
									: 'false'}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function isNonTerminal(sym: string): boolean {
	return sym.length > 0 && sym[0] === sym[0].toUpperCase() && /[A-ZА-Я]/.test(sym[0])
}

export {LL1TableView}

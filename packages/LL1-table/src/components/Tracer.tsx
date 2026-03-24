import {useCallback, useState} from 'react'
import {traceLL1} from '../algorithms/trace'
import {type LL1Row, type TraceStep} from '../types'
import {LL1TableView} from './LL1TableView'

interface Props {
	table: LL1Row[],
}

const ACTION_LABELS: Record<TraceStep['action'], string> = {
	dispatch: 'Выбор варианта',
	shift: 'Сдвиг',
	call: 'Вызов нетерминала',
	epsilon: 'e-правило',
	error: 'Ошибка',
	accept: 'Принято',
}

const ACTION_CLASSES: Record<TraceStep['action'], string> = {
	dispatch: 'action-dispatch',
	shift: 'action-shift',
	call: 'action-call',
	epsilon: 'action-epsilon',
	error: 'action-error',
	accept: 'action-accept',
}

function Tracer({table}: Props) {
	const [inputText, setInputText] = useState('')
	const [steps, setSteps] = useState<TraceStep[] | null>(null)
	const [currentStep, setCurrentStep] = useState(0)

	const handleTrace = useCallback(() => {
		const tokens = inputText.trim().split(/\s+/)
			.filter(Boolean)
		const result = traceLL1(table, tokens)
		setSteps(result)
		setCurrentStep(0)
	}, [inputText, table])

	const step = steps?.[currentStep]
	const accepted = steps !== null && steps[steps.length - 1]?.action === 'accept'

	return (
		<section className="tracer-section">
			<h2>Трассировка</h2>

			<div className="tracer-input-row">
				<input
					className="tracer-input"
					type="text"
					placeholder="Введите строку через пробел, например: a b c"
					value={inputText}
					onChange={e => setInputText(e.target.value)}
					onKeyDown={e => e.key === 'Enter' && handleTrace()}
				/>
				<button className="btn btn-secondary" onClick={handleTrace}>
					Запустить
				</button>
			</div>

			{steps && (
				<>
					<div className={`trace-result ${accepted
						? 'trace-accepted'
						: 'trace-rejected'}`}>
						{accepted
							? '✓ Строка принадлежит языку грамматики'
							: '✗ Строка не принадлежит языку грамматики'
						}
						<span className="trace-result-steps">{steps.length} шагов</span>
					</div>

					<div className="tracer-body">
						<div className="tracer-controls">
							<button
								className="btn btn-sm"
								disabled={currentStep === 0}
								onClick={() => setCurrentStep(s => s - 1)}
							>
								← Назад
							</button>
							<span className="step-counter">
								Шаг {currentStep + 1} / {steps.length}
							</span>
							<button
								className="btn btn-sm"
								disabled={currentStep === steps.length - 1}
								onClick={() => setCurrentStep(s => s + 1)}
							>
								Вперёд →
							</button>
							<button
								className="btn btn-sm"
								onClick={() => setCurrentStep(steps.length - 1)}
							>
								В конец →|
							</button>
						</div>

						{step && (
							<>
								<div className={`step-status ${ACTION_CLASSES[step.action]}`}>
									<strong>{ACTION_LABELS[step.action]}:</strong> {step.description}
								</div>

								<div className="tracer-state">
									<div className="state-block">
										<div className="state-label">Входная строка</div>
										<div className="token-row">
											{step.tokens.map((t, i) => (
												<span
													key={i}
													className={`token ${i === step.tokenIndex
														? 'token-current'
														: i < step.tokenIndex
															? 'token-consumed'
															: ''}`}
												>
													{t}
												</span>
											))}
										</div>
									</div>

									<div className="state-block">
										<div className="state-label">Стек (вершина → дно)</div>
										<div className="stack-row">
											{step.stackSnapshot.length === 0
												? <span className="empty">пусто</span>
												: [...step.stackSnapshot].reverse().map((id, i) => (
													<span key={i} className="stack-item">{id}</span>
												))
											}
										</div>
									</div>

									<div className="state-block">
										<div className="state-label">Текущая строка таблицы</div>
										<div className="current-row-id">{step.rowId}</div>
									</div>
								</div>

								<LL1TableView table={table} highlightRow={step.rowId} />
							</>
						)}
					</div>
				</>
			)}
		</section>
	)
}

export {Tracer}

import { TOKEN_COSTS } from './constants'

export function calculateTokenCost(tokenCount, model) {
  const normalizedModel = model.toLowerCase().includes('haiku') ? 'HAIKU' : model.toUpperCase()
  const costPerMillion = TOKEN_COSTS[normalizedModel] || TOKEN_COSTS.HAIKU
  return (tokenCount / 1000000) * costPerMillion
}

export function formatTokenCount(count) {
  return count.toLocaleString()
}

export function calculateTrend(current, previous) {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'stable'
}

export function debounce(fn, delayMs) {
  let timeoutId
  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

export function fuzzySearch(items, query, fields) {
  const lowerQuery = query.toLowerCase()
  return items.filter(item =>
    fields.some(field => {
      const value = item[field]?.toString().toLowerCase() || ''
      return value.includes(lowerQuery)
    })
  )
}

export function filterByCategory(items, category) {
  return items.filter(item => item.category === category)
}

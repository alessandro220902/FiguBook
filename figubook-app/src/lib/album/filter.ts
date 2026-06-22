export type Filter = 'all' | 'missing' | 'double' | 'have'

export function passes(filter: Filter, count: number): boolean {
  if (filter === 'all') return true
  if (filter === 'have') return count >= 1
  if (filter === 'missing') return count === 0
  if (filter === 'double') return count >= 2
  return true
}

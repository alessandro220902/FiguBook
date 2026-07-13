import { describe, it, expect } from 'vitest'
import { provinciaOf } from './provincia'

describe('provinciaOf', () => {
  it('estrae la sigla dall etichetta canonica "Nome (PROV)"', () => {
    expect(provinciaOf('Milano (MI)')).toBe('MI')
    expect(provinciaOf('Reggio nell Emilia (RE)')).toBe('RE')
    expect(provinciaOf('  Roma (RM) ')).toBe('RM')
  })
  it('ritorna stringa vuota se manca la parentesi o è vuoto', () => {
    expect(provinciaOf('Milano')).toBe('')
    expect(provinciaOf('')).toBe('')
  })
})

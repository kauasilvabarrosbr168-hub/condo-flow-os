export type Holiday = {
  key: string
  name: string
  date: Date
  type: 'nacional' | 'movel'
}

function easter(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export const HOLIDAY_CATALOG: { key: string; name: string }[] = [
  { key: 'ano_novo', name: 'Ano Novo (1° de Janeiro)' },
  { key: 'carnaval_seg', name: 'Carnaval — Segunda-feira' },
  { key: 'carnaval_ter', name: 'Carnaval — Terça-feira' },
  { key: 'sexta_paixao', name: 'Sexta-feira da Paixão' },
  { key: 'tiradentes', name: 'Tiradentes (21 de Abril)' },
  { key: 'trabalho', name: 'Dia do Trabalho (1° de Maio)' },
  { key: 'corpus_christi', name: 'Corpus Christi' },
  { key: 'independencia', name: 'Independência (7 de Setembro)' },
  { key: 'aparecida', name: 'N. Sra. Aparecida (12 de Outubro)' },
  { key: 'finados', name: 'Finados (2 de Novembro)' },
  { key: 'republica', name: 'Proclamação da República (15 de Novembro)' },
  { key: 'natal', name: 'Natal (25 de Dezembro)' },
  { key: 'vespera_ano_novo', name: 'Véspera de Ano Novo (31 de Dezembro)' },
]

export function getHolidaysForYear(year: number): Holiday[] {
  const e = easter(year)
  return [
    { key: 'ano_novo', name: 'Ano Novo', date: new Date(year, 0, 1), type: 'nacional' },
    { key: 'carnaval_seg', name: 'Carnaval', date: addDays(e, -48), type: 'movel' },
    { key: 'carnaval_ter', name: 'Carnaval', date: addDays(e, -47), type: 'movel' },
    { key: 'sexta_paixao', name: 'Sexta-feira da Paixão', date: addDays(e, -2), type: 'movel' },
    { key: 'tiradentes', name: 'Tiradentes', date: new Date(year, 3, 21), type: 'nacional' },
    { key: 'trabalho', name: 'Dia do Trabalho', date: new Date(year, 4, 1), type: 'nacional' },
    { key: 'corpus_christi', name: 'Corpus Christi', date: addDays(e, 60), type: 'movel' },
    { key: 'independencia', name: 'Independência', date: new Date(year, 8, 7), type: 'nacional' },
    { key: 'aparecida', name: 'N. Sra. Aparecida', date: new Date(year, 9, 12), type: 'nacional' },
    { key: 'finados', name: 'Finados', date: new Date(year, 10, 2), type: 'nacional' },
    { key: 'republica', name: 'Proclamação da República', date: new Date(year, 10, 15), type: 'nacional' },
    { key: 'natal', name: 'Natal', date: new Date(year, 11, 25), type: 'nacional' },
    { key: 'vespera_ano_novo', name: 'Véspera de Ano Novo', date: new Date(year, 11, 31), type: 'nacional' },
  ]
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function buildHolidayMap(
  years: number[],
  blockedKeys: Set<string>
): Map<string, Holiday> {
  const map = new Map<string, Holiday>()
  for (const year of years) {
    for (const h of getHolidaysForYear(year)) {
      if (blockedKeys.has(h.key)) {
        map.set(toDateKey(h.date), h)
      }
    }
  }
  return map
}

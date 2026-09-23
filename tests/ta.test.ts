import { describe, expect, test } from 'vitest'
import { ta } from '../frontend/src/core/ta'

describe('Pruebas unitarias de MoonPhases', () => {

  test('1. validateDate acepta una fecha válida', () => {
    const fecha = new Date('2026-09-23')
    expect(() => ta.validateDate(fecha)).not.toThrow()
  })

  test('2. validateDate rechaza una fecha inválida', () => {
    const fecha = new Date('fecha-invalida')
    expect(() => ta.validateDate(fecha)).toThrow(
      'Se proporcionó un valor no válido para date'
    )
  })

  test('3. julianDay calcula correctamente el día juliano', () => {
    const resultado = ta.julianDay(2000, 1, 1, 12, 0, 0)
    expect(resultado).toBeCloseTo(2451545.0, 5)
  })

  test('4. moonPhase devuelve un valor entre 0 y 1', () => {
    const fecha = new Date('2026-09-23')
    const resultado = ta.moonPhase(fecha)

    expect(resultado).toBeGreaterThanOrEqual(0)
    expect(resultado).toBeLessThanOrEqual(1)
  })

  test('5. phaseName identifica Luna nueva', () => {
    expect(ta.phaseName(0)).toBe('Luna nueva')
  })

  test('6. phaseName identifica Luna llena', () => {
    expect(ta.phaseName(0.5)).toBe('Luna llena')
  })

  test('7. illumination calcula correctamente la iluminación', () => {
    expect(ta.illumination(0)).toBeCloseTo(100, 5)
  })

  test('8. daysBetween calcula la diferencia entre fechas', () => {
    const fechaInicio = new Date('2026-09-01')
    const fechaFin = new Date('2026-09-10')

    expect(ta.daysBetween(fechaInicio, fechaFin)).toBe(9)
  })

  test('9. formatRelativeTime devuelve Hoy para cero días', () => {
    expect(ta.formatRelativeTime(0)).toBe('Hoy')
  })

})


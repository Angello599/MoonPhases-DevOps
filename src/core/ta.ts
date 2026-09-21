/**
 * Utilidades de análisis técnico para calcular las fases lunares
 * Siguiendo las convenciones de nombres de Pine Script
 */

export class ta {
  /**
   * Valida una fecha de entrada
   *
   * @param date - Fecha que se validará
   * @param paramName - Nombre del parámetro para el mensaje de error
   * @throws {Error} Si la fecha no es válida
   */
  static validateDate(date: Date, paramName: string = 'date'): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error(`Se proporcionó un valor no válido para ${paramName}`)
    }
  }

  /**
   * Calcula la fase lunar para una fecha mediante un algoritmo astronómico preciso
   *
   * @param date - Fecha para la que se calculará la fase
   * @returns Valor de la fase lunar (0-1, donde 0=Luna nueva y 0.5=Luna llena)
   * @throws {Error} Si la fecha no es válida
   */
  static moonPhase(date: Date): number {
    this.validateDate(date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    const jd = this.julianDay(year, month, day, hour, minute, second)
    const newMoonJD = 2451549.5
    const synodicMonth = 29.53058868
    const phase = ((jd - newMoonJD) % synodicMonth) / synodicMonth
    return phase < 0 ? phase + 1 : phase
  }

  /**
   * Calcula el número de día juliano
   *
   * @param year - Año
   * @param month - Mes (1-12)
   * @param day - Día
   * @param hour - Hora (0-23)
   * @param minute - Minuto (0-59)
   * @param second - Segundo (0-59)
   * @returns Número de día juliano
   * @throws {Error} Si los parámetros no son válidos
   */
  static julianDay(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): number {
    if (year < -4712 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Los parámetros de fecha no son válidos')
    }
    if (month <= 2) {
      year -= 1
      month += 12
    }
    const a = Math.floor(year / 100)
    const b = 2 - a + Math.floor(a / 4)
    const dayFraction = (hour + minute / 60 + second / 3600) / 24
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + dayFraction + b - 1524.5
  }

  /**
   * Obtiene el nombre de la fase lunar a partir de su valor
   *
   * @param phase - Valor de la fase (0-1)
   * @returns Nombre de la fase
   * @throws {Error} Si la fase está fuera del rango permitido
   */
  static phaseName(phase: number): string {
    if (phase < 0 || phase > 1) {
      throw new Error('La fase debe estar entre 0 y 1')
    }
    if (phase < 0.0625) {
      return 'Luna nueva'
    }
    if (phase < 0.1875) {
      return 'Luna creciente'
    }
    if (phase < 0.3125) {
      return 'Cuarto creciente'
    }
    if (phase < 0.4375) {
      return 'Gibosa creciente'
    }
    if (phase < 0.5625) {
      return 'Luna llena'
    }
    if (phase < 0.6875) {
      return 'Gibosa menguante'
    }
    if (phase < 0.8125) {
      return 'Cuarto menguante'
    }
    if (phase < 0.9375) {
      return 'Luna menguante'
    }
    return 'Luna nueva'
  }

  /**
   * Calcula el porcentaje de iluminación
   *
   * @param phase - Valor de la fase (0-1)
   * @returns Porcentaje de iluminación (0-100)
   * @throws {Error} Si la fase está fuera del rango permitido
   */
  static illumination(phase: number): number {
    if (phase < 0 || phase > 1) {
      throw new Error('La fase debe estar entre 0 y 1')
    }
    return Math.abs(Math.cos(phase * 2 * Math.PI)) * 100
  }

  /**
   * Encuentra la fecha de la próxima luna nueva mediante una búsqueda binaria optimizada
   *
   * @param fromDate - Fecha inicial
   * @returns Fecha de la próxima luna nueva
   * @throws {Error} Si fromDate no es válida
   */
  static nextNewMoon(fromDate: Date): Date {
    this.validateDate(fromDate, 'fromDate')
    return this.findNextPhase(fromDate, 0, 'luna nueva')
  }

  /**
   * Encuentra la fecha de la próxima luna llena mediante una búsqueda binaria optimizada
   *
   * @param fromDate - Fecha inicial
   * @returns Fecha de la próxima luna llena
   * @throws {Error} Si fromDate no es válida
   */
  static nextFullMoon(fromDate: Date): Date {
    this.validateDate(fromDate, 'fromDate')
    return this.findNextPhase(fromDate, 0.5, 'luna llena')
  }

  /**
   * Calcula los días entre dos fechas
   *
   * @param fromDate - Fecha inicial
   * @param toDate - Fecha objetivo
   * @returns Número de días (puede ser negativo si toDate es anterior a fromDate)
   * @throws {Error} Si las fechas no son válidas
   */
  static daysBetween(fromDate: Date, toDate: Date): number {
    this.validateDate(fromDate, 'fromDate')
    this.validateDate(toDate, 'toDate')
    const msPerDay = 24 * 60 * 60 * 1000
    const fromTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime()
    const toTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime()
    return Math.round((toTime - fromTime) / msPerDay)
  }

  /**
   * Formatea una cadena de tiempo relativo
   *
   * @param days - Número de días
   * @returns Cadena de tiempo relativo formateada
   * @throws {Error} Si days no es un número
   */
  static formatRelativeTime(days: number): string {
    if (typeof days !== 'number' || isNaN(days)) {
      throw new Error('Los días deben ser un número válido')
    }
    if (days === 0) {
      return 'Hoy'
    }
    if (days === 1) {
      return 'Mañana'
    }
    if (days === -1) {
      return 'Ayer'
    }
    if (days > 0) {
      return `En ${days} días`
    }
    return `Hace ${Math.abs(days)} días`
  }

  /**
   * Encuentra los eventos principales de fases en un intervalo de fechas
   *
   * @param startDate - Inicio del intervalo de fechas
   * @param endDate - Fin del intervalo de fechas
   * @returns Matriz de eventos de fase con fechas y tipos
   * @throws {Error} Si las fechas no son válidas
   */
  static findPhaseEvents(startDate: Date, endDate: Date): Array<{ date: Date; type: string; phase: number }> {
    this.validateDate(startDate, 'startDate')
    this.validateDate(endDate, 'endDate')
    const events: Array<{ date: Date; type: string; phase: number }> = []
    const searchDate = new Date(startDate)
    searchDate.setDate(searchDate.getDate() - 2)
    const endTime = endDate.getTime() + (2 * 24 * 60 * 60 * 1000)
    while (searchDate.getTime() <= endTime) {
      const phase = this.moonPhase(searchDate)
      const prevDate = new Date(searchDate)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevPhase = this.moonPhase(prevDate)
      const nextDate = new Date(searchDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextPhase = this.moonPhase(nextDate)
      let phaseType = ''
      if (phase < 0.05 && (prevPhase > 0.95 || nextPhase > 0.05)) {
        phaseType = 'new-moon'
      } else if (Math.abs(phase - 0.5) < 0.05 && (Math.abs(prevPhase - 0.5) > 0.05 || Math.abs(nextPhase - 0.5) > 0.05)) {
        phaseType = 'full-moon'
      } else if (Math.abs(phase - 0.25) < 0.05 && (Math.abs(prevPhase - 0.25) > 0.05 || Math.abs(nextPhase - 0.25) > 0.05)) {
        phaseType = 'quarter'
      } else if (Math.abs(phase - 0.75) < 0.05 && (Math.abs(prevPhase - 0.75) > 0.05 || Math.abs(nextPhase - 0.75) > 0.05)) {
        phaseType = 'quarter'
      }
      if (phaseType && searchDate >= startDate && searchDate <= endDate) {
        events.push({ date: new Date(searchDate), type: phaseType, phase })
      }
      searchDate.setDate(searchDate.getDate() + 1)
    }
    return events
  }

  /**
   * Encuentra la próxima aparición de una fase específica mediante una búsqueda optimizada
   *
   * @param fromDate - Fecha inicial
   * @param targetPhase - Fase objetivo (0-1)
   * @param phaseName - Nombre de la fase para los mensajes de error
   * @returns Fecha de la próxima aparición de la fase
   * @throws {Error} Si no se encuentra la fase
   */
  private static findNextPhase(fromDate: Date, targetPhase: number, phaseName: string): Date {
    const date = new Date(fromDate)
    date.setHours(date.getHours() + 1)
    const synodicMonth = 29.53
    const maxDays = synodicMonth + 1
    let bestDate = new Date(date)
    let bestDiff = 1
    for (let hours = 0; hours < maxDays * 24; hours += 2) {
      const currentDate = new Date(date.getTime() + (hours * 60 * 60 * 1000))
      const phase = this.moonPhase(currentDate)
      let diff = Math.abs(phase - targetPhase)
      if (diff > 0.5) {
        diff = 1 - diff
      }
      if (diff < bestDiff) {
        bestDiff = diff
        bestDate = new Date(currentDate)
      }
      if (bestDiff < 0.02) {
        return this.refinePhaseDate(bestDate, targetPhase)
      }
    }
    if (bestDiff < 0.1) {
      return this.refinePhaseDate(bestDate, targetPhase)
    }
    throw new Error(`No se encontró la próxima ${phaseName} dentro del intervalo de búsqueda`)
  }

  /**
   * Refina la fecha de la fase para obtener mayor precisión
   *
   * @param approximateDate - Fecha aproximada de la fase
   * @param targetPhase - Fase objetivo (0-1)
   * @returns Fecha refinada
   */
  private static refinePhaseDate(approximateDate: Date, targetPhase: number): Date {
    let bestDate = new Date(approximateDate)
    let bestDiff = Math.abs(this.moonPhase(bestDate) - targetPhase)
    if (bestDiff > 0.5) {
      bestDiff = 1 - bestDiff
    }
    for (let minutes = -720; minutes <= 720; minutes += 30) {
      const testDate = new Date(approximateDate.getTime() + (minutes * 60 * 1000))
      const phase = this.moonPhase(testDate)
      let diff = Math.abs(phase - targetPhase)
      if (diff > 0.5) {
        diff = 1 - diff
      }
      if (diff < bestDiff) {
        bestDiff = diff
        bestDate = new Date(testDate)
      }
    }
    return bestDate
  }
}

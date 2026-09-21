import { ta } from '@/core/ta'

/**
 * Gestor del seguimiento de fechas y las transiciones de fase
 */
export class DateTracker {
  private currentDate: Date
  private onDateChange: (date: Date) => void
  private animationSpeed: number = 1
  private isAnimating: boolean = false
  private animationId: number | null = null
  private lastUpdateTime: number = 0
  private readonly updateThrottle: number = 100

  /**
  * Inicializa el seguimiento de fechas
   *
  * @param initialDate - Fecha inicial
  * @param onDateChange - Función de retorno para los cambios de fecha
  * @throws {Error} Si los parámetros no son válidos
   */
  constructor(initialDate: Date = new Date(), onDateChange: (date: Date) => void) {
    ta.validateDate(initialDate, 'initialDate')
    if (typeof onDateChange !== 'function') {
      throw new Error('onDateChange debe ser una función')
    }
    this.currentDate = new Date(initialDate)
    this.onDateChange = onDateChange
  }

  /**
  * Obtiene la fecha actual
   *
  * @returns Fecha actual
   */
  getCurrentDate(): Date {
    return new Date(this.currentDate)
  }

  /**
  * Establece una fecha nueva con animación opcional
   *
  * @param date - Fecha objetivo
  * @param animate - Indica si se debe animar la transición
  * @throws {Error} Si la fecha no es válida
   */
  setDate(date: Date, animate: boolean = false): void {
    ta.validateDate(date)
    if (animate) {
      this.animateToDate(date)
    } else {
      this.currentDate = new Date(date)
      this.onDateChange(this.currentDate)
    }
  }

  /**
  * Salta a la próxima luna nueva
   *
  * @param animate - Indica si se debe animar la transición
   */
  goToNextNewMoon(animate: boolean = true): void {
    const nextNewMoon = ta.nextNewMoon(this.currentDate)
    this.setDate(nextNewMoon, animate)
  }

  /**
  * Salta a la próxima luna llena
   *
   * @param animate - Whether to animate transition
   */
  goToNextFullMoon(animate: boolean = true): void {
    const nextFullMoon = ta.nextFullMoon(this.currentDate)
    this.setDate(nextFullMoon, animate)
  }

  /**
  * Añade días a la fecha actual
   *
  * @param days - Número de días que se añadirán
  * @param animate - Indica si se debe animar la transición
  * @throws {Error} Si days no es un número
   */
  addDays(days: number, animate: boolean = false): void {
    if (typeof days !== 'number' || isNaN(days)) {
      throw new Error('Los días deben ser un número válido')
    }
    const newDate = new Date(this.currentDate)
    newDate.setDate(newDate.getDate() + days)
    this.setDate(newDate, animate)
  }

  /**
  * Establece la velocidad de animación
   *
  * @param speed - Multiplicador de la velocidad de animación
  * @throws {Error} Si speed no es válido
   */
  setAnimationSpeed(speed: number): void {
    if (typeof speed !== 'number' || speed <= 0) {
      throw new Error('La velocidad debe ser un número positivo')
    }
    this.animationSpeed = speed
  }

  /**
  * Anima hasta la fecha objetivo
   *
  * @param targetDate - Fecha hasta la que se animará
   */
  private animateToDate(targetDate: Date): void {
    if (this.isAnimating && this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.isAnimating = true
    const startDate = new Date(this.currentDate)
    const totalDuration = Math.abs(targetDate.getTime() - startDate.getTime())
    const startTime = Date.now()
    const animate = (): void => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (totalDuration / this.animationSpeed), 1)
      const easeProgress = this.easeInOutCubic(progress)
      const currentTime =
        startDate.getTime() + (targetDate.getTime() - startDate.getTime()) * easeProgress
      this.currentDate = new Date(currentTime)
      const now = Date.now()
      if (now - this.lastUpdateTime >= this.updateThrottle || progress >= 1) {
        this.onDateChange(this.currentDate)
        this.lastUpdateTime = now
      }
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
      }
    }
    animate()
  }

  /**
  * Función de aceleración para animaciones fluidas
   *
  * @param t - Valor de progreso (0-1)
  * @returns Valor de progreso suavizado
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
  * Obtiene la información de la fase lunar actual
   *
  * @returns Objeto con información de la fase
   */
  getCurrentPhaseInfo(): {
    phase: number
    name: string
    illumination: number
    nextNewMoon: Date
    nextFullMoon: Date
    } {
    const phase = ta.moonPhase(this.currentDate)
    return {
      phase,
      name: ta.phaseName(phase),
      illumination: ta.illumination(phase),
      nextNewMoon: ta.nextNewMoon(this.currentDate),
      nextFullMoon: ta.nextFullMoon(this.currentDate)
    }
  }

  /**
  * Detiene las animaciones en ejecución
   */
  stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isAnimating = false
  }

  /**
  * Libera los recursos
   */
  dispose(): void {
    this.stopAnimation()
  }
}

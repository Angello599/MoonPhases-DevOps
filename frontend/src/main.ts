import { MoonRenderer } from '@/components/MoonRenderer'
import { DateTracker } from '@/components/DateTracker'
import { Timeline } from '@/components/Timeline'
import { ta } from '@/core/ta'

/**
 * Clase principal de la aplicación de seguimiento de fases lunares en 3D
 */
class MoonPhaseApp {
  private moonRenderer!: MoonRenderer
  private dateTracker!: DateTracker
  private timeline!: Timeline
  private dateDisplay!: HTMLElement
  private phaseDisplay!: HTMLElement
  private isUpdatingFromTimeline: boolean = false

  /**
  * Inicializa la aplicación
   */
  constructor() {
    this.initUI()
    this.initRenderer()
    this.initDateTracker()
    this.initTimeline()
    this.setupKeyboardControls()
    this.updateUI()
  }

  /**
  * Inicializa los elementos de la interfaz
   */
  private initUI(): void {
    this.dateDisplay = document.getElementById('date-display')!
    this.phaseDisplay = document.getElementById('phase-display')!
    if (!this.dateDisplay || !this.phaseDisplay) {
      throw new Error('No se encontraron los elementos necesarios de la interfaz')
    }
  }

  /**
  * Inicializa el renderizador lunar en 3D
   */
  private initRenderer(): void {
    const container = document.getElementById('moon-container')
    if (!container) {
      throw new Error('No se encontró el contenedor de la luna')
    }
    this.moonRenderer = new MoonRenderer(container)
  }

  /**
  * Inicializa el sistema de seguimiento de fechas
   */
  private initDateTracker(): void {
    this.dateTracker = new DateTracker(new Date(), (date: Date) => {
      this.moonRenderer.updatePhase(date, false)
      if (!this.isUpdatingFromTimeline) {
        this.timeline.updateCurrentDate(date)
      }
      this.updateUI()
    })
  }

  /**
  * Inicializa el componente de línea de tiempo
   */
  private initTimeline(): void {
    this.timeline = new Timeline((date: Date) => {
      this.isUpdatingFromTimeline = true
      this.dateTracker.stopAnimation()
      this.moonRenderer.updatePhase(date, true)
      this.dateTracker.setDate(date, false)
      setTimeout(() => {
        this.isUpdatingFromTimeline = false
      }, 1500)
    })
  }

  /**
  * Configura los controles de teclado para la navegación
   */
  private setupKeyboardControls(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        this.dateTracker.addDays(-1, true)
        break
      case 'ArrowRight':
        e.preventDefault()
        this.dateTracker.addDays(1, true)
        break
      case 'ArrowUp':
        e.preventDefault()
        this.dateTracker.addDays(-7, true)
        break
      case 'ArrowDown':
        e.preventDefault()
        this.dateTracker.addDays(7, true)
        break
      case 'n':
      case 'N':
        e.preventDefault()
        this.dateTracker.goToNextNewMoon(true)
        break
      case 'f':
      case 'F':
        e.preventDefault()
        this.dateTracker.goToNextFullMoon(true)
        break
      case ' ':
        e.preventDefault()
        this.dateTracker.setDate(new Date(), true)
        break
      case 't':
      case 'T':
        e.preventDefault()
        this.toggleTimeline()
        break
      }
    })
  }

  /**
  * Actualiza los elementos visibles de la interfaz
   */
  private updateUI(): void {
    const currentDate = this.dateTracker.getCurrentDate()
    const phaseInfo = this.dateTracker.getCurrentPhaseInfo()
    this.dateDisplay.textContent = currentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const nextNewMoonDate = phaseInfo.nextNewMoon.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
    const nextFullMoonDate = phaseInfo.nextFullMoon.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
    const daysToNewMoon = ta.daysBetween(currentDate, phaseInfo.nextNewMoon)
    const daysToFullMoon = ta.daysBetween(currentDate, phaseInfo.nextFullMoon)
    const newMoonRelative = ta.formatRelativeTime(daysToNewMoon)
    const fullMoonRelative = ta.formatRelativeTime(daysToFullMoon)
    this.phaseDisplay.innerHTML = `
      <div><strong>${phaseInfo.name}</strong> (${Math.round(
  phaseInfo.illumination
)}% iluminada)</div>
      <div style="margin-top: 8px; font-size: 12px;">
        <div>Próxima luna nueva: ${nextNewMoonDate} <span style="opacity: 0.8;">(${newMoonRelative})</span></div>
        <div>Próxima luna llena: ${nextFullMoonDate} <span style="opacity: 0.8;">(${fullMoonRelative})</span></div>
      </div>
      <div style="margin-top: 10px; font-size: 11px; opacity: 0.7;">
        <div>← →: Días | ↑ ↓: Semanas | T: Línea de tiempo</div>
        <div>N: Luna nueva | F: Luna llena | Espacio: Hoy</div>
      </div>
    `
  }

  /**
  * Alterna la visibilidad de la línea de tiempo
   */
  private toggleTimeline(): void {
    const timelinePanel = document.getElementById('timeline-panel')
    if (timelinePanel) {
      if (timelinePanel.style.display === 'none') {
        timelinePanel.style.display = 'block'
      } else {
        timelinePanel.style.display = 'none'
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new MoonPhaseApp()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('No se pudo inicializar la aplicación de fases lunares:', error)
    document.body.innerHTML = `
      <div style="color: white; text-align: center; margin-top: 50px;">
        <h1>Error</h1>
        <p>No se pudo cargar la aplicación de fases lunares en 3D.</p>
        <p style="font-size: 12px; opacity: 0.7;">${
  error instanceof Error ? error.message : 'Error desconocido'
}</p>
      </div>
    `
  }
})

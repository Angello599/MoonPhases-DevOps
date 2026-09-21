const API_BASE_URL = '/api'

/**
 * Panel for viewing and saving lunar observation notes by date.
 * Connects to the backend /api/notes endpoints.
 */
export class NotesPanel {
  private textarea!: HTMLTextAreaElement
  private saveButton!: HTMLElement
  private statusLabel!: HTMLElement
  private currentDateKey: string = ''
  private debounceTimer: number | null = null

  /**
   * Initialize the notes panel
   *
   * @throws {Error} If required DOM elements are not found
   */
  constructor() {
    this.initElements()
    this.setupEventListeners()
  }

  /**
   * Initialize DOM elements
   *
   * @throws {Error} If required elements not found
   */
  private initElements(): void {
    this.textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement
    this.saveButton = document.getElementById('notes-save')!
    this.statusLabel = document.getElementById('notes-status')!
    if (!this.textarea || !this.saveButton || !this.statusLabel) {
      throw new Error('Required notes panel elements not found')
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.saveButton.addEventListener('click', () => {
      this.saveNote()
    })
  }

  /**
   * Called whenever the app's current date changes.
   * Debounced so rapid changes during timeline animation don't spam the API.
   *
   * @param date - New current date
   */
  setDate(date: Date): void {
    const dateKey = this.formatDateKey(date)
    if (dateKey === this.currentDateKey) {
      return
    }
    this.currentDateKey = dateKey
    this.textarea.value = ''
    this.statusLabel.textContent = ''
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = window.setTimeout(() => {
      this.loadNote(dateKey)
    }, 400)
  }

  /**
   * Load the note for a given date key (YYYY-MM-DD) from the backend
   *
   * @param dateKey - Date in YYYY-MM-DD format
   */
  private async loadNote(dateKey: string): Promise<void> {
    this.statusLabel.textContent = 'Cargando...'
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${dateKey}`)
      if (response.status === 404) {
        this.textarea.value = ''
        this.statusLabel.textContent = 'Sin notas para esta fecha'
        return
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const note = await response.json()
      if (dateKey === this.currentDateKey) {
        this.textarea.value = note.content
        this.statusLabel.textContent = 'Nota cargada'
      }
    } catch {
      this.statusLabel.textContent = 'No se pudo conectar al servidor'
    }
  }

  /**
   * Save the current textarea content as the note for the current date
   */
  private async saveNote(): Promise<void> {
    const content = this.textarea.value.trim()
    if (!content) {
      this.statusLabel.textContent = 'Escribe algo antes de guardar'
      return
    }
    this.statusLabel.textContent = 'Guardando...'
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: this.currentDateKey, content })
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      this.statusLabel.textContent = 'Guardado ✓'
    } catch {
      this.statusLabel.textContent = 'Error al guardar'
    }
  }

  /**
   * Format a Date as YYYY-MM-DD using LOCAL date parts (not UTC),
   * so the note is saved/loaded for the day the user actually sees.
   *
   * @param date - Date to format
   * @returns Date string in YYYY-MM-DD format
   */
  private formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

const STORAGE_KEY = 'sinal-ao-vivo:theme';

export const THEMES = [
  { id: 'regie', label: 'Regie Escura' },
  { id: 'claro', label: 'Estúdio Claro' },
  { id: 'contraste', label: 'Alto Contraste' },
];

/**
 * ThemeModel: única responsabilidade é saber qual tema está ativo
 * e lembrar disso entre visitas (localStorage). Não sabe nada de HTML/CSS.
 */
export class ThemeModel {
  constructor() {
    const saved = this._read();
    this.current = THEMES.some(t => t.id === saved) ? saved : THEMES[0].id;
  }

  list() {
    return THEMES;
  }

  get() {
    return this.current;
  }

  set(themeId) {
    if (!THEMES.some(t => t.id === themeId)) return;
    this.current = themeId;
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch (e) {
      // navegador pode estar bloqueando armazenamento local — sem problema,
      // o tema simplesmente não é lembrado na próxima visita
    }
  }

  _read() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }
}

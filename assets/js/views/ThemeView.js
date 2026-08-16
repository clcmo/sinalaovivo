/**
 * ThemeView: desenha os botões de tema e aplica o atributo data-theme
 * no <html>. Não decide qual tema é o padrão nem persiste nada —
 * isso é trabalho do ThemeModel, orquestrado pelo ThemeController.
 */
export class ThemeView {
  constructor(root) {
    this.root = root;
  }

  render(themes, currentId, onSelect) {
    this.root.innerHTML = themes.map(t => `
      <button class="theme-btn ${t.id === currentId ? 'active' : ''}" data-theme-id="${t.id}"
        aria-pressed="${t.id === currentId}">${t.label}</button>
    `).join('');

    [...this.root.querySelectorAll('.theme-btn')].forEach(btn => {
      btn.addEventListener('click', () => onSelect(btn.dataset.themeId));
    });
  }

  apply(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
  }
}

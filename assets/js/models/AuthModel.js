/**
 * AuthModel: guarda quem está logado (via Google ou como convidado),
 * a credencial usada para falar com a API do YouTube (token OAuth do
 * Google OU uma chave de API colada manualmente) e os canais favoritos
 * daquele perfil. Cada perfil persiste em localStorage sob uma chave própria.
 *
 * Não sabe nada sobre botões, telas ou eventos de clique — isso é papel
 * da AuthView / AuthController.
 */
export class AuthModel {
  constructor() {
    this.identity = null;     // { type: 'google'|'guest', id, name, picture }
    this.accessToken = null;  // token OAuth do Google (curta duração)
    this.tokenExpiresAt = 0;
    this.apiKey = '';         // fallback: chave de API colada manualmente
    this.favorites = [];      // [{ channelId, channelTitle }]
  }

  isLoggedIn() {
    return !!this.identity;
  }

  loginGoogle({ email, name, picture }) {
    this.identity = { type: 'google', id: email, name, picture };
    this._loadPersisted();
  }

  loginGuest(username) {
    this.identity = { type: 'guest', id: username, name: username, picture: null };
    this._loadPersisted();
  }

  logout() {
    this.identity = null;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.apiKey = '';
    this.favorites = [];
  }

  forget() {
    if (this.identity) {
      try {
        localStorage.removeItem(this._storageKey());
      } catch (e) {
        // nada salvo, sem problema
      }
    }
    this.logout();
  }

  setAccessToken(token, expiresInSeconds) {
    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + (Number(expiresInSeconds) || 0) * 1000;
  }

  hasValidToken() {
    return !!this.accessToken && Date.now() < this.tokenExpiresAt - 5000;
  }

  setApiKey(key) {
    this.apiKey = key;
    this._persist();
  }

  /**
   * Credencial atual para chamar a API: prioriza o token OAuth do Google
   * (obtido junto do login) e cai para a chave manual se não houver token.
   * Retorna null se nada estiver disponível ainda.
   */
  credential() {
    if (this.hasValidToken()) return { type: 'token', value: this.accessToken };
    if (this.apiKey) return { type: 'key', value: this.apiKey };
    return null;
  }

  isFavorite(channelId) {
    return this.favorites.some(f => f.channelId === channelId);
  }

  toggleFavorite(channelId, channelTitle) {
    const idx = this.favorites.findIndex(f => f.channelId === channelId);
    if (idx >= 0) this.favorites.splice(idx, 1);
    else this.favorites.push({ channelId, channelTitle });
    this._persist();
  }

  _storageKey() {
    return `sinal-ao-vivo:profile:${this.identity.type}:${this.identity.id.toLowerCase()}`;
  }

  _loadPersisted() {
    try {
      const raw = localStorage.getItem(this._storageKey());
      const data = raw ? JSON.parse(raw) : null;
      this.favorites = Array.isArray(data?.favorites) ? data.favorites : [];
      this.apiKey = data?.apiKey || '';
    } catch (e) {
      this.favorites = [];
      this.apiKey = '';
    }
  }

  _persist() {
    if (!this.identity) return;
    try {
      localStorage.setItem(this._storageKey(), JSON.stringify({
        favorites: this.favorites,
        apiKey: this.apiKey,
      }));
    } catch (e) {
      // armazenamento local indisponível — segue sem persistir
    }
  }
}

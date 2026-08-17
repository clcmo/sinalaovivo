import { CONFIG } from '../config.js';

const LAST_SESSION_KEY = 'sinal-ao-vivo:last-session';

/**
 * AuthModel: guarda quem está logado (via Google ou como convidado),
 * a credencial usada para falar com a API do YouTube (token OAuth do
 * Google OU uma chave de API colada manualmente) e os canais favoritos
 * daquele perfil. Cada perfil persiste em localStorage sob uma chave própria.
 * Também lembra qual foi a última sessão neste navegador, para restaurar
 * o perfil sozinho quando a página é recarregada.
 *
 * Não sabe nada sobre botões, telas ou eventos de clique — isso é papel
 * da AuthView / AuthController. Fala com o SDK do Google (OAuth2) porque
 * essa é a fonte da credencial, do mesmo jeito que o ChannelModel fala
 * com a YouTube Data API.
 */
export class AuthModel {
  constructor() {
    this.identity = null;     // { type: 'google'|'guest', id, name, picture }
    this.accessToken = null;  // token OAuth do Google (curta duração, nunca persistido)
    this.tokenExpiresAt = 0;
    this.apiKey = '';         // fallback: chave de API colada manualmente
    this.favorites = [];      // [{ channelId, channelTitle }]
    this.tokenClient = null;

    this._restoreLastSession();
  }

  hasSession() {
    return !!this.identity;
  }

  getIdentity() {
    return this.identity;
  }

  getApiKey() {
    return this.apiKey;
  }

  loginGoogle({ email, name, picture }) {
    this.identity = { type: 'google', id: email, name, picture };
    this._loadPersisted();
    this._rememberLastSession();
  }

  loginGuest(username) {
    this.identity = { type: 'guest', id: username, name: username, picture: null };
    this._loadPersisted();
    this._rememberLastSession();
  }

  logout() {
    this.identity = null;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.apiKey = '';
    this.favorites = [];
    this._forgetLastSession();
  }

  /** Apaga também os dados persistidos do perfil atual (favoritos + chave). */
  clearAll() {
    if (this.identity) {
      try {
        localStorage.removeItem(this._storageKey());
      } catch (e) {
        // nada salvo, sem problema
      }
    }
    this.logout();
  }

  hasValidToken() {
    return !!this.accessToken && Date.now() < this.tokenExpiresAt - 5000;
  }

  saveApiKey(key) {
    this.apiKey = key;
    this._persist();
  }

  /**
   * Pede um access_token OAuth2 ao Google (escopo youtube.readonly), na
   * conta que já fez login. callback(error) é chamado ao final.
   */
  requestOAuthToken(callback) {
    if (!window.google?.accounts?.oauth2) {
      callback && callback(new Error('Google Identity Services indisponível.'));
      return;
    }
    if (!this.tokenClient) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        scope: CONFIG.YOUTUBE_SCOPE,
        callback: response => {
          if (response.error) {
            callback && callback(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          this.tokenExpiresAt = Date.now() + (Number(response.expires_in) || 0) * 1000;
          callback && callback(null);
        },
      });
    }
    this.tokenClient.requestAccessToken({ prompt: '' });
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

  _rememberLastSession() {
    try {
      localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(this.identity));
    } catch (e) {
      // sem problema — só significa que não vai logar sozinho da próxima vez
    }
  }

  _forgetLastSession() {
    try {
      localStorage.removeItem(LAST_SESSION_KEY);
    } catch (e) {
      // sem problema
    }
  }

  _restoreLastSession() {
    try {
      const raw = localStorage.getItem(LAST_SESSION_KEY);
      if (!raw) return;
      this.identity = JSON.parse(raw);
      this._loadPersisted();
    } catch (e) {
      this.identity = null;
    }
  }
}

import { CONFIG } from '../config.js';

function decodeJwt(token) {
  const payload = token.split('.')[1];
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

/**
 * AuthController: liga o AuthModel à AuthView e ao Google Identity Services.
 *
 * Dois fluxos do Google, propositalmente separados:
 *  1) "Entrar com Google" (OpenID Connect) -> id_token -> nome/e-mail/foto,
 *     usado só para IDENTIFICAR a pessoa (não dá acesso a nenhuma API).
 *  2) "Autorizar acesso ao YouTube" (OAuth2 token client) -> access_token
 *     com escopo youtube.readonly, essa sim é a CREDENCIAL usada para
 *     consultar a API — pedida em conjunto, logo após o login.
 *
 * Quem não quiser passar pelo OAuth pode entrar como convidado (nome
 * digitado) e colar uma chave de API manualmente.
 */
export class AuthController {
  constructor(model, view, { onCredentialReady }) {
    this.model = model;
    this.view = view;
    this.onCredentialReady = onCredentialReady;
    this.tokenClient = null;

    this.view.bind({
      onToggleGuestPanel: () => this.view.toggleGuestPanel(),
      onToggleManualKey: () => this.view.toggleManualKeyPanel(),
      onGuestSubmit: username => this._loginGuest(username),
      onManualKeySave: key => this._saveManualKey(key),
      onAuthorizeYoutube: () => this._requestAccessToken(),
      onLogout: () => this._logout(),
      onForget: () => this._forget(),
    });

    this._initGoogle();
  }

  _initGoogle() {
    if (!window.google?.accounts || CONFIG.GOOGLE_CLIENT_ID.includes('SEU_CLIENT_ID')) {
      this.view.showGoogleUnavailable();
      return;
    }

    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: response => this._handleGoogleLogin(response),
    });
    google.accounts.id.renderButton(this.view.googleButtonContainer, {
      theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'pt-BR',
    });

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: CONFIG.YOUTUBE_SCOPE,
      callback: response => this._handleAccessToken(response),
    });
  }

  _handleGoogleLogin(response) {
    const payload = decodeJwt(response.credential);
    this.model.loginGoogle({ email: payload.email, name: payload.name, picture: payload.picture });
    this._afterLogin();
    // pede a credencial da API automaticamente, na sequência do login
    this._requestAccessToken();
  }

  _loginGuest(username) {
    if (!username) {
      this.view.guestError('Digite um nome para entrar.');
      return;
    }
    this.model.loginGuest(username);
    this._afterLogin();
  }

  _afterLogin() {
    this.view.renderProfile(this.model.identity);
    if (this.model.apiKey) this.view.prefillManualKey(this.model.apiKey);
    if (this.model.credential()) this.onCredentialReady();
  }

  _requestAccessToken() {
    if (!this.tokenClient) {
      this.view.setKeyStatus('Login com Google não configurado neste site — use a chave manual abaixo.', true);
      return;
    }
    this.tokenClient.requestAccessToken({ prompt: '' });
  }

  _handleAccessToken(response) {
    if (response.error) {
      this.view.setKeyStatus(
        'Não foi possível autorizar o acesso ao YouTube (' + response.error + '). Você pode usar a chave manual abaixo.',
        true
      );
      return;
    }
    this.model.setAccessToken(response.access_token, response.expires_in);
    this.view.setKeyStatus('Autorizado com sua conta Google — pronto para sintonizar.', false);
    this.onCredentialReady();
  }

  _saveManualKey(key) {
    if (!key) {
      this.view.setKeyStatus('Cole uma chave válida para conectar.', true);
      return;
    }
    this.model.setApiKey(key);
    this.view.setKeyStatus('Chave manual conectada — pronto para sintonizar.', false);
    this.onCredentialReady();
  }

  _logout() {
    this.model.logout();
    this.view.reset();
  }

  _forget() {
    this.model.forget();
    this.view.reset();
  }
}

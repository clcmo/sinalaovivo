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
  constructor(authModel, authView) {
    this.model = authModel;
    this.view = authView;

    this.view.bind({
      onGuestSubmit: name => this._loginAsGuest(name),
      onManualKeySave: key => this._saveManualKey(key),
      onAuthorizeYoutube: () => this._authorizeYoutube(),
      onLogout: () => this._logout(),
      onForget: () => this._forget(),
      onToggleGuestPanel: () => this.view.toggleGuestPanel(),
      onToggleManualKey: () => this.view.toggleManualKeyPanel(),
    });
  }

  start() {
    if (!CONFIG.GOOGLE_CLIENT_ID || CONFIG.GOOGLE_CLIENT_ID.includes('SEU_CLIENT_ID')) {
      this.view.showGoogleUnavailable();
    } else {
      this._initGoogleButton();
    }

    if (this.model.hasSession()) {
      this.view.renderProfile(this.model.getIdentity());
      this.view.prefillManualKey(this.model.getApiKey());
    } else {
      this.view.reset();
    }
  }

  _initGoogleButton() {
    const render = () => {
      if (window.google && google.accounts && google.accounts.id) {
        this.view.renderGoogleButton(CONFIG.GOOGLE_CLIENT_ID, response => this._handleCredentialResponse(response));
      } else {
        setTimeout(render, 100); // Tenta novamente até a biblioteca GSI estar pronta
      }
    };
    render();
  }

  _handleCredentialResponse(response) {
    if (response.credential) {
      // Decodifica o JWT retornado pelo Google Identity Services
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      this.model.loginGoogle({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
      this.view.renderProfile(this.model.getIdentity());
    }
  }

  _loginAsGuest(name) {
    if (!name) {
      this.view.guestError('Informe um nome de usuário.');
      return;
    }
    this.model.loginGuest(name);
    this.view.renderProfile(this.model.getIdentity());
  }

  _authorizeYoutube() {
    this.model.requestOAuthToken(() => {
      this.view.setKeyStatus('Acesso ao YouTube autorizado com sucesso!');
    });
  }

  _saveManualKey(key) {
    if (!key) {
      this.view.setKeyStatus('Cole uma chave de API válida.', true);
      return;
    }
    this.model.saveApiKey(key);
    this.view.setKeyStatus('Chave salva com sucesso!');
  }

  _logout() {
    this.model.logout();
    this.view.reset();
    this.start();
  }

  _forget() {
    this.model.clearAll();
    this.view.reset();
    this.start();
  }
}

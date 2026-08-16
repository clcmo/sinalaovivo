/**
 * AuthView: mostra/esconde os blocos de login e credencial, e desenha
 * o chip de perfil. Não fala com a YouTube API — só recebe dados prontos
 * (nome, e-mail, foto) e dispara callbacks quando a pessoa interage.
 */
export class AuthView {
  constructor() {
    this.el = {
      loginPanel: document.getElementById('loginPanel'),
      loginStatus: document.getElementById('loginStatus'),
      googleButtonContainer: document.getElementById('googleButtonContainer'),
      googleUnavailable: document.getElementById('googleUnavailable'),
      guestToggle: document.getElementById('guestToggle'),
      guestPanel: document.getElementById('guestPanel'),
      guestInput: document.getElementById('guestUsername'),
      guestSubmit: document.getElementById('guestSubmit'),

      profileChip: document.getElementById('profileChip'),
      profileAvatar: document.getElementById('profileAvatar'),
      profileName: document.getElementById('profileName'),
      logoutBtn: document.getElementById('logoutBtn'),

      keyPanel: document.getElementById('keyPanel'),
      authorizeBtn: document.getElementById('authorizeYoutubeBtn'),
      manualKeyToggle: document.getElementById('manualKeyToggle'),
      manualKeyPanel: document.getElementById('manualKeyPanel'),
      manualKeyInput: document.getElementById('apiKey'),
      manualKeySave: document.getElementById('saveKeyBtn'),
      keyStatus: document.getElementById('keyStatus'),
      forgetBtn: document.getElementById('forgetBtn'),

      mainApp: document.getElementById('mainApp'),
    };
  }

  bind({ onGuestSubmit, onManualKeySave, onAuthorizeYoutube, onLogout, onForget, onToggleGuestPanel, onToggleManualKey }) {
    this.el.guestToggle.addEventListener('click', onToggleGuestPanel);
    this.el.guestSubmit.addEventListener('click', () => onGuestSubmit(this.el.guestInput.value.trim()));
    this.el.guestInput.addEventListener('keydown', e => { if (e.key === 'Enter') onGuestSubmit(this.el.guestInput.value.trim()); });

    this.el.authorizeBtn.addEventListener('click', onAuthorizeYoutube);
    this.el.manualKeyToggle.addEventListener('click', onToggleManualKey);
    this.el.manualKeySave.addEventListener('click', () => onManualKeySave(this.el.manualKeyInput.value.trim()));

    this.el.logoutBtn.addEventListener('click', onLogout);
    this.el.forgetBtn.addEventListener('click', onForget);
  }

  renderGoogleButton(clientId, onSuccessCallback) {
  if (window.google && google.accounts && google.accounts.id) {
    this.el.googleButtonContainer.innerHTML = ''; // Limpa estado anterior

    google.accounts.id.initialize({
      client_id: clientId,
      callback: onSuccessCallback,
      auto_select: false
    });

    google.accounts.id.renderButton(
      this.el.googleButtonContainer,
      { theme: 'outline', size: 'large', locale: 'pt-BR', width: '100%' }
    );
  }
}

  showGoogleUnavailable() {
    this.el.googleUnavailable.classList.remove('hidden');
  }

  toggleGuestPanel() {
    this.el.guestPanel.classList.toggle('hidden');
  }

  toggleManualKeyPanel() {
    this.el.manualKeyPanel.classList.toggle('hidden');
  }

  guestError(msg) {
    this.el.guestInput.setAttribute('aria-invalid', 'true');
    this.el.loginStatus.textContent = msg || '';
    this.el.loginStatus.className = 'panel-status' + (msg ? ' error' : '');
  }

  renderProfile(identity) {
    this.el.loginPanel.classList.add('hidden');
    this.el.profileChip.classList.remove('hidden');
    this.el.profileName.textContent = identity.name;
    if (identity.picture) {
      this.el.profileAvatar.src = identity.picture;
      this.el.profileAvatar.classList.remove('hidden');
    } else {
      this.el.profileAvatar.classList.add('hidden');
    }
    this.el.keyPanel.classList.remove('hidden');
    this.el.mainApp.classList.remove('hidden');
  }

  prefillManualKey(key) {
    this.el.manualKeyInput.value = key || '';
  }

  setKeyStatus(msg, isError) {
    this.el.keyStatus.textContent = msg || '';
    this.el.keyStatus.className = 'panel-status' + (isError ? ' error' : msg ? ' ok' : '');
  }

  reset() {
    this.el.loginPanel.classList.remove('hidden');
    this.el.profileChip.classList.add('hidden');
    this.el.keyPanel.classList.add('hidden');
    this.el.mainApp.classList.add('hidden');
    this.el.guestPanel.classList.add('hidden');
    this.el.manualKeyPanel.classList.add('hidden');
    this.el.guestInput.value = '';
    this.el.manualKeyInput.value = '';
    this.el.loginStatus.textContent = '';
    this.setKeyStatus('');
  }

  get googleButtonContainer() {
    return this.el.googleButtonContainer;
  }
}

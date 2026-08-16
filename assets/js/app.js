import { ThemeModel } from './models/ThemeModel.js';
import { AuthModel } from './models/AuthModel.js';
import { ChannelModel } from './models/ChannelModel.js';

import { ThemeView } from './views/ThemeView.js';
import { AuthView } from './views/AuthView.js';
import { ChannelView } from './views/ChannelView.js';

import { ThemeController } from './controllers/ThemeController.js';
import { AuthController } from './controllers/AuthController.js';
import { ChannelController } from './controllers/ChannelController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Tema: independente de login, aplica assim que a página carrega
  new ThemeController(new ThemeModel(), new ThemeView(document.getElementById('themeSwitcher')));

  // Canais + Autenticação: o ChannelController só começa a buscar
  // quando o AuthController avisa que existe uma credencial pronta
  const authModel = new AuthModel();
  const channelController = new ChannelController(new ChannelModel(), new ChannelView(), authModel);

  new AuthController(authModel, new AuthView(), {
    onCredentialReady: () => channelController.start(),
  });
});

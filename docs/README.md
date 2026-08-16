# 📡 Sinal Ao Vivo

Interface web que consulta a **YouTube Data API v3** e mostra canais transmitindo ao vivo agora, organizados por segmento. Dá pra assistir direto na página, abrir no YouTube e salvar canais favoritos por perfil.

Construído em **arquitetura MVC** com HTML + JavaScript puro (ES Modules, sem framework e sem build), pensado para apresentar as camadas separadas em aula de Interfaces Web I. Login com **Google (OAuth 2.0 + OpenID Connect)**, com um caminho alternativo (convidado + chave manual) para quem não tiver o login configurado.

## Arquitetura

```
index.html          ← só estrutura (HTML), nenhuma lógica
├── assets/  
   ├──   css/
      ├── base.css         ← reset, tipografia, layout, variáveis do tema padrão
      ├── themes.css        ← só redefine as variáveis de cor por tema  
      └── components.css    ← estilo de cada componente (cards, painéis, player...)
   └── js/
      ├── config.js          ← configuração (Client ID do Google)
      ├── app.js             ← ponto de entrada: instancia tudo e liga as peças
      ├── models/            ← dados e regras de negócio, sem tocar em DOM
      │   ├── ThemeModel.js    → tema ativo + persistência
      │   ├── AuthModel.js     → identidade, credencial de API, favoritos
      │   └── ChannelModel.js  → toda a comunicação com a YouTube Data API
      ├── views/             ← só DOM: desenham telas e disparam callbacks
      │   ├── ThemeView.js
      │   ├── AuthView.js
      │   └── ChannelView.js
      └── controllers/       ← ligam Model e View, tratam eventos
         ├── ThemeController.js
         ├── AuthController.js
         └── ChannelController.js
```

Nenhuma View importa um Model, e nenhum Model toca em `document`. Só os Controllers conhecem as duas pontas — é o ponto mais fácil de mostrar em aula: "o que acontece se eu trocar só a View de tema, mantendo o Model?".

## Temas

Três temas prontos, trocados por um atributo `data-theme` na tag `<html>` — CSS puro, sem JS reconstruindo estilos:

- **Regie Escura** (padrão) — sala de controle de transmissão, luz de tally vermelha
- **Estúdio Claro** — mesma identidade, fundo claro
- **Alto Contraste** — acessibilidade, preto/branco/amarelo

A escolha fica salva em `localStorage` e persiste entre visitas.

## Login com Google — o que ele faz

Dois fluxos do Google, propositalmente separados (bom exemplo em aula da diferença entre **autenticação** e **autorização**):

1. **"Sign in with Google"** (OpenID Connect) → devolve um `id_token` com nome, e-mail e foto. Serve só para **identificar** a pessoa — não dá acesso a nenhuma API.
2. **"Autorizar acesso ao YouTube"** (OAuth2, escopo `youtube.readonly`) → devolve um `access_token` de curta duração. Essa é a **credencial de verdade** usada para consultar a API, pedida automaticamente logo após o login.

Quem não configurar o login do Google (ou não quiser passar pelo consentimento) pode clicar em "Entrar sem conta Google" e colar uma chave de API manual, do jeito que já funcionava antes — o app não fica bloqueado.

## Configurando o login com Google (uma vez só, feito pelo professor/mantenedor)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Ative a **YouTube Data API v3** em "Biblioteca de APIs"
3. Configure a **Tela de consentimento OAuth**:
   - Tipo: Externo
   - Escopo adicionado: `https://www.googleapis.com/auth/youtube.readonly`
   - Publicação: deixe em **Teste** e adicione os e-mails da turma em "Usuários de teste" (até 100) — não precisa passar pela verificação do Google para uso didático
4. Crie uma credencial **ID do cliente OAuth**, tipo **Aplicativo da Web**:
   - Origens JavaScript autorizadas: a URL onde o GitHub Pages vai publicar (ex: `https://clcmo.github.io`)
5. Copie o Client ID gerado (algo como `123...apps.googleusercontent.com`) e cole em `js/config.js`:

```js
export const CONFIG = {
  GOOGLE_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
  YOUTUBE_SCOPE: 'https://www.googleapis.com/auth/youtube.readonly',
};
```

> Enquanto o app estiver em modo "Teste" na tela de consentimento, só quem estiver na lista de usuários de teste consegue autorizar o acesso ao YouTube — quem não estiver na lista vê uma tela de bloqueio do Google. É por isso que o app sempre tem a chave manual como alternativa: garante que a aula não trava se alguém não tiver sido cadastrado a tempo.

Sem esse Client ID configurado, o botão do Google simplesmente não aparece e o site já mostra direto a opção de convidado + chave manual.

## Antes de usar: credencial da API

- **Com Google configurado**: clique em "Entrar com Google" → depois em "Autorizar acesso ao YouTube" → pronto.
- **Sem Google (chave manual)**: crie uma chave em [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) (Credenciais → Criar credenciais → Chave de API) e cole na tela "2. Conectar à API do YouTube".

> Cada busca por segmento consome ~100 unidades da cota gratuita da API (10.000/dia). Com login Google, cada aluno usa a própria cota; com chave manual compartilhada, a cota é dividida entre todo mundo que usar a mesma chave.

## Rodando localmente

Como os módulos JS (`type="module"`) e as chamadas à API exigem `http://` ou `https://`, abrir o arquivo direto (`file://`) não funciona. Sirva por um servidor local:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Ou use a extensão **Live Server** do VS Code.

## Publicando no GitHub Pages

```bash
git init
git add .
git commit -m "Sinal Ao Vivo: MVC + temas + login com Google"
git branch -M main
git remote add origin https://github.com/clcmo/sinal-ao-vivo.git
git push -u origin main
```

No GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**. Em 1–2 minutos o site fica em `https://clcmo.github.io/sinal-ao-vivo/` — lembre de usar essa mesma URL como origem autorizada no passo de configuração do Google acima.

## Privacidade

Não existe servidor próprio nem banco de dados. Tokens de acesso do Google vivem só na memória da aba (nunca são salvos) e expiram sozinhos; a chave manual e a lista de favoritos de cada perfil ficam em `localStorage`, no navegador de cada pessoa. O login por nome de usuário (sem Google) não é autenticação de verdade — qualquer um que souber o nome digitado acessa aquele perfil no mesmo navegador. Bom para casa e sala de aula; não recomendado para dados sensíveis.

## Licença

MIT — veja [LICENCE](./LICENCE).

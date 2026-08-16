# 📡 Sinal Ao Vivo

Interface web que consulta a **YouTube Data API v3** e mostra canais transmitindo ao vivo agora, organizados por segmento (Jogos, Música, Notícias, Esportes, Educação, Tecnologia, Entretenimento, Estilo & Como Fazer). Dá pra assistir direto na página ou abrir a transmissão no YouTube, e salvar canais como favoritos.

Feito para uso didático em **Interfaces Web I** — sem build, sem backend, um único `index.html`.

## Funcionalidades

- 🔴 Busca de transmissões ao vivo por segmento (categoria oficial do YouTube) ou por texto livre
- 👁️ Contagem de espectadores simultâneos quando disponível
- ▶️ Player embutido na própria página + link direto para abrir no YouTube
- 👤 "Login" simples por nome de usuário (sem senha) para separar perfis no mesmo navegador
- ⭐ Canais favoritos, salvos por perfil, com aba dedicada para ver quais estão ao vivo agora
- 💾 Tudo fica salvo em `localStorage`, **só no navegador de quem está usando** — nada é enviado para nenhum servidor além do Google

## Antes de usar: chave da API

Cada pessoa que for testar precisa da própria chave gratuita da YouTube Data API v3:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto (ou use um existente)
3. Em **Biblioteca de APIs**, ative a **YouTube Data API v3**
4. Em **Credenciais**, crie uma **Chave de API**
5. Cole essa chave na tela "Conectar API" do site

> A cota gratuita é de 10.000 unidades/dia. Cada busca por segmento consome ~100 unidades — dá pra fazer bastante teste em sala, mas se a turma toda usar a mesma chave ao mesmo tempo ela pode esgotar rápido. O ideal é cada aluno criar a própria chave.

## Rodando localmente

Como o app faz `fetch` para a API do Google, o mais simples é servir por um servidor local (abrir o arquivo direto com `file://` pode ser bloqueado pelo navegador):

```bash
# na pasta do projeto
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Ou use a extensão **Live Server** do VS Code.

## Publicando no GitHub Pages

```bash
git init
git add .
git commit -m "Sinal Ao Vivo: canais do YouTube ao vivo por segmento"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sinal-ao-vivo.git
git push -u origin main
```

Depois, no GitHub:

1. Vá em **Settings → Pages**
2. Em **Source**, escolha **Deploy from a branch**
3. Branch: **main**, pasta: **/ (root)**
4. Salve e aguarde 1–2 minutos

O site fica disponível em `https://SEU_USUARIO.github.io/sinal-ao-vivo/`.

## Privacidade

Não existe servidor próprio nem banco de dados: a chave de API e a lista de favoritos de cada pessoa ficam salvas apenas no `localStorage` do navegador dela. Não é uma autenticação de verdade — qualquer pessoa que souber o nome de usuário digitado consegue acessar aquele perfil no mesmo navegador/computador. Bom para testar em casa ou em sala de aula; não recomendado para dados sensíveis.

## Estrutura

```
sinal-ao-vivo/
├── index.html   ← aplicação inteira (HTML + CSS + JS, sem dependências de build)
├── README.md
└── LICENSE
```

## Licença

MIT — veja [LICENSE](./LICENSE).

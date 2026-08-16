// Configuração do projeto.
// O professor/mantenedor preenche o CLIENT_ID uma única vez (veja o README,
// seção "Configurando o login com Google"). Os alunos não mexem aqui.
export const CONFIG = {
  // Crie em https://console.cloud.google.com/apis/credentials
  // Tipo: "ID do cliente OAuth" > Aplicativo da Web
  // Origens JavaScript autorizadas: a URL onde o GitHub Pages vai publicar o site
  GOOGLE_CLIENT_ID: '548410040077-6jriphfld2thua9426r68nmbfqj0e2ce.apps.googleusercontent.com',

  // Escopo somente-leitura: dá acesso de busca/consulta na API do YouTube
  // em nome de quem fizer login, sem poder alterar nada na conta da pessoa.
  YOUTUBE_SCOPE: 'https://www.googleapis.com/auth/youtube.readonly',
};

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export const SEGMENTS = [
  { id: 'all',   ch: 'TODOS', label: 'Todos os canais',       category: null },
  { id: 'games', ch: '01',    label: 'Jogos',                 category: 20 },
  { id: 'music', ch: '02',    label: 'Música',                category: 10 },
  { id: 'news',  ch: '03',    label: 'Notícias',              category: 25 },
  { id: 'sport', ch: '04',    label: 'Esportes',              category: 17 },
  { id: 'edu',   ch: '05',    label: 'Educação',              category: 27 },
  { id: 'tech',  ch: '06',    label: 'Tecnologia',            category: 28 },
  { id: 'ent',   ch: '07',    label: 'Entretenimento',        category: 24 },
  { id: 'style', ch: '08',    label: 'Estilo & Como Fazer',   category: 26 },
];

export const FAVORITES_SEGMENT = { id: 'favorites', ch: '\u2605', label: 'Favoritos', category: null, isFavorites: true };

function authHeaders(credential) {
  return credential.type === 'token' ? { Authorization: `Bearer ${credential.value}` } : {};
}

function withCredentialParam(params, credential) {
  if (credential.type === 'key') params.set('key', credential.value);
  return params;
}

async function callApi(path, params, credential) {
  const res = await fetch(`${API_BASE}/${path}?${withCredentialParam(params, credential)}`, {
    headers: authHeaders(credential),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Não foi possível consultar a API do YouTube.');
  }
  return data;
}

/**
 * ChannelModel: só sabe falar com a YouTube Data API v3. Recebe a credencial
 * (token OAuth ou chave de API) pronta e devolve dados já filtrados — nunca
 * toca em DOM nem sabe o que é um "segmento" visualmente.
 */
export class ChannelModel {
  async searchLive({ credential, category, query, maxResults = 24 }) {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      eventType: 'live',
      maxResults: String(maxResults),
      order: 'viewCount',
    });
    if (category) params.set('videoCategoryId', String(category));
    if (query) params.set('q', query);

    const data = await callApi('search', params, credential);
    return (data.items || []).filter(it => it.id && it.id.videoId);
  }

  async searchLiveByChannel({ credential, channelId }) {
    const params = new URLSearchParams({
      part: 'snippet',
      channelId,
      type: 'video',
      eventType: 'live',
      maxResults: '1',
    });
    const data = await callApi('search', params, credential);
    return data.items || [];
  }

  async fetchViewerCounts({ credential, videoIds }) {
    if (!videoIds.length) return {};
    const params = new URLSearchParams({ part: 'liveStreamingDetails', id: videoIds.join(',') });
    try {
      const data = await callApi('videos', params, credential);
      const map = {};
      (data.items || []).forEach(v => {
        const count = v.liveStreamingDetails && v.liveStreamingDetails.concurrentViewers;
        if (count) map[v.id] = Number(count);
      });
      return map;
    } catch (e) {
      return {}; // contagem de espectadores é só um extra, nunca deve travar a busca
    }
  }
}

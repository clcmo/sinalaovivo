const API_BASE = 'https://www.googleapis.com/youtube/v3';

// Lista de canais de grande relevância (CazéTV, DiaTV, TV Cultura, MTV Brasil)
export const RELEVANT_CHANNELS = [
  { id: 'UCZiYbVptd3PVPf4f6eR6UaQ', name: 'CazéTV' },
  { id: 'UCKnMcgDLxDeq9HqUgLhtYbQ', name: 'DiaTV' },
  { id: 'UCjOJvvYe6tyEHY21OD33h8A', name: 'TV Cultura' },
  { id: 'UCVN82Qid2Al8bPBr9I0FxVQ', name: 'MTV Brasil' },
];

export const SEGMENTS = [
  { id: 'all',     ch: 'TODOS', label: 'Todos os canais',        category: null },
  { id: 'curated', ch: '00',    label: 'Canais Destaque',        category: null, isCurated: true },
  { id: 'games',   ch: '01',    label: 'Jogos',                  category: 20 },
  { id: 'music',   ch: '02',    label: 'Música',                 category: 10 },
  { id: 'news',    ch: '03',    label: 'Notícias',               category: 25 },
  { id: 'sport',   ch: '04',    label: 'Esportes',               category: 17 },
  { id: 'edu',     ch: '05',    label: 'Educação',               category: 27 },
  { id: 'tech',    ch: '06',    label: 'Tecnologia',             category: 28 },
  { id: 'ent',     ch: '07',    label: 'Entretenimento',         category: 24 },
  { id: 'style',   ch: '08',    label: 'Estilo & Como Fazer',    category: 26 },
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
 * ChannelModel: comunicação direta com a YouTube Data API v3.
 */
export class ChannelModel {
  async searchLive({ credential, category, query, maxResults = 24 }) {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      eventType: 'live',
      maxResults: String(maxResults),
      order: 'viewCount', // Traz primeiro as transmissões com maior audiência
      regionCode: 'BR', // Afunila os resultados para o Brasil
      relevanceLanguage: 'pt', // Prioriza o idioma português
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

  // Busca simultânea de transmissões ao vivo para a lista de canais em destaque
  async fetchCuratedLive({ credential, channels = RELEVANT_CHANNELS }) {
    const promises = channels.map(ch =>
      this.searchLiveByChannel({ credential, channelId: ch.id }).catch(() => [])
    );
    const results = await Promise.all(promises);
    return results.flat().filter(it => it.id && it.id.videoId);
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
      return {};
    }
  }
}

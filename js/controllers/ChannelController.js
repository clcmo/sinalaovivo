import { SEGMENTS, FAVORITES_SEGMENT } from '../models/ChannelModel.js';

const ORDERED_SEGMENTS = [FAVORITES_SEGMENT, ...SEGMENTS];

/**
 * ChannelController: sabe qual segmento está ativo e qual é a busca livre
 * atual, pede dados ao ChannelModel usando a credencial fornecida pelo
 * AuthController, e manda a ChannelView desenhar o resultado.
 */
export class ChannelController {
  constructor(channelModel, channelView, authModel) {
    this.channelModel = channelModel;
    this.view = channelView;
    this.authModel = authModel;
    this.segment = SEGMENTS[0];
    this.query = '';

    this.view.bind({
      onSelectSegment: id => this._selectSegment(id),
      onSearch: query => this._search(query),
      onOpenPlayer: (videoId, title, channel) => this.view.openPlayer(videoId, title, channel),
      onToggleFavorite: (channelId, channelTitle) => this._toggleFavorite(channelId, channelTitle),
    });

    this._renderPresets();
  }

  start() {
    this.refresh();
  }

  _renderPresets() {
    this.view.renderPresets(ORDERED_SEGMENTS, this.segment.id, this.authModel.favorites.length);
  }

  _selectSegment(id) {
    this.segment = ORDERED_SEGMENTS.find(s => s.id === id) || SEGMENTS[0];
    this._renderPresets();
    this.refresh();
  }

  _search(query) {
    this.query = query;
    this.refresh();
  }

  _toggleFavorite(channelId, channelTitle) {
    this.authModel.toggleFavorite(channelId, channelTitle);
    this.view.updateStarButtons(channelId, this.authModel.isFavorite(channelId));
    this._renderPresets();
    if (this.segment.isFavorites) this.refresh();
  }

  async refresh() {
    const credential = this.authModel.credential();
    if (!credential) {
      this.view.setStatus('Conecte sua conta Google ou uma chave de API para sintonizar.', true);
      return;
    }

    if (this.segment.isFavorites) {
      return this._refreshFavorites(credential);
    }

    this.view.setStatus('Sintonizando transmissões ao vivo…');
    this.view.clearGrid();

    try {
      const items = await this.channelModel.searchLive({
        credential, category: this.segment.category, query: this.query,
      });

      if (items.length === 0) {
        this.view.setStatus('');
        this.view.showEmpty('Nenhum sinal encontrado', 'Tente outro segmento ou ajuste a busca.');
        return;
      }

      const viewerMap = await this.channelModel.fetchViewerCounts({
        credential, videoIds: items.map(it => it.id.videoId),
      });

      this.view.setStatus(`${items.length} transmissões ao vivo em "${this.segment.label}".`);
      this.view.renderGrid(items, viewerMap, id => this.authModel.isFavorite(id));

    } catch (err) {
      this.view.setStatus(err.message || 'Erro ao buscar canais ao vivo.', true);
      this.view.clearGrid();
    }
  }

  async _refreshFavorites(credential) {
    const favorites = this.authModel.favorites;
    if (favorites.length === 0) {
      this.view.setStatus('');
      this.view.showEmpty('Nenhum favorito ainda', 'Clique na estrela de um canal, em qualquer segmento, para adicioná-lo aqui.');
      return;
    }

    this.view.setStatus('Verificando quais favoritos estão ao vivo…');
    this.view.clearGrid();

    try {
      const results = await Promise.all(
        favorites.map(fav => this.channelModel.searchLiveByChannel({ credential, channelId: fav.channelId }))
      );
      const items = results.flat().filter(it => it.id && it.id.videoId);

      if (items.length === 0) {
        this.view.setStatus(`Nenhum dos seus ${favorites.length} favoritos está ao vivo agora.`);
        this.view.showEmpty('Tudo quieto por aqui', 'Nenhum canal favorito está transmitindo neste momento.');
        return;
      }

      const viewerMap = await this.channelModel.fetchViewerCounts({
        credential, videoIds: items.map(it => it.id.videoId),
      });

      this.view.setStatus(`${items.length} de ${favorites.length} favoritos ao vivo agora.`);
      this.view.renderGrid(items, viewerMap, id => this.authModel.isFavorite(id));

    } catch (err) {
      this.view.setStatus(err.message || 'Erro ao verificar favoritos.', true);
      this.view.clearGrid();
    }
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function formatViewers(n) {
  if (!n) return null;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k assistindo';
  return n + ' assistindo';
}

/**
 * ChannelView: desenha o quadro de segmentos, a busca, a grade de cards
 * e o player. Recebe listas prontas e dispara callbacks nos cliques —
 * não decide o que buscar nem guarda estado de favoritos.
 */
export class ChannelView {
  constructor() {
    this.el = {
      presets: document.getElementById('presets'),
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),
      status: document.getElementById('status'),
      player: document.getElementById('player'),
      grid: document.getElementById('grid'),
    };
  }

  bind({ onSelectSegment, onSearch, onOpenPlayer, onToggleFavorite }) {
    this._onSelectSegment = onSelectSegment;
    this._onOpenPlayer = onOpenPlayer;
    this._onToggleFavorite = onToggleFavorite;

    this.el.searchBtn.addEventListener('click', () => onSearch(this.el.searchInput.value.trim()));
    this.el.searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') onSearch(this.el.searchInput.value.trim());
    });
  }

  renderPresets(orderedSegments, currentId, favoritesCount) {
    this.el.presets.innerHTML = orderedSegments.map(seg => `
      <button class="preset ${seg.isFavorites ? 'favorites' : ''} ${seg.id === currentId ? 'active' : ''}" data-seg="${seg.id}">
        <span class="ch">${seg.ch}</span>${seg.label}${seg.isFavorites ? ` (${favoritesCount})` : ''}
      </button>
    `).join('');

    [...this.el.presets.querySelectorAll('.preset')].forEach(btn => {
      btn.addEventListener('click', () => this._onSelectSegment(btn.dataset.seg));
    });
  }

  setStatus(msg, isError) {
    this.el.status.textContent = msg || '';
    this.el.status.classList.toggle('error', !!isError);
  }

  showEmpty(title, body) {
    this.el.grid.innerHTML = `<div class="empty"><strong>${escapeHtml(title)}</strong>${escapeHtml(body)}</div>`;
  }

  clearGrid() {
    this.el.grid.innerHTML = '';
  }

  renderGrid(items, viewerMap, isFavoriteFn) {
    this.el.grid.innerHTML = items.map(it => {
      const videoId = it.id.videoId;
      const snip = it.snippet;
      const channelId = snip.channelId;
      const thumb = snip.thumbnails.medium?.url || snip.thumbnails.default?.url;
      const viewers = formatViewers(viewerMap[videoId]);
      const fav = isFavoriteFn(channelId);
      return `
        <div class="card">
          <div class="thumb-wrap" data-video="${videoId}" data-title="${escapeHtml(snip.title)}" data-channel="${escapeHtml(snip.channelTitle)}">
            <img src="${thumb}" alt="${escapeHtml(snip.title)}" loading="lazy" />
            <span class="tally"><span class="dot"></span>AO VIVO</span>
            <button class="star-btn ${fav ? 'active' : ''}" data-star-for="${channelId}" data-channel-title="${escapeHtml(snip.channelTitle)}"
              title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="Favoritar canal ${escapeHtml(snip.channelTitle)}">${fav ? '\u2605' : '\u2606'}</button>
            ${viewers ? `<span class="viewers">${viewers}</span>` : ''}
          </div>
          <div class="card-body">
            <div class="title">${escapeHtml(snip.title)}</div>
            <div class="channel">${escapeHtml(snip.channelTitle)}</div>
            <div class="card-actions">
              <button class="btn-ghost" data-video="${videoId}" data-title="${escapeHtml(snip.title)}" data-channel="${escapeHtml(snip.channelTitle)}">Assistir aqui</button>
              <a class="btn-outline" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Abrir no YouTube</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    [...this.el.grid.querySelectorAll('.thumb-wrap, .btn-ghost[data-video]')].forEach(el => {
      el.addEventListener('click', () => this._onOpenPlayer(el.dataset.video, el.dataset.title, el.dataset.channel));
    });
    [...this.el.grid.querySelectorAll('[data-star-for]')].forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this._onToggleFavorite(btn.dataset.starFor, btn.dataset.channelTitle);
      });
    });
  }

  updateStarButtons(channelId, isFav) {
    [...document.querySelectorAll(`[data-star-for="${channelId}"]`)].forEach(btn => {
      btn.classList.toggle('active', isFav);
      btn.textContent = isFav ? '\u2605' : '\u2606';
    });
  }

  openPlayer(videoId, title, channel) {
    this.el.player.classList.remove('hidden');
    this.el.player.innerHTML = `
      <div class="player-frame">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="${escapeHtml(title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <div class="player-meta">
        <div class="player-info">
          <h2>${escapeHtml(title)}</h2>
          <div class="channel">${escapeHtml(channel)}</div>
        </div>
        <div class="player-actions">
          <a class="btn-outline" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Abrir no YouTube</a>
          <a class="btn-ghost" href="https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}" target="_blank" rel="noopener">Ver conteúdos do canal</a>
          <button class="btn-close" id="closePlayerBtn">Fechar transmissão</button>
        </div>
      </div>
    `;
    document.getElementById('closePlayerBtn').addEventListener('click', () => this.closePlayer());
    this.el.player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  closePlayer() {
    this.el.player.classList.add('hidden');
    this.el.player.innerHTML = '';
  }
}

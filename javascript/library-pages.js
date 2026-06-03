const pageTitle = document.querySelector("[data-page-title]");
const pageSubtitle = document.querySelector("[data-page-subtitle]");
const trackList = document.querySelector("[data-track-list]");
const cardGrid = document.querySelector("[data-card-grid]");
const searchInput = document.querySelector("[data-search-input]");
const emptyState = document.querySelector("[data-empty-state]");
const tracks = MusicData.getTracks();

function createCover(type = "track") {
    const cover = document.createElement("div");
    cover.className = type === "artist" ? "artist-card__avatar" : "cover cover--small";
    cover.innerHTML = type === "artist" ? "<span></span>" : '<span class="cover__mark"></span>';
    return cover;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderTracks(items) {
    if (!trackList) {
        return;
    }

    trackList.innerHTML = "";
    emptyState.hidden = items.length > 0;

    items.forEach((track, index) => {
        const row = document.createElement("article");
        row.className = "track-list__row";
        row.innerHTML = `
            <span class="track-list__index">${index + 1}</span>
            <div class="track-list__main"></div>
            <span class="track-list__meta">${escapeHtml(track.album || "Single")}</span>
            <span class="track-list__duration">${track.year || ""}</span>
        `;

        const main = row.querySelector(".track-list__main");
        main.append(createCover());
        main.insertAdjacentHTML("beforeend", `
            <span class="track-list__text">
                <strong class="track-list__title">${escapeHtml(track.title)}</strong>
                <small class="track-list__artist">${escapeHtml(track.artist)}</small>
            </span>
        `);

        trackList.append(row);
    });
}

function renderCollectionCards(items, options) {
    if (!cardGrid) {
        return;
    }

    cardGrid.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("article");
        card.className = options.artist ? "artist-card" : "music-card";

        if (options.artist) {
            card.append(createCover("artist"));
        } else {
            card.append(createCover());
        }

        card.insertAdjacentHTML("beforeend", `
            <h3 class="${options.artist ? "artist-card__title" : "music-card__title"}">${escapeHtml(item.title)}</h3>
            <p class="${options.artist ? "artist-card__meta" : "music-card__meta"}">${escapeHtml(item.description)}</p>
        `);
        cardGrid.append(card);
    });
}

function initSearchPage() {
    renderTracks(tracks);

    searchInput.addEventListener("input", () => {
        const query = MusicData.normalize(searchInput.value);
        const results = tracks.filter((track) => {
            return MusicData.normalize(track.title).includes(query) ||
                MusicData.normalize(track.artist).includes(query);
        });

        renderTracks(results);
        pageSubtitle.textContent = query
            ? `Found ${results.length} tracks`
            : "Type a track or artist name";
    });
}

function initPlaylistsPage() {
    const playlists = MusicData.getPlaylists();
    renderCollectionCards(playlists.map((playlist) => ({
        title: playlist.title,
        description: `${playlist.trackIds.length} songs - ${playlist.description}`
    })), {});

    const playlistTracks = playlists.flatMap((playlist) => {
        return playlist.trackIds
            .map((id) => tracks.find((track) => track.id === id))
            .filter(Boolean);
    });

    renderTracks(playlistTracks);
}

function initArtistsPage() {
    const artistGroups = MusicData.groupBy(tracks, "artist");
    const artists = Object.entries(artistGroups).map(([artist, artistTracks]) => ({
        title: artist,
        description: `Artist - ${artistTracks.length} songs`
    }));

    renderCollectionCards(artists, { artist: true });
}

function initAlbumsPage() {
    const albumGroups = MusicData.groupBy(tracks, "album");
    const albums = Object.entries(albumGroups).map(([album, albumTracks]) => ({
        title: album,
        description: `${albumTracks[0].year || ""} - ${albumTracks[0].artist} - ${albumTracks.length} songs`
    }));

    renderCollectionCards(albums, {});
}

const page = document.body.dataset.page;

if (page === "search") {
    initSearchPage();
} else if (page === "playlists") {
    initPlaylistsPage();
} else if (page === "artists") {
    initArtistsPage();
} else if (page === "albums") {
    initAlbumsPage();
}

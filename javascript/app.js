const DB_NAME = "respot_music_player";
const DB_VERSION = 1;
const TRACK_STORE = "tracks";
const PLAYLIST_STORE = "playlists";
const FAVORITES_KEY = "respot_favorites";
const PLAYER_KEY = "respot_player_settings";
const LEGACY_DEMO_PLAYLIST_IDS = new Set(["pl-daily", "pl-energy"]);
const LOGO_URL = new URL("../images/logo.png", import.meta.url).href;

class Track {
    constructor(data) {
        this.id = data.id;
        this.title = data.title?.trim() || "Untitled";
        this.artist = data.artist?.trim() || "Unknown artist";
        this.album = data.album?.trim() || "Single";
        this.genre = data.genre || "Unknown";
        this.duration = Number(data.duration) || 0;
        this.blob = data.blob || null;
        this.previewUrl = data.previewUrl || "";
        this.source = data.source || "local";
        this.fileName = data.fileName || "";
        this.coverUrl = data.coverUrl || "";
        this.colorA = data.colorA || "#1ed760";
        this.colorB = data.colorB || "#6d8cff";
        this.createdAt = data.createdAt || Date.now();
    }

    matches(query) {
        return normalize(`${this.title} ${this.artist} ${this.album}`).includes(normalize(query));
    }

    toJSON() {
        return { ...this };
    }
}

class Playlist {
    constructor(data) {
        this.id = data.id;
        this.name = data.name?.trim() || "Untitled playlist";
        this.trackIds = Array.isArray(data.trackIds) ? [...data.trackIds] : [];
        this.coverUrl = data.coverUrl || "";
        this.createdAt = data.createdAt || Date.now();
    }

    static create(name) {
        return new Playlist({ id: uid("pl"), name, trackIds: [], createdAt: Date.now() });
    }

    rename(name) {
        this.name = name.trim();
    }

    addTrack(trackId) {
        if (this.trackIds.includes(trackId)) {
            return false;
        }
        this.trackIds.push(trackId);
        return true;
    }

    removeTrack(trackId) {
        this.trackIds = this.trackIds.filter((id) => id !== trackId);
    }

    syncTrackIds(existingTrackIds) {
        this.trackIds = this.trackIds.filter((trackId) => existingTrackIds.has(trackId));
    }

    toJSON() {
        return { ...this, trackIds: [...this.trackIds] };
    }
}

const playerSettings = readJson(PLAYER_KEY, { volume: 0.75, repeat: "off", shuffle: false });

const state = {
    tracks: [],
    playlists: [],
    favorites: new Set(readJson(FAVORITES_KEY, [])),
    view: "home",
    selectedPlaylistId: null,
    query: "",
    genre: "all",
    album: "all",
    currentTrackId: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: playerSettings.volume ?? 0.75,
    repeat: playerSettings.repeat === "one" ? "one" : "off",
    shuffle: playerSettings.shuffle ?? false,
    itunes: {
        query: "",
        results: [],
        isLoading: false,
        error: ""
    },
    menu: null
};

let db;
let audio;
let activeRangeAction = null;
const objectUrls = new Map();
const app = document.querySelector("#app");

function readJson(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    })[char]);
}

function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const nextDb = request.result;
            if (!nextDb.objectStoreNames.contains(TRACK_STORE)) {
                nextDb.createObjectStore(TRACK_STORE, { keyPath: "id" });
            }
            if (!nextDb.objectStoreNames.contains(PLAYLIST_STORE)) {
                nextDb.createObjectStore(PLAYLIST_STORE, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function storeGetAll(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const request = tx.objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function storePut(storeName, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function storeDelete(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function trackSource(track) {
    if (track.previewUrl) {
        return track.previewUrl;
    }

    if (objectUrls.has(track.id)) {
        return objectUrls.get(track.id);
    }

    if (!track.blob) {
        return "";
    }

    const url = URL.createObjectURL(track.blob);
    objectUrls.set(track.id, url);
    return url;
}

function coverMarkup(track, sizeClass = "") {
    const label = escapeHtml((track.title || "?").slice(0, 1).toUpperCase());
    const style = `style="background: linear-gradient(135deg, ${track.colorA || "#1ed760"}, ${track.colorB || "#6d8cff"});"`;
    if (track.coverUrl) {
        return `<div class="cover-art ${sizeClass}" ${style}><img src="${track.coverUrl}" alt=""></div>`;
    }
    return `<div class="cover-art ${sizeClass}" ${style}>${label}</div>`;
}

function getPlaylistCoverUrl(playlist) {
    if (playlist.coverUrl) {
        return playlist.coverUrl;
    }
    const firstTrack = state.tracks.find((track) => playlist.trackIds.includes(track.id));
    return firstTrack?.coverUrl || "";
}

function playlistCoverMarkup(playlist, extraClass = "") {
    const label = escapeHtml((playlist.name || "?").slice(0, 1).toUpperCase());
    const coverUrl = getPlaylistCoverUrl(playlist);
    if (coverUrl) {
        return `<span class="playlist-cover ${extraClass}"><img src="${coverUrl}" alt=""></span>`;
    }
    return `<span class="playlist-cover ${extraClass}">${label}</span>`;
}

function toast(title, message) {
    const id = uid("toast");
    const stack = document.querySelector(".toast-stack");
    if (!stack) {
        return;
    }
    stack.insertAdjacentHTML("beforeend", `
        <div class="toast" data-toast-id="${id}">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
        </div>
    `);
    setTimeout(() => {
        document.querySelector(`[data-toast-id="${id}"]`)?.remove();
    }, 3400);
}

function savePlayerSettings() {
    writeJson(PLAYER_KEY, {
        volume: state.volume,
        repeat: state.repeat,
        shuffle: state.shuffle
    });
}

async function loadData() {
    db = await openDatabase();
    const [uploadedTracks, storedPlaylists] = await Promise.all([
        storeGetAll(TRACK_STORE),
        storeGetAll(PLAYLIST_STORE)
    ]);

    state.tracks = uploadedTracks.map((track) => new Track(track));

    const userPlaylists = storedPlaylists.filter((playlist) => !LEGACY_DEMO_PLAYLIST_IDS.has(playlist.id));
    await Promise.all(storedPlaylists
        .filter((playlist) => LEGACY_DEMO_PLAYLIST_IDS.has(playlist.id))
        .map((playlist) => storeDelete(PLAYLIST_STORE, playlist.id)));

    state.playlists = userPlaylists
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((playlist) => new Playlist(playlist));

    const existingTrackIds = new Set(state.tracks.map((track) => track.id));
    state.favorites = new Set([...state.favorites].filter((trackId) => existingTrackIds.has(trackId)));
    writeJson(FAVORITES_KEY, [...state.favorites]);
    state.playlists.forEach((playlist) => playlist.syncTrackIds(existingTrackIds));
    await Promise.all(state.playlists.map((playlist) => storePut(PLAYLIST_STORE, playlist.toJSON())));

    state.currentTrackId = state.tracks[0]?.id ?? null;
    state.queue = state.tracks.map((track) => track.id);
    state.queueIndex = state.queue.indexOf(state.currentTrackId);
}

function getCurrentTrack() {
    return [...state.tracks, ...state.itunes.results].find((track) => track.id === state.currentTrackId) ?? state.tracks[0];
}

function getFilteredTracks(sourceTracks = state.tracks) {
    const query = normalize(state.query);
    return sourceTracks.filter((track) => {
        const matchesQuery = !query || track.matches(query);
        const matchesGenre = state.genre === "all" || track.genre === state.genre;
        const matchesAlbum = state.album === "all" || track.album === state.album;
        return matchesQuery && matchesGenre && matchesAlbum;
    });
}

function getVisibleTracks() {
    if (state.view === "favorites") {
        return getFilteredTracks(state.tracks.filter((track) => state.favorites.has(track.id)));
    }
    if (state.view === "playlist") {
        const playlist = state.playlists.find((item) => item.id === state.selectedPlaylistId);
        const ids = new Set(playlist?.trackIds ?? []);
        return getFilteredTracks(state.tracks.filter((track) => ids.has(track.id)));
    }
    return getFilteredTracks();
}

function buildQueue(trackIds, startTrackId) {
    const ids = [...trackIds];
    const startIndex = ids.indexOf(startTrackId);
    if (startIndex >= 0) {
        state.queueIndex = startIndex;
    } else {
        state.queueIndex = 0;
    }
    state.queue = ids;
}

async function playTrack(trackId, queueIds = getVisibleTracks().map((track) => track.id)) {
    const playableTracks = [...state.tracks, ...state.itunes.results];
    const track = playableTracks.find((item) => item.id === trackId);
    if (!track) {
        return;
    }

    buildQueue(queueIds.length ? queueIds : playableTracks.map((item) => item.id), trackId);
    state.currentTrackId = track.id;
    const source = trackSource(track);
    if (!source) {
        state.isPlaying = false;
        toast("Track unavailable", "Upload the audio file again or choose another preview.");
        render();
        return;
    }
    audio.src = source;
    audio.currentTime = 0;

    try {
        await audio.play();
        state.isPlaying = true;
    } catch {
        state.isPlaying = false;
        toast("Воспроизведение остановлено", "Браузер попросил еще раз нажать Play.");
    }
    render();
    updatePlaybackUi();
}

async function togglePlay() {
    if (!audio.src) {
        await playTrack(state.currentTrackId ?? state.tracks[0]?.id);
        return;
    }
    if (audio.paused) {
        await audio.play();
        state.isPlaying = true;
    } else {
        audio.pause();
        state.isPlaying = false;
    }
    renderPlayer();
    updateTrackPlaybackIndicators();
}

function nextTrack() {
    if (state.repeat === "one") {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    if (state.shuffle && state.queue.length > 1) {
        const availableIds = state.queue.filter((id) => id !== state.currentTrackId);
        const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
        state.queueIndex = state.queue.indexOf(randomId);
        playTrack(randomId, state.queue);
        return;
    }

    const nextIndex = state.queueIndex + 1;
    if (nextIndex < state.queue.length) {
        state.queueIndex = nextIndex;
        playTrack(state.queue[state.queueIndex], state.queue);
        return;
    }

    if (state.queue.length) {
        state.queueIndex = 0;
        playTrack(state.queue[0], state.queue);
    } else {
        state.isPlaying = false;
        renderPlayer();
    }
}

function previousTrack() {
    if (audio.currentTime > 4) {
        audio.currentTime = 0;
        return;
    }
    const prevIndex = state.queueIndex - 1;
    if (prevIndex >= 0) {
        state.queueIndex = prevIndex;
        playTrack(state.queue[state.queueIndex], state.queue);
        return;
    }
    if (state.queue.length) {
        state.queueIndex = state.queue.length - 1;
        playTrack(state.queue[state.queueIndex], state.queue);
    }
}

function setView(view, playlistId = null) {
    state.view = view;
    state.selectedPlaylistId = playlistId;
    state.menu = null;
    render();
}

function toggleFavorite(trackId) {
    if (state.favorites.has(trackId)) {
        state.favorites.delete(trackId);
    } else {
        state.favorites.add(trackId);
    }
    writeJson(FAVORITES_KEY, [...state.favorites]);
    render();
}

async function createPlaylist(name) {
    const cleanName = name.trim();
    if (!cleanName) {
        return;
    }
    const playlist = Playlist.create(cleanName);
    await storePut(PLAYLIST_STORE, playlist.toJSON());
    state.playlists.push(playlist);
    setView("playlist", playlist.id);
    toast("Плейлист создан", cleanName);
}

async function renamePlaylist(playlistId, name) {
    const playlist = state.playlists.find((item) => item.id === playlistId);
    const cleanName = name.trim();
    if (!playlist || !cleanName) {
        return;
    }
    playlist.rename(cleanName);
    await storePut(PLAYLIST_STORE, playlist.toJSON());
    render();
    toast("Плейлист переименован", cleanName);
}

async function updatePlaylistCover(playlistId, file) {
    const playlist = state.playlists.find((item) => item.id === playlistId);
    if (!playlist || !file) {
        return;
    }
    playlist.coverUrl = await fileToDataUrl(file);
    await storePut(PLAYLIST_STORE, playlist.toJSON());
    render();
    toast("Playlist cover updated", playlist.name);
}

async function deletePlaylist(playlistId) {
    const playlist = state.playlists.find((item) => item.id === playlistId);
    if (!playlist) {
        return;
    }
    await storeDelete(PLAYLIST_STORE, playlistId);
    state.playlists = state.playlists.filter((item) => item.id !== playlistId);
    setView("playlists");
    toast("Плейлист удален", playlist.name);
}

async function addToPlaylist(trackId, playlistId) {
    const playlist = state.playlists.find((item) => item.id === playlistId);
    if (!playlist || !playlist.addTrack(trackId)) {
        state.menu = null;
        render();
        return;
    }
    await storePut(PLAYLIST_STORE, playlist.toJSON());
    const track = state.tracks.find((item) => item.id === trackId);
    state.menu = null;
    render();
    toast("Трек добавлен", `${track.title} -> ${playlist.name}`);
}

async function removeFromPlaylist(trackId, playlistId) {
    const playlist = state.playlists.find((item) => item.id === playlistId);
    if (!playlist) {
        return;
    }
    playlist.removeTrack(trackId);
    await storePut(PLAYLIST_STORE, playlist.toJSON());
    render();
}

async function persistPlaylists() {
    await Promise.all(state.playlists.map((playlist) => storePut(PLAYLIST_STORE, playlist.toJSON())));
}

async function deleteTrack(trackId) {
    const track = state.tracks.find((item) => item.id === trackId);
    if (!track) {
        return;
    }

    await storeDelete(TRACK_STORE, track.id);

    state.favorites.delete(track.id);
    writeJson(FAVORITES_KEY, [...state.favorites]);
    state.playlists.forEach((playlist) => {
        playlist.removeTrack(track.id);
    });
    await persistPlaylists();

    state.tracks = state.tracks.filter((item) => item.id !== track.id);
    state.queue = state.queue.filter((id) => id !== track.id);

    if (state.currentTrackId === track.id) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        state.isPlaying = false;
        state.currentTime = 0;
        state.duration = 0;
        state.currentTrackId = state.tracks[0]?.id ?? null;
        state.queue = state.tracks.map((item) => item.id);
        state.queueIndex = state.currentTrackId ? 0 : -1;
    } else {
        state.queueIndex = state.queue.indexOf(state.currentTrackId);
    }

    render();
    toast("Track deleted", track.title);
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function readAudioDuration(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const probe = new Audio(url);
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(Math.round(probe.duration || 0));
        };
        probe.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
        };
    });
}

function isAudioFile(file) {
    if (!file) {
        return false;
    }
    if (file.type && file.type.startsWith("audio/")) {
        return true;
    }
    return /\.(aac|aif|aiff|alac|amr|flac|m4a|m4b|mid|midi|mp3|oga|ogg|opus|wav|weba|wma)$/i.test(file.name);
}

async function uploadTrack(form) {
    const audioFile = form.elements.audio.files[0];
    const coverFile = form.elements.cover.files[0];
    if (!isAudioFile(audioFile)) {
        toast("Файл не загружен", "Выберите аудиофайл, который поддерживает ваш браузер.");
        return;
    }

    const duration = await readAudioDuration(audioFile);
    const track = new Track({
        id: uid("up"),
        title: form.elements.title.value.trim(),
        artist: form.elements.artist.value.trim(),
        album: form.elements.album.value.trim() || "Single",
        genre: form.elements.genre.value,
        duration,
        blob: audioFile,
        fileName: audioFile.name,
        coverUrl: await fileToDataUrl(coverFile),
        colorA: "#1ed760",
        colorB: "#6d8cff",
        createdAt: Date.now()
    });

    await storePut(TRACK_STORE, track.toJSON());
    state.tracks.push(track);
    form.reset();
    setView("library");
    toast("Трек загружен", `${track.title} теперь в библиотеке.`);
}

function mapItunesTrack(item) {
    const artwork = item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "300x300bb") : "";
    return new Track({
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || "Single",
        genre: item.primaryGenreName || "iTunes",
        duration: Math.round((item.trackTimeMillis || 0) / 1000),
        previewUrl: item.previewUrl || "",
        coverUrl: artwork,
        colorA: "#e7e0d0",
        colorB: "#6d8cff",
        source: "itunes",
        createdAt: Date.now()
    });
}

async function searchItunes(query) {
    const cleanQuery = query.trim();
    state.itunes.query = cleanQuery;
    state.itunes.error = "";

    if (!cleanQuery) {
        state.itunes.results = [];
        render();
        return;
    }

    state.itunes.isLoading = true;
    render();

    try {
        const params = new URLSearchParams({
            term: cleanQuery,
            media: "music",
            entity: "song",
            limit: "24"
        });
        const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error("iTunes request failed");
        }
        const data = await response.json();
        state.itunes.results = (data.results || [])
            .filter((item) => item.trackId && item.previewUrl)
            .map(mapItunesTrack);
    } catch (error) {
        state.itunes.results = [];
        state.itunes.error = error.message || "Could not load iTunes results.";
    } finally {
        state.itunes.isLoading = false;
        render();
    }
}

async function addItunesTrack(trackId) {
    const track = state.itunes.results.find((item) => item.id === trackId);
    if (!track) {
        return;
    }
    if (state.tracks.some((item) => item.id === track.id)) {
        toast("Already in library", track.title);
        return;
    }

    const savedTrack = new Track({ ...track.toJSON(), createdAt: Date.now() });
    await storePut(TRACK_STORE, savedTrack.toJSON());
    state.tracks.push(savedTrack);
    toast("Added from iTunes", `${savedTrack.title} is now in your library.`);
    render();
}

function SearchBar() {
    return `
        <header class="topbar">
            <div class="search-wrap">
                <span class="icon">⌕</span>
                <input class="search-input" data-action="search" type="search" value="${escapeHtml(state.query)}" placeholder="Поиск по названию, исполнителю или альбому">
            </div>
        </header>
    `;
}

function FilterControls() {
    const genres = ["all", ...new Set(state.tracks.map((track) => track.genre).filter(Boolean))];
    const albums = ["all", ...new Set(state.tracks.map((track) => track.album).filter(Boolean))];
    return `
        <section class="library-controls" aria-label="Фильтры библиотеки">
            <div class="filters">
                <select class="select-input" data-action="genre">
                    ${genres.map((genre) => `<option value="${escapeHtml(genre)}" ${genre === state.genre ? "selected" : ""}>${genre === "all" ? "Все жанры" : escapeHtml(genre)}</option>`).join("")}
                </select>
                <select class="select-input" data-action="album">
                    ${albums.map((album) => `<option value="${escapeHtml(album)}" ${album === state.album ? "selected" : ""}>${album === "all" ? "Все альбомы" : escapeHtml(album)}</option>`).join("")}
                </select>
            </div>
        </section>
    `;
}

function Sidebar() {
    const favoriteTracks = state.tracks.filter((track) => state.favorites.has(track.id));
    const nav = [
        ["home", "⌂", "Главная"],
        ["library", "♬", "Моя библиотека"],
        ["favorites", "♡", "Избранное"],
        ["upload", "⇧", "Загрузка"],
        ["itunes", "iT", "iTunes"],
        ["playlists", "▤", "Плейлисты"]
    ];
    return `
        <aside class="sidebar">
            <div class="brand"><span class="brand-mark"><img src="${LOGO_URL}" alt=""></span><span>Re:Spot</span></div>
            <nav class="nav-group">
                ${nav.map(([view, icon, label]) => `
                    <button class="nav-button ${state.view === view || (view === "playlists" && state.view === "playlist") ? "active" : ""}" data-view="${view}" type="button">
                        <span class="icon">${icon}</span>${label}
                    </button>
                `).join("")}
            </nav>
            <section class="sidebar-section">
                <h2 class="sidebar-heading">Новый плейлист</h2>
                <form class="create-form" data-action="create-playlist">
                    <input class="text-input" name="name" type="text" maxlength="40" placeholder="Название">
                    <button class="icon-button" type="submit" title="Создать">+</button>
                </form>
            </section>
            <section class="sidebar-section">
                <h2 class="sidebar-heading">Ваши плейлисты</h2>
                <div class="playlist-rail">
                    ${state.playlists.map((playlist) => `
                        <button class="${state.selectedPlaylistId === playlist.id ? "active" : ""}" data-playlist-open="${playlist.id}" type="button">
                            ${playlistCoverMarkup(playlist, "icon playlist-cover-mini")}
                            <span>${escapeHtml(playlist.name)}</span>
                        </button>
                    `).join("") || `<p class="subtle">Создайте первый плейлист</p>`}
                </div>
            </section>
            <section class="sidebar-stats">
                <div class="stat-tile"><strong>${state.tracks.length}</strong><span class="subtle">tracks</span></div>
                <div class="stat-tile"><strong>${state.playlists.length}</strong><span class="subtle">playlists</span></div>
                <div class="stat-tile"><strong>${favoriteTracks.length}</strong><span class="subtle">favorites</span></div>
            </section>
        </aside>
    `;
}

function MusicCard(track) {
    return `
        <article class="music-card">
            <div class="cover-wrap">
                ${coverMarkup(track)}
                <button class="floating-play ${track.id === state.currentTrackId && state.isPlaying ? "active" : ""}" data-play-track="${track.id}" type="button" title="${track.id === state.currentTrackId && state.isPlaying ? "Pause" : "Play"}">${track.id === state.currentTrackId && state.isPlaying ? "&#9208;" : "&#9654;"}</button>
            </div>
            <h3 title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</h3>
            <p>${escapeHtml(track.artist)} · ${escapeHtml(track.album)}</p>
        </article>
    `;
}

function TrackList(tracks, options = {}) {
    if (!tracks.length) {
        return `<div class="empty-state"><h2>Ничего не найдено</h2><p class="subtle">Измените поиск, фильтр или загрузите собственный трек.</p></div>`;
    }
    return `
        <div class="track-table">
            ${tracks.map((track, index) => `
                <div class="track-row ${track.id === state.currentTrackId ? "active" : ""}" data-track-id="${track.id}" data-track-index="${index + 1}">
                    <div class="track-index">${index + 1}</div>
                    <div class="track-main">
                        ${coverMarkup(track, "cover-sm")}
                        <div>
                            <span class="track-title">${escapeHtml(track.title)}</span>
                            <span class="track-artist">${escapeHtml(track.artist)}</span>
                        </div>
                    </div>
                    <div class="track-meta album-cell">${escapeHtml(track.album)}</div>
                    <div class="track-meta genre-cell">${escapeHtml(track.genre)}</div>
                    <div class="track-duration">${formatTime(track.duration)}</div>
                    <div class="row-actions">
                        <button class="row-action ${track.id === state.currentTrackId && state.isPlaying ? "active" : ""}" data-play-track="${track.id}" type="button" title="${track.id === state.currentTrackId && state.isPlaying ? "Pause" : "Play"}">${track.id === state.currentTrackId && state.isPlaying ? "&#9208;" : "&#9654;"}</button>
                        <button class="row-action ${state.favorites.has(track.id) ? "active" : ""}" data-favorite="${track.id}" type="button" title="В избранное">${state.favorites.has(track.id) ? "♥" : "♡"}</button>
                        <button class="row-action" data-menu-track="${track.id}" type="button" title="Добавить в плейлист">＋</button>
                        ${options.playlistId ? `<button class="row-action" data-remove-track="${track.id}" data-playlist-id="${options.playlistId}" type="button" title="Удалить из плейлиста">×</button>` : ""}
                        <button class="row-action danger-action" data-delete-track="${track.id}" type="button" title="Delete track">×</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function UploadMusic() {
    return `
        <section class="upload-panel">
            <h2>Загрузить трек</h2>
            <form data-action="upload-track">
                <div class="upload-grid">
                    <label class="form-field full">
                        <span>Любой аудиофайл</span>
                        <div class="file-field">
                            <input name="audio" type="file" accept="audio/*" required>
                            <div><strong>Выберите аудио</strong><span data-file-label="audio">Формат должен поддерживаться браузером</span></div>
                        </div>
                    </label>
                    <label class="form-field">
                        <span>Обложка</span>
                        <div class="file-field">
                            <input name="cover" type="file" accept="image/png,image/jpeg,image/webp">
                            <div><strong>Выберите изображение</strong><span data-file-label="cover">PNG, JPG или WEBP</span></div>
                        </div>
                    </label>
                    <label class="form-field">
                        <span>Название</span>
                        <input class="text-input" name="title" type="text" required maxlength="80" placeholder="Название трека">
                    </label>
                    <label class="form-field">
                        <span>Исполнитель</span>
                        <input class="text-input" name="artist" type="text" required maxlength="80" placeholder="Имя исполнителя">
                    </label>
                    <label class="form-field">
                        <span>Альбом</span>
                        <input class="text-input" name="album" type="text" maxlength="80" placeholder="Single">
                    </label>
                    <label class="form-field">
                        <span>Жанр</span>
                        <select class="select-input" name="genre" required>
                            <option value="Pop">Pop</option>
                            <option value="Rock">Rock</option>
                            <option value="Hip Hop">Hip Hop</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Chill">Chill</option>
                            <option value="Indie">Indie</option>
                            <option value="Jazz">Jazz</option>
                        </select>
                    </label>
                </div>
                <div class="upload-actions">
                    <button class="pill-button" type="submit">Загрузить и сохранить</button>
                    <button class="pill-button secondary" type="reset">Очистить</button>
                </div>
            </form>
        </section>
    `;
}

function PlaylistDetails() {
    const playlist = state.playlists.find((item) => item.id === state.selectedPlaylistId) ?? state.playlists[0];
    if (!playlist) {
        return `<h2>Плейлистов пока нет</h2><p class="subtle">Создайте плейлист в левой панели.</p>`;
    }
    state.selectedPlaylistId = playlist.id;
    const ids = new Set(playlist.trackIds);
    const tracks = getFilteredTracks(state.tracks.filter((track) => ids.has(track.id)));
    return `
        <div class="playlist-detail">
            <div class="playlist-head">
                <label class="playlist-cover-picker" title="Change playlist cover">
                    ${playlistCoverMarkup(playlist)}
                    <input data-playlist-cover-input="${playlist.id}" type="file" accept="image/png,image/jpeg,image/webp">
                </label>
            </div>
            <p class="eyebrow">Плейлист</p>
            <h1>${escapeHtml(playlist.name)}</h1>
            <p class="subtle">${playlist.trackIds.length} треков</p>
            <form class="rename-form" data-action="rename-playlist" data-playlist-id="${playlist.id}">
                <input class="text-input" name="name" type="text" value="${escapeHtml(playlist.name)}" maxlength="40" required>
                <button class="icon-button" type="submit" title="Переименовать">✓</button>
            </form>
            <div class="playlist-actions">
                <button class="pill-button" data-play-collection="${playlist.id}" type="button" ${tracks.length ? "" : "disabled"}>Слушать плейлист</button>
                <button class="danger-button" data-delete-playlist="${playlist.id}" type="button">Удалить плейлист</button>
            </div>
        </div>
        <div class="playlist-tracks">
            ${TrackList(tracks, { playlistId: playlist.id })}
        </div>
    `;
}

function PlaylistsView() {
    return `
        <div class="playlist-grid">
            <section class="playlist-panel">
                <h2>Плейлисты</h2>
                <div class="playlist-list">
                    ${state.playlists.map((playlist) => `
                        <button class="playlist-item ${state.selectedPlaylistId === playlist.id ? "active" : ""}" data-playlist-open="${playlist.id}" type="button">
                            <span><strong>${escapeHtml(playlist.name)}</strong><br><span class="subtle">${playlist.trackIds.length} треков</span></span>
                            <span>›</span>
                        </button>
                    `).join("") || `<p class="subtle">Пока пусто.</p>`}
                </div>
            </section>
            <section class="playlist-panel">${PlaylistDetails()}</section>
        </div>
    `;
}

function HomeView() {
    const recent = state.tracks.slice(0, 5);
    return `
        <section class="section">
            <div class="section-title-row"><h2>Recommendations</h2><button class="ghost-button" data-view="library" type="button">Open library</button></div>
            <div class="card-grid">${recent.map(MusicCard).join("")}</div>
        </section>
        <section class="section">
            <h2>Quick picks</h2>
            ${TrackList(getFilteredTracks(state.tracks).slice(0, 8))}
        </section>
    `;
}

function ItunesView() {
    const results = state.itunes.results;
    return `
        <div class="view-header">
            <div>
                <p class="eyebrow">iTunes API</p>
                <h1>iTunes Search</h1>
                <p class="subtle">Search songs from iTunes and play 30-second previews.</p>
            </div>
        </div>
        <section class="upload-panel">
            <form class="itunes-search-form" data-action="itunes-search">
                <input class="text-input" name="query" type="search" value="${escapeHtml(state.itunes.query)}" placeholder="Artist, song or album" required>
                <button class="pill-button" type="submit" ${state.itunes.isLoading ? "disabled" : ""}>${state.itunes.isLoading ? "Searching..." : "Search"}</button>
            </form>
        </section>
        ${state.itunes.error ? `<div class="empty-state"><h2>iTunes error</h2><p class="subtle">${escapeHtml(state.itunes.error)}</p></div>` : ""}
        ${!state.itunes.error && state.itunes.isLoading ? `<div class="empty-state"><h2>Searching iTunes...</h2><p class="subtle">Please wait a moment.</p></div>` : ""}
        ${!state.itunes.error && !state.itunes.isLoading && state.itunes.query && !results.length ? `<div class="empty-state"><h2>No tracks found</h2><p class="subtle">Try another artist or song title.</p></div>` : ""}
        ${results.length ? `
            <div class="card-grid itunes-grid">
                ${results.map((track) => `
                    <article class="music-card">
                        <div class="cover-wrap">
                            ${coverMarkup(track)}
                            <button class="floating-play" data-play-track="${track.id}" type="button" title="Play preview">▶</button>
                        </div>
                        <h3 title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</h3>
                        <p>${escapeHtml(track.artist)} · ${escapeHtml(track.album)}</p>
                        <button class="ghost-button itunes-add-button" data-add-itunes-track="${track.id}" type="button">Добавить в библиотеку</button>
                    </article>
                `).join("")}
            </div>
        ` : ""}
    `;
}

function ViewContent() {
    const visibleTracks = getVisibleTracks();
    if (state.view === "itunes") {
        return ItunesView();
    }
    if (state.view === "upload") {
        return `<div class="view-header"><div><p class="eyebrow">Upload Music</p><h1>Загрузка музыки</h1><p class="subtle">Файл сохраняется локально и доступен после перезагрузки страницы.</p></div></div>${UploadMusic()}`;
    }
    if (state.view === "favorites") {
        return `<div class="view-header"><div><p class="eyebrow">Избранное</p><h1>Любимые треки</h1><p class="subtle">${visibleTracks.length} треков</p></div></div>${TrackList(visibleTracks)}`;
    }
    if (state.view === "playlist") {
        return `<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${PlaylistsView()}`;
    }
    if (state.view === "playlists") {
        return `<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${PlaylistsView()}`;
    }
    if (state.view === "library") {
        return `<div class="view-header"><div><p class="eyebrow">TrackList</p><h1>Моя библиотека</h1><p class="subtle">${visibleTracks.length} треков найдено</p></div><button class="pill-button" data-view="upload" type="button">Загрузить</button></div>${FilterControls()}${TrackList(visibleTracks)}`;
    }
    return HomeView();
}

function Player() {
    const track = getCurrentTrack();
    return `
        <footer class="player">
            <div class="now-playing">
                ${track ? coverMarkup(track, "cover-sm") : ""}
                <div class="track-main-text">
                    <span class="track-title">${escapeHtml(track?.title ?? "Нет трека")}</span>
                    <span class="track-artist">${escapeHtml(track?.artist ?? "Выберите музыку")}</span>
                </div>
                ${track ? `<button class="row-action ${state.favorites.has(track.id) ? "active" : ""}" data-favorite="${track.id}" type="button" title="В избранное">${state.favorites.has(track.id) ? "♥" : "♡"}</button>` : ""}
            </div>
            <div class="player-center">
                <div class="player-controls">
                    <button class="round-control ${state.shuffle ? "active" : ""}" data-action="shuffle" type="button" title="Перемешать">⤨</button>
                    <button class="round-control" data-action="prev" type="button" title="Предыдущий">⏮</button>
                    <button class="round-control primary" data-action="toggle-play" type="button" title="Play/Pause">${state.isPlaying ? "⏸" : "▶"}</button>
                    <button class="round-control" data-action="next" type="button" title="Следующий">⏭</button>
                    <button class="round-control ${state.repeat === "one" ? "active" : ""}" data-action="repeat" type="button" title="Повтор">${state.repeat === "one" ? "①" : "↻"}</button>
                </div>
                <div class="progress-row">
                    <span>${formatTime(state.currentTime)}</span>
                    <input class="range" data-action="seek" type="range" min="0" max="${Math.max(1, state.duration || track?.duration || 1)}" step="0.1" value="${state.currentTime}">
                    <span>${formatTime(state.duration || track?.duration)}</span>
                </div>
            </div>
            <div class="volume-row">
                <span class="icon">♬</span>
                <input class="range" data-action="volume" type="range" min="0" max="1" step="0.01" value="${state.volume}">
            </div>
        </footer>
    `;
}

function PlaylistMenu() {
    if (!state.menu) {
        return "";
    }
    return `
        <div class="menu" style="left:${state.menu.x}px; top:${state.menu.y}px;">
            ${state.playlists.map((playlist) => `<button data-add-track="${state.menu.trackId}" data-playlist-id="${playlist.id}" type="button">${escapeHtml(playlist.name)}</button>`).join("") || `<button type="button" disabled>Сначала создайте плейлист</button>`}
        </div>
    `;
}

function App() {
    return `
        <div class="app-layout">
            ${Sidebar()}
            <main class="main">
                ${SearchBar()}
                ${ViewContent()}
            </main>
        </div>
        ${Player()}
        ${PlaylistMenu()}
        <div class="toast-stack" aria-live="polite"></div>
    `;
}

function render() {
    app.innerHTML = App();
}

function renderPlayer() {
    const player = document.querySelector(".player");
    if (player) {
        player.outerHTML = Player();
    }
}

function updateTrackPlaybackIndicators() {
    document.querySelectorAll("[data-track-id]").forEach((row) => {
        const isCurrent = row.dataset.trackId === state.currentTrackId;
        const isActive = isCurrent && state.isPlaying;
        row.classList.toggle("active", isCurrent);

        const index = row.querySelector(".track-index");
        if (index) {
            index.textContent = row.dataset.trackIndex;
        }

        const playButton = row.querySelector("[data-play-track]");
        if (playButton) {
            playButton.classList.toggle("active", isActive);
            playButton.title = isActive ? "Pause" : "Play";
            playButton.innerHTML = isActive ? "&#9208;" : "&#9654;";
        }
    });

    document.querySelectorAll(".floating-play[data-play-track]").forEach((playButton) => {
        const isActive = playButton.dataset.playTrack === state.currentTrackId && state.isPlaying;
        playButton.classList.toggle("active", isActive);
        playButton.title = isActive ? "Pause" : "Play";
        playButton.innerHTML = isActive ? "&#9208;" : "&#9654;";
    });
}

function updatePlayerProgress() {
    const player = document.querySelector(".player");
    if (!player) {
        return;
    }

    const track = getCurrentTrack();
    const progress = player.querySelector('[data-action="seek"]');
    const volume = player.querySelector('[data-action="volume"]');
    const progressLabels = player.querySelectorAll(".progress-row span");

    if (progress) {
        progress.max = Math.max(1, state.duration || track?.duration || 1);
        if (activeRangeAction !== "seek") {
            progress.value = state.currentTime;
        }
    }
    if (volume && activeRangeAction !== "volume") {
        volume.value = state.volume;
    }
    if (progressLabels[0]) {
        progressLabels[0].textContent = formatTime(state.currentTime);
    }
    if (progressLabels[1]) {
        progressLabels[1].textContent = formatTime(state.duration || track?.duration);
    }
}

function updatePlaybackUi() {
    updatePlayerProgress();
    updateTrackPlaybackIndicators();
}

function renderAndRestoreControl(action, cursorPosition = null) {
    render();
    const control = document.querySelector(`[data-action="${action}"]`);
    if (!control) {
        return;
    }
    control.focus();
    if (action === "search" && cursorPosition !== null) {
        control.setSelectionRange(cursorPosition, cursorPosition);
    }
}

function bindAudio() {
    audio = new Audio();
    audio.volume = state.volume;
    audio.addEventListener("timeupdate", () => {
        state.currentTime = audio.currentTime;
        state.duration = audio.duration || getCurrentTrack()?.duration || 0;
        updatePlayerProgress();
    });
    audio.addEventListener("loadedmetadata", () => {
        state.duration = audio.duration || getCurrentTrack()?.duration || 0;
        renderPlayer();
    });
    audio.addEventListener("play", () => {
        state.isPlaying = true;
        renderPlayer();
        updateTrackPlaybackIndicators();
    });
    audio.addEventListener("pause", () => {
        state.isPlaying = false;
        renderPlayer();
        updateTrackPlaybackIndicators();
    });
    audio.addEventListener("ended", nextTrack);
}

function closestAction(target, selector) {
    return target.closest(selector);
}

function bindEvents() {
    document.addEventListener("click", async (event) => {
        const target = event.target;
        const viewButton = closestAction(target, "[data-view]");
        const playButton = closestAction(target, "[data-play-track]");
        const favoriteButton = closestAction(target, "[data-favorite]");
        const menuButton = closestAction(target, "[data-menu-track]");
        const playlistOpen = closestAction(target, "[data-playlist-open]");
        const addTrackButton = closestAction(target, "[data-add-track]");
        const addItunesButton = closestAction(target, "[data-add-itunes-track]");
        const removeTrackButton = closestAction(target, "[data-remove-track]");
        const deleteTrackButton = closestAction(target, "[data-delete-track]");
        const deletePlaylistButton = closestAction(target, "[data-delete-playlist]");
        const collectionButton = closestAction(target, "[data-play-collection]");
        const control = closestAction(target, "[data-action]");

        if (!closestAction(target, ".menu") && !menuButton && state.menu) {
            state.menu = null;
            render();
            return;
        }

        if (viewButton) {
            setView(viewButton.dataset.view);
            return;
        }
        if (playButton) {
            if (playButton.dataset.playTrack === state.currentTrackId && audio.src) {
                await togglePlay();
                return;
            }
            const queueIds = state.view === "itunes"
                ? state.itunes.results.map((track) => track.id)
                : getVisibleTracks().map((track) => track.id);
            await playTrack(playButton.dataset.playTrack, queueIds);
            return;
        }
        if (favoriteButton) {
            toggleFavorite(favoriteButton.dataset.favorite);
            return;
        }
        if (menuButton) {
            const rect = menuButton.getBoundingClientRect();
            state.menu = {
                trackId: menuButton.dataset.menuTrack,
                x: Math.min(rect.left, window.innerWidth - 240),
                y: Math.min(rect.bottom + 6, window.innerHeight - 220)
            };
            render();
            return;
        }
        if (playlistOpen) {
            setView("playlist", playlistOpen.dataset.playlistOpen);
            return;
        }
        if (addTrackButton) {
            await addToPlaylist(addTrackButton.dataset.addTrack, addTrackButton.dataset.playlistId);
            return;
        }
        if (addItunesButton) {
            await addItunesTrack(addItunesButton.dataset.addItunesTrack);
            return;
        }
        if (removeTrackButton) {
            await removeFromPlaylist(removeTrackButton.dataset.removeTrack, removeTrackButton.dataset.playlistId);
            return;
        }
        if (deleteTrackButton) {
            await deleteTrack(deleteTrackButton.dataset.deleteTrack);
            return;
        }
        if (deletePlaylistButton) {
            await deletePlaylist(deletePlaylistButton.dataset.deletePlaylist);
            return;
        }
        if (collectionButton) {
            const playlist = state.playlists.find((item) => item.id === collectionButton.dataset.playCollection);
            const firstTrackId = playlist?.trackIds[0];
            if (firstTrackId) {
                await playTrack(firstTrackId, playlist.trackIds);
            }
            return;
        }
        if (control?.dataset.action === "toggle-play") {
            await togglePlay();
            return;
        }
        if (control?.dataset.action === "prev") {
            previousTrack();
            return;
        }
        if (control?.dataset.action === "next") {
            nextTrack();
            return;
        }
        if (control?.dataset.action === "shuffle") {
            state.shuffle = !state.shuffle;
            savePlayerSettings();
            renderPlayer();
            return;
        }
        if (control?.dataset.action === "repeat") {
            state.repeat = state.repeat === "one" ? "off" : "one";
            savePlayerSettings();
            renderPlayer();
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (event.target.matches('input[type="range"][data-action]')) {
            activeRangeAction = event.target.dataset.action;
        }
    });

    document.addEventListener("pointerup", () => {
        activeRangeAction = null;
        updatePlayerProgress();
    });

    document.addEventListener("input", (event) => {
        const action = event.target.dataset.action;
        if (action === "search") {
            const cursorPosition = event.target.selectionStart;
            state.query = event.target.value;
            renderAndRestoreControl("search", cursorPosition);
        }
        if (action === "genre") {
            state.genre = event.target.value;
            renderAndRestoreControl("genre");
        }
        if (action === "album") {
            state.album = event.target.value;
            renderAndRestoreControl("album");
        }
        if (action === "seek") {
            activeRangeAction = "seek";
            audio.currentTime = Number(event.target.value);
            state.currentTime = audio.currentTime;
            updatePlayerProgress();
        }
        if (action === "volume") {
            activeRangeAction = "volume";
            state.volume = Number(event.target.value);
            audio.volume = state.volume;
            savePlayerSettings();
        }
        if (event.target.dataset.playlistCoverInput) {
            updatePlaylistCover(event.target.dataset.playlistCoverInput, event.target.files[0]);
            return;
        }
        if (event.target.type === "file") {
            const label = document.querySelector(`[data-file-label="${event.target.name}"]`);
            if (label) {
                label.textContent = event.target.files[0]?.name ?? label.textContent;
            }
        }
    });

    document.addEventListener("change", (event) => {
        if (event.target.matches('input[type="range"][data-action]')) {
            activeRangeAction = null;
            updatePlayerProgress();
        }
    });

    document.addEventListener("submit", async (event) => {
        const form = event.target;
        if (form.dataset.action === "create-playlist") {
            event.preventDefault();
            await createPlaylist(form.elements.name.value);
            return;
        }
        if (form.dataset.action === "rename-playlist") {
            event.preventDefault();
            await renamePlaylist(form.dataset.playlistId, form.elements.name.value);
            return;
        }
        if (form.dataset.action === "upload-track") {
            event.preventDefault();
            if (form.reportValidity()) {
                await uploadTrack(form);
            }
            return;
        }
        if (form.dataset.action === "itunes-search") {
            event.preventDefault();
            if (form.reportValidity()) {
                await searchItunes(form.elements.query.value);
            }
        }
    });
}

async function init() {
    bindAudio();
    try {
        await loadData();
        render();
        bindEvents();
    } catch (error) {
        app.innerHTML = `<main class="main"><div class="empty-state"><h1>Не удалось запустить Re:Spot</h1><p class="subtle">${escapeHtml(error.message)}</p></div></main>`;
    }
}

init();

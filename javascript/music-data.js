class Track {
    constructor(data) {
        this.id = data.id;
        this.title = data.title.trim();
        this.artist = data.artist.trim();
        this.album = data.album?.trim() || "Single";
        this.year = Number(data.year) || "";
        this.genre = data.genre || "unknown";
        this.coverName = data.coverName || "";
        this.audioName = data.audioName || "";
        this.createdAt = data.createdAt || "";
    }

    matches(query) {
        const normalizedQuery = MusicLibrary.normalize(query);
        return MusicLibrary.normalize(`${this.title} ${this.artist}`).includes(normalizedQuery);
    }

    toJSON() {
        return { ...this };
    }
}

class Playlist {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.trackIds = [...data.trackIds];
    }

    get size() {
        return this.trackIds.length;
    }
}

class LocalTrackStorage {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    getAll() {
        try {
            const tracks = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            return tracks.map((track) => new Track(track));
        } catch {
            return [];
        }
    }

    save(track) {
        const tracks = this.getAll();
        tracks.push(track);
        localStorage.setItem(this.storageKey, JSON.stringify(tracks.map((item) => item.toJSON())));
        return track;
    }
}

class MusicLibrary {
    constructor({ tracks, playlists, storage }) {
        this.defaultTracks = tracks.map((track) => new Track(track));
        this.playlists = playlists.map((playlist) => new Playlist(playlist));
        this.storage = storage;
    }

    getTracks() {
        return [...this.defaultTracks, ...this.storage.getAll()];
    }

    getPlaylists() {
        return [...this.playlists];
    }

    groupBy(items, key) {
        return items.reduce((groups, item) => {
            const name = item[key] || "Single";
            groups[name] = groups[name] || [];
            groups[name].push(item);
            return groups;
        }, {});
    }

    static normalize(value) {
        return String(value || "").trim().toLowerCase();
    }
}

const MusicData = (() => {
    const defaultTracks = [
        { id: "default-1", title: "Starlight", artist: "Luna Nova", album: "Night Sky", year: 2024, genre: "pop" },
        { id: "default-2", title: "High Energy", artist: "The Voltage", album: "Powerline", year: 2024, genre: "rock" },
        { id: "default-3", title: "Tides", artist: "Coastal", album: "Open Water", year: 2023, genre: "pop" },
        { id: "default-4", title: "Urban Jungle", artist: "Metro Beat", album: "City Lights", year: 2024, genre: "hiphop" },
        { id: "default-5", title: "Vacation", artist: "Sunny Days", album: "Postcards", year: 2023, genre: "pop" },
        { id: "default-6", title: "Retro Future", artist: "Synthwave", album: "Neon Roads", year: 2024, genre: "electronic" },
        { id: "default-7", title: "Late Night Feels", artist: "Luna Nova", album: "Night Sky", year: 2024, genre: "pop" },
        { id: "default-8", title: "Focus Flow", artist: "Metro Beat", album: "City Lights", year: 2024, genre: "electronic" },
        { id: "default-9", title: "Chill Vibes", artist: "Coastal", album: "Open Water", year: 2023, genre: "jazz" },
        { id: "default-10", title: "Workout Mix", artist: "The Voltage", album: "Powerline", year: 2024, genre: "rock" }
    ];

    const playlists = [
        {
            id: "liked",
            title: "Liked Songs",
            description: "Favorite tracks from the library",
            trackIds: ["default-1", "default-4", "default-6"]
        },
        {
            id: "favorites",
            title: "My Favorites",
            description: "A quick mix for daily listening",
            trackIds: ["default-2", "default-3", "default-5"]
        },
        {
            id: "focus",
            title: "Focus Flow",
            description: "Clean rhythm for study and work",
            trackIds: ["default-8", "default-9", "default-10"]
        }
    ];

    const library = new MusicLibrary({
        tracks: defaultTracks,
        playlists,
        storage: new LocalTrackStorage("respot_tracks")
    });

    return {
        getTracks: () => library.getTracks(),
        getPlaylists: () => library.getPlaylists(),
        normalize: MusicLibrary.normalize,
        groupBy: (items, key) => library.groupBy(items, key),
        storage: library.storage,
        Track,
        Playlist,
        MusicLibrary,
        LocalTrackStorage
    };
})();

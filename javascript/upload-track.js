const uploadForm = document.querySelector("#upload-track-form");
const yearInput = document.querySelector("#track-year");
const uploadMessage = document.querySelector(".form-message");
const currentYear = new Date().getFullYear();
const TRACKS_KEY = "respot_tracks";

yearInput.max = String(currentYear);
yearInput.placeholder = String(currentYear);

class UploadedTrack {
    constructor(trackData) {
        this.id = UploadedTrack.createId();
        this.coverName = trackData.coverName;
        this.audioName = trackData.audioName;
        this.title = trackData.title.trim();
        this.year = Number(trackData.year);
        this.artist = trackData.artist.trim();
        this.album = trackData.album.trim() || "Single";
        this.genre = trackData.genre;
        this.createdAt = new Date().toISOString();
    }

    static createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    toJSON() {
        return { ...this };
    }
}

class TrackRepository {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch {
            return [];
        }
    }

    add(track) {
        const tracks = this.getAll();
        tracks.push(track.toJSON());
        localStorage.setItem(this.storageKey, JSON.stringify(tracks));
        return track;
    }
}

class UploadTrackForm {
    constructor(form, repository) {
        this.form = form;
        this.repository = repository;
    }

    getTrackData() {
        const coverFile = document.querySelector("#track-cover").files[0];
        const audioFile = document.querySelector("#track-file").files[0];

        return {
            coverName: coverFile.name,
            audioName: audioFile.name,
            title: document.querySelector("#track-title").value,
            year: yearInput.value,
            artist: document.querySelector("#track-artist").value,
            album: document.querySelector("#track-album").value,
            genre: document.querySelector("#track-genre").value
        };
    }

    save() {
        return this.repository.add(new UploadedTrack(this.getTrackData()));
    }
}

const trackRepository = new TrackRepository(TRACKS_KEY);
const uploadTrackForm = new UploadTrackForm(uploadForm, trackRepository);

function validateYear() {
    const year = Number(yearInput.value);
    const isValidYear = yearInput.value && year <= currentYear;
    yearInput.setCustomValidity(isValidYear ? "" : `Year cannot be later than ${currentYear}`);
    return isValidYear;
}

yearInput.addEventListener("input", validateYear);

// File input preview handling
function setupFileInput(inputId, containerSelector) {
    const input = document.getElementById(inputId);
    const dropText = document.querySelector(`${containerSelector} .drop-text`);
    const originalText = dropText.textContent;

    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            dropText.textContent = e.target.files[0].name;
            document.querySelector(containerSelector).style.borderColor = 'var(--blue, #17399f)';
        } else {
            dropText.textContent = originalText;
        }
    });
}

setupFileInput("track-cover", "#cover-drop-area");
setupFileInput("track-file", "#audio-drop-area");

uploadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validateYear();

    if (!uploadForm.reportValidity()) {
        return;
    }

    try {
        uploadTrackForm.save();

        uploadMessage.textContent = "Track saved successfully";
        uploadMessage.classList.remove("is-error");
        uploadForm.reset();
        yearInput.max = String(currentYear);
        
        // Reset file input texts
        document.querySelector("#cover-drop-area .drop-text").textContent = "Add Cover Art";
        document.querySelector("#audio-drop-area .drop-text").textContent = "Drop your track here";
        document.querySelector("#cover-drop-area").style.borderColor = "";
        document.querySelector("#audio-drop-area").style.borderColor = "";
    } catch (error) {
        uploadMessage.textContent = error.message;
        uploadMessage.classList.add("is-error");
    }
});

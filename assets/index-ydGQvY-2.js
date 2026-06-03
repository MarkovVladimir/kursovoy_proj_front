(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const v of r.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&i(v)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}})();const lt="respot_music_player",ot=1,$="tracks",p="playlists",x="respot_favorites",Z="respot_player_settings",K=new Set(["pl-daily","pl-energy"]),ct=new URL(""+new URL("logo-DCDOM8-c.png",import.meta.url).href,import.meta.url).href;class L{constructor(a){var s,i,n;this.id=a.id,this.title=((s=a.title)==null?void 0:s.trim())||"Untitled",this.artist=((i=a.artist)==null?void 0:i.trim())||"Unknown artist",this.album=((n=a.album)==null?void 0:n.trim())||"Single",this.genre=a.genre||"Unknown",this.duration=Number(a.duration)||0,this.blob=a.blob||null,this.previewUrl=a.previewUrl||"",this.source=a.source||"local",this.fileName=a.fileName||"",this.coverUrl=a.coverUrl||"",this.colorA=a.colorA||"#1ed760",this.colorB=a.colorB||"#6d8cff",this.createdAt=a.createdAt||Date.now()}matches(a){return B(`${this.title} ${this.artist} ${this.album}`).includes(B(a))}toJSON(){return{...this}}}class A{constructor(a){var s;this.id=a.id,this.name=((s=a.name)==null?void 0:s.trim())||"Untitled playlist",this.trackIds=Array.isArray(a.trackIds)?[...a.trackIds]:[],this.coverUrl=a.coverUrl||"",this.createdAt=a.createdAt||Date.now()}static create(a){return new A({id:J("pl"),name:a,trackIds:[],createdAt:Date.now()})}rename(a){this.name=a.trim()}addTrack(a){return this.trackIds.includes(a)?!1:(this.trackIds.push(a),!0)}removeTrack(a){this.trackIds=this.trackIds.filter(s=>s!==a)}syncTrackIds(a){this.trackIds=this.trackIds.filter(s=>a.has(s))}toJSON(){return{...this,trackIds:[...this.trackIds]}}}const R=et(Z,{volume:.75,repeat:"off",shuffle:!1}),e={tracks:[],playlists:[],favorites:new Set(et(x,[])),view:"home",selectedPlaylistId:null,query:"",genre:"all",album:"all",currentTrackId:null,queue:[],queueIndex:-1,isPlaying:!1,currentTime:0,duration:0,volume:R.volume??.75,repeat:R.repeat==="one"?"one":"off",shuffle:R.shuffle??!1,itunes:{query:"",results:[],isLoading:!1,error:""},menu:null};let U,o,b=null;const D=new Map,tt=document.querySelector("#app");function et(t,a){try{return JSON.parse(localStorage.getItem(t))??a}catch{return a}}function O(t,a){localStorage.setItem(t,JSON.stringify(a))}function J(t){return`${t}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}function l(t){return String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a])}function B(t){return String(t??"").trim().toLowerCase()}function T(t){if(!Number.isFinite(t)||t<0)return"0:00";const a=Math.floor(t/60),s=Math.floor(t%60);return`${a}:${String(s).padStart(2,"0")}`}function ut(){return new Promise((t,a)=>{const s=indexedDB.open(lt,ot);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains($)||i.createObjectStore($,{keyPath:"id"}),i.objectStoreNames.contains(p)||i.createObjectStore(p,{keyPath:"id"})},s.onsuccess=()=>t(s.result),s.onerror=()=>a(s.error)})}function Q(t){return new Promise((a,s)=>{const n=U.transaction(t,"readonly").objectStore(t).getAll();n.onsuccess=()=>a(n.result),n.onerror=()=>s(n.error)})}function y(t,a){return new Promise((s,i)=>{const n=U.transaction(t,"readwrite");n.objectStore(t).put(a),n.oncomplete=()=>s(),n.onerror=()=>i(n.error)})}function H(t,a){return new Promise((s,i)=>{const n=U.transaction(t,"readwrite");n.objectStore(t).delete(a),n.oncomplete=()=>s(),n.onerror=()=>i(n.error)})}function dt(t){if(t.previewUrl)return t.previewUrl;if(D.has(t.id))return D.get(t.id);if(!t.blob)return"";const a=URL.createObjectURL(t.blob);return D.set(t.id,a),a}function N(t,a=""){const s=l((t.title||"?").slice(0,1).toUpperCase()),i=`style="background: linear-gradient(135deg, ${t.colorA||"#1ed760"}, ${t.colorB||"#6d8cff"});"`;return t.coverUrl?`<div class="cover ${a}" ${i}><img class="cover__image" src="${t.coverUrl}" alt=""></div>`:`<div class="cover ${a}" ${i}>${s}</div>`}function pt(t){if(t.coverUrl)return t.coverUrl;const a=e.tracks.find(s=>t.trackIds.includes(s.id));return(a==null?void 0:a.coverUrl)||""}function at(t,a=""){const s=l((t.name||"?").slice(0,1).toUpperCase()),i=pt(t);return i?`<span class="playlist-cover ${a}"><img class="playlist-cover__image" src="${i}" alt=""></span>`:`<span class="playlist-cover ${a}">${s}</span>`}function f(t,a){const s=J("toast"),i=document.querySelector(".toast-stack");i&&(i.insertAdjacentHTML("beforeend",`
        <div class="toast toast-stack__item" data-toast-id="${s}">
            <strong class="toast__title">${l(t)}</strong>
            <p class="toast__message">${l(a)}</p>
        </div>
    `),setTimeout(()=>{var n;(n=document.querySelector(`[data-toast-id="${s}"]`))==null||n.remove()},3400))}function C(){O(Z,{volume:e.volume,repeat:e.repeat,shuffle:e.shuffle})}async function ft(){var n;U=await ut();const[t,a]=await Promise.all([Q($),Q(p)]);e.tracks=t.map(r=>new L(r));const s=a.filter(r=>!K.has(r.id));await Promise.all(a.filter(r=>K.has(r.id)).map(r=>H(p,r.id))),e.playlists=s.sort((r,v)=>r.createdAt-v.createdAt).map(r=>new A(r));const i=new Set(e.tracks.map(r=>r.id));e.favorites=new Set([...e.favorites].filter(r=>i.has(r))),O(x,[...e.favorites]),e.playlists.forEach(r=>r.syncTrackIds(i)),await Promise.all(e.playlists.map(r=>y(p,r.toJSON()))),e.currentTrackId=((n=e.tracks[0])==null?void 0:n.id)??null,e.queue=e.tracks.map(r=>r.id),e.queueIndex=e.queue.indexOf(e.currentTrackId)}function P(){return[...e.tracks,...e.itunes.results].find(t=>t.id===e.currentTrackId)??e.tracks[0]}function k(t=e.tracks){const a=B(e.query);return t.filter(s=>{const i=!a||s.matches(a),n=e.genre==="all"||s.genre===e.genre,r=e.album==="all"||s.album===e.album;return i&&n&&r})}function F(){if(e.view==="favorites")return k(e.tracks.filter(t=>e.favorites.has(t.id)));if(e.view==="playlist"){const t=e.playlists.find(s=>s.id===e.selectedPlaylistId),a=new Set((t==null?void 0:t.trackIds)??[]);return k(e.tracks.filter(s=>a.has(s.id)))}return k()}function mt(t,a){const s=[...t],i=s.indexOf(a);i>=0?e.queueIndex=i:e.queueIndex=0,e.queue=s}async function _(t,a=F().map(s=>s.id)){const s=[...e.tracks,...e.itunes.results],i=s.find(r=>r.id===t);if(!i)return;mt(a.length?a:s.map(r=>r.id),t),e.currentTrackId=i.id;const n=dt(i);if(!n){e.isPlaying=!1,f("Track unavailable","Upload the audio file again or choose another preview."),c();return}o.src=n,o.currentTime=0;try{await o.play(),e.isPlaying=!0}catch{e.isPlaying=!1,f("Воспроизведение остановлено","Браузер попросил еще раз нажать Play.")}c(),Jt()}async function W(){var t;if(!o.src){await _(e.currentTrackId??((t=e.tracks[0])==null?void 0:t.id));return}o.paused?(await o.play(),e.isPlaying=!0):(o.pause(),e.isPlaying=!1),h(),q()}function st(){if(e.repeat==="one"){o.currentTime=0,o.play();return}if(e.shuffle&&e.queue.length>1){const a=e.queue.filter(i=>i!==e.currentTrackId),s=a[Math.floor(Math.random()*a.length)];e.queueIndex=e.queue.indexOf(s),_(s,e.queue);return}const t=e.queueIndex+1;if(t<e.queue.length){e.queueIndex=t,_(e.queue[e.queueIndex],e.queue);return}e.queue.length?(e.queueIndex=0,_(e.queue[0],e.queue)):(e.isPlaying=!1,h())}function yt(){if(o.currentTime>4){o.currentTime=0;return}const t=e.queueIndex-1;if(t>=0){e.queueIndex=t,_(e.queue[e.queueIndex],e.queue);return}e.queue.length&&(e.queueIndex=e.queue.length-1,_(e.queue[e.queueIndex],e.queue))}function I(t,a=null){e.view=t,e.selectedPlaylistId=a,e.menu=null,c()}function vt(t){e.favorites.has(t)?e.favorites.delete(t):e.favorites.add(t),O(x,[...e.favorites]),c()}async function _t(t){const a=t.trim();if(!a)return;const s=A.create(a);await y(p,s.toJSON()),e.playlists.push(s),I("playlist",s.id),f("Плейлист создан",a)}async function bt(t,a){const s=e.playlists.find(n=>n.id===t),i=a.trim();!s||!i||(s.rename(i),await y(p,s.toJSON()),c(),f("Плейлист переименован",i))}async function ht(t,a){const s=e.playlists.find(i=>i.id===t);!s||!a||(s.coverUrl=await it(a),await y(p,s.toJSON()),c(),f("Playlist cover updated",s.name))}async function gt(t){const a=e.playlists.find(s=>s.id===t);a&&(await H(p,t),e.playlists=e.playlists.filter(s=>s.id!==t),I("playlists"),f("Плейлист удален",a.name))}async function $t(t,a){const s=e.playlists.find(n=>n.id===a);if(!s||!s.addTrack(t)){e.menu=null,c();return}await y(p,s.toJSON());const i=e.tracks.find(n=>n.id===t);e.menu=null,c(),f("Трек добавлен",`${i.title} -> ${s.name}`)}async function kt(t,a){const s=e.playlists.find(i=>i.id===a);s&&(s.removeTrack(t),await y(p,s.toJSON()),c())}async function wt(){await Promise.all(e.playlists.map(t=>y(p,t.toJSON())))}async function Tt(t){var s;const a=e.tracks.find(i=>i.id===t);a&&(await H($,a.id),e.favorites.delete(a.id),O(x,[...e.favorites]),e.playlists.forEach(i=>{i.removeTrack(a.id)}),await wt(),e.tracks=e.tracks.filter(i=>i.id!==a.id),e.queue=e.queue.filter(i=>i!==a.id),e.currentTrackId===a.id?(o.pause(),o.removeAttribute("src"),o.load(),e.isPlaying=!1,e.currentTime=0,e.duration=0,e.currentTrackId=((s=e.tracks[0])==null?void 0:s.id)??null,e.queue=e.tracks.map(i=>i.id),e.queueIndex=e.currentTrackId?0:-1):e.queueIndex=e.queue.indexOf(e.currentTrackId),c(),f("Track deleted",a.title))}function it(t){return new Promise((a,s)=>{if(!t){a("");return}const i=new FileReader;i.onload=()=>a(i.result),i.onerror=()=>s(i.error),i.readAsDataURL(t)})}function It(t){return new Promise(a=>{const s=URL.createObjectURL(t),i=new Audio(s);i.preload="metadata",i.onloadedmetadata=()=>{URL.revokeObjectURL(s),a(Math.round(i.duration||0))},i.onerror=()=>{URL.revokeObjectURL(s),a(0)}})}function Pt(t){return t?t.type&&t.type.startsWith("audio/")?!0:/\.(aac|aif|aiff|alac|amr|flac|m4a|m4b|mid|midi|mp3|oga|ogg|opus|wav|weba|wma)$/i.test(t.name):!1}async function St(t){const a=t.elements.audio.files[0],s=t.elements.cover.files[0];if(!Pt(a)){f("Файл не загружен","Выберите аудиофайл, который поддерживает ваш браузер.");return}const i=await It(a),n=new L({id:J("up"),title:t.elements.title.value.trim(),artist:t.elements.artist.value.trim(),album:t.elements.album.value.trim()||"Single",genre:t.elements.genre.value,duration:i,blob:a,fileName:a.name,coverUrl:await it(s),colorA:"#1ed760",colorB:"#6d8cff",createdAt:Date.now()});await y($,n.toJSON()),e.tracks.push(n),t.reset(),I("library"),f("Трек загружен",`${n.title} теперь в библиотеке.`)}function qt(t){const a=t.artworkUrl100?t.artworkUrl100.replace("100x100bb","300x300bb"):"";return new L({id:`itunes-${t.trackId}`,title:t.trackName,artist:t.artistName,album:t.collectionName||"Single",genre:t.primaryGenreName||"iTunes",duration:Math.round((t.trackTimeMillis||0)/1e3),previewUrl:t.previewUrl||"",coverUrl:a,colorA:"#e7e0d0",colorB:"#6d8cff",source:"itunes",createdAt:Date.now()})}async function xt(t){const a=t.trim();if(e.itunes.query=a,e.itunes.error="",!a){e.itunes.results=[],c();return}e.itunes.isLoading=!0,c();try{const s=new URLSearchParams({term:a,media:"music",entity:"song",limit:"24"}),i=await fetch(`https://itunes.apple.com/search?${s.toString()}`);if(!i.ok)throw new Error("iTunes request failed");const n=await i.json();e.itunes.results=(n.results||[]).filter(r=>r.trackId&&r.previewUrl).map(qt)}catch(s){e.itunes.results=[],e.itunes.error=s.message||"Could not load iTunes results."}finally{e.itunes.isLoading=!1,c()}}async function Lt(t){const a=e.itunes.results.find(i=>i.id===t);if(!a)return;if(e.tracks.some(i=>i.id===a.id)){f("Already in library",a.title);return}const s=new L({...a.toJSON(),createdAt:Date.now()});await y($,s.toJSON()),e.tracks.push(s),f("Added from iTunes",`${s.title} is now in your library.`),c()}function At(){return`
        <header class="search-bar">
            <div class="search-bar__field">
                <span class="search-bar__icon">⌕</span>
                <input class="search-bar__input" data-action="search" type="search" value="${l(e.query)}" placeholder="Поиск по названию, исполнителю или альбому">
            </div>
        </header>
    `}function Ut(){const t=["all",...new Set(e.tracks.map(s=>s.genre).filter(Boolean))],a=["all",...new Set(e.tracks.map(s=>s.album).filter(Boolean))];return`
        <section class="library__controls" aria-label="Фильтры библиотеки">
            <div class="library__filters">
                <select class="select-input" data-action="genre">
                    ${t.map(s=>`<option value="${l(s)}" ${s===e.genre?"selected":""}>${s==="all"?"Все жанры":l(s)}</option>`).join("")}
                </select>
                <select class="select-input" data-action="album">
                    ${a.map(s=>`<option value="${l(s)}" ${s===e.album?"selected":""}>${s==="all"?"Все альбомы":l(s)}</option>`).join("")}
                </select>
            </div>
        </section>
    `}function Ot(){const t=e.tracks.filter(s=>e.favorites.has(s.id));return`
        <aside class="sidebar">
            <div class="sidebar__brand"><img class="sidebar__brand-mark" src="${ct}" alt=""><span class="sidebar__brand-name">Re:Spot</span></div>
            <nav class="sidebar__nav">
                ${[["home","⌂","Главная"],["library","♬","Моя библиотека"],["favorites","♡","Избранное"],["upload","⇧","Загрузка"],["itunes","iT","iTunes"],["playlists","▤","Плейлисты"]].map(([s,i,n])=>`
                    <button class="sidebar__nav-button ${e.view===s||s==="playlists"&&e.view==="playlist"?"sidebar__nav-button--active":""}" data-view="${s}" type="button">
                        <span class="sidebar__nav-icon">${i}</span>${n}
                    </button>
                `).join("")}
            </nav>
            <section class="sidebar__section">
                <h2 class="sidebar__heading">Новый плейлист</h2>
                <form class="sidebar__create-form" data-action="create-playlist">
                    <input class="text-input" name="name" type="text" maxlength="40" placeholder="Название">
                    <button class="icon-button" type="submit" title="Создать">+</button>
                </form>
            </section>
            <section class="sidebar__section">
                <h2 class="sidebar__heading">Ваши плейлисты</h2>
                <div class="sidebar__playlist-rail">
                    ${e.playlists.map(s=>`
                        <button class="sidebar__playlist-button ${e.selectedPlaylistId===s.id?"sidebar__playlist-button--active":""}" data-playlist-open="${s.id}" type="button">
                            ${at(s,"playlist-cover--small")}
                            <span class="sidebar__playlist-name">${l(s.name)}</span>
                        </button>
                    `).join("")||'<p class="subtle">Создайте первый плейлист</p>'}
                </div>
            </section>
            <section class="sidebar__stats">
                <div class="sidebar__stat stat-tile"><strong class="stat-tile__value">${e.tracks.length}</strong><span class="subtle">tracks</span></div>
                <div class="sidebar__stat stat-tile"><strong class="stat-tile__value">${e.playlists.length}</strong><span class="subtle">playlists</span></div>
                <div class="sidebar__stat stat-tile"><strong class="stat-tile__value">${t.length}</strong><span class="subtle">favorites</span></div>
            </section>
        </aside>
    `}function Nt(t){return`
        <article class="music-card">
            <div class="music-card__cover">
                ${N(t)}
                <button class="music-card__play ${t.id===e.currentTrackId&&e.isPlaying?"music-card__play--active":""}" data-play-track="${t.id}" type="button" title="${t.id===e.currentTrackId&&e.isPlaying?"Pause":"Play"}">${t.id===e.currentTrackId&&e.isPlaying?"&#9208;":"&#9654;"}</button>
            </div>
            <h3 class="music-card__title" title="${l(t.title)}">${l(t.title)}</h3>
            <p class="music-card__meta">${l(t.artist)} · ${l(t.album)}</p>
        </article>
    `}function S(t,a={}){return t.length?`
        <div class="track-list">
            ${t.map((s,i)=>`
                <div class="track-list__row ${s.id===e.currentTrackId?"track-list__row--active":""}" data-track-id="${s.id}" data-track-index="${i+1}">
                    <div class="track-list__index">${i+1}</div>
                    <div class="track-list__main">
                        ${N(s,"cover--small")}
                        <div class="track-list__text">
                            <span class="track-list__title">${l(s.title)}</span>
                            <span class="track-list__artist">${l(s.artist)}</span>
                        </div>
                    </div>
                    <div class="track-list__meta track-list__meta--album">${l(s.album)}</div>
                    <div class="track-list__meta track-list__meta--genre">${l(s.genre)}</div>
                    <div class="track-list__duration">${T(s.duration)}</div>
                    <div class="track-list__actions">
                        <button class="track-list__action ${s.id===e.currentTrackId&&e.isPlaying?"track-list__action--active":""}" data-play-track="${s.id}" type="button" title="${s.id===e.currentTrackId&&e.isPlaying?"Pause":"Play"}">${s.id===e.currentTrackId&&e.isPlaying?"&#9208;":"&#9654;"}</button>
                        <button class="track-list__action ${e.favorites.has(s.id)?"track-list__action--active":""}" data-favorite="${s.id}" type="button" title="В избранное">${e.favorites.has(s.id)?"♥":"♡"}</button>
                        <button class="track-list__action" data-menu-track="${s.id}" type="button" title="Добавить в плейлист">＋</button>
                        ${a.playlistId?`<button class="track-list__action" data-remove-track="${s.id}" data-playlist-id="${a.playlistId}" type="button" title="Удалить из плейлиста">×</button>`:""}
                        <button class="track-list__action track-list__action--danger" data-delete-track="${s.id}" type="button" title="Delete track">×</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `:'<div class="empty-state"><h2>Ничего не найдено</h2><p class="subtle">Измените поиск, фильтр или загрузите собственный трек.</p></div>'}function Et(){return`
        <section class="upload">
            <h2>Загрузить трек</h2>
            <form class="upload__form" data-action="upload-track">
                <div class="upload__grid">
                    <label class="upload__field upload__field--full">
                        <span>Любой аудиофайл</span>
                        <div class="upload__file">
                            <input class="upload__file-input" name="audio" type="file" accept="audio/*" required>
                            <div><strong>Выберите аудио</strong><span data-file-label="audio">Формат должен поддерживаться браузером</span></div>
                        </div>
                    </label>
                    <label class="upload__field">
                        <span>Обложка</span>
                        <div class="upload__file">
                            <input class="upload__file-input" name="cover" type="file" accept="image/png,image/jpeg,image/webp">
                            <div><strong>Выберите изображение</strong><span data-file-label="cover">PNG, JPG или WEBP</span></div>
                        </div>
                    </label>
                    <label class="upload__field">
                        <span>Название</span>
                        <input class="text-input" name="title" type="text" required maxlength="80" placeholder="Название трека">
                    </label>
                    <label class="upload__field">
                        <span>Исполнитель</span>
                        <input class="text-input" name="artist" type="text" required maxlength="80" placeholder="Имя исполнителя">
                    </label>
                    <label class="upload__field">
                        <span>Альбом</span>
                        <input class="text-input" name="album" type="text" maxlength="80" placeholder="Single">
                    </label>
                    <label class="upload__field">
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
                <div class="upload__actions">
                    <button class="pill-button" type="submit">Загрузить и сохранить</button>
                    <button class="pill-button pill-button--secondary" type="reset">Очистить</button>
                </div>
            </form>
        </section>
    `}function Mt(){const t=e.playlists.find(i=>i.id===e.selectedPlaylistId)??e.playlists[0];if(!t)return'<h2>Плейлистов пока нет</h2><p class="subtle">Создайте плейлист в левой панели.</p>';e.selectedPlaylistId=t.id;const a=new Set(t.trackIds),s=k(e.tracks.filter(i=>a.has(i.id)));return`
        <div class="playlist-detail">
            <div class="playlist-detail__head">
                <label class="playlist-detail__cover-picker" title="Change playlist cover">
                    ${at(t)}
                    <input class="playlist-detail__cover-input" data-playlist-cover-input="${t.id}" type="file" accept="image/png,image/jpeg,image/webp">
                </label>
            </div>
            <p class="eyebrow">Плейлист</p>
            <h1>${l(t.name)}</h1>
            <p class="subtle">${t.trackIds.length} треков</p>
            <form class="playlist-detail__rename-form" data-action="rename-playlist" data-playlist-id="${t.id}">
                <input class="text-input" name="name" type="text" value="${l(t.name)}" maxlength="40" required>
                <button class="icon-button" type="submit" title="Переименовать">✓</button>
            </form>
            <div class="playlist-detail__actions">
                <button class="pill-button" data-play-collection="${t.id}" type="button" ${s.length?"":"disabled"}>Слушать плейлист</button>
                <button class="danger-button" data-delete-playlist="${t.id}" type="button">Удалить плейлист</button>
            </div>
        </div>
        <div class="playlist-detail__tracks">
            ${S(s,{playlistId:t.id})}
        </div>
    `}function X(){return`
        <div class="playlists__grid">
            <section class="playlists__panel">
                <h2>Плейлисты</h2>
                <div class="playlists__list">
                    ${e.playlists.map(t=>`
                        <button class="playlists__item ${e.selectedPlaylistId===t.id?"playlists__item--active":""}" data-playlist-open="${t.id}" type="button">
                            <span><strong>${l(t.name)}</strong><br><span class="subtle">${t.trackIds.length} треков</span></span>
                            <span>›</span>
                        </button>
                    `).join("")||'<p class="subtle">Пока пусто.</p>'}
                </div>
            </section>
            <section class="playlists__panel">${Mt()}</section>
        </div>
    `}function Rt(){return`
        <section class="section">
            <div class="section__header"><h2>Recommendations</h2><button class="ghost-button" data-view="library" type="button">Open library</button></div>
            <div class="card-grid">${e.tracks.slice(0,5).map(Nt).join("")}</div>
        </section>
        <section class="section">
            <h2>Quick picks</h2>
            ${S(k(e.tracks).slice(0,8))}
        </section>
    `}function Dt(){const t=e.itunes.results;return`
        <div class="view-header">
            <div>
                <p class="eyebrow">iTunes API</p>
                <h1>iTunes Search</h1>
                <p class="subtle">Search songs from iTunes and play 30-second previews.</p>
            </div>
        </div>
        <section class="upload">
            <form class="itunes-search-form" data-action="itunes-search">
                <input class="text-input" name="query" type="search" value="${l(e.itunes.query)}" placeholder="Artist, song or album" required>
                <button class="pill-button" type="submit" ${e.itunes.isLoading?"disabled":""}>${e.itunes.isLoading?"Searching...":"Search"}</button>
            </form>
        </section>
        ${e.itunes.error?`<div class="empty-state"><h2>iTunes error</h2><p class="subtle">${l(e.itunes.error)}</p></div>`:""}
        ${!e.itunes.error&&e.itunes.isLoading?'<div class="empty-state"><h2>Searching iTunes...</h2><p class="subtle">Please wait a moment.</p></div>':""}
        ${!e.itunes.error&&!e.itunes.isLoading&&e.itunes.query&&!t.length?'<div class="empty-state"><h2>No tracks found</h2><p class="subtle">Try another artist or song title.</p></div>':""}
        ${t.length?`
            <div class="card-grid card-grid--itunes">
                ${t.map(a=>`
                    <article class="music-card">
                        <div class="music-card__cover">
                            ${N(a)}
                            <button class="music-card__play" data-play-track="${a.id}" type="button" title="Play preview">▶</button>
                        </div>
                        <h3 class="music-card__title" title="${l(a.title)}">${l(a.title)}</h3>
                        <p class="music-card__meta">${l(a.artist)} · ${l(a.album)}</p>
                        <button class="music-card__add-button ghost-button" data-add-itunes-track="${a.id}" type="button">Добавить в библиотеку</button>
                    </article>
                `).join("")}
            </div>
        `:""}
    `}function Ct(){const t=F();return e.view==="itunes"?Dt():e.view==="upload"?`<div class="view-header"><div><p class="eyebrow">Upload Music</p><h1>Загрузка музыки</h1><p class="subtle">Файл сохраняется локально и доступен после перезагрузки страницы.</p></div></div>${Et()}`:e.view==="favorites"?`<div class="view-header"><div><p class="eyebrow">Избранное</p><h1>Любимые треки</h1><p class="subtle">${t.length} треков</p></div></div>${S(t)}`:e.view==="playlist"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${X()}`:e.view==="playlists"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${X()}`:e.view==="library"?`<div class="view-header"><div><p class="eyebrow">TrackList</p><h1>Моя библиотека</h1><p class="subtle">${t.length} треков найдено</p></div><button class="pill-button" data-view="upload" type="button">Загрузить</button></div>${Ut()}${S(t)}`:Rt()}function nt(){const t=P();return`
        <footer class="player">
            <div class="player__current">
                ${t?N(t,"cover--small"):""}
                <div class="player__track-text">
                    <span class="track-list__title">${l((t==null?void 0:t.title)??"Нет трека")}</span>
                    <span class="track-list__artist">${l((t==null?void 0:t.artist)??"Выберите музыку")}</span>
                </div>
                ${t?`<button class="track-list__action ${e.favorites.has(t.id)?"track-list__action--active":""}" data-favorite="${t.id}" type="button" title="В избранное">${e.favorites.has(t.id)?"♥":"♡"}</button>`:""}
            </div>
            <div class="player__center">
                <div class="player__controls">
                    <button class="player__control ${e.shuffle?"player__control--active":""}" data-action="shuffle" type="button" title="Перемешать">⤨</button>
                    <button class="player__control" data-action="prev" type="button" title="Предыдущий">⏮</button>
                    <button class="player__control player__control--primary" data-action="toggle-play" type="button" title="Play/Pause">${e.isPlaying?"⏸":"▶"}</button>
                    <button class="player__control" data-action="next" type="button" title="Следующий">⏭</button>
                    <button class="player__control ${e.repeat==="one"?"player__control--active":""}" data-action="repeat" type="button" title="Повтор">${e.repeat==="one"?"①":"↻"}</button>
                </div>
                <div class="player__progress">
                    <span class="player__time">${T(e.currentTime)}</span>
                    <input class="player__range" data-action="seek" type="range" min="0" max="${Math.max(1,e.duration||(t==null?void 0:t.duration)||1)}" step="0.1" value="${e.currentTime}">
                    <span class="player__time">${T(e.duration||(t==null?void 0:t.duration))}</span>
                </div>
            </div>
            <div class="player__volume">
                <span class="player__volume-icon">♬</span>
                <input class="player__range player__range--volume" data-action="volume" type="range" min="0" max="1" step="0.01" value="${e.volume}">
            </div>
        </footer>
    `}function jt(){return e.menu?`
        <div class="playlist-menu" style="left:${e.menu.x}px; top:${e.menu.y}px;">
            ${e.playlists.map(t=>`<button class="playlist-menu__button" data-add-track="${e.menu.trackId}" data-playlist-id="${t.id}" type="button">${l(t.name)}</button>`).join("")||'<button class="playlist-menu__button" type="button" disabled>Сначала создайте плейлист</button>'}
        </div>
    `:""}function Bt(){return`
        <div class="app__layout">
            ${Ot()}
            <main class="app__main">
                ${At()}
                ${Ct()}
            </main>
        </div>
        ${nt()}
        ${jt()}
        <div class="toast-stack" aria-live="polite"></div>
    `}function c(){tt.innerHTML=Bt()}function h(){const t=document.querySelector(".player");t&&(t.outerHTML=nt())}function q(){document.querySelectorAll("[data-track-id]").forEach(t=>{const a=t.dataset.trackId===e.currentTrackId,s=a&&e.isPlaying;t.classList.toggle("track-list__row--active",a);const i=t.querySelector(".track-list__index");i&&(i.textContent=t.dataset.trackIndex);const n=t.querySelector("[data-play-track]");n&&(n.classList.toggle("track-list__action--active",s),n.title=s?"Pause":"Play",n.innerHTML=s?"&#9208;":"&#9654;")}),document.querySelectorAll(".music-card__play[data-play-track]").forEach(t=>{const a=t.dataset.playTrack===e.currentTrackId&&e.isPlaying;t.classList.toggle("music-card__play--active",a),t.title=a?"Pause":"Play",t.innerHTML=a?"&#9208;":"&#9654;"})}function w(){const t=document.querySelector(".player");if(!t)return;const a=P(),s=t.querySelector('[data-action="seek"]'),i=t.querySelector('[data-action="volume"]'),n=t.querySelectorAll(".player__time");s&&(s.max=Math.max(1,e.duration||(a==null?void 0:a.duration)||1),b!=="seek"&&(s.value=e.currentTime)),i&&b!=="volume"&&(i.value=e.volume),n[0]&&(n[0].textContent=T(e.currentTime)),n[1]&&(n[1].textContent=T(e.duration||(a==null?void 0:a.duration)))}function Jt(){w(),q()}function j(t,a=null){c();const s=document.querySelector(`[data-action="${t}"]`);s&&(s.focus(),t==="search"&&a!==null&&s.setSelectionRange(a,a))}function Ht(){o=new Audio,o.volume=e.volume,o.addEventListener("timeupdate",()=>{var t;e.currentTime=o.currentTime,e.duration=o.duration||((t=P())==null?void 0:t.duration)||0,w()}),o.addEventListener("loadedmetadata",()=>{var t;e.duration=o.duration||((t=P())==null?void 0:t.duration)||0,h()}),o.addEventListener("play",()=>{e.isPlaying=!0,h(),q()}),o.addEventListener("pause",()=>{e.isPlaying=!1,h(),q()}),o.addEventListener("ended",st)}function d(t,a){return t.closest(a)}function Ft(){document.addEventListener("click",async t=>{const a=t.target,s=d(a,"[data-view]"),i=d(a,"[data-play-track]"),n=d(a,"[data-favorite]"),r=d(a,"[data-menu-track]"),v=d(a,"[data-playlist-open]"),E=d(a,"[data-add-track]"),V=d(a,"[data-add-itunes-track]"),M=d(a,"[data-remove-track]"),G=d(a,"[data-delete-track]"),Y=d(a,"[data-delete-playlist]"),z=d(a,"[data-play-collection]"),u=d(a,"[data-action]");if(!d(a,".playlist-menu")&&!r&&e.menu){e.menu=null,c();return}if(s){I(s.dataset.view);return}if(i){if(i.dataset.playTrack===e.currentTrackId&&o.src){await W();return}const m=e.view==="itunes"?e.itunes.results.map(g=>g.id):F().map(g=>g.id);await _(i.dataset.playTrack,m);return}if(n){vt(n.dataset.favorite);return}if(r){const m=r.getBoundingClientRect();e.menu={trackId:r.dataset.menuTrack,x:Math.min(m.left,window.innerWidth-240),y:Math.min(m.bottom+6,window.innerHeight-220)},c();return}if(v){I("playlist",v.dataset.playlistOpen);return}if(E){await $t(E.dataset.addTrack,E.dataset.playlistId);return}if(V){await Lt(V.dataset.addItunesTrack);return}if(M){await kt(M.dataset.removeTrack,M.dataset.playlistId);return}if(G){await Tt(G.dataset.deleteTrack);return}if(Y){await gt(Y.dataset.deletePlaylist);return}if(z){const m=e.playlists.find(rt=>rt.id===z.dataset.playCollection),g=m==null?void 0:m.trackIds[0];g&&await _(g,m.trackIds);return}if((u==null?void 0:u.dataset.action)==="toggle-play"){await W();return}if((u==null?void 0:u.dataset.action)==="prev"){yt();return}if((u==null?void 0:u.dataset.action)==="next"){st();return}if((u==null?void 0:u.dataset.action)==="shuffle"){e.shuffle=!e.shuffle,C(),h();return}(u==null?void 0:u.dataset.action)==="repeat"&&(e.repeat=e.repeat==="one"?"off":"one",C(),h())}),document.addEventListener("pointerdown",t=>{t.target.matches('input[type="range"][data-action]')&&(b=t.target.dataset.action)}),document.addEventListener("pointerup",()=>{b=null,w()}),document.addEventListener("input",t=>{var s;const a=t.target.dataset.action;if(a==="search"){const i=t.target.selectionStart;e.query=t.target.value,j("search",i)}if(a==="genre"&&(e.genre=t.target.value,j("genre")),a==="album"&&(e.album=t.target.value,j("album")),a==="seek"&&(b="seek",o.currentTime=Number(t.target.value),e.currentTime=o.currentTime,w()),a==="volume"&&(b="volume",e.volume=Number(t.target.value),o.volume=e.volume,C()),t.target.dataset.playlistCoverInput){ht(t.target.dataset.playlistCoverInput,t.target.files[0]);return}if(t.target.type==="file"){const i=document.querySelector(`[data-file-label="${t.target.name}"]`);i&&(i.textContent=((s=t.target.files[0])==null?void 0:s.name)??i.textContent)}}),document.addEventListener("change",t=>{t.target.matches('input[type="range"][data-action]')&&(b=null,w())}),document.addEventListener("submit",async t=>{const a=t.target;if(a.dataset.action==="create-playlist"){t.preventDefault(),await _t(a.elements.name.value);return}if(a.dataset.action==="rename-playlist"){t.preventDefault(),await bt(a.dataset.playlistId,a.elements.name.value);return}if(a.dataset.action==="upload-track"){t.preventDefault(),a.reportValidity()&&await St(a);return}a.dataset.action==="itunes-search"&&(t.preventDefault(),a.reportValidity()&&await xt(a.elements.query.value))})}async function Vt(){Ht();try{await ft(),c(),Ft()}catch(t){tt.innerHTML=`<main class="app__main"><div class="empty-state"><h1>Не удалось запустить Re:Spot</h1><p class="subtle">${l(t.message)}</p></div></main>`}}Vt();

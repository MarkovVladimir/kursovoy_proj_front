(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const b of r.addedNodes)b.tagName==="LINK"&&b.rel==="modulepreload"&&i(b)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}})();const st="respot_music_player",it=1,w="tracks",p="playlists",I="respot_favorites",K="respot_player_settings",G=new Set(["pl-daily","pl-energy"]),nt=new URL(""+new URL("logo-DCDOM8-c.png",import.meta.url).href,import.meta.url).href;class P{constructor(a){var s,i,n;this.id=a.id,this.title=((s=a.title)==null?void 0:s.trim())||"Untitled",this.artist=((i=a.artist)==null?void 0:i.trim())||"Unknown artist",this.album=((n=a.album)==null?void 0:n.trim())||"Single",this.genre=a.genre||"Unknown",this.duration=Number(a.duration)||0,this.blob=a.blob||null,this.previewUrl=a.previewUrl||"",this.source=a.source||"local",this.fileName=a.fileName||"",this.coverUrl=a.coverUrl||"",this.colorA=a.colorA||"#1ed760",this.colorB=a.colorB||"#6d8cff",this.createdAt=a.createdAt||Date.now()}matches(a){return E(`${this.title} ${this.artist} ${this.album}`).includes(E(a))}toJSON(){return{...this}}}class S{constructor(a){var s;this.id=a.id,this.name=((s=a.name)==null?void 0:s.trim())||"Untitled playlist",this.trackIds=Array.isArray(a.trackIds)?[...a.trackIds]:[],this.coverUrl=a.coverUrl||"",this.createdAt=a.createdAt||Date.now()}static create(a){return new S({id:B("pl"),name:a,trackIds:[],createdAt:Date.now()})}rename(a){this.name=a.trim()}addTrack(a){return this.trackIds.includes(a)?!1:(this.trackIds.push(a),!0)}removeTrack(a){this.trackIds=this.trackIds.filter(s=>s!==a)}syncTrackIds(a){this.trackIds=this.trackIds.filter(s=>a.has(s))}toJSON(){return{...this,trackIds:[...this.trackIds]}}}const O=W(K,{volume:.75,repeat:"off",shuffle:!1}),e={tracks:[],playlists:[],favorites:new Set(W(I,[])),view:"home",selectedPlaylistId:null,query:"",genre:"all",album:"all",currentTrackId:null,queue:[],queueIndex:-1,isPlaying:!1,currentTime:0,duration:0,volume:O.volume??.75,repeat:O.repeat==="one"?"one":"off",shuffle:O.shuffle??!1,itunes:{query:"",results:[],isLoading:!1,error:""},menu:null};let q,o;const N=new Map,Q=document.querySelector("#app");function W(t,a){try{return JSON.parse(localStorage.getItem(t))??a}catch{return a}}function x(t,a){localStorage.setItem(t,JSON.stringify(a))}function B(t){return`${t}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}function l(t){return String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a])}function E(t){return String(t??"").trim().toLowerCase()}function M(t){if(!Number.isFinite(t)||t<0)return"0:00";const a=Math.floor(t/60),s=Math.floor(t%60);return`${a}:${String(s).padStart(2,"0")}`}function rt(){return new Promise((t,a)=>{const s=indexedDB.open(st,it);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains(w)||i.createObjectStore(w,{keyPath:"id"}),i.objectStoreNames.contains(p)||i.createObjectStore(p,{keyPath:"id"})},s.onsuccess=()=>t(s.result),s.onerror=()=>a(s.error)})}function Y(t){return new Promise((a,s)=>{const n=q.transaction(t,"readonly").objectStore(t).getAll();n.onsuccess=()=>a(n.result),n.onerror=()=>s(n.error)})}function y(t,a){return new Promise((s,i)=>{const n=q.transaction(t,"readwrite");n.objectStore(t).put(a),n.oncomplete=()=>s(),n.onerror=()=>i(n.error)})}function C(t,a){return new Promise((s,i)=>{const n=q.transaction(t,"readwrite");n.objectStore(t).delete(a),n.oncomplete=()=>s(),n.onerror=()=>i(n.error)})}function lt(t){if(t.previewUrl)return t.previewUrl;if(N.has(t.id))return N.get(t.id);if(!t.blob)return"";const a=URL.createObjectURL(t.blob);return N.set(t.id,a),a}function L(t,a=""){const s=l((t.title||"?").slice(0,1).toUpperCase()),i=`style="background: linear-gradient(135deg, ${t.colorA||"#1ed760"}, ${t.colorB||"#6d8cff"});"`;return t.coverUrl?`<div class="cover-art ${a}" ${i}><img src="${t.coverUrl}" alt=""></div>`:`<div class="cover-art ${a}" ${i}>${s}</div>`}function ot(t){if(t.coverUrl)return t.coverUrl;const a=e.tracks.find(s=>t.trackIds.includes(s.id));return(a==null?void 0:a.coverUrl)||""}function X(t,a=""){const s=l((t.name||"?").slice(0,1).toUpperCase()),i=ot(t);return i?`<span class="playlist-cover ${a}"><img src="${i}" alt=""></span>`:`<span class="playlist-cover ${a}">${s}</span>`}function f(t,a){const s=B("toast"),i=document.querySelector(".toast-stack");i&&(i.insertAdjacentHTML("beforeend",`
        <div class="toast" data-toast-id="${s}">
            <strong>${l(t)}</strong>
            <p>${l(a)}</p>
        </div>
    `),setTimeout(()=>{var n;(n=document.querySelector(`[data-toast-id="${s}"]`))==null||n.remove()},3400))}function R(){x(K,{volume:e.volume,repeat:e.repeat,shuffle:e.shuffle})}async function ct(){var n;q=await rt();const[t,a]=await Promise.all([Y(w),Y(p)]);e.tracks=t.map(r=>new P(r));const s=a.filter(r=>!G.has(r.id));await Promise.all(a.filter(r=>G.has(r.id)).map(r=>C(p,r.id))),e.playlists=s.sort((r,b)=>r.createdAt-b.createdAt).map(r=>new S(r));const i=new Set(e.tracks.map(r=>r.id));e.favorites=new Set([...e.favorites].filter(r=>i.has(r))),x(I,[...e.favorites]),e.playlists.forEach(r=>r.syncTrackIds(i)),await Promise.all(e.playlists.map(r=>y(p,r.toJSON()))),e.currentTrackId=((n=e.tracks[0])==null?void 0:n.id)??null,e.queue=e.tracks.map(r=>r.id),e.queueIndex=e.queue.indexOf(e.currentTrackId)}function j(){return[...e.tracks,...e.itunes.results].find(t=>t.id===e.currentTrackId)??e.tracks[0]}function $(t=e.tracks){const a=E(e.query);return t.filter(s=>{const i=!a||s.matches(a),n=e.genre==="all"||s.genre===e.genre,r=e.album==="all"||s.album===e.album;return i&&n&&r})}function J(){if(e.view==="favorites")return $(e.tracks.filter(t=>e.favorites.has(t.id)));if(e.view==="playlist"){const t=e.playlists.find(s=>s.id===e.selectedPlaylistId),a=new Set((t==null?void 0:t.trackIds)??[]);return $(e.tracks.filter(s=>a.has(s.id)))}return $()}function ut(t,a){const s=[...t],i=s.indexOf(a);i>=0?e.queueIndex=i:e.queueIndex=0,e.queue=s}async function h(t,a=J().map(s=>s.id)){const s=[...e.tracks,...e.itunes.results],i=s.find(r=>r.id===t);if(!i)return;ut(a.length?a:s.map(r=>r.id),t),e.currentTrackId=i.id;const n=lt(i);if(!n){e.isPlaying=!1,f("Track unavailable","Upload the audio file again or choose another preview."),c();return}o.src=n,o.currentTime=0;try{await o.play(),e.isPlaying=!0}catch{e.isPlaying=!1,f("Воспроизведение остановлено","Браузер попросил еще раз нажать Play.")}c()}async function dt(){var t;if(!o.src){await h(e.currentTrackId??((t=e.tracks[0])==null?void 0:t.id));return}o.paused?(await o.play(),e.isPlaying=!0):(o.pause(),e.isPlaying=!1),v()}function Z(){if(e.repeat==="one"){o.currentTime=0,o.play();return}if(e.shuffle&&e.queue.length>1){const a=e.queue.filter(i=>i!==e.currentTrackId),s=a[Math.floor(Math.random()*a.length)];e.queueIndex=e.queue.indexOf(s),h(s,e.queue);return}const t=e.queueIndex+1;if(t<e.queue.length){e.queueIndex=t,h(e.queue[e.queueIndex],e.queue);return}e.queue.length?(e.queueIndex=0,h(e.queue[0],e.queue)):(e.isPlaying=!1,v())}function pt(){if(o.currentTime>4){o.currentTime=0;return}const t=e.queueIndex-1;if(t>=0){e.queueIndex=t,h(e.queue[e.queueIndex],e.queue);return}e.queue.length&&(e.queueIndex=e.queue.length-1,h(e.queue[e.queueIndex],e.queue))}function k(t,a=null){e.view=t,e.selectedPlaylistId=a,e.menu=null,c()}function ft(t){e.favorites.has(t)?e.favorites.delete(t):e.favorites.add(t),x(I,[...e.favorites]),c()}async function mt(t){const a=t.trim();if(!a)return;const s=S.create(a);await y(p,s.toJSON()),e.playlists.push(s),k("playlist",s.id),f("Плейлист создан",a)}async function vt(t,a){const s=e.playlists.find(n=>n.id===t),i=a.trim();!s||!i||(s.rename(i),await y(p,s.toJSON()),c(),f("Плейлист переименован",i))}async function yt(t,a){const s=e.playlists.find(i=>i.id===t);!s||!a||(s.coverUrl=await tt(a),await y(p,s.toJSON()),c(),f("Playlist cover updated",s.name))}async function bt(t){const a=e.playlists.find(s=>s.id===t);a&&(await C(p,t),e.playlists=e.playlists.filter(s=>s.id!==t),k("playlists"),f("Плейлист удален",a.name))}async function ht(t,a){const s=e.playlists.find(n=>n.id===a);if(!s||!s.addTrack(t)){e.menu=null,c();return}await y(p,s.toJSON());const i=e.tracks.find(n=>n.id===t);e.menu=null,c(),f("Трек добавлен",`${i.title} -> ${s.name}`)}async function gt(t,a){const s=e.playlists.find(i=>i.id===a);s&&(s.removeTrack(t),await y(p,s.toJSON()),c())}async function wt(){await Promise.all(e.playlists.map(t=>y(p,t.toJSON())))}async function $t(t){var s;const a=e.tracks.find(i=>i.id===t);a&&(await C(w,a.id),e.favorites.delete(a.id),x(I,[...e.favorites]),e.playlists.forEach(i=>{i.removeTrack(a.id)}),await wt(),e.tracks=e.tracks.filter(i=>i.id!==a.id),e.queue=e.queue.filter(i=>i!==a.id),e.currentTrackId===a.id?(o.pause(),o.removeAttribute("src"),o.load(),e.isPlaying=!1,e.currentTime=0,e.duration=0,e.currentTrackId=((s=e.tracks[0])==null?void 0:s.id)??null,e.queue=e.tracks.map(i=>i.id),e.queueIndex=e.currentTrackId?0:-1):e.queueIndex=e.queue.indexOf(e.currentTrackId),c(),f("Track deleted",a.title))}function tt(t){return new Promise((a,s)=>{if(!t){a("");return}const i=new FileReader;i.onload=()=>a(i.result),i.onerror=()=>s(i.error),i.readAsDataURL(t)})}function kt(t){return new Promise(a=>{const s=URL.createObjectURL(t),i=new Audio(s);i.preload="metadata",i.onloadedmetadata=()=>{URL.revokeObjectURL(s),a(Math.round(i.duration||0))},i.onerror=()=>{URL.revokeObjectURL(s),a(0)}})}function Tt(t){return t?t.type&&t.type.startsWith("audio/")?!0:/\.(aac|aif|aiff|alac|amr|flac|m4a|m4b|mid|midi|mp3|oga|ogg|opus|wav|weba|wma)$/i.test(t.name):!1}async function It(t){const a=t.elements.audio.files[0],s=t.elements.cover.files[0];if(!Tt(a)){f("Файл не загружен","Выберите аудиофайл, который поддерживает ваш браузер.");return}const i=await kt(a),n=new P({id:B("up"),title:t.elements.title.value.trim(),artist:t.elements.artist.value.trim(),album:t.elements.album.value.trim()||"Single",genre:t.elements.genre.value,duration:i,blob:a,fileName:a.name,coverUrl:await tt(s),colorA:"#1ed760",colorB:"#6d8cff",createdAt:Date.now()});await y(w,n.toJSON()),e.tracks.push(n),t.reset(),k("library"),f("Трек загружен",`${n.title} теперь в библиотеке.`)}function Pt(t){const a=t.artworkUrl100?t.artworkUrl100.replace("100x100bb","300x300bb"):"";return new P({id:`itunes-${t.trackId}`,title:t.trackName,artist:t.artistName,album:t.collectionName||"Single",genre:t.primaryGenreName||"iTunes",duration:Math.round((t.trackTimeMillis||0)/1e3),previewUrl:t.previewUrl||"",coverUrl:a,colorA:"#e7e0d0",colorB:"#6d8cff",source:"itunes",createdAt:Date.now()})}async function St(t){const a=t.trim();if(e.itunes.query=a,e.itunes.error="",!a){e.itunes.results=[],c();return}e.itunes.isLoading=!0,c();try{const s=new URLSearchParams({term:a,media:"music",entity:"song",limit:"24"}),i=await fetch(`https://itunes.apple.com/search?${s.toString()}`);if(!i.ok)throw new Error("iTunes request failed");const n=await i.json();e.itunes.results=(n.results||[]).filter(r=>r.trackId&&r.previewUrl).map(Pt)}catch(s){e.itunes.results=[],e.itunes.error=s.message||"Could not load iTunes results."}finally{e.itunes.isLoading=!1,c()}}async function qt(t){const a=e.itunes.results.find(i=>i.id===t);if(!a)return;if(e.tracks.some(i=>i.id===a.id)){f("Already in library",a.title);return}const s=new P({...a.toJSON(),createdAt:Date.now()});await y(w,s.toJSON()),e.tracks.push(s),f("Added from iTunes",`${s.title} is now in your library.`),c()}function xt(){return`
        <header class="topbar">
            <div class="search-wrap">
                <span class="icon">⌕</span>
                <input class="search-input" data-action="search" type="search" value="${l(e.query)}" placeholder="Поиск по названию, исполнителю или альбому">
            </div>
        </header>
    `}function Lt(){const t=["all",...new Set(e.tracks.map(s=>s.genre).filter(Boolean))],a=["all",...new Set(e.tracks.map(s=>s.album).filter(Boolean))];return`
        <section class="library-controls" aria-label="Фильтры библиотеки">
            <div class="filters">
                <select class="select-input" data-action="genre">
                    ${t.map(s=>`<option value="${l(s)}" ${s===e.genre?"selected":""}>${s==="all"?"Все жанры":l(s)}</option>`).join("")}
                </select>
                <select class="select-input" data-action="album">
                    ${a.map(s=>`<option value="${l(s)}" ${s===e.album?"selected":""}>${s==="all"?"Все альбомы":l(s)}</option>`).join("")}
                </select>
            </div>
        </section>
    `}function Ut(){const t=e.tracks.filter(s=>e.favorites.has(s.id));return`
        <aside class="sidebar">
            <div class="brand"><span class="brand-mark"><img src="${nt}" alt=""></span><span>Re:Spot</span></div>
            <nav class="nav-group">
                ${[["home","⌂","Главная"],["library","♬","Моя библиотека"],["favorites","♡","Избранное"],["upload","⇧","Загрузка"],["itunes","iT","iTunes"],["playlists","▤","Плейлисты"]].map(([s,i,n])=>`
                    <button class="nav-button ${e.view===s||s==="playlists"&&e.view==="playlist"?"active":""}" data-view="${s}" type="button">
                        <span class="icon">${i}</span>${n}
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
                    ${e.playlists.map(s=>`
                        <button class="${e.selectedPlaylistId===s.id?"active":""}" data-playlist-open="${s.id}" type="button">
                            ${X(s,"icon playlist-cover-mini")}
                            <span>${l(s.name)}</span>
                        </button>
                    `).join("")||'<p class="subtle">Создайте первый плейлист</p>'}
                </div>
            </section>
            <section class="sidebar-stats">
                <div class="stat-tile"><strong>${e.tracks.length}</strong><span class="subtle">tracks</span></div>
                <div class="stat-tile"><strong>${e.playlists.length}</strong><span class="subtle">playlists</span></div>
                <div class="stat-tile"><strong>${t.length}</strong><span class="subtle">favorites</span></div>
            </section>
        </aside>
    `}function At(t){return`
        <article class="music-card">
            <div class="cover-wrap">
                ${L(t)}
                <button class="floating-play" data-play-track="${t.id}" type="button" title="Слушать">▶</button>
            </div>
            <h3 title="${l(t.title)}">${l(t.title)}</h3>
            <p>${l(t.artist)} · ${l(t.album)}</p>
        </article>
    `}function T(t,a={}){return t.length?`
        <div class="track-table">
            ${t.map((s,i)=>`
                <div class="track-row ${s.id===e.currentTrackId?"active":""}">
                    <div class="track-index">${s.id===e.currentTrackId&&e.isPlaying?"▶":i+1}</div>
                    <div class="track-main">
                        ${L(s,"cover-sm")}
                        <div>
                            <span class="track-title">${l(s.title)}</span>
                            <span class="track-artist">${l(s.artist)}</span>
                        </div>
                    </div>
                    <div class="track-meta album-cell">${l(s.album)}</div>
                    <div class="track-meta genre-cell">${l(s.genre)}</div>
                    <div class="track-duration">${M(s.duration)}</div>
                    <div class="row-actions">
                        <button class="row-action" data-play-track="${s.id}" type="button" title="Слушать">▶</button>
                        <button class="row-action ${e.favorites.has(s.id)?"active":""}" data-favorite="${s.id}" type="button" title="В избранное">${e.favorites.has(s.id)?"♥":"♡"}</button>
                        <button class="row-action" data-menu-track="${s.id}" type="button" title="Добавить в плейлист">＋</button>
                        ${a.playlistId?`<button class="row-action" data-remove-track="${s.id}" data-playlist-id="${a.playlistId}" type="button" title="Удалить из плейлиста">×</button>`:""}
                        <button class="row-action danger-action" data-delete-track="${s.id}" type="button" title="Delete track">×</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `:'<div class="empty-state"><h2>Ничего не найдено</h2><p class="subtle">Измените поиск, фильтр или загрузите собственный трек.</p></div>'}function Ot(){return`
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
    `}function Nt(){const t=e.playlists.find(i=>i.id===e.selectedPlaylistId)??e.playlists[0];if(!t)return'<h2>Плейлистов пока нет</h2><p class="subtle">Создайте плейлист в левой панели.</p>';e.selectedPlaylistId=t.id;const a=new Set(t.trackIds),s=$(e.tracks.filter(i=>a.has(i.id)));return`
        <div class="playlist-detail">
            <div class="playlist-head">
                <label class="playlist-cover-picker" title="Change playlist cover">
                    ${X(t)}
                    <input data-playlist-cover-input="${t.id}" type="file" accept="image/png,image/jpeg,image/webp">
                </label>
            </div>
            <p class="eyebrow">Плейлист</p>
            <h1>${l(t.name)}</h1>
            <p class="subtle">${t.trackIds.length} треков</p>
            <form class="rename-form" data-action="rename-playlist" data-playlist-id="${t.id}">
                <input class="text-input" name="name" type="text" value="${l(t.name)}" maxlength="40" required>
                <button class="icon-button" type="submit" title="Переименовать">✓</button>
            </form>
            <div class="playlist-actions">
                <button class="pill-button" data-play-collection="${t.id}" type="button" ${s.length?"":"disabled"}>Слушать плейлист</button>
                <button class="danger-button" data-delete-playlist="${t.id}" type="button">Удалить плейлист</button>
            </div>
        </div>
        <div class="playlist-tracks">
            ${T(s,{playlistId:t.id})}
        </div>
    `}function z(){return`
        <div class="playlist-grid">
            <section class="playlist-panel">
                <h2>Плейлисты</h2>
                <div class="playlist-list">
                    ${e.playlists.map(t=>`
                        <button class="playlist-item ${e.selectedPlaylistId===t.id?"active":""}" data-playlist-open="${t.id}" type="button">
                            <span><strong>${l(t.name)}</strong><br><span class="subtle">${t.trackIds.length} треков</span></span>
                            <span>›</span>
                        </button>
                    `).join("")||'<p class="subtle">Пока пусто.</p>'}
                </div>
            </section>
            <section class="playlist-panel">${Nt()}</section>
        </div>
    `}function Rt(){return`
        <section class="section">
            <div class="section-title-row"><h2>Recommendations</h2><button class="ghost-button" data-view="library" type="button">Open library</button></div>
            <div class="card-grid">${e.tracks.slice(0,5).map(At).join("")}</div>
        </section>
        <section class="section">
            <h2>Quick picks</h2>
            ${T($(e.tracks).slice(0,8))}
        </section>
    `}function Dt(){const t=e.itunes.results;return`
        <div class="view-header">
            <div>
                <p class="eyebrow">iTunes API</p>
                <h1>iTunes Search</h1>
                <p class="subtle">Search songs from iTunes and play 30-second previews.</p>
            </div>
        </div>
        <section class="upload-panel">
            <form class="itunes-search-form" data-action="itunes-search">
                <input class="text-input" name="query" type="search" value="${l(e.itunes.query)}" placeholder="Artist, song or album" required>
                <button class="pill-button" type="submit" ${e.itunes.isLoading?"disabled":""}>${e.itunes.isLoading?"Searching...":"Search"}</button>
            </form>
        </section>
        ${e.itunes.error?`<div class="empty-state"><h2>iTunes error</h2><p class="subtle">${l(e.itunes.error)}</p></div>`:""}
        ${!e.itunes.error&&e.itunes.isLoading?'<div class="empty-state"><h2>Searching iTunes...</h2><p class="subtle">Please wait a moment.</p></div>':""}
        ${!e.itunes.error&&!e.itunes.isLoading&&e.itunes.query&&!t.length?'<div class="empty-state"><h2>No tracks found</h2><p class="subtle">Try another artist or song title.</p></div>':""}
        ${t.length?`
            <div class="card-grid itunes-grid">
                ${t.map(a=>`
                    <article class="music-card">
                        <div class="cover-wrap">
                            ${L(a)}
                            <button class="floating-play" data-play-track="${a.id}" type="button" title="Play preview">▶</button>
                        </div>
                        <h3 title="${l(a.title)}">${l(a.title)}</h3>
                        <p>${l(a.artist)} · ${l(a.album)}</p>
                        <button class="ghost-button itunes-add-button" data-add-itunes-track="${a.id}" type="button">Добавить в библиотеку</button>
                    </article>
                `).join("")}
            </div>
        `:""}
    `}function Et(){const t=J();return e.view==="itunes"?Dt():e.view==="upload"?`<div class="view-header"><div><p class="eyebrow">Upload Music</p><h1>Загрузка музыки</h1><p class="subtle">Файл сохраняется локально и доступен после перезагрузки страницы.</p></div></div>${Ot()}`:e.view==="favorites"?`<div class="view-header"><div><p class="eyebrow">Избранное</p><h1>Любимые треки</h1><p class="subtle">${t.length} треков</p></div></div>${T(t)}`:e.view==="playlist"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${z()}`:e.view==="playlists"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${z()}`:e.view==="library"?`<div class="view-header"><div><p class="eyebrow">TrackList</p><h1>Моя библиотека</h1><p class="subtle">${t.length} треков найдено</p></div><button class="pill-button" data-view="upload" type="button">Загрузить</button></div>${Lt()}${T(t)}`:Rt()}function et(){const t=j();return`
        <footer class="player">
            <div class="now-playing">
                ${t?L(t,"cover-sm"):""}
                <div class="track-main-text">
                    <span class="track-title">${l((t==null?void 0:t.title)??"Нет трека")}</span>
                    <span class="track-artist">${l((t==null?void 0:t.artist)??"Выберите музыку")}</span>
                </div>
                ${t?`<button class="row-action ${e.favorites.has(t.id)?"active":""}" data-favorite="${t.id}" type="button" title="В избранное">${e.favorites.has(t.id)?"♥":"♡"}</button>`:""}
            </div>
            <div class="player-center">
                <div class="player-controls">
                    <button class="round-control ${e.shuffle?"active":""}" data-action="shuffle" type="button" title="Перемешать">⤨</button>
                    <button class="round-control" data-action="prev" type="button" title="Предыдущий">⏮</button>
                    <button class="round-control primary" data-action="toggle-play" type="button" title="Play/Pause">${e.isPlaying?"⏸":"▶"}</button>
                    <button class="round-control" data-action="next" type="button" title="Следующий">⏭</button>
                    <button class="round-control ${e.repeat==="one"?"active":""}" data-action="repeat" type="button" title="Повтор">${e.repeat==="one"?"①":"↻"}</button>
                </div>
                <div class="progress-row">
                    <span>${M(e.currentTime)}</span>
                    <input class="range" data-action="seek" type="range" min="0" max="${Math.max(1,e.duration||(t==null?void 0:t.duration)||1)}" step="0.1" value="${e.currentTime}">
                    <span>${M(e.duration||(t==null?void 0:t.duration))}</span>
                </div>
            </div>
            <div class="volume-row">
                <span class="icon">♬</span>
                <input class="range" data-action="volume" type="range" min="0" max="1" step="0.01" value="${e.volume}">
            </div>
        </footer>
    `}function Mt(){return e.menu?`
        <div class="menu" style="left:${e.menu.x}px; top:${e.menu.y}px;">
            ${e.playlists.map(t=>`<button data-add-track="${e.menu.trackId}" data-playlist-id="${t.id}" type="button">${l(t.name)}</button>`).join("")||'<button type="button" disabled>Сначала создайте плейлист</button>'}
        </div>
    `:""}function jt(){return`
        <div class="app-layout">
            ${Ut()}
            <main class="main">
                ${xt()}
                ${Et()}
            </main>
        </div>
        ${et()}
        ${Mt()}
        <div class="toast-stack" aria-live="polite"></div>
    `}function c(){Q.innerHTML=jt()}function v(){const t=document.querySelector(".player");t&&(t.outerHTML=et())}function D(t,a=null){c();const s=document.querySelector(`[data-action="${t}"]`);s&&(s.focus(),t==="search"&&a!==null&&s.setSelectionRange(a,a))}function Bt(){o=new Audio,o.volume=e.volume,o.addEventListener("timeupdate",()=>{var t;e.currentTime=o.currentTime,e.duration=o.duration||((t=j())==null?void 0:t.duration)||0,v()}),o.addEventListener("loadedmetadata",()=>{var t;e.duration=o.duration||((t=j())==null?void 0:t.duration)||0,v()}),o.addEventListener("play",()=>{e.isPlaying=!0,v()}),o.addEventListener("pause",()=>{e.isPlaying=!1,v()}),o.addEventListener("ended",Z)}function d(t,a){return t.closest(a)}function Ct(){document.addEventListener("click",async t=>{const a=t.target,s=d(a,"[data-view]"),i=d(a,"[data-play-track]"),n=d(a,"[data-favorite]"),r=d(a,"[data-menu-track]"),b=d(a,"[data-playlist-open]"),U=d(a,"[data-add-track]"),_=d(a,"[data-add-itunes-track]"),A=d(a,"[data-remove-track]"),F=d(a,"[data-delete-track]"),H=d(a,"[data-delete-playlist]"),V=d(a,"[data-play-collection]"),u=d(a,"[data-action]");if(!d(a,".menu")&&!r&&e.menu){e.menu=null,c();return}if(s){k(s.dataset.view);return}if(i){const m=e.view==="itunes"?e.itunes.results.map(g=>g.id):J().map(g=>g.id);await h(i.dataset.playTrack,m);return}if(n){ft(n.dataset.favorite);return}if(r){const m=r.getBoundingClientRect();e.menu={trackId:r.dataset.menuTrack,x:Math.min(m.left,window.innerWidth-240),y:Math.min(m.bottom+6,window.innerHeight-220)},c();return}if(b){k("playlist",b.dataset.playlistOpen);return}if(U){await ht(U.dataset.addTrack,U.dataset.playlistId);return}if(_){await qt(_.dataset.addItunesTrack);return}if(A){await gt(A.dataset.removeTrack,A.dataset.playlistId);return}if(F){await $t(F.dataset.deleteTrack);return}if(H){await bt(H.dataset.deletePlaylist);return}if(V){const m=e.playlists.find(at=>at.id===V.dataset.playCollection),g=m==null?void 0:m.trackIds[0];g&&await h(g,m.trackIds);return}if((u==null?void 0:u.dataset.action)==="toggle-play"){await dt();return}if((u==null?void 0:u.dataset.action)==="prev"){pt();return}if((u==null?void 0:u.dataset.action)==="next"){Z();return}if((u==null?void 0:u.dataset.action)==="shuffle"){e.shuffle=!e.shuffle,R(),v();return}(u==null?void 0:u.dataset.action)==="repeat"&&(e.repeat=e.repeat==="one"?"off":"one",R(),v())}),document.addEventListener("input",t=>{var s;const a=t.target.dataset.action;if(a==="search"){const i=t.target.selectionStart;e.query=t.target.value,D("search",i)}if(a==="genre"&&(e.genre=t.target.value,D("genre")),a==="album"&&(e.album=t.target.value,D("album")),a==="seek"&&(o.currentTime=Number(t.target.value),e.currentTime=o.currentTime,v()),a==="volume"&&(e.volume=Number(t.target.value),o.volume=e.volume,R()),t.target.dataset.playlistCoverInput){yt(t.target.dataset.playlistCoverInput,t.target.files[0]);return}if(t.target.type==="file"){const i=document.querySelector(`[data-file-label="${t.target.name}"]`);i&&(i.textContent=((s=t.target.files[0])==null?void 0:s.name)??i.textContent)}}),document.addEventListener("submit",async t=>{const a=t.target;if(a.dataset.action==="create-playlist"){t.preventDefault(),await mt(a.elements.name.value);return}if(a.dataset.action==="rename-playlist"){t.preventDefault(),await vt(a.dataset.playlistId,a.elements.name.value);return}if(a.dataset.action==="upload-track"){t.preventDefault(),a.reportValidity()&&await It(a);return}a.dataset.action==="itunes-search"&&(t.preventDefault(),a.reportValidity()&&await St(a.elements.query.value))})}async function Jt(){Bt();try{await ct(),c(),Ct()}catch(t){Q.innerHTML=`<main class="main"><div class="empty-state"><h1>Не удалось запустить Re:Spot</h1><p class="subtle">${l(t.message)}</p></div></main>`}}Jt();

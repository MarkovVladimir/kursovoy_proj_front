(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const y of r.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&s(y)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();const lt="respot_music_player",ot=1,w="tracks",p="playlists",L="respot_favorites",Z="respot_player_settings",K=new Set(["pl-daily","pl-energy"]),ct=new URL(""+new URL("logo-DCDOM8-c.png",import.meta.url).href,import.meta.url).href;class A{constructor(a){var i,s,n;this.id=a.id,this.title=((i=a.title)==null?void 0:i.trim())||"Untitled",this.artist=((s=a.artist)==null?void 0:s.trim())||"Unknown artist",this.album=((n=a.album)==null?void 0:n.trim())||"Single",this.genre=a.genre||"Unknown",this.duration=Number(a.duration)||0,this.blob=a.blob||null,this.previewUrl=a.previewUrl||"",this.source=a.source||"local",this.fileName=a.fileName||"",this.coverUrl=a.coverUrl||"",this.colorA=a.colorA||"#1ed760",this.colorB=a.colorB||"#6d8cff",this.createdAt=a.createdAt||Date.now()}matches(a){return J(`${this.title} ${this.artist} ${this.album}`).includes(J(a))}toJSON(){return{...this}}}class U{constructor(a){var i;this.id=a.id,this.name=((i=a.name)==null?void 0:i.trim())||"Untitled playlist",this.trackIds=Array.isArray(a.trackIds)?[...a.trackIds]:[],this.coverUrl=a.coverUrl||"",this.createdAt=a.createdAt||Date.now()}static create(a){return new U({id:_("pl"),name:a,trackIds:[],createdAt:Date.now()})}rename(a){this.name=a.trim()}addTrack(a){return this.trackIds.includes(a)?!1:(this.trackIds.push(a),!0)}removeTrack(a){this.trackIds=this.trackIds.filter(i=>i!==a)}syncTrackIds(a){this.trackIds=this.trackIds.filter(i=>a.has(i))}toJSON(){return{...this,trackIds:[...this.trackIds]}}}const D=et(Z,{volume:.75,repeat:"off",shuffle:!1}),e={tracks:[],playlists:[],favorites:new Set(et(L,[])),view:"home",selectedPlaylistId:null,query:"",genre:"all",album:"all",currentTrackId:null,queue:[],queueIndex:-1,isPlaying:!1,currentTime:0,duration:0,volume:D.volume??.75,repeat:D.repeat==="one"?"one":"off",shuffle:D.shuffle??!1,itunes:{query:"",results:[],isLoading:!1,error:""},menu:null};let O,o,h=null;const C=new Map,tt=document.querySelector("#app");function et(t,a){try{return JSON.parse(localStorage.getItem(t))??a}catch{return a}}function N(t,a){localStorage.setItem(t,JSON.stringify(a))}function _(t){return`${t}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}function l(t){return String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a])}function J(t){return String(t??"").trim().toLowerCase()}function I(t){if(!Number.isFinite(t)||t<0)return"0:00";const a=Math.floor(t/60),i=Math.floor(t%60);return`${a}:${String(i).padStart(2,"0")}`}function ut(){return new Promise((t,a)=>{const i=indexedDB.open(lt,ot);i.onupgradeneeded=()=>{const s=i.result;s.objectStoreNames.contains(w)||s.createObjectStore(w,{keyPath:"id"}),s.objectStoreNames.contains(p)||s.createObjectStore(p,{keyPath:"id"})},i.onsuccess=()=>t(i.result),i.onerror=()=>a(i.error)})}function Q(t){return new Promise((a,i)=>{const n=O.transaction(t,"readonly").objectStore(t).getAll();n.onsuccess=()=>a(n.result),n.onerror=()=>i(n.error)})}function v(t,a){return new Promise((i,s)=>{const n=O.transaction(t,"readwrite");n.objectStore(t).put(a),n.oncomplete=()=>i(),n.onerror=()=>s(n.error)})}function H(t,a){return new Promise((i,s)=>{const n=O.transaction(t,"readwrite");n.objectStore(t).delete(a),n.oncomplete=()=>i(),n.onerror=()=>s(n.error)})}function dt(t){if(t.previewUrl)return t.previewUrl;if(C.has(t.id))return C.get(t.id);if(!t.blob)return"";const a=URL.createObjectURL(t.blob);return C.set(t.id,a),a}function E(t,a=""){const i=l((t.title||"?").slice(0,1).toUpperCase()),s=`style="background: linear-gradient(135deg, ${t.colorA||"#1ed760"}, ${t.colorB||"#6d8cff"});"`;return t.coverUrl?`<div class="cover-art ${a}" ${s}><img src="${t.coverUrl}" alt=""></div>`:`<div class="cover-art ${a}" ${s}>${i}</div>`}function pt(t){if(t.coverUrl)return t.coverUrl;const a=e.tracks.find(i=>t.trackIds.includes(i.id));return(a==null?void 0:a.coverUrl)||""}function at(t,a=""){const i=l((t.name||"?").slice(0,1).toUpperCase()),s=pt(t);return s?`<span class="playlist-cover ${a}"><img src="${s}" alt=""></span>`:`<span class="playlist-cover ${a}">${i}</span>`}function f(t,a){const i=_("toast"),s=document.querySelector(".toast-stack");s&&(s.insertAdjacentHTML("beforeend",`
        <div class="toast" data-toast-id="${i}">
            <strong>${l(t)}</strong>
            <p>${l(a)}</p>
        </div>
    `),setTimeout(()=>{var n;(n=document.querySelector(`[data-toast-id="${i}"]`))==null||n.remove()},3400))}function j(){N(Z,{volume:e.volume,repeat:e.repeat,shuffle:e.shuffle})}async function ft(){var n;O=await ut();const[t,a]=await Promise.all([Q(w),Q(p)]);e.tracks=t.map(r=>new A(r));const i=a.filter(r=>!K.has(r.id));await Promise.all(a.filter(r=>K.has(r.id)).map(r=>H(p,r.id))),e.playlists=i.sort((r,y)=>r.createdAt-y.createdAt).map(r=>new U(r));const s=new Set(e.tracks.map(r=>r.id));e.favorites=new Set([...e.favorites].filter(r=>s.has(r))),N(L,[...e.favorites]),e.playlists.forEach(r=>r.syncTrackIds(s)),await Promise.all(e.playlists.map(r=>v(p,r.toJSON()))),e.currentTrackId=((n=e.tracks[0])==null?void 0:n.id)??null,e.queue=e.tracks.map(r=>r.id),e.queueIndex=e.queue.indexOf(e.currentTrackId)}function S(){return[...e.tracks,...e.itunes.results].find(t=>t.id===e.currentTrackId)??e.tracks[0]}function k(t=e.tracks){const a=J(e.query);return t.filter(i=>{const s=!a||i.matches(a),n=e.genre==="all"||i.genre===e.genre,r=e.album==="all"||i.album===e.album;return s&&n&&r})}function F(){if(e.view==="favorites")return k(e.tracks.filter(t=>e.favorites.has(t.id)));if(e.view==="playlist"){const t=e.playlists.find(i=>i.id===e.selectedPlaylistId),a=new Set((t==null?void 0:t.trackIds)??[]);return k(e.tracks.filter(i=>a.has(i.id)))}return k()}function mt(t,a){const i=[...t],s=i.indexOf(a);s>=0?e.queueIndex=s:e.queueIndex=0,e.queue=i}async function b(t,a=F().map(i=>i.id)){const i=[...e.tracks,...e.itunes.results],s=i.find(r=>r.id===t);if(!s)return;mt(a.length?a:i.map(r=>r.id),t),e.currentTrackId=s.id;const n=dt(s);if(!n){e.isPlaying=!1,f("Track unavailable","Upload the audio file again or choose another preview."),c();return}o.src=n,o.currentTime=0;try{await o.play(),e.isPlaying=!0}catch{e.isPlaying=!1,f("Воспроизведение остановлено","Браузер попросил еще раз нажать Play.")}c(),_t()}async function W(){var t;if(!o.src){await b(e.currentTrackId??((t=e.tracks[0])==null?void 0:t.id));return}o.paused?(await o.play(),e.isPlaying=!0):(o.pause(),e.isPlaying=!1),g(),x()}function it(){if(e.repeat==="one"){o.currentTime=0,o.play();return}if(e.shuffle&&e.queue.length>1){const a=e.queue.filter(s=>s!==e.currentTrackId),i=a[Math.floor(Math.random()*a.length)];e.queueIndex=e.queue.indexOf(i),b(i,e.queue);return}const t=e.queueIndex+1;if(t<e.queue.length){e.queueIndex=t,b(e.queue[e.queueIndex],e.queue);return}e.queue.length?(e.queueIndex=0,b(e.queue[0],e.queue)):(e.isPlaying=!1,g())}function vt(){if(o.currentTime>4){o.currentTime=0;return}const t=e.queueIndex-1;if(t>=0){e.queueIndex=t,b(e.queue[e.queueIndex],e.queue);return}e.queue.length&&(e.queueIndex=e.queue.length-1,b(e.queue[e.queueIndex],e.queue))}function P(t,a=null){e.view=t,e.selectedPlaylistId=a,e.menu=null,c()}function yt(t){e.favorites.has(t)?e.favorites.delete(t):e.favorites.add(t),N(L,[...e.favorites]),c()}async function bt(t){const a=t.trim();if(!a)return;const i=U.create(a);await v(p,i.toJSON()),e.playlists.push(i),P("playlist",i.id),f("Плейлист создан",a)}async function ht(t,a){const i=e.playlists.find(n=>n.id===t),s=a.trim();!i||!s||(i.rename(s),await v(p,i.toJSON()),c(),f("Плейлист переименован",s))}async function gt(t,a){const i=e.playlists.find(s=>s.id===t);!i||!a||(i.coverUrl=await st(a),await v(p,i.toJSON()),c(),f("Playlist cover updated",i.name))}async function $t(t){const a=e.playlists.find(i=>i.id===t);a&&(await H(p,t),e.playlists=e.playlists.filter(i=>i.id!==t),P("playlists"),f("Плейлист удален",a.name))}async function wt(t,a){const i=e.playlists.find(n=>n.id===a);if(!i||!i.addTrack(t)){e.menu=null,c();return}await v(p,i.toJSON());const s=e.tracks.find(n=>n.id===t);e.menu=null,c(),f("Трек добавлен",`${s.title} -> ${i.name}`)}async function kt(t,a){const i=e.playlists.find(s=>s.id===a);i&&(i.removeTrack(t),await v(p,i.toJSON()),c())}async function Tt(){await Promise.all(e.playlists.map(t=>v(p,t.toJSON())))}async function It(t){var i;const a=e.tracks.find(s=>s.id===t);a&&(await H(w,a.id),e.favorites.delete(a.id),N(L,[...e.favorites]),e.playlists.forEach(s=>{s.removeTrack(a.id)}),await Tt(),e.tracks=e.tracks.filter(s=>s.id!==a.id),e.queue=e.queue.filter(s=>s!==a.id),e.currentTrackId===a.id?(o.pause(),o.removeAttribute("src"),o.load(),e.isPlaying=!1,e.currentTime=0,e.duration=0,e.currentTrackId=((i=e.tracks[0])==null?void 0:i.id)??null,e.queue=e.tracks.map(s=>s.id),e.queueIndex=e.currentTrackId?0:-1):e.queueIndex=e.queue.indexOf(e.currentTrackId),c(),f("Track deleted",a.title))}function st(t){return new Promise((a,i)=>{if(!t){a("");return}const s=new FileReader;s.onload=()=>a(s.result),s.onerror=()=>i(s.error),s.readAsDataURL(t)})}function Pt(t){return new Promise(a=>{const i=URL.createObjectURL(t),s=new Audio(i);s.preload="metadata",s.onloadedmetadata=()=>{URL.revokeObjectURL(i),a(Math.round(s.duration||0))},s.onerror=()=>{URL.revokeObjectURL(i),a(0)}})}function St(t){return t?t.type&&t.type.startsWith("audio/")?!0:/\.(aac|aif|aiff|alac|amr|flac|m4a|m4b|mid|midi|mp3|oga|ogg|opus|wav|weba|wma)$/i.test(t.name):!1}async function qt(t){const a=t.elements.audio.files[0],i=t.elements.cover.files[0];if(!St(a)){f("Файл не загружен","Выберите аудиофайл, который поддерживает ваш браузер.");return}const s=await Pt(a),n=new A({id:_("up"),title:t.elements.title.value.trim(),artist:t.elements.artist.value.trim(),album:t.elements.album.value.trim()||"Single",genre:t.elements.genre.value,duration:s,blob:a,fileName:a.name,coverUrl:await st(i),colorA:"#1ed760",colorB:"#6d8cff",createdAt:Date.now()});await v(w,n.toJSON()),e.tracks.push(n),t.reset(),P("library"),f("Трек загружен",`${n.title} теперь в библиотеке.`)}function xt(t){const a=t.artworkUrl100?t.artworkUrl100.replace("100x100bb","300x300bb"):"";return new A({id:`itunes-${t.trackId}`,title:t.trackName,artist:t.artistName,album:t.collectionName||"Single",genre:t.primaryGenreName||"iTunes",duration:Math.round((t.trackTimeMillis||0)/1e3),previewUrl:t.previewUrl||"",coverUrl:a,colorA:"#e7e0d0",colorB:"#6d8cff",source:"itunes",createdAt:Date.now()})}async function Lt(t){const a=t.trim();if(e.itunes.query=a,e.itunes.error="",!a){e.itunes.results=[],c();return}e.itunes.isLoading=!0,c();try{const i=new URLSearchParams({term:a,media:"music",entity:"song",limit:"24"}),s=await fetch(`https://itunes.apple.com/search?${i.toString()}`);if(!s.ok)throw new Error("iTunes request failed");const n=await s.json();e.itunes.results=(n.results||[]).filter(r=>r.trackId&&r.previewUrl).map(xt)}catch(i){e.itunes.results=[],e.itunes.error=i.message||"Could not load iTunes results."}finally{e.itunes.isLoading=!1,c()}}async function At(t){const a=e.itunes.results.find(s=>s.id===t);if(!a)return;if(e.tracks.some(s=>s.id===a.id)){f("Already in library",a.title);return}const i=new A({...a.toJSON(),createdAt:Date.now()});await v(w,i.toJSON()),e.tracks.push(i),f("Added from iTunes",`${i.title} is now in your library.`),c()}function Ut(){return`
        <header class="topbar">
            <div class="search-wrap">
                <span class="icon">⌕</span>
                <input class="search-input" data-action="search" type="search" value="${l(e.query)}" placeholder="Поиск по названию, исполнителю или альбому">
            </div>
        </header>
    `}function Ot(){const t=["all",...new Set(e.tracks.map(i=>i.genre).filter(Boolean))],a=["all",...new Set(e.tracks.map(i=>i.album).filter(Boolean))];return`
        <section class="library-controls" aria-label="Фильтры библиотеки">
            <div class="filters">
                <select class="select-input" data-action="genre">
                    ${t.map(i=>`<option value="${l(i)}" ${i===e.genre?"selected":""}>${i==="all"?"Все жанры":l(i)}</option>`).join("")}
                </select>
                <select class="select-input" data-action="album">
                    ${a.map(i=>`<option value="${l(i)}" ${i===e.album?"selected":""}>${i==="all"?"Все альбомы":l(i)}</option>`).join("")}
                </select>
            </div>
        </section>
    `}function Nt(){const t=e.tracks.filter(i=>e.favorites.has(i.id));return`
        <aside class="sidebar">
            <div class="brand"><span class="brand-mark"><img src="${ct}" alt=""></span><span>Re:Spot</span></div>
            <nav class="nav-group">
                ${[["home","⌂","Главная"],["library","♬","Моя библиотека"],["favorites","♡","Избранное"],["upload","⇧","Загрузка"],["itunes","iT","iTunes"],["playlists","▤","Плейлисты"]].map(([i,s,n])=>`
                    <button class="nav-button ${e.view===i||i==="playlists"&&e.view==="playlist"?"active":""}" data-view="${i}" type="button">
                        <span class="icon">${s}</span>${n}
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
                    ${e.playlists.map(i=>`
                        <button class="${e.selectedPlaylistId===i.id?"active":""}" data-playlist-open="${i.id}" type="button">
                            ${at(i,"icon playlist-cover-mini")}
                            <span>${l(i.name)}</span>
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
    `}function Et(t){return`
        <article class="music-card">
            <div class="cover-wrap">
                ${E(t)}
                <button class="floating-play ${t.id===e.currentTrackId&&e.isPlaying?"active":""}" data-play-track="${t.id}" type="button" title="${t.id===e.currentTrackId&&e.isPlaying?"Pause":"Play"}">${t.id===e.currentTrackId&&e.isPlaying?"&#9208;":"&#9654;"}</button>
            </div>
            <h3 title="${l(t.title)}">${l(t.title)}</h3>
            <p>${l(t.artist)} · ${l(t.album)}</p>
        </article>
    `}function q(t,a={}){return t.length?`
        <div class="track-table">
            ${t.map((i,s)=>`
                <div class="track-row ${i.id===e.currentTrackId?"active":""}" data-track-id="${i.id}" data-track-index="${s+1}">
                    <div class="track-index">${s+1}</div>
                    <div class="track-main">
                        ${E(i,"cover-sm")}
                        <div>
                            <span class="track-title">${l(i.title)}</span>
                            <span class="track-artist">${l(i.artist)}</span>
                        </div>
                    </div>
                    <div class="track-meta album-cell">${l(i.album)}</div>
                    <div class="track-meta genre-cell">${l(i.genre)}</div>
                    <div class="track-duration">${I(i.duration)}</div>
                    <div class="row-actions">
                        <button class="row-action ${i.id===e.currentTrackId&&e.isPlaying?"active":""}" data-play-track="${i.id}" type="button" title="${i.id===e.currentTrackId&&e.isPlaying?"Pause":"Play"}">${i.id===e.currentTrackId&&e.isPlaying?"&#9208;":"&#9654;"}</button>
                        <button class="row-action ${e.favorites.has(i.id)?"active":""}" data-favorite="${i.id}" type="button" title="В избранное">${e.favorites.has(i.id)?"♥":"♡"}</button>
                        <button class="row-action" data-menu-track="${i.id}" type="button" title="Добавить в плейлист">＋</button>
                        ${a.playlistId?`<button class="row-action" data-remove-track="${i.id}" data-playlist-id="${a.playlistId}" type="button" title="Удалить из плейлиста">×</button>`:""}
                        <button class="row-action danger-action" data-delete-track="${i.id}" type="button" title="Delete track">×</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `:'<div class="empty-state"><h2>Ничего не найдено</h2><p class="subtle">Измените поиск, фильтр или загрузите собственный трек.</p></div>'}function Mt(){return`
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
    `}function Rt(){const t=e.playlists.find(s=>s.id===e.selectedPlaylistId)??e.playlists[0];if(!t)return'<h2>Плейлистов пока нет</h2><p class="subtle">Создайте плейлист в левой панели.</p>';e.selectedPlaylistId=t.id;const a=new Set(t.trackIds),i=k(e.tracks.filter(s=>a.has(s.id)));return`
        <div class="playlist-detail">
            <div class="playlist-head">
                <label class="playlist-cover-picker" title="Change playlist cover">
                    ${at(t)}
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
                <button class="pill-button" data-play-collection="${t.id}" type="button" ${i.length?"":"disabled"}>Слушать плейлист</button>
                <button class="danger-button" data-delete-playlist="${t.id}" type="button">Удалить плейлист</button>
            </div>
        </div>
        <div class="playlist-tracks">
            ${q(i,{playlistId:t.id})}
        </div>
    `}function X(){return`
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
            <section class="playlist-panel">${Rt()}</section>
        </div>
    `}function Dt(){return`
        <section class="section">
            <div class="section-title-row"><h2>Recommendations</h2><button class="ghost-button" data-view="library" type="button">Open library</button></div>
            <div class="card-grid">${e.tracks.slice(0,5).map(Et).join("")}</div>
        </section>
        <section class="section">
            <h2>Quick picks</h2>
            ${q(k(e.tracks).slice(0,8))}
        </section>
    `}function Ct(){const t=e.itunes.results;return`
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
                            ${E(a)}
                            <button class="floating-play" data-play-track="${a.id}" type="button" title="Play preview">▶</button>
                        </div>
                        <h3 title="${l(a.title)}">${l(a.title)}</h3>
                        <p>${l(a.artist)} · ${l(a.album)}</p>
                        <button class="ghost-button itunes-add-button" data-add-itunes-track="${a.id}" type="button">Добавить в библиотеку</button>
                    </article>
                `).join("")}
            </div>
        `:""}
    `}function jt(){const t=F();return e.view==="itunes"?Ct():e.view==="upload"?`<div class="view-header"><div><p class="eyebrow">Upload Music</p><h1>Загрузка музыки</h1><p class="subtle">Файл сохраняется локально и доступен после перезагрузки страницы.</p></div></div>${Mt()}`:e.view==="favorites"?`<div class="view-header"><div><p class="eyebrow">Избранное</p><h1>Любимые треки</h1><p class="subtle">${t.length} треков</p></div></div>${q(t)}`:e.view==="playlist"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${X()}`:e.view==="playlists"?`<div class="view-header"><div><p class="eyebrow">Playlist</p><h1>Плейлисты</h1></div></div>${X()}`:e.view==="library"?`<div class="view-header"><div><p class="eyebrow">TrackList</p><h1>Моя библиотека</h1><p class="subtle">${t.length} треков найдено</p></div><button class="pill-button" data-view="upload" type="button">Загрузить</button></div>${Ot()}${q(t)}`:Dt()}function nt(){const t=S();return`
        <footer class="player">
            <div class="now-playing">
                ${t?E(t,"cover-sm"):""}
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
                    <span>${I(e.currentTime)}</span>
                    <input class="range" data-action="seek" type="range" min="0" max="${Math.max(1,e.duration||(t==null?void 0:t.duration)||1)}" step="0.1" value="${e.currentTime}">
                    <span>${I(e.duration||(t==null?void 0:t.duration))}</span>
                </div>
            </div>
            <div class="volume-row">
                <span class="icon">♬</span>
                <input class="range" data-action="volume" type="range" min="0" max="1" step="0.01" value="${e.volume}">
            </div>
        </footer>
    `}function Bt(){return e.menu?`
        <div class="menu" style="left:${e.menu.x}px; top:${e.menu.y}px;">
            ${e.playlists.map(t=>`<button data-add-track="${e.menu.trackId}" data-playlist-id="${t.id}" type="button">${l(t.name)}</button>`).join("")||'<button type="button" disabled>Сначала создайте плейлист</button>'}
        </div>
    `:""}function Jt(){return`
        <div class="app-layout">
            ${Nt()}
            <main class="main">
                ${Ut()}
                ${jt()}
            </main>
        </div>
        ${nt()}
        ${Bt()}
        <div class="toast-stack" aria-live="polite"></div>
    `}function c(){tt.innerHTML=Jt()}function g(){const t=document.querySelector(".player");t&&(t.outerHTML=nt())}function x(){document.querySelectorAll("[data-track-id]").forEach(t=>{const a=t.dataset.trackId===e.currentTrackId,i=a&&e.isPlaying;t.classList.toggle("active",a);const s=t.querySelector(".track-index");s&&(s.textContent=t.dataset.trackIndex);const n=t.querySelector("[data-play-track]");n&&(n.classList.toggle("active",i),n.title=i?"Pause":"Play",n.innerHTML=i?"&#9208;":"&#9654;")}),document.querySelectorAll(".floating-play[data-play-track]").forEach(t=>{const a=t.dataset.playTrack===e.currentTrackId&&e.isPlaying;t.classList.toggle("active",a),t.title=a?"Pause":"Play",t.innerHTML=a?"&#9208;":"&#9654;"})}function T(){const t=document.querySelector(".player");if(!t)return;const a=S(),i=t.querySelector('[data-action="seek"]'),s=t.querySelector('[data-action="volume"]'),n=t.querySelectorAll(".progress-row span");i&&(i.max=Math.max(1,e.duration||(a==null?void 0:a.duration)||1),h!=="seek"&&(i.value=e.currentTime)),s&&h!=="volume"&&(s.value=e.volume),n[0]&&(n[0].textContent=I(e.currentTime)),n[1]&&(n[1].textContent=I(e.duration||(a==null?void 0:a.duration)))}function _t(){T(),x()}function B(t,a=null){c();const i=document.querySelector(`[data-action="${t}"]`);i&&(i.focus(),t==="search"&&a!==null&&i.setSelectionRange(a,a))}function Ht(){o=new Audio,o.volume=e.volume,o.addEventListener("timeupdate",()=>{var t;e.currentTime=o.currentTime,e.duration=o.duration||((t=S())==null?void 0:t.duration)||0,T()}),o.addEventListener("loadedmetadata",()=>{var t;e.duration=o.duration||((t=S())==null?void 0:t.duration)||0,g()}),o.addEventListener("play",()=>{e.isPlaying=!0,g(),x()}),o.addEventListener("pause",()=>{e.isPlaying=!1,g(),x()}),o.addEventListener("ended",it)}function d(t,a){return t.closest(a)}function Ft(){document.addEventListener("click",async t=>{const a=t.target,i=d(a,"[data-view]"),s=d(a,"[data-play-track]"),n=d(a,"[data-favorite]"),r=d(a,"[data-menu-track]"),y=d(a,"[data-playlist-open]"),M=d(a,"[data-add-track]"),V=d(a,"[data-add-itunes-track]"),R=d(a,"[data-remove-track]"),G=d(a,"[data-delete-track]"),Y=d(a,"[data-delete-playlist]"),z=d(a,"[data-play-collection]"),u=d(a,"[data-action]");if(!d(a,".menu")&&!r&&e.menu){e.menu=null,c();return}if(i){P(i.dataset.view);return}if(s){if(s.dataset.playTrack===e.currentTrackId&&o.src){await W();return}const m=e.view==="itunes"?e.itunes.results.map($=>$.id):F().map($=>$.id);await b(s.dataset.playTrack,m);return}if(n){yt(n.dataset.favorite);return}if(r){const m=r.getBoundingClientRect();e.menu={trackId:r.dataset.menuTrack,x:Math.min(m.left,window.innerWidth-240),y:Math.min(m.bottom+6,window.innerHeight-220)},c();return}if(y){P("playlist",y.dataset.playlistOpen);return}if(M){await wt(M.dataset.addTrack,M.dataset.playlistId);return}if(V){await At(V.dataset.addItunesTrack);return}if(R){await kt(R.dataset.removeTrack,R.dataset.playlistId);return}if(G){await It(G.dataset.deleteTrack);return}if(Y){await $t(Y.dataset.deletePlaylist);return}if(z){const m=e.playlists.find(rt=>rt.id===z.dataset.playCollection),$=m==null?void 0:m.trackIds[0];$&&await b($,m.trackIds);return}if((u==null?void 0:u.dataset.action)==="toggle-play"){await W();return}if((u==null?void 0:u.dataset.action)==="prev"){vt();return}if((u==null?void 0:u.dataset.action)==="next"){it();return}if((u==null?void 0:u.dataset.action)==="shuffle"){e.shuffle=!e.shuffle,j(),g();return}(u==null?void 0:u.dataset.action)==="repeat"&&(e.repeat=e.repeat==="one"?"off":"one",j(),g())}),document.addEventListener("pointerdown",t=>{t.target.matches('input[type="range"][data-action]')&&(h=t.target.dataset.action)}),document.addEventListener("pointerup",()=>{h=null,T()}),document.addEventListener("input",t=>{var i;const a=t.target.dataset.action;if(a==="search"){const s=t.target.selectionStart;e.query=t.target.value,B("search",s)}if(a==="genre"&&(e.genre=t.target.value,B("genre")),a==="album"&&(e.album=t.target.value,B("album")),a==="seek"&&(h="seek",o.currentTime=Number(t.target.value),e.currentTime=o.currentTime,T()),a==="volume"&&(h="volume",e.volume=Number(t.target.value),o.volume=e.volume,j()),t.target.dataset.playlistCoverInput){gt(t.target.dataset.playlistCoverInput,t.target.files[0]);return}if(t.target.type==="file"){const s=document.querySelector(`[data-file-label="${t.target.name}"]`);s&&(s.textContent=((i=t.target.files[0])==null?void 0:i.name)??s.textContent)}}),document.addEventListener("change",t=>{t.target.matches('input[type="range"][data-action]')&&(h=null,T())}),document.addEventListener("submit",async t=>{const a=t.target;if(a.dataset.action==="create-playlist"){t.preventDefault(),await bt(a.elements.name.value);return}if(a.dataset.action==="rename-playlist"){t.preventDefault(),await ht(a.dataset.playlistId,a.elements.name.value);return}if(a.dataset.action==="upload-track"){t.preventDefault(),a.reportValidity()&&await qt(a);return}a.dataset.action==="itunes-search"&&(t.preventDefault(),a.reportValidity()&&await Lt(a.elements.query.value))})}async function Vt(){Ht();try{await ft(),c(),Ft()}catch(t){tt.innerHTML=`<main class="main"><div class="empty-state"><h1>Не удалось запустить Re:Spot</h1><p class="subtle">${l(t.message)}</p></div></main>`}}Vt();

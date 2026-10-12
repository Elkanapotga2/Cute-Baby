/* =========================================================
   CUTE BABY LIFE — onglet « Rencontres » (18+)
   À charger APRÈS adults.js. Il s'ajoute tout seul à la
   navigation : aucune modification du HTML n'est nécessaire.

   ⚠️ VERSION PROTOTYPE (100 % côté navigateur) :
   - les profils proposés sont des profils FICTIFS de démonstration ;
   - le code secret protège l'onglet sur CET appareil (pas un vrai
     système de comptes) ;
   - pour de vraies rencontres entre vrais membres, il faudra un
     serveur (comptes, base de données, modération des photos,
     signalements, vérification d'âge).
   ========================================================= */
(function () {
    const app = document.getElementById('adultApp');
    if (!app) return;
    const nav = app.querySelector('#adNav'), main = app.querySelector('.ad-main');
    if (!nav || !main) return;
    const $ = (s, r = app) => r.querySelector(s);
    const $$ = (s, r = app) => [...r.querySelectorAll(s)];
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const rnd = n => Math.floor(Math.random() * n);

    /* ---------- Données de l'utilisateur (sur cet appareil) ---------- */
    const KEY = 'cutebaby_love_v1';
    const fresh = () => ({ pin: null, me: null, likes: [], passes: [], blocked: [], matches: [], chats: {}, filters: { min: 18, max: 60, city: '', intent: '' } });
    function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); return r ? Object.assign(fresh(), r, { filters: Object.assign(fresh().filters, r.filters) }) : fresh(); } catch (e) { return fresh(); } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Stockage plein : retirez votre photo ou libérez de l\'espace'); } }
    let S = load();

    const INTENTS = ['Relation sérieuse', 'Mariage', 'Construire une famille', 'Faire connaissance'];
    const TAGS = ['Voyage', 'Cuisine', 'Sport', 'Musique', 'Lecture', 'Foi', 'Cinéma', 'Entrepreneuriat', 'Nature', 'Danse', 'Famille', 'Technologie'];
    const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Kribi', 'Bamenda', 'Limbé', 'Ebolowa'];

    /* ---------- Avatars illustrés (remplacez-les par de vraies photos) ---------- */
    const SKINS = ['#8D5524', '#6F4222', '#A8693A', '#5C3A21', '#C68642', '#E0AC69'];
    const HAIRS = ['#14100E', '#1d1410', '#2b1b12', '#3a2416'];
    function avatar(p) {
        const skin = p.skin, hair = p.hair, f = p.g === 'f', st = p.style, shirt = p.shirt;
        const back = f && st === 'long' ? `<path d="M108 200 C88 330 104 410 128 440 L272 440 C296 410 312 330 292 200 Z" fill="${hair}"/>` : st === 'afro' ? `<ellipse cx="200" cy="190" rx="${f ? 108 : 98}" ry="${f ? 100 : 88}" fill="${hair}"/>` : '';
        const top = st === 'afro' ? '' : f ? (st === 'bun' ? `<circle cx="200" cy="104" r="34" fill="${hair}"/><path d="M128 220 C120 140 165 112 202 112 C245 112 282 140 274 220 C250 176 190 168 128 220Z" fill="${hair}"/>` : `<path d="M124 224 C112 128 168 98 205 100 C252 102 290 140 276 224 C252 172 188 160 124 224Z" fill="${hair}"/>`) : `<path d="M130 214 C124 142 166 114 202 114 C246 114 280 142 272 214 C262 178 150 172 130 214Z" fill="${hair}"/>`;
        const beard = p.beard ? `<path d="M134 250 C138 318 170 332 200 332 C230 332 262 318 266 250 C250 290 150 290 134 250Z" fill="${hair}" opacity=".92"/>` : '';
        const ear = f ? `<circle cx="127" cy="268" r="5" fill="#E8C26A"/><circle cx="273" cy="268" r="5" fill="#E8C26A"/>` : '';
        return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration de profil">
            <defs><linearGradient id="g${p.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient></defs>
            <rect width="400" height="500" fill="url(#g${p.id})"/><circle cx="70" cy="90" r="110" fill="#fff" opacity=".1"/><circle cx="350" cy="420" r="150" fill="#000" opacity=".12"/>
            <path d="M30 500 C30 405 105 372 200 372 C295 372 370 405 370 500Z" fill="${shirt}"/><path d="M165 372 Q200 410 235 372Z" fill="${skin}"/>
            ${back}<rect x="172" y="300" width="56" height="84" rx="22" fill="${skin}"/><rect x="172" y="300" width="56" height="84" rx="22" fill="#000" opacity=".1"/>
            <ellipse cx="128" cy="250" rx="11" ry="18" fill="${skin}"/><ellipse cx="272" cy="250" rx="11" ry="18" fill="${skin}"/>
            <ellipse cx="200" cy="238" rx="72" ry="90" fill="${skin}"/>${top}${beard}${ear}
            <ellipse cx="172" cy="240" rx="6" ry="8" fill="#2b1b17"/><ellipse cx="228" cy="240" rx="6" ry="8" fill="#2b1b17"/>
            <path d="M156 222 Q172 212 188 222M212 222 Q228 212 244 222" stroke="${hair}" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M198 252 Q194 272 200 276 Q208 276 204 252" stroke="#000" stroke-opacity=".18" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M178 290 Q200 312 222 290" stroke="${f ? '#B23A5A' : '#6e2a2a'}" stroke-width="${f ? 7 : 5}" fill="none" stroke-linecap="round"/></svg>`;
    }
    const pic = p => p.photo ? `<img src="${esc(p.photo)}" alt="Photo de ${esc(p.name)}">` : avatar(p);

    /* ---------- Profils de DÉMONSTRATION (fictifs) ---------- */
    const P = (id, g, name, age, city, job, intent, tags, bio, likes, skin, hair, style, shirt, bg, beard) => ({ id, g, name, age, city, job, intent, tags, bio, likes, skin: SKINS[skin], hair: HAIRS[hair], style, shirt, bg, beard, seed: id.charCodeAt(1) });
    const PROFILES = [
        P('f1', 'f', 'Aïcha', 27, 'Douala', 'Infirmière', 'Relation sérieuse', ['Voyage', 'Nature', 'Famille'], 'Douce, rieuse et passionnée par mon métier. J\'aime les balades au bord de l\'eau et les longues discussions.', true, 1, 0, 'long', '#C9A24B', ['#7B2D5B', '#2A1240']),
        P('f2', 'f', 'Nadège', 31, 'Yaoundé', 'Ingénieure', 'Mariage', ['Cuisine', 'Voyage', 'Technologie'], 'Je crois aux valeurs simples : respect, humour et loyauté. Fan de cuisine du monde et de road trips.', false, 0, 1, 'afro', '#2E7D8C', ['#1E5F74', '#0F2C48']),
        P('f3', 'f', 'Carine', 25, 'Bafoussam', 'Designer', 'Faire connaissance', ['Musique', 'Danse', 'Cinéma'], 'Créative et curieuse. Je cherche quelqu\'un avec qui rire, danser et construire pas à pas.', true, 2, 2, 'bun', '#B23A5A', ['#E0876A', '#8E2A5B']),
        P('f4', 'f', 'Estelle', 29, 'Kribi', 'Enseignante', 'Construire une famille', ['Lecture', 'Famille', 'Foi'], 'Les valeurs et la famille comptent beaucoup pour moi. J\'aime la lecture et les dimanches en famille.', true, 3, 0, 'long', '#3E7C59', ['#2F6F5E', '#14352E']),
        P('f5', 'f', 'Mireille', 34, 'Yaoundé', 'Entrepreneuse', 'Relation sérieuse', ['Entrepreneuriat', 'Voyage', 'Sport'], 'Autonome, ambitieuse, mais surtout sincère. Je veux un partenaire de vie, pas un spectateur.', false, 1, 3, 'afro', '#1B2A4A', ['#C9A24B', '#7A4B1E']),
        P('f6', 'f', 'Prisca', 26, 'Douala', 'Comptable', 'Mariage', ['Cuisine', 'Foi', 'Nature'], 'Posée, attentionnée et organisée. J\'adore cuisiner et recevoir les gens que j\'aime.', true, 4, 1, 'long', '#8E2A5B', ['#9B5DE5', '#3A1C71']),
        P('f7', 'f', 'Sandrine', 30, 'Garoua', 'Pharmacienne', 'Relation sérieuse', ['Lecture', 'Voyage', 'Cinéma'], 'Calme en apparence, joyeuse dès qu\'on me connaît. Cinéma, bons livres et voyages au programme.', false, 2, 0, 'bun', '#E3A58C', ['#1F6F8B', '#0B2545']),
        P('f8', 'f', 'Ornella', 28, 'Limbé', 'Avocate', 'Faire connaissance', ['Sport', 'Musique', 'Famille'], 'Franche et pleine d\'énergie. Je cours le matin, je chante sous la douche et je cherche la complicité.', true, 3, 2, 'afro', '#5B2A86', ['#F4845F', '#B5179E']),
        P('m1', 'm', 'Brice', 30, 'Douala', 'Ingénieur', 'Relation sérieuse', ['Technologie', 'Sport', 'Voyage'], 'Calme, curieux et travailleur. J\'aime le foot, les bons restos et les week-ends à la plage.', true, 0, 0, 'short', '#1B2A4A', ['#2A5D9F', '#0B1B3A'], true),
        P('m2', 'm', 'Yannick', 33, 'Yaoundé', 'Médecin', 'Mariage', ['Famille', 'Foi', 'Lecture'], 'Attaché à la famille et aux valeurs. Je cherche une femme avec qui bâtir un foyer solide.', true, 1, 1, 'fade', '#3E7C59', ['#2E8B6F', '#123A33']),
        P('m3', 'm', 'Landry', 28, 'Bafoussam', 'Développeur', 'Faire connaissance', ['Technologie', 'Musique', 'Cinéma'], 'Geek assumé, fan de musique et de bonne humeur. On commence par un café ?', false, 2, 2, 'afro', '#6E3FA3', ['#8E5BFF', '#2A1260']),
        P('m4', 'm', 'Cédric', 35, 'Douala', 'Entrepreneur', 'Relation sérieuse', ['Entrepreneuriat', 'Voyage', 'Sport'], 'Entrepreneur dans l\'âme, mais je sais faire de la place pour l\'essentiel : une belle histoire à deux.', true, 3, 0, 'short', '#8A6A1F', ['#C9A24B', '#5E3A12'], true),
        P('m5', 'm', 'Hervé', 31, 'Ebolowa', 'Enseignant', 'Construire une famille', ['Lecture', 'Nature', 'Famille'], 'Simple, patient et à l\'écoute. J\'aime la nature, les histoires et les repas partagés.', false, 4, 1, 'fade', '#2E7D8C', ['#3FA7A0', '#0F3B3F']),
        P('m6', 'm', 'Franck', 29, 'Yaoundé', 'Architecte', 'Faire connaissance', ['Voyage', 'Cuisine', 'Danse'], 'J\'aime dessiner des maisons… et rêver à celle que je partagerai un jour. Bonne cuisine = bon début.', true, 2, 3, 'short', '#B23A5A', ['#FF8B6A', '#8E2A5B'], false),
        P('m7', 'm', 'Serge', 37, 'Garoua', 'Comptable', 'Mariage', ['Foi', 'Famille', 'Lecture'], 'Sérieux, fiable et sincère. Je cherche une relation durable, bâtie sur la confiance.', true, 5, 0, 'fade', '#1B2A4A', ['#4A5D8F', '#1B2440'], true),
        P('m8', 'm', 'Boris', 27, 'Kribi', 'Chef cuisinier', 'Relation sérieuse', ['Cuisine', 'Musique', 'Nature'], 'Je cuisine avec le cœur. Si vous aimez les bonnes tables et les soirées musique, on s\'entendra.', false, 3, 2, 'afro', '#C9A24B', ['#F2994A', '#7B2D26'])
    ];
    const byId = id => PROFILES.find(p => p.id === id);
    const opp = () => S.me.g === 'm' ? 'f' : 'm';
    function compat(p) { const me = S.me; let s = 40 + p.tags.filter(t => me.tags.includes(t)).length * 10; if (p.intent === me.intent) s += 20; if (p.city === me.city) s += 10; return Math.min(98, s + p.seed % 7); }
    function queue() {
        const f = S.filters;
        return PROFILES.filter(p => p.g === opp() && !S.likes.includes(p.id) && !S.passes.includes(p.id) && !S.blocked.includes(p.id) && p.age >= f.min && p.age <= f.max && (!f.city || p.city === f.city) && (!f.intent || p.intent === f.intent)).sort((a, b) => compat(b) - compat(a));
    }
    const myAvatar = () => pic({ id: 'me', g: S.me.g, name: S.me.name, photo: S.me.photo, skin: SKINS[0], hair: HAIRS[0], style: S.me.g === 'f' ? 'long' : 'short', shirt: '#C9A24B', bg: ['#7B2D5B', '#2A1240'], beard: false });
    function toast(m) { const b = $('#adToasts'); if (!b) return; const t = document.createElement('div'); t.className = 'ad-toast'; t.textContent = m; b.appendChild(t); setTimeout(() => t.classList.add('out'), 2400); setTimeout(() => t.remove(), 2800); }

    /* ---------- Injection dans la navigation et l'accueil ---------- */
    const btn = document.createElement('button');
    btn.dataset.ad = 'love'; btn.innerHTML = '<i>♥</i><span>Rencontres</span>';
    nav.insertBefore(btn, nav.querySelector('[data-ad="media"]'));
    const sec = document.createElement('section');
    sec.className = 'ad-page lv'; sec.id = 'ad-love'; sec.innerHTML = '<div class="lv-wrap" id="lvBody"></div>';
    main.insertBefore(sec, main.querySelector('.ad-foot'));
    const body = $('#lvBody');
    const rows = $('.ad-rows');
    if (rows) {
        const row = document.createElement('button');
        row.className = 'ad-row'; row.innerHTML = '<b>07</b><h3>Rencontres</h3><p>Un espace protégé par code secret pour rencontrer des célibataires et construire un couple.</p><i>→</i>';
        rows.insertBefore(row, rows.querySelector('[data-ad="media"]'));
        row.addEventListener('click', () => btn.click());
        const h = rows.previousElementSibling && rows.previousElementSibling.querySelector('h2'); if (h) h.textContent = 'Sept outils, un seul objectif';
    }
    btn.addEventListener('click', () => {
        $$('.ad-page').forEach(p => p.classList.toggle('active', p.id === 'ad-love'));
        $$('#adNav button').forEach(b => b.classList.toggle('on', b === btn));
        window.scrollTo({ top: 0 }); render();
    });
    nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b !== btn) lock(); });   // on reverrouille en quittant l'onglet
    document.addEventListener('visibilitychange', () => { if (document.hidden) lock(); });
    new MutationObserver(() => { if (document.body.dataset.zone !== 'adults') lock(); }).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

    /* ---------- Verrou : code secret ---------- */
    let unlocked = false, tab = 'discover', chatId = null, pinBuf = '', pinStage = 'a', pinFirst = '', agree = false, fails = 0, lockedUntil = 0, draft = null, editing = false;
    function lock() { unlocked = false; pinBuf = ''; pinStage = 'a'; pinFirst = ''; chatId = null; editing = false; if ($('#ad-love') && $('#ad-love').classList.contains('active')) render(); }
    async function hash(pin, salt) {
        if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pin)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
        let h = 5381; for (const c of salt + pin) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'f' + h;
    }
    function renderGate() {
        const creating = !S.pin, wait = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
        const title = creating ? (pinStage === 'a' ? 'Créez votre code secret' : 'Confirmez votre code') : 'Entrez votre code secret';
        body.innerHTML = `<div class="lv-gate"><div class="lv-emblem"><span>♥</span></div><h2>Rencontres</h2>
            <p class="lv-lead">${creating ? 'Un espace privé, protégé par un code à 4 chiffres que vous seul(e) connaissez.' : 'Cet espace est protégé. Saisissez votre code pour continuer.'}</p>
            ${creating && pinStage === 'a' ? `<label class="lv-check"><input type="checkbox" id="lvAgree" ${agree ? 'checked' : ''}> Je confirme avoir <b>18 ans ou plus</b> et accepter les règles de respect de cette section.</label>` : ''}
            <div class="lv-pt">${title}</div><div class="lv-dots">${[0, 1, 2, 3].map(i => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>
            <div class="lv-msg" id="lvMsg">${wait ? `Trop d'essais. Réessayez dans ${wait} s.` : ''}</div>
            <div class="lv-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="x" class="alt" aria-label="Effacer">⌫</button><button data-k="0">0</button><button class="alt" disabled></button></div>
            ${creating ? '' : '<button class="lv-link" id="lvForgot">Code oublié ?</button>'}</div>`;
        const chk = $('#lvAgree'); if (chk) chk.onchange = () => { agree = chk.checked; };
        $$('.lv-keys [data-k]').forEach(b => b.onclick = () => key(b.dataset.k));
        const fg = $('#lvForgot'); if (fg) fg.onclick = () => { if (confirm('Réinitialiser le code supprimera votre profil, vos matchs et vos messages enregistrés sur cet appareil. Continuer ?')) { S = fresh(); save(); pinBuf = ''; toast('Données supprimées : créez un nouveau code'); render(); } };
    }
    async function key(k) {
        if (Date.now() < lockedUntil) return;
        if (k === 'x') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += k;
        renderGate();
        if (pinBuf.length < 4) return;
        const msg = t => { const m = $('#lvMsg'); if (m) m.textContent = t; };
        if (!S.pin) {
            if (pinStage === 'a') { if (!agree) { pinBuf = ''; renderGate(); return msg('Cochez la confirmation d\'âge pour continuer.'); } pinFirst = pinBuf; pinBuf = ''; pinStage = 'b'; return renderGate(); }
            if (pinBuf !== pinFirst) { pinBuf = ''; pinStage = 'a'; pinFirst = ''; renderGate(); return msg('Les deux codes sont différents. Recommencez.'); }
            const salt = Math.random().toString(36).slice(2); S.pin = { salt, h: await hash(pinBuf, salt) }; save(); unlocked = true; pinBuf = ''; pinStage = 'a'; return render();
        }
        if (await hash(pinBuf, S.pin.salt) === S.pin.h) { unlocked = true; fails = 0; pinBuf = ''; return render(); }
        fails++; pinBuf = '';
        if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; renderGate(); return void setTimeout(() => lockedUntil && renderGate(), 30500); }
        renderGate(); msg(`Code incorrect (${fails}/5).`);
    }

    /* ---------- Profil (création / modification) ---------- */
    function renderSetup() {
        const d = draft = draft || Object.assign({ g: '', name: '', age: '', city: '', job: '', intent: INTENTS[0], bio: '', tags: [], photo: '' }, S.me || {});
        d.tags = [...d.tags];
        body.innerHTML = `<div class="lv-setup"><div class="lv-head"><h2>${S.me ? 'Modifier mon profil' : 'Créons votre profil'}</h2><p class="lv-lead">${S.me ? '' : 'Quelques informations pour vous proposer des célibataires qui vous ressemblent.'}</p></div>
            <div class="lv-scope"><b>À propos de cette section</b> Cette section est réservée à la rencontre entre un homme et une femme célibataires, dans une optique de relation sérieuse. Elle ne propose pas d'autres types de mises en relation.</div>
            <div class="lv-glass"><span class="lv-l">Je suis</span><div class="lv-gender"><button data-g="m" class="${d.g === 'm' ? 'on' : ''}"><i>👨🏿</i>Un homme<small>Je verrai des femmes célibataires</small></button><button data-g="f" class="${d.g === 'f' ? 'on' : ''}"><i>👩🏿</i>Une femme<small>Je verrai des hommes célibataires</small></button></div>
            <div class="lv-photo-up"><div class="lv-ph" id="lvPh">${d.photo ? `<img src="${d.photo}" alt="Votre photo">` : '<span>📷</span>'}</div><div><b>Votre photo</b><small>Facultative, enregistrée uniquement sur cet appareil.</small><br><label class="lv-btn ghost sm" style="display:inline-block;margin-top:8px;cursor:pointer">Choisir une photo<input type="file" id="lvFile" accept="image/*" hidden></label></div></div>
            <div class="lv-two"><label><span class="lv-l">Prénom</span><input class="lv-in" data-f="name" value="${esc(d.name)}" maxlength="24"></label><label><span class="lv-l">Âge</span><input class="lv-in" data-f="age" type="number" min="18" max="99" value="${esc(d.age)}"></label></div>
            <div class="lv-two"><label><span class="lv-l">Ville</span><select class="lv-in" data-f="city"><option value="">Choisir…</option>${CITIES.map(c => `<option ${d.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label><span class="lv-l">Profession</span><input class="lv-in" data-f="job" value="${esc(d.job)}" maxlength="30"></label></div>
            <label><span class="lv-l">Ce que je recherche</span><select class="lv-in" data-f="intent">${INTENTS.map(i => `<option ${d.intent === i ? 'selected' : ''}>${i}</option>`).join('')}</select></label>
            <label><span class="lv-l">À propos de moi</span><textarea class="lv-in" data-f="bio" maxlength="240" rows="3" placeholder="Parlez de vous en quelques phrases, avec sincérité.">${esc(d.bio)}</textarea></label>
            <span class="lv-l">Centres d'intérêt (jusqu'à 6)</span><div class="lv-tags sel">${TAGS.map(t => `<button data-t="${t}" class="${d.tags.includes(t) ? 'on' : ''}">${t}</button>`).join('')}</div>
            <div class="lv-msg" id="lvErr"></div><div class="lv-row"><button class="lv-btn" id="lvSave">${S.me ? 'Enregistrer' : 'Entrer dans l\'espace'}</button>${S.me ? '<button class="lv-btn ghost" id="lvCancel">Annuler</button>' : ''}</div></div></div>`;
        $$('.lv-gender button').forEach(b => b.onclick = () => { d.g = b.dataset.g; $$('.lv-gender button').forEach(x => x.classList.toggle('on', x === b)); });
        $$('[data-f]', body).forEach(i => i.oninput = i.onchange = () => { d[i.dataset.f] = i.value; });
        $$('.lv-tags.sel button').forEach(b => b.onclick = () => { const t = b.dataset.t; if (d.tags.includes(t)) d.tags = d.tags.filter(x => x !== t); else if (d.tags.length < 6) d.tags.push(t); else return toast('6 centres d\'intérêt maximum'); b.classList.toggle('on'); });
        $('#lvFile').onchange = e => {
            const f = e.target.files[0]; if (!f) return; const r = new FileReader();
            r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); d.photo = c.toDataURL('image/jpeg', .8); $('#lvPh').innerHTML = `<img src="${d.photo}" alt="Votre photo">`; }; im.src = r.result; };
            r.readAsDataURL(f);
        };
        $('#lvSave').onclick = () => {
            const err = t => { $('#lvErr').textContent = t; };
            if (!d.g) return err('Indiquez si vous êtes un homme ou une femme.');
            if (!d.name.trim()) return err('Indiquez votre prénom.');
            if (!(+d.age >= 18)) return err('Cette section est réservée aux personnes de 18 ans et plus.');
            if (!d.city) return err('Choisissez votre ville.');
            S.me = Object.assign({}, d, { name: d.name.trim(), age: +d.age }); save(); draft = null; editing = false; tab = 'discover'; render();
        };
        const c = $('#lvCancel'); if (c) c.onclick = () => { draft = null; editing = false; render(); };
    }

    /* ---------- Application ---------- */
    function renderApp() {
        const unread = S.matches.length;
        body.innerHTML = `<div class="lv-top"><div><span class="lv-kick">Espace protégé</span><h2>Bonjour ${esc(S.me.name)}</h2></div>
            <div class="lv-tabs">${[['discover', '💘 Découvrir'], ['matches', `💬 Matchs${unread ? ` <em>${unread}</em>` : ''}`], ['me', '👤 Mon profil'], ['safe', '🛡️ Sécurité']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}<button id="lvLock" title="Verrouiller">🔒</button></div></div>
            <div class="lv-demo">Mode démonstration : les profils affichés sont des exemples fictifs et les illustrations remplacent de vraies photos.</div><div id="lvView"></div>`;
        $$('.lv-tabs [data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; chatId = null; renderApp(); });
        $('#lvLock').onclick = () => { lock(); toast('Espace verrouillé'); };
        ({ discover: renderDiscover, matches: renderMatches, me: renderMe, safe: renderSafe })[tab]();
    }
    const tagsHTML = (p, mine) => p.tags.map(t => `<span class="${mine && mine.includes(t) ? 'hit' : ''}">${t}</span>`).join('');
    function renderDiscover() {
        const q = queue(), v = $('#lvView'), f = S.filters;
        v.innerHTML = `<div class="lv-grid"><div class="lv-main">${q.length ? `<div class="lv-deck" id="lvDeck">${q.slice(0, 3).reverse().map((p, i, a) => { const top = i === a.length - 1; return `<div class="lv-card ${top ? 'top' : ''}" data-id="${p.id}" style="--d:${a.length - 1 - i}"><div class="lv-photo">${pic(p)}</div><div class="lv-stamp like">J'AIME</div><div class="lv-stamp nope">PASSER</div><div class="lv-compat">${compat(p)} % compatible</div><div class="lv-info"><h3>${esc(p.name)}, ${p.age}</h3><p>📍 ${esc(p.city)} · ${esc(p.job)}</p></div></div>`; }).join('')}</div>
            <div class="lv-actions"><button class="no" id="lvNo" aria-label="Passer">✕</button><button class="yes" id="lvYes" aria-label="J'aime">♥</button></div>
            <div class="lv-detail" id="lvDetail"></div>` : `<div class="lv-end"><div style="font-size:3rem">✨</div><h3>Vous avez vu tous les profils</h3><p>Élargissez vos filtres ou revoyez les profils passés.</p><button class="lv-btn" id="lvReset">Revoir les profils passés</button></div>`}</div>
            <aside class="lv-side"><div class="lv-glass"><h4>Filtres</h4><label><span class="lv-l">Âge : ${f.min} – ${f.max} ans</span><div class="lv-two"><input class="lv-in" type="number" min="18" max="99" value="${f.min}" id="fMin"><input class="lv-in" type="number" min="18" max="99" value="${f.max}" id="fMax"></div></label>
            <label><span class="lv-l">Ville</span><select class="lv-in" id="fCity"><option value="">Toutes</option>${CITIES.map(c => `<option ${f.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <label><span class="lv-l">Intention</span><select class="lv-in" id="fInt"><option value="">Toutes</option>${INTENTS.map(i => `<option ${f.intent === i ? 'selected' : ''}>${i}</option>`).join('')}</select></label></div>
            <div class="lv-scope"><b>À propos de cette section</b> Cute Baby met en relation des hommes et des femmes célibataires qui souhaitent construire un couple. Les autres types de mises en relation ne sont pas proposés ici.</div></aside></div>`;
        const upd = () => { S.filters = { min: +$('#fMin').value || 18, max: +$('#fMax').value || 99, city: $('#fCity').value, intent: $('#fInt').value }; save(); renderDiscover(); };
        ['#fMin', '#fMax', '#fCity', '#fInt'].forEach(s => $(s).onchange = upd);
        const rs = $('#lvReset'); if (rs) rs.onclick = () => { S.passes = []; save(); renderDiscover(); };
        if (!q.length) return;
        const showDetail = p => {
            $('#lvDetail').innerHTML = `<div class="lv-bar"><i style="width:${compat(p)}%"></i></div><p class="lv-bio">« ${esc(p.bio)} »</p><div class="lv-meta"><span>💍 ${esc(p.intent)}</span></div><div class="lv-tags">${tagsHTML(p, S.me.tags)}</div><button class="lv-link" id="lvRep">Signaler ou bloquer ce profil</button>`;
            $('#lvRep').onclick = () => { if (confirm(`Bloquer ${p.name} ? Ce profil ne vous sera plus proposé.`)) { S.blocked.push(p.id); save(); toast('Profil bloqué. Merci de contribuer à un espace respectueux.'); renderDiscover(); } };
        };
        const top = $('.lv-card.top'), p0 = byId(top.dataset.id); showDetail(p0);
        let drag = null;
        const fly = dir => { top.style.transition = 'transform .38s ease, opacity .38s'; top.style.transform = `translate(${dir === 'like' ? 900 : -900}px,40px) rotate(${dir === 'like' ? 30 : -30}deg)`; top.style.opacity = 0; setTimeout(() => decide(dir, p0), 320); };
        top.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; top.setPointerCapture(e.pointerId); top.style.transition = 'none'; };
        top.onpointermove = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; top.style.transform = `translate(${dx}px,${dy * .3}px) rotate(${dx / 18}deg)`; $('.lv-stamp.like', top).style.opacity = Math.max(0, Math.min(1, dx / 110)); $('.lv-stamp.nope', top).style.opacity = Math.max(0, Math.min(1, -dx / 110)); };
        top.onpointerup = e => { if (!drag) return; const dx = e.clientX - drag.x; drag = null; if (Math.abs(dx) > 110) fly(dx > 0 ? 'like' : 'pass'); else { top.style.transition = 'transform .3s'; top.style.transform = ''; $$('.lv-stamp', top).forEach(s => s.style.opacity = 0); } };
        $('#lvYes').onclick = () => fly('like'); $('#lvNo').onclick = () => fly('pass');
    }
    function decide(dir, p) {
        if (dir === 'pass') { S.passes.push(p.id); save(); return renderApp(); }
        S.likes.push(p.id);
        if (p.likes && !S.matches.some(m => m.id === p.id)) { S.matches.push({ id: p.id, t: Date.now() }); S.chats[p.id] = [{ f: 'them', t: `Bonjour ${S.me.name} 😊 Ravi${p.g === 'f' ? 'e' : ''} de ce match !`, d: Date.now() }]; save(); renderApp(); return showMatch(p); }
        save(); toast(`💌 Vous avez aimé le profil de ${p.name}`); renderApp();
    }
    function showMatch(p) {
        const m = document.createElement('div'); m.className = 'lv-modal';
        m.innerHTML = `<div class="lv-hearts">${Array.from({ length: 16 }, () => `<span style="left:${rnd(100)}%;animation-delay:${(Math.random() * 2).toFixed(2)}s;font-size:${14 + rnd(22)}px">♥</span>`).join('')}</div>
            <div class="lv-mbox"><small>C'EST UN MATCH</small><h2>Vous vous plaisez mutuellement</h2><div class="lv-pair"><div>${myAvatar()}</div><b>♥</b><div>${pic(p)}</div></div><p>${esc(S.me.name)} & ${esc(p.name)}</p>
            <div class="lv-row" style="justify-content:center"><button class="lv-btn" id="mMsg">Écrire un message</button><button class="lv-btn ghost" id="mGo">Continuer</button></div></div>`;
        document.body.appendChild(m);
        $('#mMsg', m).onclick = () => { m.remove(); tab = 'matches'; chatId = p.id; renderApp(); };
        $('#mGo', m).onclick = () => m.remove();
    }

    /* ---------- Matchs et messages ---------- */
    const REPLIES = { f: ['Merci pour ton message, ça me fait plaisir 😊', 'Et toi, qu\'aimes-tu faire le week-end ?', 'J\'aimerais bien en savoir plus sur toi.', 'On pourrait se parler un peu avant de se rencontrer, qu\'en dis-tu ?'], m: ['Merci pour ton message, ça me touche 😊', 'Et toi, comment se passe ta semaine ?', 'J\'aimerais mieux te connaître.', 'Prenons le temps de discuter, puis on verra pour se rencontrer en lieu public.'] };
    function renderMatches() {
        const v = $('#lvView');
        if (chatId) return renderChat(v);
        v.innerHTML = S.matches.length ? `<div class="lv-list">${S.matches.map(m => { const p = byId(m.id), c = S.chats[m.id] || [], last = c[c.length - 1]; return `<button class="lv-match" data-id="${p.id}"><div class="lv-mav">${pic(p)}</div><div><b>${esc(p.name)}, ${p.age}</b><small>${last ? esc(last.t).slice(0, 56) : 'Dites bonjour !'}</small></div><i>›</i></button>`; }).join('')}</div>` : `<div class="lv-end"><div style="font-size:3rem">💬</div><h3>Pas encore de match</h3><p>Aimez des profils : lorsque l'intérêt est réciproque, la conversation s'ouvre ici.</p><button class="lv-btn" id="lvGoD">Découvrir des profils</button></div>`;
        $$('.lv-match', v).forEach(b => b.onclick = () => { chatId = b.dataset.id; renderMatches(); });
        const g = $('#lvGoD'); if (g) g.onclick = () => { tab = 'discover'; renderApp(); };
    }
    function renderChat(v) {
        const p = byId(chatId), msgs = S.chats[chatId] || [];
        v.innerHTML = `<div class="lv-chat"><div class="lv-chat-h"><button class="lv-link" id="cBack">← Retour</button><div class="lv-mav sm">${pic(p)}</div><div><b>${esc(p.name)}, ${p.age}</b><small>📍 ${esc(p.city)}</small></div><button class="lv-link" id="cBlock">Bloquer</button></div>
            <div class="lv-msgs" id="cMsgs">${msgs.map(m => `<div class="lv-b ${m.f}">${esc(m.t)}</div>`).join('')}</div>
            <div class="lv-demo" style="margin:10px 0">Conversation de démonstration : les réponses sont automatiques. Ne communiquez jamais d'argent ni d'informations bancaires.</div>
            <div class="lv-send"><input class="lv-in" id="cIn" placeholder="Écrire un message…" maxlength="300"><button class="lv-btn" id="cSend">Envoyer</button></div></div>`;
        const box = $('#cMsgs'); box.scrollTop = box.scrollHeight;
        const send = () => {
            const i = $('#cIn'), t = i.value.trim(); if (!t) return;
            (S.chats[chatId] = S.chats[chatId] || []).push({ f: 'me', t, d: Date.now() }); save(); renderChat(v);
            setTimeout(() => { if (chatId !== p.id) return; S.chats[p.id].push({ f: 'them', t: REPLIES[p.g][rnd(4)], d: Date.now() }); save(); if ($('#cMsgs')) renderChat(v); }, 1300);
        };
        $('#cSend').onclick = send; $('#cIn').onkeydown = e => { if (e.key === 'Enter') send(); };
        $('#cBack').onclick = () => { chatId = null; renderMatches(); };
        $('#cBlock').onclick = () => { if (confirm(`Bloquer ${p.name} ? La conversation sera supprimée.`)) { S.blocked.push(p.id); S.matches = S.matches.filter(m => m.id !== p.id); delete S.chats[p.id]; chatId = null; save(); toast('Profil bloqué'); renderApp(); } };
    }

    /* ---------- Mon profil, sécurité ---------- */
    function renderMe() {
        const m = S.me, v = $('#lvView');
        v.innerHTML = `<div class="lv-grid"><div class="lv-main"><div class="lv-me"><div class="lv-photo big">${myAvatar()}</div><div class="lv-info"><h3>${esc(m.name)}, ${m.age}</h3><p>📍 ${esc(m.city)}${m.job ? ' · ' + esc(m.job) : ''}</p></div></div></div>
            <aside class="lv-side"><div class="lv-glass"><span class="lv-l">${m.g === 'm' ? 'Je suis un homme' : 'Je suis une femme'} · ${esc(m.intent)}</span><p class="lv-bio">${m.bio ? '« ' + esc(m.bio) + ' »' : 'Ajoutez une courte présentation pour inspirer confiance.'}</p><div class="lv-tags">${m.tags.map(t => `<span>${t}</span>`).join('')}</div>
            <div class="lv-row"><button class="lv-btn" id="mEdit">Modifier mon profil</button></div></div>
            <div class="lv-glass"><h4>Confidentialité</h4><div class="lv-row"><button class="lv-btn ghost sm" id="mPin">Changer mon code</button><button class="lv-btn ghost sm danger" id="mDel">Supprimer mes données</button></div></div></aside></div>`;
        $('#mEdit').onclick = () => { editing = true; draft = null; render(); };
        $('#mPin').onclick = () => { if (confirm('Définir un nouveau code secret ?')) { S.pin = null; save(); lock(); render(); } };
        $('#mDel').onclick = () => { if (confirm('Supprimer définitivement votre profil, vos matchs et vos messages de cet appareil ?')) { S = fresh(); save(); lock(); toast('Données supprimées'); render(); } };
    }
    function renderSafe() {
        $('#lvView').innerHTML = `<div class="lv-grid"><div class="lv-main"><div class="lv-glass"><h4>Rencontrer en toute sécurité</h4><ul class="lv-tips">
            <li><b>Première rencontre en lieu public</b> et fréquenté, de préférence en journée.</li><li><b>Prévenez un proche</b> du lieu, de l'heure et de la personne rencontrée.</li><li><b>N'envoyez jamais d'argent</b>, de code ou d'informations bancaires, quelle que soit la raison invoquée.</li><li><b>Méfiez-vous</b> de qui refuse tout échange en visio, parle de mariage trop vite ou invente des urgences.</li><li><b>Gardez le contrôle</b> : ne partagez votre adresse et votre lieu de travail qu'une fois la confiance établie.</li><li><b>Signalez ou bloquez</b> tout comportement irrespectueux. Le respect est la règle de cet espace.</li></ul></div></div>
            <aside class="lv-side"><div class="lv-scope"><b>À propos de cette section</b> Cette section est réservée à la rencontre entre un homme et une femme célibataires, dans une optique de relation sérieuse. Elle est réservée aux personnes de 18 ans et plus.</div>
            <div class="lv-glass"><h4>Version de démonstration</h4><p class="lv-lead" style="margin:0;font-size:.88rem">Les profils sont fictifs et vos données restent uniquement sur cet appareil. Un lancement réel nécessitera un serveur sécurisé, la modération des photos et la vérification des comptes.</p></div></aside></div>`;
    }

    function render() {
        if (!$('#ad-love').classList.contains('active')) return;
        if (!unlocked) return renderGate();
        if (!S.me || editing) return renderSetup();
        renderApp();
    }
})();
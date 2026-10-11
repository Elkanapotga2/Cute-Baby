/* =========================================================
   CUTE BABY NEXT — logique de l'interface 13-18 ans
   Dépend de app.js (getCtx, playTone) et gateway.js (backToGateway)
   ========================================================= */
(function () {
    const app = document.getElementById('teenApp');
    if (!app) return;
    const $ = (s, r = app) => r.querySelector(s);
    const $$ = (s, r = app) => [...r.querySelectorAll(s)];
    const rnd = n => Math.floor(Math.random() * n);
    const shuffle = a => [...a].sort(() => Math.random() - 0.5);
    const pad = n => String(n).padStart(2, '0');
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const DAY = 864e5;

    /* ---------- Données enregistrées sur l'appareil ---------- */
    const KEY = 'cutebaby_teens_v1';
    const LEVEL_XP = 200;
    const RANKS = ['Rookie', 'Initié', 'Challenger', 'Maître', 'Elite', 'Légende'];
    const fresh = () => ({ xp: 0, focus: {}, decks: null, tasks: [], mood: {}, journal: [], orient: null, reviewed: 0, best: { type: 0, reflex: 0 }, code: {}, badges: {}, streak: { last: '', n: 0 }, rewards: {} });
    function load() {
        try { const r = JSON.parse(localStorage.getItem(KEY)); return r ? Object.assign(fresh(), r, { best: Object.assign(fresh().best, r.best) }) : fresh(); }
        catch (e) { return fresh(); }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
    let S = load();
    const level = () => Math.floor(S.xp / LEVEL_XP) + 1;
    const rank = () => RANKS[Math.min(RANKS.length - 1, Math.floor((level() - 1) / 2))];

    const BADGES = [
        { id: 'focus', e: '⏱️', n: 'Deep worker', d: 'Terminer un focus' },
        { id: 'cards', e: '🧠', n: 'Mémoire de fer', d: 'Réviser 20 fiches' },
        { id: 'orient', e: '🧭', n: 'Boussole', d: 'Finir l\'orientation' },
        { id: 'zen', e: '🌿', n: 'Zen', d: '5 cycles de respiration' },
        { id: 'coder', e: '💻', n: 'Hacker', d: 'Valider une mission de code' },
        { id: 'typist', e: '⌨️', n: 'Vitesse', d: '40 mots/min au test de frappe' },
        { id: 'streak3', e: '🔥', n: 'Régulier', d: '3 jours de suite' },
        { id: 'lvl5', e: '🏆', n: 'Challenger', d: 'Atteindre le niveau 5' }
    ];

    function toast(msg) {
        const box = $('#tnToasts'), t = document.createElement('div');
        t.className = 'tn-toast'; t.textContent = msg; box.appendChild(t);
        setTimeout(() => t.classList.add('out'), 2400); setTimeout(() => t.remove(), 2800);
    }
    function tone(f, d = 0.2, v = 0.08, type = 'sine') {
        try { const c = getCtx(); if (c.state === 'suspended') c.resume(); playTone(f, c.currentTime, d, v, type); } catch (e) { }
    }
    function unlock(id) {
        if (S.badges[id]) return;
        S.badges[id] = 1; const b = BADGES.find(x => x.id === id);
        toast(`🏅 Badge : ${b.n}`); tone(784, 0.4, 0.1, 'triangle'); save(); renderHome();
    }
    function addXP(n) {
        const before = level(); S.xp += n;
        if (level() > before) { toast(`⬆️ Niveau ${level()} : ${rank()}`);[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.09, 'triangle'), i * 110)); }
        if (level() >= 5) unlock('lvl5');
        save(); renderHome();
    }
    // Récompense limitée à une fois par jour pour une action donnée
    function dailyXP(id, n) { const k = id + dkey(); if (S.rewards[k]) return false; S.rewards[k] = 1; addXP(n); return true; }

    /* ---------- Série de jours ---------- */
    (function streak() {
        const today = dkey(), y = dkey(new Date(Date.now() - DAY));
        if (S.streak.last === today) return;
        S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1; S.streak.last = today;
        S.xp += 5; save();
        if (S.streak.n >= 3) S.badges.streak3 = 1;
    })();

    /* ---------- Accueil ---------- */
    function dueCount() { return (S.decks || []).reduce((a, d) => a + d.cards.filter(c => c.due <= Date.now()).length, 0); }
    function renderHome() {
        const inLvl = S.xp % LEVEL_XP, today = S.focus[dkey()] || 0;
        const set = (k, v) => $$(`[data-b="${k}"]`).forEach(e => e.textContent = v);
        set('level', level()); set('xp', S.xp); set('rank', rank()); set('streak', S.streak.n);
        set('xpin', inLvl); set('xpmax', LEVEL_XP); set('focusToday', today); set('due', dueCount());
        $('#tnXpBar').style.width = Math.round(inLvl / LEVEL_XP * 100) + '%';
        const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * DAY); return { l: 'DLMMJVS'[d.getDay()], v: S.focus[dkey(d)] || 0 }; });
        const max = Math.max(60, ...days.map(d => d.v));
        $('#tnChart').innerHTML = days.map(d => `<div class="${d.v ? '' : 'zero'}"><i style="height:${Math.max(4, d.v / max * 70)}px"></i>${d.l}</div>`).join('');
        $('#tnBadges').innerHTML = BADGES.map(b => `<div class="tn-badge ${S.badges[b.id] ? '' : 'locked'}"><i>${b.e}</i><b>${b.n}</b><small>${b.d}</small></div>`).join('');
    }

    /* ---------- Navigation ---------- */
    const heroVideo = $('#tnHeroVideo');
    heroVideo.addEventListener('error', () => { heroVideo.style.display = 'none'; });
    function go(id) {
        $$('.tn-page').forEach(p => p.classList.toggle('active', p.id === 'tn-' + id));
        $$('#tnNav button').forEach(b => b.classList.toggle('on', b.dataset.tn === id));
        if (id !== 'well') stopBreath();
        if (id !== 'lab') labStop();
        if (id !== 'watch') closeTV();
        if (id === 'study') renderStudy();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
    $$('[data-tn]').forEach(b => b.addEventListener('click', () => go(b.dataset.tn)));
    $('#tnBack').addEventListener('click', () => backToGateway());
    $$('.tn-b').forEach(b => b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
    new MutationObserver(() => {
        if (document.body.dataset.zone !== 'teens') { stopBreath(); labStop(); closeTV(); stopNoise(); fcPause(); heroVideo.pause(); }
        else heroVideo.play().catch(() => { });
    }).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

    /* =========== FOCUS =========== */
    const CIRC = 2 * Math.PI * 88;
    let fcMin = 25, fcFocus = true, fcTotal = 1500, fcLeft = 1500, fcEnd = 0, fcTimer = null;
    const arc = $('#fcArc');
    arc.style.strokeDasharray = CIRC;
    function fcDraw() {
        $('#fcTime').textContent = `${pad(Math.floor(fcLeft / 60))}:${pad(Math.floor(fcLeft % 60))}`;
        arc.style.strokeDashoffset = CIRC * (1 - fcLeft / fcTotal);
    }
    function fcPause() { if (fcTimer) { clearInterval(fcTimer); fcTimer = null; $('#fcStart').textContent = 'Reprendre'; } }
    function fcSet(m, focus) { fcPause(); fcMin = m; fcFocus = focus; fcTotal = fcLeft = m * 60; $('#fcStart').textContent = 'Démarrer'; fcDraw(); }
    $$('#fcModes button').forEach(b => b.addEventListener('click', () => {
        $$('#fcModes button').forEach(x => x.classList.remove('on')); b.classList.add('on'); fcSet(+b.dataset.m, !!b.dataset.f);
        $('#fcNote').textContent = b.dataset.f ? 'Pose ton téléphone, ferme les onglets inutiles, et lance-toi.' : 'Lève-toi, bois de l\'eau, regarde au loin.';
    }));
    $('#fcStart').addEventListener('click', () => {
        if (fcTimer) return fcPause();
        fcEnd = Date.now() + fcLeft * 1000; $('#fcStart').textContent = 'Pause';
        fcTimer = setInterval(() => {
            fcLeft = Math.max(0, (fcEnd - Date.now()) / 1000); fcDraw();
            if (fcLeft <= 0) fcDone();
        }, 250);
    });
    $('#fcReset').addEventListener('click', () => fcSet(fcMin, fcFocus));
    function fcDone() {
        clearInterval(fcTimer); fcTimer = null;
        [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.4, 0.1, 'triangle'), i * 160));
        if (fcFocus) {
            S.focus[dkey()] = (S.focus[dkey()] || 0) + fcMin; addXP(fcMin); unlock('focus');
            $('#fcNote').textContent = `🎉 ${fcMin} minutes de focus ! Prends une vraie pause maintenant.`;
        } else $('#fcNote').textContent = 'Pause terminée : prêt·e pour un nouveau bloc ?';
        fcSet(fcMin, fcFocus);
    }
    let noise = null;
    function stopNoise() { if (noise) { try { noise.stop(); } catch (e) { } noise = null; } $('#fcNoise').classList.remove('on'); }
    $('#fcNoise').addEventListener('click', () => {
        if (noise) return stopNoise();
        const c = getCtx(); if (c.state === 'suspended') c.resume();
        const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
        for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
        const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0.35;
        src.connect(g).connect(c.destination); src.start(); noise = src; $('#fcNoise').classList.add('on');
    });
    fcDraw();

    function renderTasks() {
        const ul = $('#tkList');
        ul.innerHTML = S.tasks.length ? S.tasks.map((t, i) => `<li class="${t.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}><span>${esc(t.t)}</span><button data-x="${i}" aria-label="Supprimer">✕</button></li>`).join('') : '<div class="tn-empty">Aucune tâche. Ajoutes-en une ci-dessus.</div>';
        $$('input[type=checkbox]', ul).forEach(c => c.addEventListener('change', () => { const t = S.tasks[+c.dataset.i]; t.done = c.checked; if (t.done) { addXP(3); tone(660, 0.15); } save(); renderTasks(); }));
        $$('[data-x]', ul).forEach(b => b.addEventListener('click', () => { S.tasks.splice(+b.dataset.x, 1); save(); renderTasks(); }));
    }
    const addTask = () => { const v = $('#tkIn').value.trim(); if (!v) return; S.tasks.unshift({ t: v, done: false }); $('#tkIn').value = ''; save(); renderTasks(); };
    $('#tkAdd').addEventListener('click', addTask);
    $('#tkIn').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
    renderTasks();

    /* =========== RÉVISER (fiches à répétition espacée) =========== */
    const INTERVALS = [0, 1, 3, 7];
    if (!S.decks) {
        S.decks = [{ id: 'd0', name: 'Exemple · Anglais : verbes irréguliers', cards: [['to be', 'was/were – been'], ['to go', 'went – gone'], ['to have', 'had – had'], ['to make', 'made – made'], ['to take', 'took – taken'], ['to see', 'saw – seen']].map(([q, a]) => ({ q, a, box: 0, due: 0 })) }];
        save();
    }
    let openDeck = null;
    function renderStudy() {
        const body = $('#stBody');
        if (openDeck === null) {
            body.innerHTML = `<div class="tn-decks">${S.decks.map((d, i) => {
                const due = d.cards.filter(c => c.due <= Date.now()).length;
                return `<button class="tn-deck" data-d="${i}"><b>${esc(d.name)}</b><span>${d.cards.length} fiche(s)</span><em>${due} à réviser</em></button>`;
            }).join('')}</div>
                <div class="tn-card"><h3>Nouveau deck</h3><div class="tn-add"><input id="dkName" placeholder="Ex. Histoire : la Révolution" maxlength="50"><button id="dkAdd" aria-label="Créer">＋</button></div></div>`;
            $$('.tn-deck', body).forEach(b => b.addEventListener('click', () => { openDeck = +b.dataset.d; renderStudy(); }));
            $('#dkAdd', body).onclick = () => { const v = $('#dkName').value.trim(); if (!v) return; S.decks.push({ id: 'd' + Date.now(), name: v, cards: [] }); save(); openDeck = S.decks.length - 1; renderStudy(); };
            return;
        }
        const d = S.decks[openDeck], due = d.cards.filter(c => c.due <= Date.now()).length;
        body.innerHTML = `<div class="tn-row" style="justify-content:space-between;margin-bottom:16px"><button class="tn-btn gh sm" id="dkBack">← Mes decks</button><button class="tn-btn gh sm" id="dkDel">🗑️ Supprimer le deck</button></div>
            <div class="tn-card"><h3>${esc(d.name)}</h3><p class="tn-sub" style="margin-bottom:16px">${d.cards.length} fiche(s) · ${due} à réviser maintenant</p>
            <div class="tn-row" style="justify-content:flex-start"><button class="tn-btn pri" id="dkStudy" ${due ? '' : 'disabled'}>Étudier (${due})</button><button class="tn-btn gh" id="dkAll" ${d.cards.length ? '' : 'disabled'}>Tout réviser</button></div></div>
            <div class="tn-card" style="margin-top:16px"><h3>Ajouter des fiches</h3>
            <div class="tn-form"><input class="tn-in" id="cdQ" placeholder="Question / recto"><input class="tn-in" id="cdA" placeholder="Réponse / verso"><button class="tn-btn pri sm" id="cdAdd" style="margin:0">Ajouter</button></div>
            <p class="tn-hint" style="margin:16px 0 8px">Ou colle plusieurs fiches, une par ligne : <code>question ; réponse</code></p>
            <textarea class="tn-in" id="cdBulk" placeholder="capitale du Cameroun ; Yaoundé"></textarea><button class="tn-btn gh sm" id="cdImp">Importer</button></div>
            <div class="tn-cardlist">${d.cards.map((c, i) => `<div><b>${esc(c.q)}</b><span>${esc(c.a)}</span><button data-x="${i}" aria-label="Supprimer">✕</button></div>`).join('')}</div>`;
        $('#dkBack', body).onclick = () => { openDeck = null; renderStudy(); };
        $('#dkDel', body).onclick = () => { if (confirm('Supprimer ce deck et ses fiches ?')) { S.decks.splice(openDeck, 1); openDeck = null; save(); renderStudy(); renderHome(); } };
        const add = (q, a) => { if (q && a) d.cards.push({ q, a, box: 0, due: 0 }); };
        $('#cdAdd', body).onclick = () => { add($('#cdQ').value.trim(), $('#cdA').value.trim()); save(); renderStudy(); renderHome(); };
        $('#cdImp', body).onclick = () => { const n = d.cards.length; $('#cdBulk').value.split('\n').forEach(l => { const [q, a] = l.split(';'); if (a) add(q.trim(), a.trim()); }); toast(`${d.cards.length - n} fiche(s) importée(s)`); save(); renderStudy(); renderHome(); };
        $$('[data-x]', body).forEach(b => b.onclick = () => { d.cards.splice(+b.dataset.x, 1); save(); renderStudy(); renderHome(); });
        $('#dkStudy', body).onclick = () => runStudy(d, false);
        $('#dkAll', body).onclick = () => runStudy(d, true);
    }
    function runStudy(d, all) {
        const q = shuffle(d.cards.filter(c => all || c.due <= Date.now())), total = q.length; let known = 0;
        const body = $('#stBody');
        const show = () => {
            if (!q.length) {
                addXP(known + 5); S.reviewed += known; if (S.reviewed >= 20) unlock('cards'); save();
                body.innerHTML = `<div class="tn-card tn-q"><div style="font-size:3rem">🎉</div><h3>Session terminée !</h3><p class="tn-sub" style="margin:0 auto 20px">${known}/${total} fiches maîtrisées · +${known + 5} XP</p><button class="tn-btn pri" id="stEnd">Retour au deck</button></div>`;
                return void ($('#stEnd', body).onclick = renderStudy);
            }
            const c = q[0];
            body.innerHTML = `<div class="tn-hint" style="text-align:center">${total - q.length + 1} / ${total} · deck « ${esc(d.name)} »</div>
                <div class="tn-flash-wrap"><div class="tn-flash" id="fl"><div class="f">${esc(c.q)}</div><div class="b">${esc(c.a)}</div></div></div>
                <p class="tn-flash-hint" id="flH">Touche la carte pour voir la réponse</p>
                <div class="tn-row" id="flBtns" hidden><button class="tn-btn gh" id="no">🔁 À revoir</button><button class="tn-btn pri" id="yes">✅ Je savais</button></div>
                <div class="tn-row" style="margin-top:14px"><button class="tn-btn gh sm" id="stQuit">Arrêter</button></div>`;
            $('#fl', body).onclick = () => { $('#fl', body).classList.add('flip'); $('#flBtns', body).hidden = false; $('#flH', body).hidden = true; };
            $('#yes', body).onclick = () => { c.box = Math.min(3, c.box + 1); c.due = Date.now() + INTERVALS[c.box] * DAY; known++; q.shift(); tone(660, 0.12); show(); };
            $('#no', body).onclick = () => { c.box = 0; c.due = 0; q.push(q.shift()); tone(200, 0.15, 0.06, 'sawtooth'); show(); };
            $('#stQuit', body).onclick = () => { save(); renderStudy(); renderHome(); };
        };
        show();
    }

    /* =========== AVENIR (orientation) =========== */
    const QS = [['R', 'Réparer ou construire quelque chose de mes mains.'], ['R', 'Travailler avec des machines, des outils ou en plein air.'],
    ['I', 'Comprendre comment fonctionne le corps humain ou l\'univers.'], ['I', 'Résoudre des énigmes ou des problèmes de logique.'],
    ['A', 'Dessiner, écrire, composer ou filmer mes propres créations.'], ['A', 'Imaginer des idées originales et sortir du cadre.'],
    ['S', 'Aider quelqu\'un qui a un problème ou qui doute.'], ['S', 'Expliquer quelque chose jusqu\'à ce que l\'autre comprenne.'],
    ['E', 'Convaincre, diriger un groupe ou lancer un projet.'], ['E', 'Organiser un événement ou gagner un défi.'],
    ['C', 'Organiser, ranger et planifier avec précision.'], ['C', 'Gérer des chiffres, un budget ou des documents.']];
    const PROF = {
        R: { n: 'Bâtisseur·se', e: '🛠️', d: 'Tu aimes le concret : voir un résultat réel de tes mains.', j: ['Ingénieur·e', 'Technicien·ne', 'Électricien·ne', 'Agronome', 'Pilote', 'Mécanicien·ne'] },
        I: { n: 'Chercheur·se', e: '🔬', d: 'Tu veux comprendre le pourquoi des choses et résoudre des problèmes complexes.', j: ['Médecin', 'Chercheur·se', 'Data scientist', 'Pharmacien·ne', 'Biologiste', 'Développeur·se'] },
        A: { n: 'Créatif·ve', e: '🎨', d: 'Tu as besoin d\'inventer, d\'exprimer des idées et de faire les choses à ta façon.', j: ['Designer', 'Architecte', 'Journaliste', 'Réalisateur·rice', 'Créateur·rice de contenu', 'Game designer'] },
        S: { n: 'Aidant·e', e: '🤝', d: 'Tu te sens bien quand tu fais progresser ou soulages les autres.', j: ['Enseignant·e', 'Infirmier·ère', 'Psychologue', 'Éducateur·rice', 'Travailleur·se social·e', 'Sage-femme'] },
        E: { n: 'Leader', e: '🚀', d: 'Tu aimes entraîner, convaincre et prendre des initiatives.', j: ['Entrepreneur·e', 'Avocat·e', 'Manager', 'Responsable marketing', 'Commercial·e', 'Diplomate'] },
        C: { n: 'Organisateur·rice', e: '📊', d: 'Tu es fiable, précis·e et tu aimes que tout soit bien structuré.', j: ['Comptable', 'Auditeur·rice', 'Banquier·ère', 'Logisticien·ne', 'Gestionnaire', 'Juriste'] }
    };
    function renderOrient() {
        const body = $('#orBody');
        if (S.orient) return showProfile(S.orient);
        const qs = shuffle(QS), sc = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }; let i = 0;
        const step = () => {
            body.innerHTML = `<div class="tn-q"><div class="tn-bar"><i style="width:${i / qs.length * 100}%"></i></div><small style="color:var(--mute)">QUESTION ${i + 1} / ${qs.length}</small>
                <h3>${qs[i][1]}</h3><div class="tn-ans"><button data-v="2"><i>😍</i>J'adore</button><button data-v="1"><i>🙂</i>Bof, ça va</button><button data-v="0"><i>🙅</i>Pas pour moi</button></div></div>`;
            $$('.tn-ans button', body).forEach(b => b.onclick = () => {
                sc[qs[i][0]] += +b.dataset.v; tone(500 + i * 30, 0.1, 0.05);
                if (++i < qs.length) return step();
                S.orient = { sc }; dailyXP('orient', 25); unlock('orient'); save(); showProfile(S.orient);
            });
        };
        step();
    }
    function showProfile(o) {
        const body = $('#orBody'), top = Object.entries(o.sc).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
        body.innerHTML = `<div class="tn-prof">${top.map((k, n) => `<div class="tn-card"><small>${n ? 'PROFIL SECONDAIRE' : 'TON PROFIL PRINCIPAL'}</small><div class="e">${PROF[k].e}</div><h3 style="margin:6px 0">${PROF[k].n}</h3>
            <p style="color:var(--mute);margin:0;line-height:1.55">${PROF[k].d}</p><ul>${PROF[k].j.map(j => `<li>${j}</li>`).join('')}</ul></div>`).join('')}</div>
            <div class="tn-card"><h3>Tes scores</h3><div class="tn-scores">${Object.entries(o.sc).map(([k, v]) => `<div><span>${PROF[k].e} ${PROF[k].n.replace(/·.*/, '')}</span><div class="tn-bar" style="margin:0"><i style="width:${v / 4 * 100}%"></i></div><b>${v}</b></div>`).join('')}</div></div>
            <div class="tn-card" style="margin-top:16px"><h3>Et maintenant ?</h3><ol class="tn-steps"><li>Parle à une personne qui fait un de ces métiers : pose-lui 3 questions.</li><li>Demande à un·e prof ou conseiller·ère d'orientation quelles filières y mènent.</li><li>Teste : stage d'observation, club, projet perso ou petite mission.</li></ol>
            <p class="tn-hint" style="margin:14px 0">Ce test mesure des goûts, pas des capacités : tes intérêts peuvent évoluer.</p><button class="tn-btn gh sm" id="orRe">Refaire le test</button></div>`;
        $('#orRe', body).onclick = () => { S.orient = null; save(); renderOrient(); };
    }
    renderOrient();

    /* =========== BIEN-ÊTRE =========== */
    const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
    const MTIPS = ['Journée dure, et c\'est OK. Essaie : 3 grandes respirations, un verre d\'eau, 10 minutes dehors. Si ça dure, parle à quelqu\'un de confiance.',
        'Pas facile aujourd\'hui. Un petit pas suffit : bouge un peu, écris ce qui te pèse, ou envoie un message à quelqu\'un que tu aimes.',
        'Journée neutre. Choisis une seule chose utile à faire, et félicite-toi après.',
        'Ça va plutôt bien ! Qu\'est-ce qui a aidé ? Note-le dans ton journal pour t\'en souvenir.',
        'Super énergie ! Profites-en pour avancer sur ce qui compte, ou pour faire sourire quelqu\'un.'];
    function renderMood() {
        const t = S.mood[dkey()], box = $('#mdBox');
        const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * DAY), v = S.mood[dkey(d)]; return `<div>${v ? MOODS[v - 1] : '·'}<small>${'DLMMJVS'[d.getDay()]}</small></div>`; }).join('');
        box.innerHTML = `<h3>Comment tu te sens ?</h3><div class="tn-moods">${MOODS.map((m, i) => `<button class="${t === i + 1 ? 'on' : ''}" data-m="${i + 1}" aria-label="Humeur ${i + 1}">${m}</button>`).join('')}</div>
            ${t ? `<div class="tn-tip">${MTIPS[t - 1]}</div>` : '<p class="tn-hint" style="margin:0">Touche l\'émoji qui te ressemble aujourd\'hui.</p>'}<div class="tn-week">${week}</div>`;
        $$('[data-m]', box).forEach(b => b.onclick = () => { S.mood[dkey()] = +b.dataset.m; dailyXP('mood', 3); save(); renderMood(); });
    }
    let brRun = false, brT = null, brCycles = 0;
    function renderBreath() {
        $('#brBox').innerHTML = `<h3>Respiration 4-4-6</h3><div class="tn-breath"><div class="tn-orb" id="orb"><span id="orbT">Prêt·e ?</span></div>
            <p class="tn-hint" id="brInfo" style="margin:0 0 12px">Inspire 4 s · retiens 4 s · expire 6 s. Ça calme le stress.</p><button class="tn-btn pri" id="brBtn">Commencer</button></div>`;
        $('#brBtn').onclick = () => brRun ? stopBreath() : startBreath();
    }
    function startBreath() {
        brRun = true; brCycles = 0; $('#brBtn').textContent = 'Arrêter';
        const orb = $('#orb'), txt = $('#orbT'), P = [['Inspire', 4000, 1], ['Retiens', 4000, 1], ['Expire', 6000, .6]];
        const phase = i => {
            if (!brRun) return;
            const [n, ms, sc] = P[i]; txt.textContent = n; orb.style.transitionDuration = (n === 'Retiens' ? 0.2 : ms / 1000) + 's'; orb.style.transform = `scale(${sc})`;
            brT = setTimeout(() => { if (i === 2) { brCycles++; $('#brInfo').textContent = `${brCycles} cycle(s) terminé(s)`; } phase((i + 1) % 3); }, ms);
        };
        phase(0);
    }
    function stopBreath() {
        if (!brRun) return;
        brRun = false; clearTimeout(brT);
        const orb = $('#orb'); if (orb) { orb.style.transform = 'scale(.6)'; $('#orbT').textContent = 'Bravo'; $('#brBtn').textContent = 'Recommencer'; }
        if (brCycles >= 3) dailyXP('breath', 8);
        if (brCycles >= 5) unlock('zen');
    }
    const PROMPTS = ['Qu\'est-ce qui m\'a fait sourire aujourd\'hui ?', 'Une chose dont je suis fier·e cette semaine ?', 'Qu\'est-ce qui me stresse, et que puis-je y faire ?', 'Quelqu\'un à remercier, et pourquoi ?', 'Un objectif pour demain, tout petit ?', 'Qu\'est-ce que j\'ai appris récemment ?', 'Comment je voudrais me sentir demain ?'];
    function renderJournal() {
        const box = $('#jrBox'), p = PROMPTS[new Date().getDay()];
        box.innerHTML = `<h3>Journal privé</h3><p class="tn-hint" style="margin:0 0 10px">💭 ${p}</p><textarea class="tn-in" id="jrTxt" placeholder="Écris librement…"></textarea>
            <button class="tn-btn pri sm" id="jrSave">Enregistrer</button>
            ${S.journal.slice(0, 3).map((j, i) => `<div class="tn-journal-item"><div><small>${j.d}</small>${esc(j.t)}</div><button data-x="${i}" aria-label="Supprimer">✕</button></div>`).join('')}`;
        $('#jrSave', box).onclick = () => { const v = $('#jrTxt').value.trim(); if (!v) return; S.journal.unshift({ d: new Date().toLocaleDateString('fr-FR'), t: v }); S.journal = S.journal.slice(0, 30); dailyXP('journal', 4); save(); renderJournal(); toast('📓 Enregistré sur cet appareil'); };
        $$('[data-x]', box).forEach(b => b.onclick = () => { S.journal.splice(+b.dataset.x, 1); save(); renderJournal(); });
    }
    renderMood(); renderBreath(); renderJournal();

    /* =========== LABO =========== */
    let labCleanup = () => { };
    function labStop() { labCleanup(); labCleanup = () => { }; }
    const MISSIONS = [
        { t: 'Mission 1 · Colore le titre', h: 'Ajoute une couleur au h1 dans le bloc <style>.', s: '<h1>Salut le monde</h1>\n<style>\n  h1 {  }\n</style>', ok: c => /h1\s*\{[^}]*color\s*:\s*[^;}\s]/i.test(c) },
        { t: 'Mission 2 · Bouton magique', h: 'Un <button> avec un clic qui change document.body.style.background.', s: '<button>Clique-moi</button>\n<script>\n  // ton code ici\n</script>', ok: c => /<button/i.test(c) && /(onclick|addEventListener)/i.test(c) && /style\.(background|backgroundColor)/i.test(c) },
        { t: 'Mission 3 · Carte de profil', h: 'Une carte avec un <h2>, un <p> et des coins arrondis (border-radius).', s: '<div class="card">\n  \n</div>\n<style>\n  .card {  }\n</style>', ok: c => /<h2/i.test(c) && /<p[\s>]/i.test(c) && /border-radius/i.test(c) },
        { t: 'Mission 4 · Compteur', h: 'Un bouton qui augmente un nombre affiché (variable + textContent).', s: '<h1 id="n">0</h1>\n<button onclick="">+1</button>\n<script>\n  let n = 0;\n</script>', ok: c => /textContent|innerText|innerHTML/i.test(c) && /\+\+|\+=\s*1|n\s*\+\s*1/i.test(c) && /<button/i.test(c) }
    ];
    function labCode(body) {
        let m = 0;
        body.innerHTML = `<div class="tn-missions">${MISSIONS.map((x, i) => `<button data-m="${i}" class="${S.code[i] ? 'ok' : ''}">${x.t}</button>`).join('')}</div>
            <p class="tn-hint" id="cdHint"></p><div class="tn-code"><textarea id="cdEd" spellcheck="false"></textarea><iframe id="cdFr" sandbox="allow-scripts" title="Aperçu"></iframe></div>
            <div class="tn-row" style="justify-content:flex-start;margin-top:14px"><button class="tn-btn pri" id="cdChk">✅ Vérifier la mission</button></div>`;
        const ed = $('#cdEd', body), fr = $('#cdFr', body); let t = null;
        const run = () => { fr.srcdoc = `<body style="font-family:sans-serif;padding:16px">${ed.value}</body>`; };
        const load = i => { m = i; ed.value = MISSIONS[i].s; $('#cdHint', body).textContent = '💡 ' + MISSIONS[i].h; $$('.tn-missions button', body).forEach((b, k) => b.classList.toggle('on', k === i)); run(); };
        $$('.tn-missions button', body).forEach(b => b.onclick = () => load(+b.dataset.m));
        ed.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 350); });
        ed.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ed.selectionStart; ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(ed.selectionEnd); ed.selectionStart = ed.selectionEnd = s + 2; } });
        $('#cdChk', body).onclick = () => {
            if (!MISSIONS[m].ok(ed.value)) return toast('🤔 Pas encore : relis l\'indice et réessaie');
            tone(784, 0.3, 0.1, 'triangle');
            if (!S.code[m]) { S.code[m] = 1; addXP(20); unlock('coder'); toast('✅ Mission validée · +20 XP'); $$('.tn-missions button', body)[m].classList.add('ok'); save(); } else toast('✅ Déjà validée, bien joué !');
        };
        load(0);
    }
    const SENT = ['La persévérance est la clé de la réussite, même quand le chemin semble long.', 'Chaque jour, je choisis de faire un petit pas vers la personne que je veux devenir.', 'Apprendre à coder, c\'est apprendre à résoudre des problèmes étape par étape.', 'Le courage ne consiste pas à ne pas avoir peur, mais à avancer malgré tout.', 'Ce que tu fais aujourd\'hui construit ce que tu seras demain.'];
    function labType(body) {
        const text = shuffle(SENT).slice(0, 3).join(' '); let t0 = 0, timer = null, over = false;
        body.innerHTML = `<div class="tn-type" id="tyBox"><div class="txt" id="tyTxt"></div><input id="tyIn" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
            <div class="tn-live"><div>Temps <b id="tyT">30</b> s</div><div>Mots/min <b id="tyW">0</b></div><div>Précision <b id="tyA">100</b>%</div><div>Record <b>${S.best.type}</b></div></div>
            <p class="tn-hint" style="margin-top:12px">Clique dans le cadre et tape le texte. Le chrono démarre à la première lettre (30 s).</p>`;
        const inp = $('#tyIn', body), txt = $('#tyTxt', body);
        const draw = v => {
            txt.innerHTML = [...text].map((ch, i) => `<span class="${i < v.length ? (v[i] === ch ? 'ok' : 'ko') : ''}${i === v.length ? ' cur' : ''}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
        };
        const stats = v => { const good = [...v].filter((c, i) => c === text[i]).length, el = Math.max(1, (Date.now() - t0) / 1000); return { good, wpm: Math.round(good / 5 / (el / 60)), acc: v.length ? Math.round(good / v.length * 100) : 100 }; };
        const end = v => {
            if (over) return; over = true; clearInterval(timer); inp.disabled = true;
            const s = stats(v); $('#tyW', body).textContent = s.wpm;
            const rec = s.wpm > S.best.type; if (rec) S.best.type = s.wpm;
            if (s.wpm >= 40) unlock('typist'); addXP(Math.floor(s.wpm / 4)); save();
            toast(`⌨️ ${s.wpm} mots/min · ${s.acc}% de précision${rec && s.wpm ? ' · NOUVEAU RECORD !' : ''}`);
            body.insertAdjacentHTML('beforeend', '<div class="tn-row" style="margin-top:16px"><button class="tn-btn pri" id="tyAgain">Rejouer</button></div>');
            $('#tyAgain', body).onclick = () => labType(body);
        };
        inp.addEventListener('input', () => {
            const v = inp.value;
            if (!t0) { t0 = Date.now(); timer = setInterval(() => { const left = Math.max(0, 30 - (Date.now() - t0) / 1000); $('#tyT', body).textContent = Math.ceil(left); const s = stats(inp.value); $('#tyW', body).textContent = s.wpm; if (left <= 0) end(inp.value); }, 200); }
            const s = stats(v); $('#tyW', body).textContent = s.wpm; $('#tyA', body).textContent = s.acc; draw(v);
            if (v.length >= text.length) end(v);
        });
        $('#tyBox', body).onclick = () => inp.focus();
        draw(''); inp.focus();
        labCleanup = () => clearInterval(timer);
    }
    function labReflex(body) {
        let n = 0, sum = 0, state = 'idle', t = null, t0 = 0;
        body.innerHTML = `<div class="tn-react" id="rx">Clique pour commencer<small>5 essais · attends le vert</small></div><p class="tn-hint" style="margin-top:12px">Record : <b>${S.best.reflex ? S.best.reflex + ' ms' : '–'}</b></p>`;
        const box = $('#rx', body);
        const set = (cls, html) => { box.className = 'tn-react ' + cls; box.innerHTML = html; };
        const wait = () => { state = 'wait'; set('wait', 'Attends…<small>Ne clique pas encore</small>'); t = setTimeout(() => { state = 'go'; t0 = performance.now(); set('go', 'CLIQUE !'); }, 1500 + rnd(2500)); };
        box.onclick = () => {
            if (state === 'idle') return wait();
            if (state === 'wait') { clearTimeout(t); state = 'idle'; return set('', 'Trop tôt !<small>Clique pour recommencer l\'essai</small>'); }
            if (state === 'go') {
                const ms = Math.round(performance.now() - t0); sum += ms; n++; tone(660, 0.1);
                if (n < 5) { state = 'idle'; return set('', `${ms} ms<small>Essai ${n}/5 · clique pour continuer</small>`); }
                const avg = Math.round(sum / 5); state = 'done'; const rec = !S.best.reflex || avg < S.best.reflex; if (rec) S.best.reflex = avg;
                addXP(avg < 300 ? 15 : 8); save(); set('', `Moyenne : ${avg} ms${rec ? ' 🏆' : ''}<small>Clique pour rejouer</small>`);
            } else if (state === 'done') labReflex(body);
        };
        labCleanup = () => clearTimeout(t);
    }
    const LABS = { code: labCode, type: labType, reflex: labReflex };
    function openLab(k) { labStop(); $$('#labTabs button').forEach(b => b.classList.toggle('on', b.dataset.l === k)); LABS[k]($('#labBody')); }
    $$('#labTabs button').forEach(b => b.addEventListener('click', () => openLab(b.dataset.l)));
    openLab('code');

    /* =========== WATCH =========== */
    // ➕ POUR AJOUTER UNE VIDÉO : copie un bloc et modifie-le.
    //   type : 'file' (vidéo de ton site, ex. assets/watch/ep1.mp4) ou 'youtube' (src = identifiant de la vidéo)
    const TV = [
        // { title: 'Épisode 1', desc: 'Titre ou résumé', duration: '12:40', type: 'youtube', src: 'ABC123xyz',
        //   poster: '', emoji: '🎬', color: 'linear-gradient(135deg,#8B5CF6,#FF3D81)' }
    ];
    const tvModal = $('#tnTvModal'), tvScreen = $('#tnTvScreen');
    function renderTV() {
        const g = $('#tnTvGrid');
        if (!TV.length) { g.innerHTML = '<div class="tv-empty"><span>🎬</span><h3>Ta chaîne arrive bientôt</h3><p>Les premières vidéos seront ajoutées ici.</p></div>'; return; }
        g.innerHTML = TV.map((c, i) => {
            const p = c.poster || (c.type === 'youtube' ? `https://i.ytimg.com/vi/${c.src}/hqdefault.jpg` : '');
            const st = p ? `background-image:url('${p}')` : `background:${c.color || 'linear-gradient(135deg,#8B5CF6,#FF3D81)'}`;
            return `<button class="tv-card" data-i="${i}"><span class="tv-thumb" style="${st}">${p ? '' : `<span class="e">${c.emoji || '🎬'}</span>`}<span class="tv-play">▶</span>${c.duration ? `<span class="tv-dur">${c.duration}</span>` : ''}</span><span class="tv-info"><strong>${esc(c.title)}</strong><small>${esc(c.desc || '')}</small></span></button>`;
        }).join('');
        $$('.tv-card', g).forEach(b => b.addEventListener('click', () => openTV(+b.dataset.i)));
    }
    function openTV(i) {
        const c = TV[i]; if (!c) return;
        stopNoise(); if (window.speechSynthesis) speechSynthesis.cancel();
        if (c.type === 'youtube') tvScreen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.src)}?autoplay=1&rel=0&modestbranding=1" title="${esc(c.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
        else {
            const v = document.createElement('video'); v.controls = v.autoplay = v.playsInline = true; if (c.poster) v.poster = c.poster; v.src = c.src;
            tvScreen.innerHTML = ''; tvScreen.appendChild(v);
            v.addEventListener('error', () => { tvScreen.innerHTML = `<div class="tv-err">😢 Vidéo introuvable.<br>Vérifie le chemin : ${esc(c.src)}</div>`; });
        }
        $('#tnTvTitle').textContent = c.title; tvModal.classList.add('active'); tvModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    }
    function closeTV() { tvScreen.innerHTML = ''; tvModal.classList.remove('active'); tvModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    $('#tnTvClose').addEventListener('click', closeTV);
    tvModal.addEventListener('click', e => { if (e.target === tvModal) closeTV(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tvModal.classList.contains('active')) closeTV(); });
    renderTV();

    renderHome();
})();
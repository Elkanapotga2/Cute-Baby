/* =========================================================
   CUTE BABY EXPLORERS — logique de l'interface 8-12 ans
   Dépend de app.js (getCtx, playTone) et gateway.js (backToGateway)
   ========================================================= */
(function () {
    const app = document.getElementById('tweenApp');
    if (!app) return;
    const $ = (s, r = app) => r.querySelector(s);
    const $$ = (s, r = app) => [...r.querySelectorAll(s)];
    const rnd = n => Math.floor(Math.random() * n);
    const shuffle = a => [...a].sort(() => Math.random() - 0.5);

    /* ---------- Progression (enregistrée sur l'appareil) ---------- */
    const KEY = 'cutebaby_explorers_v1';
    const XP_PER_LEVEL = 150;
    const RANKS = ['Recrue', 'Éclaireur', 'Navigateur', 'Pilote', 'Capitaine', 'Commandant', 'Amiral', 'Légende'];
    const fresh = () => ({ xp: 0, best: { calc: 0, seq: 0, quiz: 0 }, badges: {} });
    function load() {
        try {
            const r = JSON.parse(localStorage.getItem(KEY));
            if (!r) return fresh();
            const f = fresh();
            return { xp: r.xp || 0, best: Object.assign(f.best, r.best), badges: r.badges || {} };
        } catch (e) { return fresh(); }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
    let S = load();
    const level = () => Math.floor(S.xp / XP_PER_LEVEL) + 1;
    const rank = () => RANKS[Math.min(RANKS.length - 1, Math.floor((level() - 1) / 2))];

    const BADGES = [
        { id: 'first', e: '🚀', n: 'Décollage', d: 'Terminer un premier défi' },
        { id: 'calc15', e: '⚡', n: 'Éclair', d: '15 bonnes réponses au calcul éclair' },
        { id: 'seq7', e: '🧠', n: 'Mémoire d\'acier', d: 'Répéter une suite de 7' },
        { id: 'quiz', e: '🎓', n: 'Grand cerveau', d: 'Quiz sans aucune faute' },
        { id: 'art', e: '🎨', n: 'Artiste', d: 'Enregistrer un pixel art' },
        { id: 'lvl3', e: '⭐', n: 'Étoile montante', d: 'Atteindre le niveau 3' },
        { id: 'touche', e: '🧭', n: 'Touche-à-tout', d: 'Essayer 6 jeux différents' },
        { id: 'maitre', e: '👑', n: 'Maître des défis', d: 'Réussir un défi de niveau Légende' },
        { id: 'lvl10', e: '🏵️', n: 'Vétéran', d: 'Atteindre le niveau 10' }
    ];

    const DAILY_IDS = ['calc', 'seq', 'quiz'];
    const DAILY_NAMES = { calc: 'Calcul éclair', seq: 'Séquence mémoire', quiz: 'Quiz culture' };
    let daily = DAILY_IDS[0];
    function setDaily() {
        daily = DAILY_IDS[Math.floor(Date.now() / 864e5) % DAILY_IDS.length];
        $('#twDailyName').textContent = DAILY_NAMES[daily];
        $$('.x2').forEach(x => x.remove());
        $$('.tw-cards [data-open]').forEach(c => {
            if (c.dataset.open === daily) c.insertAdjacentHTML('beforeend', '<span class="x2">×2 XP</span>');
        });
    }

    function toast(msg) {
        const box = $('#twToasts');
        const t = document.createElement('div');
        t.className = 'tw-toast';
        t.textContent = msg;
        box.appendChild(t);
        setTimeout(() => t.classList.add('out'), 2300);
        setTimeout(() => t.remove(), 2700);
    }
    function tone(f, d = 0.2, v = 0.09, type = 'sine') {
        try {
            const c = getCtx();
            if (c.state === 'suspended') c.resume();
            playTone(f, c.currentTime, d, v, type);
        } catch (e) { }
    }

    function renderHUD() {
        const inLvl = S.xp % XP_PER_LEVEL;
        const set = (k, v) => $$(`[data-bind="${k}"]`).forEach(el => el.textContent = v);
        set('level', level()); set('xp', S.xp); set('rank', rank());
        set('xpin', inLvl); set('xpmax', XP_PER_LEVEL);
        Object.keys(S.best).forEach(k => set('best-' + k, S.best[k]));
        $('#twRing').style.setProperty('--p', Math.round(inLvl / XP_PER_LEVEL * 100));
        $('#twBadges').innerHTML = BADGES.map(b => `
            <div class="tw-badge ${S.badges[b.id] ? '' : 'locked'}"><i>${b.e}</i><b>${b.n}</b><small>${b.d}</small></div>`).join('');
    }
    function unlock(id) {
        if (S.badges[id]) return;
        S.badges[id] = 1;
        const b = BADGES.find(x => x.id === id);
        toast(`🏅 Badge débloqué : ${b.n}`);
        tone(784, 0.4, 0.1, 'triangle');
        save(); renderHUD();
    }
    function addXP(n) {
        const before = level();
        S.xp += n;
        if (level() > before) {
            toast(`⬆️ Niveau ${level()} atteint : ${rank()} !`);
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.09, 'triangle'), i * 110));
        }
        if (level() >= 3) unlock('lvl3');
        if (level() >= 10) unlock('lvl10');
        save(); renderHUD();
    }
    // XP doublée pour le défi du jour
    function gain(id, base) {
        const x = base * (id === daily ? 2 : 1);
        addXP(x);
        return x;
    }

    /* ---------- Navigation ---------- */
    function go(id) {
        $$('.tw-page').forEach(p => p.classList.toggle('active', p.id === 'tw-' + id));
        $$('#twNav button').forEach(b => b.classList.toggle('on', b.dataset.tw === id));
        if (id !== 'games') closeStage();
        if (id !== 'tv') closeTV();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
    $$('[data-tw]').forEach(b => b.addEventListener('click', () => {
        go(b.dataset.tw);
        if (b.dataset.open) openStage(b.dataset.open);
    }));
    $$('#twPicker [data-open]').forEach(b => b.addEventListener('click', () => openStage(b.dataset.open)));
    $('#twBack').addEventListener('click', () => backToGateway());

    app.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) closeStage();
        const rp = e.target.closest('[data-replay]');
        if (rp) { const id = rp.closest('.tw-stage').id.replace('st-', ''); STAGES[id].start(); }
    });

    // Coupe tout dès qu'on quitte le cercle 8-12
    const heroVideo = $('#twHeroVideo');
    heroVideo.addEventListener('error', () => { heroVideo.style.display = 'none'; });
    new MutationObserver(() => {
        if (document.body.dataset.zone !== 'tweens') {
            closeStage(); closeTV(); heroVideo.pause();
        } else {
            heroVideo.play().catch(() => { });
        }
    }).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

    /* ---------- Gestion des défis ---------- */
    const STAGES = {
        calc: { start: startCalc, stop: stopCalc },
        seq: { start: startSeq, stop: stopSeq },
        quiz: { start: startQuiz, stop: () => { } }
    };
    function openStage(id) {
        $('#twPicker').hidden = true;
        $$('.tw-stage').forEach(s => s.hidden = s.id !== 'st-' + id);
        STAGES[id].start();
    }
    function closeStage() {
        stopCalc(); stopSeq();
        Object.values(STAGES).forEach(st => st.stop && st.stop());
        $$('.tw-stage').forEach(s => s.hidden = true);
        $('#twPicker').hidden = false;
    }
    function resetStage(id) {
        const st = $('#st-' + id);
        $('.tw-play', st).hidden = false;
        $('.tw-result', st).hidden = true;
    }
    function showResult(id, r) {
        const st = $('#st-' + id);
        $('.tw-play', st).hidden = true;
        const box = $('.tw-result', st);
        box.hidden = false;
        box.innerHTML = `
            <div class="tw-r-e">${r.emoji}</div>
            <h3>${r.title}</h3>
            <div class="tw-r-big">${r.big}</div>
            <p>${r.sub}</p>
            <div class="tw-r-xp">+${r.xp} XP${id === daily ? ' (mission du jour ×2)' : ''}</div>
            <div class="tw-r-btns">
                <button class="tw-btn pri" data-replay>Rejouer</button>
                <button class="tw-btn gh" data-close>Retour aux défis</button>
            </div>`;
    }

    /* ---------- Défi 1 : Calcul éclair ---------- */
    const CALC_TIME = 60;
    let cTimer = null, cLeft = 0, cScore = 0, cStreak = 0, cLive = false;
    function genCalc() {
        const st = Math.min(4, Math.floor(cScore / 5));
        const op = st === 0 ? '+' : ['+', '−', '×'][rnd(st < 2 ? 2 : 3)];
        let a, b, ans;
        if (op === '+') { a = 5 + rnd(10 + st * 25); b = 5 + rnd(10 + st * 25); ans = a + b; }
        else if (op === '−') { a = 10 + rnd(20 + st * 30); b = 1 + rnd(a); ans = a - b; }
        else { a = 2 + rnd(4 + st * 2); b = 2 + rnd(4 + st * 2); ans = a * b; }
        const opts = new Set([ans]);
        while (opts.size < 4) {
            const v = ans + (rnd(2) ? 1 : -1) * (1 + rnd(10));
            if (v >= 0) opts.add(v);
        }
        return { text: `${a} ${op} ${b} = ?`, ans, opts: shuffle([...opts]) };
    }
    function nextCalc() {
        const q = genCalc();
        $('#calcQ').textContent = q.text;
        const box = $('#calcOpts');
        box.innerHTML = '';
        q.opts.forEach(v => {
            const b = document.createElement('button');
            b.textContent = v;
            b.addEventListener('click', () => {
                if (!cLive) return;
                if (v === q.ans) {
                    cScore++; cStreak++;
                    b.classList.add('ok');
                    tone(440 + Math.min(cStreak, 10) * 40, 0.15, 0.08);
                    $('#calcScore').textContent = cScore;
                    $('#calcStreak').textContent = cStreak >= 3 ? `🔥 série de ${cStreak}` : '';
                    setTimeout(() => { if (cLive) nextCalc(); }, 130);
                } else {
                    cStreak = 0; cLeft = Math.max(0, cLeft - 3);
                    b.classList.add('ko');
                    tone(180, 0.25, 0.08, 'sawtooth');
                    $('#calcStreak').textContent = '−3 s';
                }
            });
            box.appendChild(b);
        });
    }
    function startCalc() {
        stopCalc(); resetStage('calc');
        cScore = 0; cStreak = 0; cLeft = CALC_TIME; cLive = true;
        $('#calcScore').textContent = 0; $('#calcStreak').textContent = '';
        nextCalc();
        cTimer = setInterval(() => {
            cLeft -= 0.1;
            $('#calcBar').style.width = Math.max(0, cLeft / CALC_TIME * 100) + '%';
            if (cLeft <= 0) endCalc();
        }, 100);
    }
    function stopCalc() { cLive = false; clearInterval(cTimer); cTimer = null; }
    function endCalc() {
        stopCalc();
        const isBest = cScore > S.best.calc;
        if (isBest) S.best.calc = cScore;
        const xp = gain('calc', cScore * 3);
        unlock('first'); if (cScore >= 15) unlock('calc15');
        showResult('calc', {
            emoji: isBest && cScore > 0 ? '🏆' : '⏱️', title: 'Temps écoulé !', big: cScore,
            sub: isBest && cScore > 0 ? 'Nouveau record !' : `Ton record : ${S.best.calc}`, xp
        });
        save(); renderHUD();
    }

    /* ---------- Défi 2 : Séquence mémoire ---------- */
    const PAD_FREQ = [392, 523, 659, 784];
    let sq = [], sIn = 0, sBusy = true, sTimers = [], sRound = 0;
    function lightPad(i, dur = 320) {
        const pad = $(`[data-pad="${i}"]`);
        pad.classList.add('lit');
        tone(PAD_FREQ[i], 0.3, 0.12, 'triangle');
        setTimeout(() => pad.classList.remove('lit'), dur);
    }
    function nextSeqRound() {
        sq.push(rnd(4)); sIn = 0; sBusy = true;
        $('#seqStatus').textContent = 'Regarde bien…';
        const gap = Math.max(340, 640 - sRound * 22);
        sq.forEach((p, i) => sTimers.push(setTimeout(() => lightPad(p, gap - 120), 700 + i * gap)));
        sTimers.push(setTimeout(() => { sBusy = false; $('#seqStatus').textContent = 'À toi !'; }, 700 + sq.length * gap));
    }
    function startSeq() {
        stopSeq(); resetStage('seq');
        sq = []; sRound = 0; $('#seqScore').textContent = 0;
        nextSeqRound();
    }
    function stopSeq() { sTimers.forEach(clearTimeout); sTimers = []; sBusy = true; }
    $$('#seqPads .tw-pad').forEach(p => p.addEventListener('click', () => {
        if (sBusy) return;
        const i = +p.dataset.pad;
        lightPad(i);
        if (i !== sq[sIn]) return endSeq();
        sIn++;
        if (sIn === sq.length) {
            sRound++; sBusy = true;
            $('#seqScore').textContent = sRound;
            $('#seqStatus').textContent = 'Bravo ! Manche suivante…';
            sTimers.push(setTimeout(nextSeqRound, 800));
        }
    }));
    function endSeq() {
        stopSeq();
        tone(160, 0.5, 0.1, 'sawtooth');
        const isBest = sRound > S.best.seq;
        if (isBest) S.best.seq = sRound;
        const xp = gain('seq', sRound * 5);
        unlock('first'); if (sRound >= 7) unlock('seq7');
        showResult('seq', {
            emoji: isBest && sRound > 0 ? '🏆' : '🧠', title: 'Raté… mais bien essayé !', big: sRound,
            sub: isBest && sRound > 0 ? 'Nouveau record !' : `Ton record : ${S.best.seq}`, xp
        });
        save(); renderHUD();
    }

    /* ---------- Défi 3 : Quiz culture ---------- */
    // [question, bonne réponse, ...mauvaises réponses]
    const QUIZ = {
        espace: {
            e: '🪐', n: 'Espace', q: [
                ['Quelle planète est la plus proche du Soleil ?', 'Mercure', 'Vénus', 'Mars', 'La Terre'],
                ['Combien de planètes compte le système solaire ?', '8', '7', '9', '10'],
                ['Quelle planète est la plus célèbre pour ses anneaux ?', 'Saturne', 'Mars', 'Vénus', 'Mercure'],
                ['Comment s\'appelle notre galaxie ?', 'La Voie lactée', 'Andromède', 'Orion', 'Le Grand Chariot'],
                ['Qui a posé le pied sur la Lune en premier ?', 'Neil Armstrong', 'Buzz Aldrin', 'Youri Gagarine', 'Thomas Pesquet'],
                ['Quelle planète est surnommée « la planète rouge » ?', 'Mars', 'Jupiter', 'Mercure', 'Neptune']]
        },
        animaux: {
            e: '🦁', n: 'Animaux', q: [
                ['Quel est le plus grand animal terrestre ?', 'L\'éléphant d\'Afrique', 'La girafe', 'Le rhinocéros', 'L\'hippopotame'],
                ['Combien de pattes a une araignée ?', '8', '6', '10', '4'],
                ['Quel mammifère pond des œufs ?', 'L\'ornithorynque', 'Le dauphin', 'La chauve-souris', 'Le castor'],
                ['Quel animal terrestre court le plus vite ?', 'Le guépard', 'Le lion', 'Le cheval', 'L\'autruche'],
                ['La baleine est un…', 'Mammifère', 'Poisson', 'Reptile', 'Amphibien'],
                ['Combien de cœurs possède une pieuvre ?', '3', '1', '2', '8']]
        },
        monde: {
            e: '🌍', n: 'Monde & sciences', q: [
                ['Quel est le plus grand océan du monde ?', 'L\'océan Pacifique', 'L\'océan Atlantique', 'L\'océan Indien', 'L\'océan Arctique'],
                ['Quel gaz les plantes absorbent-elles pour fabriquer leur nourriture ?', 'Le dioxyde de carbone', 'L\'oxygène', 'L\'azote', 'L\'hélium'],
                ['Quelle est la capitale du Cameroun ?', 'Yaoundé', 'Douala', 'Garoua', 'Bafoussam'],
                ['Combien y a-t-il de continents ?', '7', '5', '6', '8'],
                ['À quelle température l\'eau gèle-t-elle ?', '0 °C', '10 °C', '−10 °C', '100 °C'],
                ['Quel est le plus long fleuve d\'Afrique ?', 'Le Nil', 'Le Congo', 'Le Niger', 'Le Zambèze']]
        }
    };
    let qList = [], qi = 0, qScore = 0, qLock = false, qTheme = '';
    function startQuiz() {
        resetStage('quiz');
        $('#quizPick').hidden = false; $('#quizPlay').hidden = true;
        $('#quizThemes').innerHTML = Object.entries(QUIZ).map(([k, t]) =>
            `<button data-theme="${k}"><i>${t.e}</i>${t.n}</button>`).join('');
        $$('#quizThemes button').forEach(b => b.addEventListener('click', () => beginQuiz(b.dataset.theme)));
    }
    function beginQuiz(theme) {
        qTheme = theme; qi = 0; qScore = 0;
        qList = shuffle(QUIZ[theme].q);
        $('#quizPick').hidden = true; $('#quizPlay').hidden = false;
        showQ();
    }
    function showQ() {
        qLock = false;
        const [text, good, ...bad] = qList[qi];
        $('#quizProg').textContent = `${QUIZ[qTheme].n} · question ${qi + 1} sur ${qList.length}`;
        $('#quizQ').textContent = text;
        const box = $('#quizOpts');
        box.innerHTML = '';
        shuffle([good, ...bad]).forEach(opt => {
            const b = document.createElement('button');
            b.textContent = opt;
            b.addEventListener('click', () => {
                if (qLock) return;
                qLock = true;
                const ok = opt === good;
                b.classList.add(ok ? 'ok' : 'ko');
                if (!ok) $$('#quizOpts button').find(x => x.textContent === good).classList.add('ok');
                if (ok) qScore++;
                tone(ok ? 660 : 180, 0.25, 0.09, ok ? 'sine' : 'sawtooth');
                setTimeout(() => (++qi < qList.length) ? showQ() : endQuiz(), 1000);
            });
            box.appendChild(b);
        });
    }
    function endQuiz() {
        const perfect = qScore === qList.length;
        const isBest = qScore > S.best.quiz;
        if (isBest) S.best.quiz = qScore;
        const xp = gain('quiz', qScore * 5 + (perfect ? 10 : 0));
        unlock('first'); if (perfect) unlock('quiz');
        showResult('quiz', {
            emoji: perfect ? '🎓' : '🌍', title: perfect ? 'Sans faute !' : 'Quiz terminé !',
            big: `${qScore}/${qList.length}`, sub: perfect ? 'Tu es un vrai explorateur du savoir.' : 'Rejoue pour faire encore mieux.', xp
        });
        save(); renderHUD();
    }

    /* ---------- Atelier pixel art ---------- */
    const N = 16;
    const PAL = ['#0B1230', '#FFFFFF', '#FF4B4B', '#FF9A3C', '#FFD93B', '#B6F24A', '#2FBF71', '#29D3F5', '#3B6BFF', '#8E5BFF', '#FF4FA3', '#8B5A3C'];
    const px = $('#pxCanvas'), pctx = px.getContext('2d');
    let grid = Array(N * N).fill(null), pcur = PAL[2], perase = false, painting = false;
    function drawPx() {
        const c = px.width / N;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const v = grid[y * N + x];
            pctx.fillStyle = v || ((x + y) % 2 ? '#EEF1FA' : '#FFFFFF');
            pctx.fillRect(x * c, y * c, c, c);
        }
        pctx.strokeStyle = 'rgba(18,32,74,.08)'; pctx.lineWidth = 1;
        for (let i = 1; i < N; i++) {
            pctx.beginPath(); pctx.moveTo(i * c, 0); pctx.lineTo(i * c, px.height); pctx.stroke();
            pctx.beginPath(); pctx.moveTo(0, i * c); pctx.lineTo(px.width, i * c); pctx.stroke();
        }
    }
    function paintAt(e) {
        const r = px.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left) / r.width * N);
        const y = Math.floor((e.clientY - r.top) / r.height * N);
        if (x < 0 || y < 0 || x >= N || y >= N) return;
        const v = perase ? null : pcur;
        if (grid[y * N + x] !== v) { grid[y * N + x] = v; drawPx(); }
    }
    px.addEventListener('pointerdown', e => { painting = true; px.setPointerCapture(e.pointerId); paintAt(e); });
    px.addEventListener('pointermove', e => { if (painting) paintAt(e); });
    ['pointerup', 'pointercancel'].forEach(ev => px.addEventListener(ev, () => painting = false));

    $('#pxPalette').innerHTML = PAL.map((c, i) => `<button class="tw-sw ${i === 2 ? 'on' : ''}" style="--c:${c}" data-c="${c}" aria-label="Couleur ${i + 1}"></button>`).join('');
    $$('#pxPalette .tw-sw').forEach(b => b.addEventListener('click', () => {
        $$('#pxPalette .tw-sw').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); pcur = b.dataset.c; perase = false;
        $('#pxErase').classList.remove('on');
    }));
    $('#pxErase').addEventListener('click', function () { perase = !perase; this.classList.toggle('on', perase); });
    $('#pxClear').addEventListener('click', () => { grid.fill(null); drawPx(); });
    $('#pxSave').addEventListener('click', () => {
        if (grid.every(v => !v)) { toast('🎨 Dessine d\'abord quelque chose !'); return; }
        const out = document.createElement('canvas');
        out.width = out.height = N * 20;
        const o = out.getContext('2d');
        grid.forEach((v, i) => { if (v) { o.fillStyle = v; o.fillRect((i % N) * 20, Math.floor(i / N) * 20, 20, 20); } });
        const a = document.createElement('a');
        a.href = out.toDataURL('image/png'); a.download = 'mon-pixel-art.png';
        document.body.appendChild(a); a.click(); a.remove();
        if (!S.badges.art) addXP(15);
        unlock('art');
        toast('💾 Image enregistrée !');
    });
    drawPx();

    /* ---------- Télé ---------- */
    // ➕ POUR AJOUTER UNE ÉMISSION : copie un bloc et modifie-le.
    //   type : 'file'    → vidéo hébergée avec ton site (ex. assets/tv/episode1.mp4)
    //          'youtube' → src = identifiant de la vidéo YouTube (miniature automatique)
    const TV = [
        // {
        //     title: 'Les Explorateurs · Épisode 1',
        //     desc: 'La mission secrète',
        //     duration: '8:40',
        //     type: 'youtube',
        //     src: 'ABC123xyz',
        //     poster: '',            // facultatif : ton image de couverture
        //     emoji: '🚀',
        //     color: 'linear-gradient(135deg,#29D3F5,#0B1230)'
        // }
    ];
    const tvModal = $('#twTvModal'), tvScreen = $('#twTvScreen');
    function renderTV() {
        const grid = $('#twTvGrid');
        if (!TV.length) {
            grid.innerHTML = `<div class="tv-empty"><span>🎬</span><h3>Ta télé arrive bientôt !</h3><p>De nouvelles émissions seront ajoutées ici très vite.</p></div>`;
            return;
        }
        grid.innerHTML = TV.map((c, i) => {
            const poster = c.poster || (c.type === 'youtube' ? `https://i.ytimg.com/vi/${c.src}/hqdefault.jpg` : '');
            const style = poster ? `background-image:url('${poster}')` : `background:${c.color || 'linear-gradient(135deg,#29D3F5,#0B1230)'}`;
            return `<button class="tv-card" data-i="${i}">
                <span class="tv-thumb" style="${style}">${poster ? '' : `<span class="e">${c.emoji || '🎬'}</span>`}
                    <span class="tv-play">▶</span>${c.duration ? `<span class="tv-dur">${c.duration}</span>` : ''}</span>
                <span class="tv-info"><strong>${c.title}</strong><small>${c.desc || ''}</small></span></button>`;
        }).join('');
        $$('.tv-card').forEach(card => card.addEventListener('click', () => openTV(+card.dataset.i)));
    }
    function openTV(i) {
        const c = TV[i]; if (!c) return;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (typeof stopMelody === 'function') stopMelody();
        if (c.type === 'youtube') {
            tvScreen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.src)}?autoplay=1&rel=0&modestbranding=1"
                title="${c.title.replace(/"/g, '&quot;')}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
        } else {
            const v = document.createElement('video');
            v.controls = v.autoplay = v.playsInline = true;
            if (c.poster) v.poster = c.poster;
            v.src = c.src;
            tvScreen.innerHTML = ''; tvScreen.appendChild(v);
            v.addEventListener('error', () => { tvScreen.innerHTML = `<div class="tv-err">😢 Vidéo introuvable.<br>Vérifie le chemin : ${c.src}</div>`; });
        }
        $('#twTvTitle').textContent = c.title;
        tvModal.classList.add('active');
        tvModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function closeTV() {
        tvScreen.innerHTML = '';
        tvModal.classList.remove('active');
        tvModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    $('#twTvClose').addEventListener('click', closeTV);
    tvModal.addEventListener('click', e => { if (e.target === tvModal) closeTV(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tvModal.classList.contains('active')) closeTV(); });

    /* ---------- Démarrage ---------- */
    /* ---------- API pour les jeux supplémentaires (explorers-plus.js) ---------- */
    const CATS = { logique: '🧩 Logique', maths: '🔢 Maths', mots: '🔤 Mots', memoire: '🧠 Mémoire', culture: '🌍 Culture' };
    function register(def) {
        const st = document.createElement('div');
        st.className = 'tw-panel tw-stage'; st.id = 'st-' + def.id; st.hidden = true;
        st.innerHTML = `<div class="tw-stage-top"><button class="tw-ghost" data-close>← Défis</button>
            <div class="tw-stat">${def.emoji} ${def.title} · Meilleur : <b data-bind="best-${def.id}">0</b></div></div>
            <div class="tw-play"></div><div class="tw-result" hidden></div>`;
        $('#tw-games .tw-wrap').appendChild(st);
        if (S.best[def.id] === undefined) S.best[def.id] = 0;
        STAGES[def.id] = { start: () => { resetStage(def.id); def.start($('.tw-play', st)); }, stop: def.stop };
        let more = $('#twMore');
        if (!more) { more = document.createElement('div'); more.id = 'twMore'; $('#twPicker').appendChild(more); }
        let grid = $('#cat-' + def.cat, more);
        if (!grid) {
            more.insertAdjacentHTML('beforeend', `<h3 class="tw-cat">${CATS[def.cat]}</h3><div class="tw-cards" id="cat-${def.cat}"></div>`);
            grid = $('#cat-' + def.cat, more);
        }
        const card = document.createElement('button');
        card.className = 'tw-mcard'; card.style.setProperty('--c', def.color); card.dataset.open = def.id;
        card.innerHTML = `<span class="ico">${def.emoji}</span><strong>${def.title}</strong><span class="d">${def.desc}</span>`;
        card.addEventListener('click', () => openStage(def.id));
        grid.appendChild(card);
        DAILY_IDS.push(def.id); DAILY_NAMES[def.id] = def.title;
    }
    window.TW = { S, BADGES, level, addXP, gain, unlock, toast, tone, save, renderHUD, showResult, rnd, shuffle, register, setDaily, $, $$, app };

    setDaily();
    renderTV();
    renderHUD();
})();

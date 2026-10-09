/* =========================================================
   EXPLORERS PLUS — 10 jeux supplémentaires, 5 paliers chacun
   À charger APRÈS explorers.js
   ========================================================= */
(function () {
    if (!window.TW) return;
    const T = window.TW, rnd = T.rnd, shuffle = T.shuffle;
    const pick = a => a[rnd(a.length)];
    const $ = (s, r) => r.querySelector(s);

    // Les paliers s'ouvrent avec le niveau du joueur : de 8 à 12 ans, il y a toujours du challenge.
    const TIERS = [
        { n: 'Débutant', e: '🌱', lvl: 1 }, { n: 'Confirmé', e: '🌿', lvl: 3 },
        { n: 'Expert', e: '🌳', lvl: 5 }, { n: 'Maître', e: '🔥', lvl: 8 }, { n: 'Légende', e: '👑', lvl: 12 }
    ];
    let cleanup = () => { };
    const stopAll = () => { cleanup(); cleanup = () => { }; };

    function pickTier(root, title, desc, run) {
        const lvl = T.level();
        root.innerHTML = `<div class="tw-qtext">${title}</div><p class="tw-sub" style="margin-bottom:16px">${desc}</p>
            <div class="tw-tiers">${TIERS.map((t, i) => {
            const lk = lvl < t.lvl; return `<button data-t="${i + 1}" class="${lk ? 'lock' : ''}">
                <i>${lk ? '🔒' : t.e}</i><b>${t.n}</b><small>${lk ? 'Niveau ' + t.lvl : 'Ouvert'}</small></button>`;
        }).join('')}</div>`;
        root.querySelectorAll('.tw-tiers button').forEach(b => b.addEventListener('click', () => {
            if (b.classList.contains('lock')) { T.toast(`🔒 Atteins le niveau ${TIERS[b.dataset.t - 1].lvl} pour ouvrir ce palier`); return; }
            run(+b.dataset.t);
        }));
    }
    function finish(id, tier, o) {
        const S = T.S;
        const isBest = o.points > (S.best[id] || 0);
        if (isBest) S.best[id] = o.points;
        const xp = T.gain(id, o.xp);
        S.badges['p_' + id] = 1;
        T.unlock('first');
        if (Object.keys(S.badges).filter(k => k.startsWith('p_')).length >= 6) T.unlock('touche');
        if (tier === 5 && o.win !== false) T.unlock('maitre');
        T.showResult(id, { emoji: o.emoji, title: o.title, big: o.big, sub: (isBest && o.points > 0 ? '🏆 Nouveau record ! ' : '') + o.sub, xp });
        T.save(); T.renderHUD();
    }

    /* ----- Moteur QCM réutilisé par plusieurs jeux ----- */
    function mcRun(root, id, tier, n, make) {
        let i = 0, score = 0;
        const show = () => {
            const q = make(tier, i);
            root.innerHTML = `<div class="tw-prog">Question ${i + 1} sur ${n} · ${TIERS[tier - 1].n}</div>
                <div class="${q.big ? 'tw-q' : 'tw-qtext'}">${q.prompt}</div><div class="tw-opts ${q.big ? '' : 'quiz'}"></div>`;
            const box = $('.tw-opts', root); let lock = false;
            shuffle(q.opts).forEach(o => {
                const b = document.createElement('button'); b.textContent = o;
                b.addEventListener('click', () => {
                    if (lock) return; lock = true;
                    const ok = String(o) === String(q.ans);
                    b.classList.add(ok ? 'ok' : 'ko');
                    if (!ok) [...box.children].find(x => x.textContent === String(q.ans)).classList.add('ok');
                    if (ok) score++;
                    T.tone(ok ? 660 : 180, 0.25, 0.09, ok ? 'sine' : 'sawtooth');
                    setTimeout(() => (++i < n) ? show() : done(), ok ? 650 : 1400);
                });
                box.appendChild(b);
            });
        };
        const done = () => finish(id, tier, {
            points: score * tier, xp: score * tier * 3 + (score === n ? 10 : 0), emoji: score === n ? '🏆' : '🎯',
            title: score === n ? 'Sans faute !' : 'Défi terminé', big: `${score}/${n}`, sub: `Palier ${TIERS[tier - 1].n}`
        });
        show();
    }
    const near = (a, sp = 6) => { const s = new Set([a]); while (s.size < 4) { const v = a + (rnd(2) ? 1 : -1) * (1 + rnd(sp)); if (v >= 0) s.add(v); } return [...s]; };

    /* =========== 1. SUITE LOGIQUE =========== */
    const L6 = f => Array.from({ length: 6 }, (_, i) => f(i));
    const SG = {
        ar: () => { const a = 1 + rnd(15), d = 2 + rnd(8); return L6(i => a + i * d); },
        ard: () => { const d = 3 + rnd(10), a = 60 + rnd(60); return L6(i => a - i * d); },
        dbl: () => { const a = 1 + rnd(4); return L6(i => a * 2 ** i); },
        sq: () => { const o = rnd(10); return L6(i => (i + 1 + o) ** 2); },
        tri3: () => { const a = 1 + rnd(3); return L6(i => a * 3 ** i); },
        alt: () => { const a = 1 + rnd(10), x = 2 + rnd(5), y = 1 + rnd(4), s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? x : y)); return s; },
        grow: () => { const a = rnd(10), d = 1 + rnd(3), s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d * i); return s; },
        fib: () => { const s = [1 + rnd(4), 2 + rnd(5)]; for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); return s; },
        lin: () => { const m = 2 + rnd(2), c = 1 + rnd(3), s = [1 + rnd(3)]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * m + c); return s; },
        cube: () => { const o = rnd(2); return L6(i => (i + 1 + o) ** 3); },
        inter: () => { const a = 1 + rnd(10), d = 2 + rnd(4), b = 30 + rnd(30), e = 2 + rnd(5); return L6(i => i % 2 ? b - (i >> 1) * e : a + (i >> 1) * d); }
    };
    const SG_T = [['ar'], ['ar', 'ard', 'dbl'], ['sq', 'alt', 'tri3', 'ard'], ['grow', 'fib', 'lin', 'alt'], ['cube', 'inter', 'lin', 'grow', 'fib']];
    T.register({
        id: 'suite', cat: 'logique', title: 'Suite logique', emoji: '🔮', color: '#8E5BFF',
        desc: 'Trouve le nombre qui continue la suite. Des règles de plus en plus cachées.',
        start: root => pickTier(root, 'Suite logique', 'Quelle règle se cache derrière ces nombres ?', t =>
            mcRun(root, 'suite', t, 8, tier => {
                const s = SG[pick(SG_T[tier - 1])]();
                return { prompt: s.slice(0, 5).join(' , ') + ' , ?', ans: s[5], opts: near(s[5], 4 + tier * 3), big: true };
            }))
    });

    /* =========== 2. PROBLÈMES MALINS =========== */
    const NAMES = ['Léa', 'Tom', 'Inès', 'Karim', 'Amina', 'Noah', 'Sofia', 'Yanis'];
    const nm = () => pick(NAMES);
    const hm = m => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
    const PB = [
        [() => { const a = 8 + rnd(20), b = 3 + rnd(9); return { prompt: `${nm()} a ${a} billes et en gagne ${b}. Combien en a-t-il maintenant ?`, ans: a + b }; },
        () => { const a = 20 + rnd(30), b = 5 + rnd(15); return { prompt: `${nm()} a ${a} images et en donne ${b}. Combien lui en reste-t-il ?`, ans: a - b }; }],
        [() => { const a = 3 + rnd(7), b = 3 + rnd(7); return { prompt: `Une boîte contient ${a} gâteaux. Combien de gâteaux y a-t-il dans ${b} boîtes ?`, ans: a * b }; },
        () => { const a = 3 + rnd(7), b = 3 + rnd(8); return { prompt: `${a * b} élèves forment des équipes de ${a}. Combien d'équipes y a-t-il ?`, ans: b }; }],
        [() => { const a = 2 + rnd(5), p = 3 + rnd(6), q = 2 + rnd(8); return { prompt: `${nm()} achète ${a} cahiers à ${p} € et un stylo à ${q} €. Combien paie-t-il en tout (en €) ?`, ans: a * p + q }; },
        () => { const a = 4 + rnd(6), b = 2 + rnd(4), c = 5 + rnd(10); return { prompt: `Un train a ${a} wagons de ${b * 5} places. ${c} places sont libres. Combien de voyageurs y a-t-il ?`, ans: a * b * 5 - c }; }],
        [() => { const p = [20, 40, 60, 80][rnd(4)], r = [10, 25, 50][rnd(3)]; return { prompt: `Un jeu coûte ${p} €. Il est en promotion à −${r} %. Quel est son nouveau prix (en €) ?`, ans: p - p * r / 100 }; },
        () => {
            const st = (13 + rnd(5)) * 60 + [10, 20, 30, 40, 50][rnd(5)], d = [45, 50, 75, 95][rnd(4)], e = st + d, ans = hm(e);
            return { prompt: `Un film dure ${d} minutes et commence à ${hm(st)}. À quelle heure finit-il ?`, ans, opts: [ans, hm(e + 10), hm(e - 10), hm(e + 20)] };
        }],
        [() => { const m = 2 + rnd(4), k = 3 + rnd(9), x = 3 + rnd(12); return { prompt: `Je pense à un nombre. Je le multiplie par ${m}, puis j'ajoute ${k} : j'obtiens ${m * x + k}. Quel est ce nombre ?`, ans: x }; },
        () => { const avg = 10 + rnd(7), a = avg - 2 - rnd(3), b = avg + rnd(3), c = 3 * avg - a - b; return { prompt: `${nm()} a eu ${a}, ${b} et ${c} à trois contrôles. Quelle est sa moyenne ?`, ans: avg }; },
        () => { const L = 8 + rnd(10), l = 3 + rnd(5); return { prompt: `Un rectangle a une longueur de ${L} cm et un périmètre de ${2 * (L + l)} cm. Quelle est sa largeur (en cm) ?`, ans: l }; }]
    ];
    T.register({
        id: 'problemes', cat: 'maths', title: 'Problèmes malins', emoji: '🧮', color: '#29D3F5',
        desc: 'De la petite addition aux pourcentages, aux heures et aux nombres mystères.',
        start: root => pickTier(root, 'Problèmes malins', 'Lis bien l\'énoncé, puis choisis la bonne réponse.', t =>
            mcRun(root, 'problemes', t, 8, tier => { const q = pick(PB[tier - 1])(); return { prompt: q.prompt, ans: q.ans, opts: q.opts || near(q.ans, 3 + tier * 2) }; }))
    });

    /* =========== 3. QUIZ GÉANT =========== */
    // [palier, question, bonne réponse, mauvaise, mauvaise, mauvaise]
    const QG = {
        geo: ['🗺️ Géographie', [
            [1, 'Quel est le plus grand continent ?', 'L\'Asie', 'L\'Afrique', 'L\'Europe', 'L\'Amérique'],
            [1, 'Quelle est la capitale de la France ?', 'Paris', 'Lyon', 'Marseille', 'Bordeaux'],
            [2, 'Quel pays a la forme d\'une botte ?', 'L\'Italie', 'L\'Espagne', 'La Grèce', 'Le Portugal'],
            [2, 'Quelle est la capitale du Sénégal ?', 'Dakar', 'Abidjan', 'Bamako', 'Accra'],
            [3, 'Quelle est la plus haute montagne du monde ?', 'L\'Everest', 'Le Mont Blanc', 'Le Kilimandjaro', 'L\'Aconcagua'],
            [4, 'Quel pays africain a pour capitale Nairobi ?', 'Le Kenya', 'La Tanzanie', 'L\'Ouganda', 'L\'Éthiopie'],
            [4, 'Quel est le plus grand désert chaud du monde ?', 'Le Sahara', 'Le Kalahari', 'Le Gobi', 'L\'Atacama'],
            [5, 'Quel est le plus petit pays du monde ?', 'Le Vatican', 'Monaco', 'Saint-Marin', 'Malte']]],
        sci: ['🔬 Sciences', [
            [1, 'Sur quelle planète habitons-nous ?', 'La Terre', 'Mars', 'Vénus', 'Jupiter'],
            [1, 'Comment appelle-t-on l\'eau gelée ?', 'La glace', 'La vapeur', 'La rosée', 'Le nuage'],
            [2, 'Quel organe pompe le sang dans le corps ?', 'Le cœur', 'Le foie', 'Les poumons', 'Le cerveau'],
            [2, 'Quelle est la formule chimique de l\'eau ?', 'H₂O', 'CO₂', 'O₂', 'NaCl'],
            [3, 'Quelle force nous attire vers le sol ?', 'La gravité', 'Le magnétisme', 'Le vent', 'La friction'],
            [4, 'Quel élément chimique a pour symbole Fe ?', 'Le fer', 'Le fluor', 'Le francium', 'Le plomb'],
            [4, 'Combien d\'os possède un adulte (environ) ?', '206', '106', '306', '412'],
            [5, 'Quelle est la vitesse approximative de la lumière ?', '300 000 km/s', '30 000 km/s', '3 000 km/s', '3 millions km/s']]],
        his: ['🏛️ Histoire', [
            [1, 'Comment appelait-on les rois d\'Égypte ?', 'Les pharaons', 'Les empereurs', 'Les sultans', 'Les tsars'],
            [2, 'Quel peuple a construit les pyramides de Gizeh ?', 'Les Égyptiens', 'Les Romains', 'Les Grecs', 'Les Mayas'],
            [2, 'Quel navigateur a atteint l\'Amérique en 1492 ?', 'Christophe Colomb', 'Magellan', 'Vasco de Gama', 'Marco Polo'],
            [3, 'En quelle année a eu lieu la Révolution française ?', '1789', '1492', '1815', '1914'],
            [3, 'Qui fut le premier président du Cameroun ?', 'Ahmadou Ahidjo', 'Paul Biya', 'Ruben Um Nyobè', 'John Ngu Foncha'],
            [4, 'Quelle civilisation a inventé les Jeux olympiques ?', 'La Grèce antique', 'Rome', 'L\'Égypte', 'Carthage'],
            [4, 'Quelle guerre s\'est terminée en 1945 ?', 'La Seconde Guerre mondiale', 'La Première Guerre mondiale', 'La guerre de Cent Ans', 'La guerre de Corée'],
            [5, 'Qui fut le dernier empereur des Français ?', 'Napoléon III', 'Napoléon Ier', 'Louis XVI', 'Charles X']]],
        nat: ['🌿 Nature', [
            [1, 'Combien de pattes a un insecte ?', '6', '4', '8', '10'],
            [1, 'Quel animal est surnommé le roi de la savane ?', 'Le lion', 'L\'éléphant', 'Le zèbre', 'La girafe'],
            [2, 'Avec quoi les abeilles fabriquent-elles le miel ?', 'Le nectar des fleurs', 'L\'eau', 'Le sable', 'Le sucre'],
            [2, 'Quel est le plus grand animal du monde ?', 'La baleine bleue', 'L\'éléphant', 'Le requin-baleine', 'La girafe'],
            [3, 'Un animal qui mange uniquement des plantes est un…', 'Herbivore', 'Carnivore', 'Omnivore', 'Insectivore'],
            [3, 'Quelle partie de la plante absorbe l\'eau du sol ?', 'Les racines', 'Les feuilles', 'Les fleurs', 'La tige'],
            [4, 'Quel est le seul mammifère capable de voler vraiment ?', 'La chauve-souris', 'L\'écureuil volant', 'Le pangolin', 'Le koala'],
            [5, 'Comment s\'appelle la transformation de la chenille en papillon ?', 'La métamorphose', 'La photosynthèse', 'L\'hibernation', 'La germination']]],
        cul: ['🎭 Culture', [
            [1, 'Quelle langue parle-t-on principalement au Brésil ?', 'Le portugais', 'L\'espagnol', 'L\'anglais', 'Le français'],
            [2, 'Combien de joueurs par équipe sur le terrain au football ?', '11', '9', '10', '12'],
            [2, 'Quel instrument possède 88 touches ?', 'Le piano', 'La guitare', 'Le violon', 'La flûte'],
            [3, 'Quel peintre a réalisé la Joconde ?', 'Léonard de Vinci', 'Picasso', 'Van Gogh', 'Monet'],
            [3, 'Quelle langue a le plus de locuteurs natifs ?', 'Le mandarin', 'L\'anglais', 'L\'espagnol', 'L\'hindi'],
            [4, 'Dans quelle ville ont eu lieu les JO d\'été de 2016 ?', 'Rio de Janeiro', 'Pékin', 'Londres', 'Tokyo'],
            [4, 'Combien de notes comporte la gamme (do, ré, mi…) ?', '7', '5', '8', '12'],
            [5, 'Qui a écrit « Le Petit Prince » ?', 'Antoine de Saint-Exupéry', 'Jules Verne', 'Victor Hugo', 'Molière']]]
    };
    T.register({
        id: 'quizgeant', cat: 'culture', title: 'Quiz géant', emoji: '🎓', color: '#FF4FA3',
        desc: '5 thèmes et 5 paliers : géographie, sciences, histoire, nature, culture.',
        start: root => pickTier(root, 'Quiz géant', 'Les questions deviennent plus difficiles à chaque palier.', t => {
            root.innerHTML = `<div class="tw-qtext">Quel thème ?</div><div class="tw-themes">
                <button data-k="mix"><i>🎲</i>Tout mélangé</button>
                ${Object.entries(QG).map(([k, v]) => `<button data-k="${k}"><i>${v[0].split(' ')[0]}</i>${v[0].split(' ').slice(1).join(' ')}</button>`).join('')}</div>`;
            root.querySelectorAll('.tw-themes button').forEach(b => b.addEventListener('click', () => {
                const pool = (b.dataset.k === 'mix' ? Object.values(QG).flatMap(v => v[1]) : QG[b.dataset.k][1]);
                const list = shuffle(pool).sort((x, y) => Math.abs(x[0] - t) - Math.abs(y[0] - t)).slice(0, 8);
                mcRun(root, 'quizgeant', t, list.length, (tier, i) => { const [, q, g, ...bad] = list[i]; return { prompt: q, ans: g, opts: [g, ...bad] }; });
            }));
        })
    });

    /* =========== 4. LUMIÈRES (Lights Out) =========== */
    function lights(root, tier) {
        const n = [3, 4, 5, 5, 6][tier - 1], presses = [3, 5, 7, 10, 14][tier - 1];
        let g = Array(n * n).fill(0), moves = 0;
        const press = i => { const x = i % n, y = Math.floor(i / n);[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < n && b < n) g[b * n + a] ^= 1; }); };
        do { g.fill(0); for (let k = 0; k < presses; k++) press(rnd(n * n)); } while (!g.some(v => v));
        const render = () => {
            root.innerHTML = `<div class="tw-score"><span>Éteins toutes les lumières</span><span>Coups : <b>${moves}</b></span></div>
                <div class="tw-lg" style="grid-template-columns:repeat(${n},1fr)">${g.map((v, i) => `<button class="tw-cell ${v ? 'on' : ''}" data-i="${i}" aria-label="Case ${i + 1}"></button>`).join('')}</div>
                <p class="tw-status">Toucher une case change aussi ses 4 voisines.</p>`;
            root.querySelectorAll('.tw-cell').forEach(c => c.addEventListener('click', () => {
                press(+c.dataset.i); moves++; T.tone(300 + rnd(300), 0.12, 0.07);
                if (!g.some(v => v)) finish('lumieres', tier, { points: tier * 10 + Math.max(0, 20 - moves), xp: tier * 12, emoji: '💡', title: 'Tout est éteint !', big: moves, sub: 'coups utilisés' });
                else render();
            }));
        };
        render();
    }
    T.register({
        id: 'lumieres', cat: 'logique', title: 'Lumières', emoji: '💡', color: '#FFB93B',
        desc: 'Éteins toutes les cases. Chaque clic change aussi les voisines : réfléchis !',
        start: root => pickTier(root, 'Lumières', 'La grille grandit à chaque palier.', t => lights(root, t)), stop: stopAll
    });

    /* =========== 5. LABYRINTHE =========== */
    function maze(root, tier) {
        stopAll();
        const n = [6, 8, 10, 13, 16][tier - 1];
        const W = Array.from({ length: n * n }, () => [1, 1, 1, 1]), seen = Array(n * n).fill(0), st = [0];
        const D = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]];
        seen[0] = 1;
        while (st.length) {
            const c = st[st.length - 1], x = c % n, y = (c / n) | 0;
            const o = D.filter(([dx, dy]) => { const a = x + dx, b = y + dy; return a >= 0 && b >= 0 && a < n && b < n && !seen[b * n + a]; });
            if (!o.length) { st.pop(); continue; }
            const [dx, dy, w, op] = pick(o), nx = (y + dy) * n + x + dx;
            W[c][w] = 0; W[nx][op] = 0; seen[nx] = 1; st.push(nx);
        }
        root.innerHTML = `<div class="tw-score"><span>Mène la boule rose jusqu'à l'étoile ⭐</span><span>Pas : <b id="mzMoves">0</b></span></div>
            <canvas class="tw-mz" width="480" height="480"></canvas>
            <div class="tw-dpad"><button data-d="0">▲</button><button data-d="3">◀</button><button data-d="2">▼</button><button data-d="1">▶</button></div>`;
        const cv = $('canvas', root), c = cv.getContext('2d'), cs = cv.width / n;
        let p = 0, moves = 0, over = false; const t0 = Date.now();
        const line = (a, b, x, y) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); };
        const draw = () => {
            c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
            c.font = `${cs * .7}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', cv.width - cs / 2, cv.height - cs / 2);
            c.strokeStyle = '#0B1230'; c.lineWidth = Math.max(2, cs / 9); c.lineCap = 'round';
            W.forEach((w, i) => { const x = (i % n) * cs, y = ((i / n) | 0) * cs; if (w[0]) line(x, y, x + cs, y); if (w[1]) line(x + cs, y, x + cs, y + cs); if (w[2]) line(x, y + cs, x + cs, y + cs); if (w[3]) line(x, y, x, y + cs); });
            c.fillStyle = '#FF4FA3'; c.beginPath(); c.arc((p % n + .5) * cs, (((p / n) | 0) + .5) * cs, cs * .3, 0, 7); c.fill();
        };
        const move = d => {
            if (over || W[p][d]) return;
            p += D[d][1] * n + D[d][0]; moves++; $('#mzMoves', root).textContent = moves; T.tone(260 + (moves % 5) * 30, 0.06, 0.04); draw();
            if (p === n * n - 1) {
                over = true; const sec = Math.round((Date.now() - t0) / 1000);
                finish('labyrinthe', tier, { points: tier * 10 + Math.max(0, Math.round(n * n * .5 - sec)), xp: tier * 10 + 5, emoji: '🧭', title: 'Sortie trouvée !', big: sec + ' s', sub: `${moves} pas` });
            }
        };
        const onKey = e => { const d = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } };
        document.addEventListener('keydown', onKey); cleanup = () => document.removeEventListener('keydown', onKey);
        root.querySelectorAll('.tw-dpad button').forEach(b => b.addEventListener('click', () => move(+b.dataset.d)));
        draw();
    }
    T.register({
        id: 'labyrinthe', cat: 'logique', title: 'Labyrinthe', emoji: '🧭', color: '#2FBF71',
        desc: 'Un labyrinthe différent à chaque partie, de plus en plus grand. Flèches du clavier ou boutons.',
        start: root => pickTier(root, 'Labyrinthe', 'Trouve le chemin le plus vite possible.', t => maze(root, t)), stop: stopAll
    });

    /* =========== 6. CODE SECRET (Mastermind) =========== */
    const PEG = ['#FF4B4B', '#FFD93B', '#2FBF71', '#29D3F5', '#8E5BFF', '#FF4FA3', '#FF9A3C'];
    function codeGame(root, tier) {
        const len = [3, 4, 4, 5, 5][tier - 1], nc = [4, 5, 6, 6, 7][tier - 1], max = 10;
        const secret = Array.from({ length: len }, () => rnd(nc)); let cur = [], rows = [];
        const fb = g => {
            const b = g.filter((v, i) => v === secret[i]).length;
            let tot = 0; for (let k = 0; k < nc; k++) tot += Math.min(g.filter(v => v === k).length, secret.filter(v => v === k).length);
            return [b, tot - b];
        };
        const peg = v => `<span class="tw-peg" style="--c:${v === undefined ? 'transparent' : PEG[v]}"></span>`;
        const render = () => {
            root.innerHTML = `<div class="tw-score"><span>Trouve le code de ${len} couleurs</span><span>Essais restants : <b>${max - rows.length}</b></span></div>
                <div class="tw-hist">${rows.map(([g, [b, w]]) => `<div class="tw-row">${g.map(peg).join('')}<em>${'⚫'.repeat(b)}${'⚪'.repeat(w)}${b + w === 0 ? '—' : ''}</em></div>`).join('')}
                <div class="tw-row cur">${Array.from({ length: len }, (_, i) => peg(cur[i])).join('')}</div></div>
                <div class="tw-pal">${PEG.slice(0, nc).map((c, i) => `<button class="tw-sw" style="--c:${c}" data-c="${i}" aria-label="Couleur ${i + 1}"></button>`).join('')}</div>
                <div class="tw-r-btns"><button class="tw-btn gh" data-act="del">⌫ Effacer</button><button class="tw-btn pri" data-act="ok" ${cur.length < len ? 'disabled' : ''}>Valider</button></div>
                <p class="tw-status">⚫ bonne couleur au bon endroit · ⚪ bonne couleur au mauvais endroit</p>`;
            root.querySelectorAll('.tw-pal button').forEach(b => b.addEventListener('click', () => { if (cur.length < len) { cur.push(+b.dataset.c); T.tone(400 + cur.length * 60, 0.1, 0.06); render(); } }));
            $('[data-act="del"]', root).addEventListener('click', () => { cur.pop(); render(); });
            $('[data-act="ok"]', root).addEventListener('click', () => {
                const f = fb(cur); rows.push([cur, f]);
                if (f[0] === len) return finish('code', tier, { points: tier * 10 + (max - rows.length) * 2, xp: tier * 12, emoji: '🔓', title: 'Code déchiffré !', big: rows.length, sub: 'essais utilisés' });
                if (rows.length >= max) return finish('code', tier, { points: 0, xp: tier * 3, win: false, emoji: '🔒', title: 'Coffre verrouillé', big: '✗', sub: 'Le code était : ' + secret.map(v => peg(v)).join('') });
                cur = []; render();
            });
        };
        render();
    }
    T.register({
        id: 'code', cat: 'logique', title: 'Code secret', emoji: '🔐', color: '#FF4B4B',
        desc: 'Déchiffre le code caché grâce aux indices. Un vrai jeu de détective !',
        start: root => pickTier(root, 'Code secret', 'Plus le palier est haut, plus il y a de couleurs à deviner.', t => codeGame(root, t))
    });

    /* =========== 7. MÉMORY GÉANT =========== */
    const EMO = ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐙', '🦋', '🐢', '🦄', '🐧', '🦉', '🐝', '🐬', '🦒', '🍉', '🚀', '⚽', '🎸', '🌈'];
    function memo(root, tier) {
        const pairs = [6, 8, 10, 12, 15][tier - 1], cols = [4, 4, 5, 6, 6][tier - 1];
        const deck = shuffle([...EMO.slice(0, pairs), ...EMO.slice(0, pairs)]);
        let open = [], found = 0, moves = 0, lock = false;
        root.innerHTML = `<div class="tw-score"><span>Retrouve les ${pairs} paires</span><span>Coups : <b id="mmMoves">0</b></span></div>
            <div class="tw-mem" style="grid-template-columns:repeat(${cols},1fr)">${deck.map((e, i) => `<button class="tw-mc" data-i="${i}">❔</button>`).join('')}</div>`;
        root.querySelectorAll('.tw-mc').forEach(b => b.addEventListener('click', () => {
            const i = +b.dataset.i;
            if (lock || b.classList.contains('up')) return;
            b.classList.add('up'); b.textContent = deck[i]; open.push(b); T.tone(500, 0.08, 0.05);
            if (open.length < 2) return;
            moves++; $('#mmMoves', root).textContent = moves; lock = true;
            const [a, c] = open;
            if (deck[a.dataset.i] === deck[c.dataset.i]) {
                a.classList.add('done'); c.classList.add('done'); found++; open = []; lock = false; T.tone(700, 0.2, 0.08);
                if (found === pairs) finish('memoire', tier, { points: tier * 10 + Math.max(0, pairs * 3 - moves), xp: tier * 10 + 5, emoji: '🧠', title: 'Mémoire parfaite !', big: moves, sub: 'coups utilisés' });
            } else setTimeout(() => { open.forEach(x => { x.classList.remove('up'); x.textContent = '❔'; }); open = []; lock = false; }, 800);
        }));
    }
    T.register({
        id: 'memoire', cat: 'memoire', title: 'Mémory géant', emoji: '🃏', color: '#29D3F5',
        desc: 'De 12 à 30 cartes : retrouve toutes les paires en un minimum de coups.',
        start: root => pickTier(root, 'Mémory géant', 'Le nombre de cartes augmente à chaque palier.', t => memo(root, t))
    });

    /* =========== 8 & 9. MOTS : ANAGRAMMES + PENDU =========== */
    const WORDS = [
        ['LUNE', 'CHAT', 'LIVRE', 'TABLE', 'ROUGE', 'PLAGE', 'FLEUR', 'NUAGE', 'SABLE', 'POMME'],
        ['ORANGE', 'JARDIN', 'PLANTE', 'CHEVAL', 'BATEAU', 'MAISON', 'GARCON', 'SOLEIL'],
        ['VOITURE', 'FENETRE', 'CUISINE', 'PLANETE', 'CHANSON', 'LUMIERE', 'SORCIER', 'DRAGONS'],
        ['MONTAGNE', 'AVENTURE', 'VACANCES', 'ELEPHANT', 'CHOCOLAT', 'PAPILLON', 'CROCODILE', 'TELEPHONE'],
        ['ORDINATEUR', 'ASTRONAUTE', 'TELESCOPE', 'ARCHITECTE', 'EXPLORATEUR', 'HELICOPTERE', 'INTELLIGENT', 'BIBLIOTHEQUE']
    ];
    function anagram(root, tier) {
        const words = shuffle(WORDS[tier - 1]).slice(0, 5); let wi = 0, solved = 0, hints = 0;
        const next = () => {
            if (wi >= words.length) return finish('anagrammes', tier, { points: Math.max(0, solved * tier * 2 - hints), xp: solved * tier * 3 + 5, emoji: '🔤', title: 'Mots terminés !', big: `${solved}/${words.length}`, sub: hints ? `${hints} indice(s) utilisé(s)` : 'sans indice' });
            const w = words[wi]; let letters; do { letters = shuffle(w.split('')); } while (letters.join('') === w);
            let chosen = [], hinted = false;
            const render = () => {
                root.innerHTML = `<div class="tw-prog">Mot ${wi + 1} sur ${words.length} · ${w.length} lettres</div>
                    <div class="tw-word">${Array.from({ length: w.length }, (_, i) => `<span>${chosen[i] !== undefined ? letters[chosen[i]] : ''}</span>`).join('')}</div>
                    <div class="tw-tiles">${letters.map((l, i) => `<button class="tw-tile" data-i="${i}" ${chosen.includes(i) ? 'disabled' : ''}>${l}</button>`).join('')}</div>
                    <div class="tw-r-btns"><button class="tw-btn gh" data-a="del">⌫ Effacer</button><button class="tw-btn gh" data-a="hint">💡 Indice</button></div>
                    <p class="tw-status">${hinted ? 'Le mot commence par « ' + w.slice(0, 2) + ' »' : ''}</p>`;
                root.querySelectorAll('.tw-tile').forEach(b => b.addEventListener('click', () => {
                    chosen.push(+b.dataset.i); T.tone(450 + chosen.length * 40, 0.08, 0.06);
                    if (chosen.length < w.length) return render();
                    if (chosen.map(i => letters[i]).join('') === w) { if (!hinted) solved++; T.tone(780, 0.3, 0.1); render(); $('.tw-word', root).classList.add('good'); wi++; setTimeout(next, 900); }
                    else { T.tone(180, 0.25, 0.08, 'sawtooth'); chosen = []; render(); $('.tw-word', root).classList.add('bad'); }
                }));
                $('[data-a="del"]', root).addEventListener('click', () => { chosen.pop(); render(); });
                $('[data-a="hint"]', root).addEventListener('click', () => { if (!hinted) { hinted = true; hints++; } render(); });
            };
            render();
        };
        next();
    }
    T.register({
        id: 'anagrammes', cat: 'mots', title: 'Mots mélangés', emoji: '🔤', color: '#B6F24A',
        desc: 'Remets les lettres dans l\'ordre pour retrouver le mot caché.',
        start: root => pickTier(root, 'Mots mélangés', 'Touche les lettres dans le bon ordre.', t => anagram(root, t))
    });

    function pendu(root, tier) {
        const words = shuffle(WORDS[tier - 1]).slice(0, 4), lv0 = [8, 7, 7, 6, 6][tier - 1]; let wi = 0, found = 0;
        const next = () => {
            if (wi >= words.length) return finish('pendu', tier, { points: found * tier * 3, xp: found * tier * 4 + 3, emoji: '🎯', title: 'Partie terminée', big: `${found}/${words.length}`, sub: 'mots devinés' });
            const w = words[wi], g = new Set(); let lives = lv0, locked = false;
            const render = (msg = '') => {
                root.innerHTML = `<div class="tw-score"><span>Mot ${wi + 1} sur ${words.length}</span><span>${'❤️'.repeat(lives)}${'🖤'.repeat(lv0 - lives)}</span></div>
                    <div class="tw-word">${w.split('').map(l => `<span>${g.has(l) || msg ? l : ''}</span>`).join('')}</div>
                    <div class="tw-keys">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `<button class="${g.has(l) ? (w.includes(l) ? 'ok' : 'ko') : ''}" ${g.has(l) ? 'disabled' : ''}>${l}</button>`).join('')}</div>
                    <p class="tw-status">${msg}</p>`;
                root.querySelectorAll('.tw-keys button').forEach(b => b.addEventListener('click', () => {
                    if (locked) return; const l = b.textContent; g.add(l);
                    if (w.includes(l)) { T.tone(660, 0.12, 0.07); if (w.split('').every(x => g.has(x))) { locked = true; found++; wi++; T.tone(880, 0.3, 0.1); render('✅ Bravo !'); return void setTimeout(next, 1000); } }
                    else { lives--; T.tone(180, 0.2, 0.08, 'sawtooth'); if (lives <= 0) { locked = true; wi++; render('Raté… c\'était : ' + w); return void setTimeout(next, 1700); } }
                    render();
                }));
            };
            render();
        };
        next();
    }
    T.register({
        id: 'pendu', cat: 'mots', title: 'Le pendu', emoji: '🪢', color: '#FF9A3C',
        desc: 'Devine le mot lettre par lettre avant de perdre toutes tes vies.',
        start: root => pickTier(root, 'Le pendu', 'Les mots s\'allongent à chaque palier.', t => pendu(root, t))
    });

    /* ---------- Finalisation ---------- */
    const sub = T.$('#twPicker .tw-sub');
    if (sub) sub.textContent = 'Plus de dix défis, classés par catégorie. Chaque palier s\'ouvre quand tu montes en niveau.';
    T.setDaily(); T.renderHUD();
})();
/* =========================================================
   EXPLORERS — ATELIERS (compétences pour la vie)
   À charger APRÈS explorers.js (et explorers-plus.js)
   Transforme l'onglet Atelier en hub : le pixel art devient
   un atelier parmi d'autres, sans toucher au HTML.
   ========================================================= */
(function () {
    if (!window.TW) return;
    const T = window.TW, S = T.S, rnd = T.rnd, shuffle = T.shuffle, pick = a => a[rnd(a.length)];
    const page = document.getElementById('tw-atelier');
    if (!page) return;
    const wrap = page.querySelector('.tw-wrap');
    const $ = (s, r = document) => r.querySelector(s);

    /* ---------- Squelette : hub + scène ---------- */
    const pxBox = document.createElement('div');
    [...wrap.children].slice(2).forEach(n => pxBox.appendChild(n));   // on garde l'atelier pixel art, listeners compris
    wrap.innerHTML = `
        <div id="atHub"><h2>Ateliers</h2>
            <p class="tw-sub">Apprends en faisant : cuisine, code, musique, argent, secours… chaque atelier t'apprend un vrai savoir-faire.</p>
            <div id="atCats"></div></div>
        <div class="tw-panel" id="atStage" hidden>
            <div class="tw-stage-top"><button class="tw-ghost" id="atBack">← Ateliers</button><div class="tw-stat" id="atTitle"></div></div>
            <div id="atBody"></div></div>`;
    const hub = $('#atHub'), stage = $('#atStage'), body = $('#atBody');
    const LIST = [], CATS = { cuisine: '🍳 Cuisine', vie: '🛠️ Savoir-faire', code: '💻 Code & logique', creer: '🎨 Créer' };
    let cleanup = () => { }, cur = null;

    function openAt(id) {
        const d = LIST.find(x => x.id === id); cur = d;
        cleanup(); cleanup = () => { };
        hub.hidden = true; stage.hidden = false; body.innerHTML = '';
        $('#atTitle').textContent = d.emoji + ' ' + d.title;
        S.badges['a_' + id] = 1;
        if (Object.keys(S.badges).filter(k => k.startsWith('a_')).length >= 5) T.unlock('artisan');
        T.save();
        d.start(body);
        window.scrollTo({ top: 0 });
    }
    function closeAt() { cleanup(); cleanup = () => { }; stage.hidden = true; hub.hidden = false; body.innerHTML = ''; }
    $('#atBack').addEventListener('click', closeAt);
    T.app.addEventListener('click', e => { const b = e.target.closest('#twNav button'); if (b && b.dataset.tw !== 'atelier') cleanup(); });
    new MutationObserver(() => { if (document.body.dataset.zone !== 'tweens') closeAt(); }).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

    function reg(d) {
        LIST.push(d);
        let g = $('#atc-' + d.cat);
        if (!g) { $('#atCats').insertAdjacentHTML('beforeend', `<h3 class="tw-cat">${CATS[d.cat]}</h3><div class="tw-cards" id="atc-${d.cat}"></div>`); g = $('#atc-' + d.cat); }
        const c = document.createElement('button');
        c.className = 'tw-mcard'; c.style.setProperty('--c', d.color);
        c.innerHTML = `<span class="ico">${d.emoji}</span><strong>${d.title}</strong><span class="d">${d.desc}</span>`;
        c.addEventListener('click', () => openAt(d.id));
        g.appendChild(c);
    }

    /* ---------- Outils communs ---------- */
    function result(root, o) {
        root.innerHTML = `<div class="tw-result"><div class="tw-r-e">${o.emoji}</div><h3>${o.title}</h3><div class="tw-r-big">${o.big}</div>
            <p>${o.sub}</p>${o.xp ? `<div class="tw-r-xp">+${o.xp} XP</div>` : ''}
            <div class="tw-r-btns"><button class="tw-btn pri" id="atAgain">Rejouer</button><button class="tw-btn gh" id="atHome">Retour aux ateliers</button></div></div>`;
        $('#atAgain', root).onclick = o.again; $('#atHome', root).onclick = closeAt;
        if (o.xp) T.addXP(o.xp);
    }
    // Question à choix avec explication « À retenir » : c'est là que l'enfant apprend
    function askQ(root, q, head, cb) {
        root.innerHTML = `${head}<div class="tw-qtext">${q.q}</div><div class="tw-opts quiz"></div><div class="at-tip" hidden></div>`;
        const box = $('.tw-opts', root), tip = $('.at-tip', root); let lock = false;
        shuffle(q.o).forEach(o => {
            const b = document.createElement('button'); b.textContent = o;
            b.addEventListener('click', () => {
                if (lock) return; lock = true;
                const ok = o === q.g; b.classList.add(ok ? 'ok' : 'ko');
                if (!ok) [...box.children].find(x => x.textContent === q.g).classList.add('ok');
                T.tone(ok ? 660 : 180, 0.25, 0.09, ok ? 'sine' : 'sawtooth');
                showTip(tip, ok, q.tip, () => cb(ok));
            });
            box.appendChild(b);
        });
    }
    function showTip(tip, ok, text, next) {
        tip.hidden = false;
        tip.innerHTML = `<b>${ok ? '✅ Exact !' : '💡 À retenir'}</b><p>${text || ''}</p><button class="tw-btn pri">Suivant</button>`;
        $('button', tip).onclick = next;
    }
    const prog = (i, n, label) => `<div class="at-prog"><i style="width:${Math.round(i / n * 100)}%"></i></div><div class="tw-prog">${label} · étape ${i + 1} sur ${n}</div>`;

    /* =========== 🍳 CUISINE =========== */
    const Q = (q, g, bad, tip) => ({ t: 'q', q, g, o: [g, ...bad], tip });
    const P = (q, good, bad, tip) => ({ t: 'p', q, good, bad, tip });
    const M = (q, e, u, target, step, max, tip) => ({ t: 'm', q, e, u, target, step, max, tip });
    const K = (q, e, verb, n, tip) => ({ t: 'k', q, e, verb, n, tip });
    const WASH = Q('Avant de commencer à cuisiner, que fais-tu ?', 'Je me lave les mains au savon et j\'attache mes cheveux', ['Je goûte les ingrédients pour voir', 'Je mets seulement un tablier'], 'On se lave les mains au savon pendant environ 20 secondes. On les relave après avoir touché des œufs ou de la viande crus.');
    const SWEET = ['🍫 Chocolat', '🍭 Bonbons', '🍓 Fraises'];
    const RECIPES = [
        {
            id: 'smoothie', n: 'Smoothie banane-mangue', e: '🥤', lvl: 1, time: '5 min', recap: 'Fruits mûrs + lait ou yaourt + mixeur débranché pour nettoyer.', steps: [WASH,
                P('Choisis les 3 ingrédients du smoothie', ['🍌 Banane', '🥭 Mangue', '🥛 Lait ou yaourt'], ['🧂 Sel', '🧅 Oignon', '🌶️ Piment'], 'Des fruits bien mûrs sont plus sucrés : pas besoin d\'ajouter du sucre.'),
                Q('Comment protèges-tu tes doigts en coupant un fruit ?', 'Doigts repliés en « patte de chat », loin de la lame', ['Doigts bien à plat sous le couteau', 'Je coupe en tenant le fruit en l\'air'], 'Le bout des doigts rentré, c\'est la « patte de chat ». On coupe toujours sur une planche.'),
                M('Verse 200 ml de lait dans le mixeur', '🥛', 'ml', 200, 50, 500, 'Un verre contient environ 200 à 250 ml.'),
                K('Appuie pour mixer (avec un adulte à côté)', '🌀', 'Mixer', 10, 'Un smoothie se boit frais.'),
                Q('Avant d\'ouvrir ou de nettoyer le mixeur, tu dois…', 'L\'arrêter et le débrancher', ['Juste attendre un peu', 'Mettre la main dedans pour aider'], 'Les lames sont très coupantes : on débranche toujours avant de toucher.')]
        },
        {
            id: 'fruits', n: 'Salade de fruits', e: '🍓', lvl: 1, time: '15 min', recap: 'Laver, couper, citronner, garder au frais.', steps: [WASH,
                Q('Que fais-tu des fruits avant de les couper ?', 'Je les lave à l\'eau claire', ['Je les coupe directement', 'Je les trempe dans du savon'], 'On lave même les fruits qu\'on épluche : le couteau transporterait la saleté à l\'intérieur.'),
                P('Choisis les fruits de ta salade', ['🍎 Pomme', '🍊 Orange', '🍇 Raisin', '🍓 Fraise'], ['🥕 Carotte', '🧅 Oignon', '🥔 Pomme de terre'], 'Varie les couleurs : chaque couleur apporte des vitamines différentes.'),
                Q('Pour que la pomme coupée ne noircisse pas, j\'ajoute…', 'Un peu de jus de citron', ['De l\'huile', 'Du poivre'], 'L\'acidité du citron ralentit le noircissement (l\'oxydation).'),
                M('Ajoute 2 cuillères à soupe de jus de citron', '🍋', 'c. à soupe', 2, 1, 6, 'Une cuillère à soupe contient environ 15 ml.'),
                K('Mélange doucement avec une cuillère', '🥄', 'Mélanger', 8, 'Doucement, pour ne pas écraser les fruits.'),
                Q('Où ranges-tu la salade de fruits ?', 'Au réfrigérateur, dans un récipient fermé', ['Sur la table toute la journée', 'À côté de la gazinière'], 'Les aliments coupés se conservent au frais.')]
        },
        {
            id: 'omelette', n: 'Omelette', e: '🍳', lvl: 2, time: '10 min', recap: 'Poêle chaude et graissée, manche rentré, œufs bien cuits, mains relavées.', steps: [WASH,
                P('Choisis les ingrédients de l\'omelette', ['🥚 Œufs', '🧈 Beurre ou huile', '🧂 Sel'], ['🍫 Chocolat', '🍌 Banane', '🍬 Bonbons'], 'Une pincée de sel suffit.'),
                M('Casse 4 œufs (2 par personne)', '🥚', 'œufs', 4, 1, 10, 'Casse l\'œuf sur une surface plate plutôt que sur le bord du bol : moins de morceaux de coquille.'),
                Q('Tu as touché des œufs crus. Ensuite ?', 'Je me relave les mains au savon', ['Je m\'essuie sur mon tablier', 'Je continue sans rien faire'], 'Les œufs crus peuvent porter des bactéries (salmonelles).'),
                K('Bats les œufs à la fourchette', '🍴', 'Battre', 15, 'Bien battre mélange le blanc et le jaune.'),
                Q('Que fais-tu avant de verser les œufs ?', 'Je fais chauffer la poêle avec un peu de matière grasse', ['Je verse les œufs dans la poêle froide et vide', 'Je mets beaucoup d\'eau dans la poêle'], 'Une poêle chaude et graissée évite que l\'omelette accroche. Le feu : toujours avec un adulte.'),
                Q('Comment poses-tu le manche de la poêle ?', 'Tourné vers l\'intérieur, sans dépasser', ['Dépassant du plan de travail', 'Peu importe'], 'Un manche qui dépasse peut être accroché : la poêle brûlante tombe.'),
                Q('L\'omelette est cuite quand…', 'Elle n\'est plus liquide et se décolle du bord', ['Elle est complètement noire', 'Elle est encore toute transparente'], 'On peut la garder moelleuse, mais plus de partie liquide.')]
        },
        {
            id: 'pates', n: 'Pâtes sauce tomate', e: '🍝', lvl: 3, time: '25 min', recap: '1 litre d\'eau pour 100 g, temps du paquet, égoutter avec maniques.', steps: [WASH,
                M('Verse 1000 ml d\'eau (1 litre) pour 100 g de pâtes', '💧', 'ml', 1000, 250, 2000, 'Règle simple : environ 1 litre d\'eau pour 100 g de pâtes.'),
                Q('L\'eau bout. Comment plonges-tu les pâtes ?', 'Je les glisse doucement, avec un adulte', ['Je les jette de très haut', 'Je me penche au-dessus de la vapeur'], 'La vapeur et les éclaboussures brûlent : on garde le visage éloigné.'),
                Q('Combien de temps cuisent des spaghettis ?', 'Environ 8 à 11 minutes : je lis le paquet', ['30 secondes', '1 heure'], 'Le paquet indique le temps exact. On goûte une pâte pour vérifier.'),
                P('Choisis les ingrédients de la sauce tomate', ['🍅 Tomates', '🧅 Oignon', '🫒 Huile d\'olive'], SWEET, 'Un peu de carotte râpée adoucit l\'acidité de la tomate.'),
                K('Remue la sauce à feu doux', '🥄', 'Remuer', 14, 'Remuer évite que la sauce accroche au fond.'),
                Q('Comment égoutter les pâtes ?', 'Avec une passoire dans l\'évier, un adulte et des maniques', ['En soulevant la casserole à mains nues', 'En laissant toute l\'eau dedans'], 'L\'eau bouillante est à 100 °C : on se protège et on s\'éloigne de la vapeur.')]
        },
        {
            id: 'crepes', n: 'Crêpes', e: '🥞', lvl: 4, time: '1 h 20', recap: '250 g de farine, 3 œufs, 50 cl de lait, repos de la pâte.', steps: [WASH,
                M('Mets 250 g de farine dans le saladier', '🌾', 'g', 250, 50, 600, 'Pour environ 12 crêpes : 250 g de farine, 3 œufs, 50 cl de lait.'),
                M('Ajoute 3 œufs', '🥚', 'œufs', 3, 1, 8, 'On creuse un puits dans la farine et on y casse les œufs.'),
                M('Verse 500 ml de lait, petit à petit', '🥛', 'ml', 500, 100, 1000, 'Verser le lait petit à petit évite les grumeaux.'),
                K('Fouette la pâte pour enlever les grumeaux', '🥄', 'Fouetter', 16, 'Une pincée de sel et une cuillère de sucre relèvent le goût.'),
                Q('Pourquoi laisser reposer la pâte à crêpes ?', 'Pour qu\'elle soit souple et sans grumeaux (environ 1 heure)', ['Pour qu\'elle devienne toute sucrée', 'Pour qu\'elle refroidisse'], 'Au repos, la farine s\'hydrate bien : les crêpes sont plus légères.'),
                Q('Quand retourner la crêpe ?', 'Quand les bords se décollent, avec une spatule et un adulte', ['Dès que je verse la pâte', 'Jamais'], 'Environ 1 minute de chaque côté, dans une poêle légèrement beurrée.')]
        },
        {
            id: 'gateau', n: 'Gâteau au yaourt', e: '🎂', lvl: 5, time: '50 min', recap: 'Le pot de yaourt est la mesure : 1 yaourt, 2 sucre, 3 farine, ½ huile, 3 œufs, 1 levure.', steps: [WASH,
                M('Vide 1 pot de yaourt nature dans le saladier', '🥣', 'pot', 1, 1, 4, 'Le pot du yaourt sert d\'unité de mesure pour tout le reste.'),
                M('Ajoute 2 pots de sucre', '🍬', 'pots', 2, 1, 6, 'Rincer le pot ? Non : il faut le remplir à ras bord, bien nivelé.'),
                M('Ajoute 3 pots de farine', '🌾', 'pots', 3, 1, 6, 'On remplit le pot à ras bord sans le tasser.'),
                M('Ajoute 3 œufs', '🥚', 'œufs', 3, 1, 8, 'Un par un, dans un petit bol d\'abord pour éviter la coquille.'),
                M('Ajoute ½ pot d\'huile', '🫒', 'pot', 0.5, 0.5, 3, 'Un demi-pot, c\'est la moitié du pot rempli.'),
                Q('À quoi sert la levure chimique ?', 'Elle fait gonfler le gâteau', ['Elle le rend salé', 'Elle le colore en rouge'], 'Elle libère des bulles de gaz qui font lever la pâte. On en met 1 sachet.'),
                K('Mélange jusqu\'à obtenir une pâte lisse', '🥄', 'Mélanger', 16, 'Dès que la pâte est lisse, on arrête.'),
                Q('À quelle température préchauffer le four ?', '180 °C (thermostat 6)', ['50 °C', '300 °C'], 'Le four se préchauffe environ 10 minutes. Toujours avec un adulte.'),
                Q('Combien de temps cuit le gâteau ?', 'Environ 35 minutes', ['5 minutes', '3 heures'], 'On commence à vérifier vers 30 minutes.'),
                Q('Comment vérifier la cuisson ?', 'Je plante la lame d\'un couteau : elle ressort sèche', ['Je regarde seulement si la croûte est noire', 'Je secoue le moule en l\'air'], 'Si la lame ressort avec de la pâte, on remet quelques minutes.'),
                Q('Qui sort le plat du four ?', 'Un adulte, avec des maniques', ['Moi, à mains nues', 'Personne : on le laisse brûler'], 'Un plat de four peut dépasser 150 °C : maniques obligatoires.')]
        },
        {
            id: 'riz', n: 'Riz sauté aux légumes', e: '🍚', lvl: 6, time: '30 min', recap: '1 volume de riz pour 2 d\'eau, huile qui brûle = couvercle, riz au frais.', steps: [WASH,
                P('Choisis les légumes du riz sauté', ['🥕 Carotte', '🫑 Poivron', '🧅 Oignon', '🌽 Maïs'], SWEET, 'Coupe-les en morceaux de même taille : ils cuisent en même temps.'),
                M('Mesure 1 verre de riz', '🍚', 'verre', 1, 1, 4, 'Pour du riz long : 1 volume de riz pour environ 2 volumes d\'eau (lis le paquet).'),
                M('Ajoute 2 verres d\'eau', '💧', 'verres', 2, 1, 6, 'Cuisson à frémissement, avec couvercle, 12 à 15 minutes.'),
                Q('De l\'huile prend feu dans la poêle. Que fais-tu ?', 'Je préviens un adulte, je couvre avec un couvercle et je coupe le feu', ['Je verse de l\'eau dessus', 'Je souffle dessus'], 'JAMAIS d\'eau sur de l\'huile qui brûle : les flammes explosent. On étouffe avec un couvercle.'),
                K('Fais sauter le tout en remuant', '🥘', 'Remuer', 18, 'Sauter = cuire vite à feu vif en remuant sans arrêt.'),
                Q('Il reste du riz. Que fais-tu ?', 'Je le refroidis vite et je le mets au réfrigérateur', ['Je le laisse des heures sur la table', 'Je le mets au soleil'], 'Du riz laissé longtemps à température ambiante peut développer des bactéries.')]
        },
        {
            id: 'pizza', n: 'Pizza maison', e: '🍕', lvl: 8, time: '2 h', recap: 'Eau tiède pour la levure, pétrir, laisser lever, four très chaud.', steps: [WASH,
                M('Mets 300 g de farine', '🌾', 'g', 300, 50, 800, 'Pour une grande pizza : 300 g de farine, 200 ml d\'eau, 1 sachet de levure.'),
                Q('L\'eau qui réveille la levure doit être…', 'Tiède', ['Glacée', 'Bouillante'], 'Trop chaude, elle tue la levure ; trop froide, elle ne la réveille pas.'),
                M('Ajoute 200 ml d\'eau tiède', '💧', 'ml', 200, 50, 600, 'On verse petit à petit jusqu\'à une pâte souple.'),
                K('Pétris la pâte avec tes mains', '👐', 'Pétrir', 20, 'Pétrir rend la pâte élastique grâce au gluten de la farine.'),
                Q('Pourquoi laisser la pâte lever environ 1 heure ?', 'La levure fait gonfler la pâte', ['Pour la refroidir', 'Pour la rendre salée'], 'Dans un endroit tiède, sous un linge propre : la pâte double de volume.'),
                P('Garnis ta pizza', ['🍅 Sauce tomate', '🧀 Fromage', '🫒 Olives'], ['🍫 Chocolat', '🍭 Bonbons', '🍌 Banane'], 'Pas trop de garniture, sinon la pâte cuit mal.'),
                Q('À quelle température cuit-on la pizza ?', 'Environ 220 °C pendant 12 à 15 minutes', ['60 °C pendant 2 minutes', '100 °C pendant 5 heures'], 'Un four très chaud donne une pâte croustillante. Adulte + maniques.')]
        }
    ];
    function cooking(root) {
        const lvl = T.level();
        root.innerHTML = `<div class="tw-qtext">Quelle recette prépares-tu ?</div>
            <div class="at-safe">👩‍🍳 Ici, tout est virtuel. Dans la vraie cuisine, demande toujours l'aide d'un adulte pour le feu, le four et les couteaux.</div>
            <div class="at-recipes">${RECIPES.map(r => {
            const lk = lvl < r.lvl, st = S.best['rec_' + r.id] || 0; return `<button class="at-rec ${lk ? 'lock' : ''}" data-id="${r.id}">
                <i>${lk ? '🔒' : r.e}</i><b>${r.n}</b><small>${lk ? 'Niveau ' + r.lvl : r.time + ' · ' + r.steps.length + ' étapes'}</small><span>${st ? '⭐'.repeat(st) : ''}</span></button>`;
        }).join('')}</div>`;
        root.querySelectorAll('.at-rec').forEach(b => b.addEventListener('click', () => {
            const r = RECIPES.find(x => x.id === b.dataset.id);
            if (b.classList.contains('lock')) return T.toast(`🔒 Atteins le niveau ${r.lvl} pour cette recette`);
            cookRun(root, r);
        }));
    }
    function cookRun(root, r) {
        let i = 0, errors = 0;
        const n = r.steps.length, head = () => prog(i, n, r.e + ' ' + r.n);
        const next = () => { i++; i < n ? step() : end(); };
        const wrong = () => { errors++; T.tone(180, 0.25, 0.08, 'sawtooth'); };
        function step() {
            const s = r.steps[i];
            if (s.t === 'q') return askQ(root, s, head(), ok => { if (!ok) errors++; next(); });
            root.innerHTML = `${head()}<div class="tw-qtext">${s.q}</div><div id="stBox"></div><div class="at-tip" hidden></div>`;
            const box = $('#stBox', root), tip = $('.at-tip', root), done = ok => { box.innerHTML = ''; showTip(tip, ok, s.tip, next); };
            if (s.t === 'p') {
                const all = shuffle([...s.good, ...s.bad]), sel = new Set();
                box.innerHTML = `<div class="at-pick">${all.map(x => `<button>${x}</button>`).join('')}</div><div class="tw-r-btns"><button class="tw-btn pri" id="stOk">Valider</button></div>`;
                box.querySelectorAll('.at-pick button').forEach(b => b.onclick = () => { b.classList.toggle('on'); sel.has(b.textContent) ? sel.delete(b.textContent) : sel.add(b.textContent); });
                $('#stOk', box).onclick = () => {
                    const ok = sel.size === s.good.length && s.good.every(g => sel.has(g));
                    if (ok) { T.tone(700, 0.2, 0.09); done(true); } else { wrong(); T.toast('🤔 Il y a une erreur : regarde bien les ingrédients'); }
                };
            } else if (s.t === 'm') {
                let v = 0; const fmt = x => Math.round(x * 10) / 10;
                box.innerHTML = `<div class="at-measure"><button id="mMinus">−</button><div><span class="e">${s.e}</span><b id="mVal">0</b> <em>${s.u}</em></div><button id="mPlus">+</button></div>
                    <div class="tw-r-btns"><button class="tw-btn pri" id="stOk">Verser</button></div><p class="tw-status" id="mMsg"></p>`;
                const upd = () => { $('#mVal', box).textContent = fmt(v); };
                $('#mMinus', box).onclick = () => { v = Math.max(0, v - s.step); upd(); T.tone(300, 0.05, 0.04); };
                $('#mPlus', box).onclick = () => { v = Math.min(s.max, v + s.step); upd(); T.tone(420, 0.05, 0.04); };
                $('#stOk', box).onclick = () => {
                    if (fmt(v) === s.target) { T.tone(700, 0.2, 0.09); done(true); }
                    else { wrong(); $('#mMsg', box).textContent = fmt(v) > s.target ? 'Trop ! Retire un peu.' : 'Pas assez, ajoute encore.'; }
                };
            } else {
                let c = 0;
                box.innerHTML = `<div class="at-tap"><button id="tapBtn"><span>${s.e}</span>${s.verb}</button><div class="at-prog"><i id="tapBar" style="width:0"></i></div></div>`;
                $('#tapBtn', box).onclick = () => {
                    c++; $('#tapBar', box).style.width = Math.round(c / s.n * 100) + '%'; T.tone(250 + c * 25, 0.06, 0.05);
                    if (c >= s.n) setTimeout(() => done(true), 250);
                };
            }
        }
        function end() {
            const stars = errors <= 1 ? 3 : errors <= 3 ? 2 : 1, prev = S.best['rec_' + r.id] || 0;
            const xp = prev === 0 ? 12 + r.lvl * 3 + stars * 6 : (stars > prev ? 8 : 3);
            if (stars > prev) S.best['rec_' + r.id] = stars;
            if (Object.keys(S.best).filter(k => k.startsWith('rec_') && S.best[k] > 0).length >= 3) T.unlock('chef');
            T.unlock('first'); T.save();
            result(root, {
                emoji: r.e, title: `${r.n} réussie !`, big: '⭐'.repeat(stars), xp, again: () => cooking(root),
                sub: `${errors} erreur(s). À retenir : ${r.recap}`
            });
        }
        step();
    }
    reg({ id: 'cuisine', cat: 'cuisine', title: 'Atelier cuisine', emoji: '👩‍🍳', color: '#FF9A3C', desc: '8 recettes pas à pas : hygiène, mesures, cuissons et sécurité. De la salade de fruits à la pizza.', start: cooking });

    /* =========== 🛠️ SAVOIR-FAIRE (packs de leçons) =========== */
    const PACKS = {
        secours: {
            t: 'Premiers secours', e: '🩹', c: '#FF4B4B', d: 'Brûlure, saignement, appel à l\'aide : les bons gestes.', q: [
                Q('Tu te brûles légèrement la main. Que fais-tu d\'abord ?', 'Je la passe sous l\'eau fraîche pendant plusieurs minutes', ['Je mets du beurre dessus', 'Je perce la cloque'], 'Eau fraîche (pas glacée) pendant 10 à 15 minutes. Jamais de beurre, de dentifrice ni de glace.'),
                Q('Un camarade saigne du nez. Comment l\'aider ?', 'Tête penchée en avant, je pince le nez environ 10 minutes', ['Tête penchée en arrière', 'Je lui fais boire de l\'eau glacée'], 'Pencher la tête en avant évite d\'avaler le sang. On pince la partie molle du nez.'),
                Q('Tu vois quelqu\'un tomber et ne plus bouger. Que fais-tu ?', 'J\'appelle un adulte et les secours, sans le déplacer', ['Je le secoue fort', 'Je m\'en vais vite'], 'Appeler à l\'aide est le premier geste. On ne déplace pas une personne blessée.'),
                Q('Tu as une égratignure. Première étape ?', 'Me laver les mains puis nettoyer la plaie à l\'eau et au savon', ['Mettre un pansement sans nettoyer', 'Souffler dessus et continuer'], 'Nettoyer évite l\'infection. Ensuite on protège avec un pansement propre.'),
                Q('Quand appelle-t-on les secours ?', 'Quand quelqu\'un est gravement blessé ou en danger', ['Pour demander l\'heure', 'Pour s\'amuser'], 'Apprends le numéro d\'urgence de ton pays et demande à un adulte de te le montrer. Dis où tu es et ce qui s\'est passé.'),
                Q('Que trouve-t-on dans une trousse de secours ?', 'Pansements, compresses, antiseptique', ['Bonbons et jeux', 'Outils de bricolage'], 'On la range en hauteur, dans un endroit connu de toute la famille.')]
        },
        web: {
            t: 'Internet en sécurité', e: '🛡️', c: '#29D3F5', d: 'Mots de passe, arnaques, harcèlement : sois un as du web.', q: [
                Q('Quel mot de passe est le plus solide ?', 'Un long mélange de lettres, chiffres et symboles', ['123456', 'Mon prénom'], 'Plus un mot de passe est long et imprévisible, plus il est dur à deviner. Un mot de passe différent par compte.'),
                Q('Un inconnu en ligne te demande ton adresse. Tu…', 'Refuses et préviens un adulte', ['Donnes si il est gentil', 'Donnes seulement ta rue'], 'On ne donne jamais d\'infos personnelles (adresse, école, téléphone) à quelqu\'un qu\'on ne connaît pas en vrai.'),
                Q('Un message dit : « Tu as gagné un téléphone ! Clique ici ». Tu…', 'Ne cliques pas et en parles à un adulte', ['Cliques vite avant la fin de l\'offre', 'Envoies le lien à tes amis'], 'C\'est une arnaque (hameçonnage). L\'urgence et les gains faciles sont des signaux d\'alerte.'),
                Q('Qui peut connaître ton mot de passe ?', 'Toi, et éventuellement tes parents', ['Mes meilleurs amis', 'Tout le monde'], 'Même un ami peut le partager sans le vouloir.'),
                Q('Une photo publiée en ligne…', 'Peut être copiée et rester visible longtemps', ['Disparaît toujours au bout de 24 h', 'Ne peut jamais être copiée'], 'Réfléchis avant de publier : tu ne contrôles plus ce que les autres en font.'),
                Q('Un camarade est moqué dans un groupe de discussion. Tu…', 'Ne participes pas, le soutiens et préviens un adulte', ['Ris avec les autres', 'Fais comme si de rien n\'était'], 'Se moquer en ligne, c\'est du harcèlement. Soutenir la victime et en parler aide vraiment.')]
        },
        jardin: {
            t: 'Petit jardinier', e: '🌱', c: '#2FBF71', d: 'Eau, soleil, compost : comprends comment poussent les plantes.', q: [
                Q('De quoi une plante a-t-elle besoin pour pousser ?', 'De lumière, d\'eau, d\'air et de nutriments', ['Seulement d\'obscurité', 'De sel'], 'Grâce à la lumière, les feuilles fabriquent leur nourriture : c\'est la photosynthèse.'),
                Q('Quand arroser le jardin pour perdre moins d\'eau ?', 'Tôt le matin ou en soirée', ['En plein midi', 'Jamais'], 'Au soleil de midi, l\'eau s\'évapore avant d\'atteindre les racines.'),
                Q('Un cactus a besoin de…', 'Peu d\'eau et beaucoup de soleil', ['D\'eau tous les jours', 'D\'ombre totale'], 'Il vient du désert et stocke l\'eau dans sa tige.'),
                Q('Que devient une épluchure de légume dans un composteur ?', 'Du compost, un engrais naturel', ['Du plastique', 'Rien, elle ne bouge jamais'], 'Des organismes la décomposent en terreau qui nourrit les plantes.'),
                Q('Que fait un ver de terre dans le sol ?', 'Il aère la terre et la rend plus fertile', ['Il mange toutes les racines', 'Il fait fuir la pluie'], 'Ses galeries laissent passer l\'air et l\'eau.'),
                Q('Quelles sont les étapes de la vie d\'une plante à fleurs ?', 'Graine, germination, tige et feuilles, fleur, fruit', ['Fruit, graine, fleur, germination', 'Fleur, fruit, tige, graine'], 'Le fruit contient de nouvelles graines : le cycle recommence.')]
        }
    };
    Object.entries(PACKS).forEach(([id, p]) => reg({ id, cat: 'vie', title: p.t, emoji: p.e, color: p.c, desc: p.d, start: root => lesson(root, id, p) }));
    function lesson(root, id, p) {
        const qs = shuffle(p.q); let i = 0, ok = 0;
        const step = () => askQ(root, qs[i], prog(i, qs.length, p.e + ' ' + p.t), good => {
            if (good) ok++;
            if (++i < qs.length) return step();
            const first = !(S.best['les_' + id] > 0), xp = first ? 20 + ok * 4 : ok * 2;
            S.best['les_' + id] = Math.max(S.best['les_' + id] || 0, ok); T.unlock('first'); T.save();
            result(root, { emoji: ok === qs.length ? '🏅' : p.e, title: ok === qs.length ? 'Sans faute !' : 'Leçon terminée', big: `${ok}/${qs.length}`, xp, again: () => lesson(root, id, p), sub: 'Relis les « À retenir » : ce sont de vrais réflexes utiles.' });
        });
        step();
    }

    /* =========== 💻 ROBOT CODEUR =========== */
    const LV = [
        { n: 4, s: [0, 3, 0], g: [0, 0], w: [], par: 1 },
        { n: 4, s: [0, 3, 0], g: [3, 0], w: [], par: 3 },
        { n: 5, s: [0, 4, 0], g: [4, 0], w: [[0, 2], [3, 3]], par: 7 },
        { n: 5, s: [0, 4, 0], g: [0, 0], w: [[0, 2], [1, 2], [2, 2], [3, 2]], par: 9 },
        { n: 6, s: [0, 5, 0], g: [5, 0], w: [[2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], par: 16 }
    ];
    const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    function robot(root) {
        const done = S.best.robot || 0;
        root.innerHTML = `<div class="tw-qtext">Programme le robot 🤖</div><p class="tw-sub">Assemble des blocs pour l'amener à l'étoile ⭐. Moins de blocs = plus d'étoiles.</p>
            <div class="tw-tiers">${LV.map((_, i) => { const lk = i > done; return `<button data-l="${i}" class="${lk ? 'lock' : ''}"><i>${lk ? '🔒' : i < done ? '✅' : '▶️'}</i><b>Niveau ${i + 1}</b></button>`; }).join('')}</div>`;
        root.querySelectorAll('.tw-tiers button').forEach(b => b.onclick = () => { if (b.classList.contains('lock')) return T.toast('🔒 Termine le niveau précédent'); robotLevel(root, +b.dataset.l); });
    }
    function robotLevel(root, li) {
        const L = LV[li]; let prog_ = [], timer = null, busy = false;
        cleanup = () => clearInterval(timer);
        const label = { F1: '⬆️ 1', F3: '⬆️ 3', L: '↺', R: '↻' };
        const draw = (pos, msg = '') => {
            const cells = [];
            for (let y = 0; y < L.n; y++) for (let x = 0; x < L.n; x++) {
                const wall = L.w.some(w => w[0] === x && w[1] === y), goal = L.g[0] === x && L.g[1] === y, me = pos.x === x && pos.y === y;
                cells.push(`<div class="rb-cell ${wall ? 'wall' : ''}">${wall ? '🧱' : goal ? '⭐' : ''}${me ? `<span class="rb-me" style="transform:rotate(${pos.d * 90}deg)">🔼</span>` : ''}</div>`);
            }
            root.innerHTML = `<div class="tw-score"><span>Niveau ${li + 1} · objectif : ${L.par} blocs</span><span>Blocs : <b>${prog_.length}</b></span></div>
                <div class="rb-grid" style="grid-template-columns:repeat(${L.n},1fr)">${cells.join('')}</div>
                <div class="rb-prog">${prog_.map(c => `<span>${label[c]}</span>`).join('') || '<em>Ton programme est vide</em>'}</div>
                <div class="rb-pal">${Object.keys(label).map(k => `<button data-c="${k}">${label[k]}</button>`).join('')}</div>
                <div class="tw-r-btns"><button class="tw-btn gh" id="rbUndo">⌫ Annuler</button><button class="tw-btn gh" id="rbClr">🗑️ Tout effacer</button><button class="tw-btn pri" id="rbRun">▶ Lancer</button></div>
                <p class="tw-status">${msg}</p>`;
            root.querySelectorAll('.rb-pal button').forEach(b => b.onclick = () => { if (!busy) { prog_.push(b.dataset.c); T.tone(380, 0.06, 0.05); draw(pos0()); } });
            $('#rbUndo', root).onclick = () => { if (!busy) { prog_.pop(); draw(pos0()); } };
            $('#rbClr', root).onclick = () => { if (!busy) { prog_ = []; draw(pos0()); } };
            $('#rbRun', root).onclick = run;
        };
        const pos0 = () => ({ x: L.s[0], y: L.s[1], d: L.s[2] });
        function run() {
            if (busy || !prog_.length) return;
            busy = true; let p = pos0();
            const steps = prog_.flatMap(c => c === 'F3' ? ['F', 'F', 'F'] : c === 'F1' ? ['F'] : [c]); let k = 0;
            draw(p);
            clearInterval(timer);
            timer = setInterval(() => {
                if (k >= steps.length) { clearInterval(timer); busy = false; return p.x === L.g[0] && p.y === L.g[1] ? win() : draw(p, '🤔 Le robot n\'est pas arrivé. Modifie ton programme !'); }
                const s = steps[k++];
                if (s === 'L') p = { ...p, d: (p.d + 3) % 4 }; else if (s === 'R') p = { ...p, d: (p.d + 1) % 4 };
                else {
                    const nx = p.x + DIR[p.d][0], ny = p.y + DIR[p.d][1];
                    if (nx < 0 || ny < 0 || nx >= L.n || ny >= L.n || L.w.some(w => w[0] === nx && w[1] === ny)) { clearInterval(timer); busy = false; T.tone(150, 0.3, 0.1, 'sawtooth'); return draw(p, '💥 Aïe, un mur ! Corrige ton programme.'); }
                    p = { ...p, x: nx, y: ny };
                }
                T.tone(330 + k * 10, 0.07, 0.05);
                const g = $('.rb-grid', root); if (g) { /* redessin léger sans toucher aux boutons */ draw(p); busy = true; }
            }, 420);
        }
        function win() {
            const n = prog_.length, stars = n <= L.par ? 3 : n <= L.par + 3 ? 2 : 1, prevStars = S.best['rbs_' + li] || 0;
            const xp = prevStars === 0 ? 10 + li * 4 + stars * 4 : (stars > prevStars ? 6 : 2);
            S.best['rbs_' + li] = Math.max(prevStars, stars);
            if ((S.best.robot || 0) < li + 1) S.best.robot = li + 1;
            if ((S.best.robot || 0) >= 4) T.unlock('codeur'); T.unlock('first'); T.save();
            result(root, {
                emoji: '🤖', title: 'Mission accomplie !', big: '⭐'.repeat(stars), xp, again: () => robot(root),
                sub: `${n} blocs (objectif : ${L.par}). Un programme, c'est une suite d'instructions précises.`
            });
        }
        draw(pos0());
    }
    reg({ id: 'robot', cat: 'code', title: 'Robot codeur', emoji: '🤖', color: '#8E5BFF', desc: 'Initie-toi à la programmation : assemble des blocs d\'instructions pour guider un robot.', start: robot });

    /* =========== 💰 ARGENT DE POCHE =========== */
    const WEEKS = [
        { s: 'Ton cahier est terminé et l\'école en demande un.', o: [['Racheter un cahier (−6)', 6, 2, 'Un besoin : tu as bien fait de l\'acheter.'], ['Emprunter à un copain (−0)', 0, 1, 'Pas toujours possible : un besoin passe avant.'], ['Cahier + stickers (−15)', 15, 0, 'Les stickers sont une envie, pas un besoin.']] },
        { s: 'C\'est l\'anniversaire d\'un ami.', o: [['Faire une belle carte (−2)', 2, 2, 'Un cadeau fait main compte autant que ce qui coûte cher.'], ['Offrir un gros cadeau (−20)', 20, 0, 'Généreux, mais tu dépenses beaucoup.'], ['Ne rien faire (−0)', 0, 1, 'Dommage : un petit geste fait plaisir.']] },
        { s: 'Un jeu en promotion que « tout le monde a » coûte 15.', o: [['L\'acheter tout de suite (−15)', 15, 0, 'Acheter sous pression, c\'est risqué.'], ['Attendre une semaine avant de décider (−0)', 0, 2, 'Bien joué ! Attendre fait souvent disparaître l\'envie.'], ['En acheter deux (−28)', 28, 0, 'Beaucoup dépensé pour une envie.']] },
        { s: 'Le pneu de ton vélo est crevé : réparation 12.', o: [['Le faire réparer (−12)', 12, 2, 'Entretenir ce qu\'on possède coûte moins cher que racheter.'], ['Ne rien faire (−0)', 0, 0, 'Plus de vélo pour te déplacer.'], ['Acheter un nouveau vélo (−45)', 45, 0, 'Beaucoup trop cher pour un pneu crevé.']] }
    ];
    function budget(root) {
        let w = 0, spent = 0, wise = 0;
        const GOAL = 60;
        const step = () => {
            const W = WEEKS[w];
            root.innerHTML = `<div class="at-prog"><i style="width:${w / 4 * 100}%"></i></div>
                <div class="tw-score"><span>Semaine ${w + 1} sur 4 · 🎯 objectif : ${GOAL} 🪙 d'économies</span><span>Dépensé : <b>${spent}</b> 🪙</span></div>
                <div class="at-tip" style="margin:0 0 14px">Chaque semaine tu reçois <b>25 🪙</b> (100 en tout).</div>
                <div class="tw-qtext">${W.s}</div><div class="tw-opts quiz"></div><div class="at-tip" hidden></div>`;
            const box = $('.tw-opts', root), tip = $('.at-tip:last-child', root); let lock = false;
            W.o.forEach(([lab, cost, wi, why]) => {
                const b = document.createElement('button'); b.textContent = lab;
                b.onclick = () => {
                    if (lock) return; lock = true; spent += cost; wise += wi; b.classList.add(wi === 2 ? 'ok' : wi === 1 ? '' : 'ko'); T.tone(wi === 2 ? 660 : 300, 0.2, 0.08);
                    showTip(tip, wi === 2, why, () => { if (++w < 4) step(); else end(); });
                };
                box.appendChild(b);
            });
        };
        const end = () => {
            const saved = 100 - spent, win = saved >= GOAL, prev = S.best.budget || 0, xp = (prev === 0 ? 15 : 4) + wise * 2 + (win ? 10 : 0);
            S.best.budget = Math.max(prev, wise); T.unlock('first'); T.save();
            result(root, {
                emoji: win ? '🏆' : '💸', title: win ? 'Objectif atteint !' : 'Presque…', big: `${saved} 🪙`, xp, again: () => budget(root),
                sub: `Économisé sur 100. Astuce des 3 pots : une part pour dépenser, une pour épargner, une pour donner. (Ici, les 🪙 sont des pièces imaginaires : remplace-les par ta monnaie.)`
            });
        };
        step();
    }
    reg({ id: 'budget', cat: 'vie', title: 'Argent de poche', emoji: '🪙', color: '#FFB93B', desc: 'Besoin ou envie ? Gère 4 semaines d\'argent de poche et atteins ton objectif d\'épargne.', start: budget });

    /* =========== 🎹 PIANO =========== */
    const KEYS = [['Do', 261.6], ['Ré', 293.7], ['Mi', 329.6], ['Fa', 349.2], ['Sol', 392], ['La', 440], ['Si', 493.9], ['Do', 523.3]];
    const SONGS = { 'Frère Jacques': [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4, 4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 0, 4, 0, 0, 4, 0], 'Au clair de la lune': [0, 0, 0, 1, 2, 1, 0, 2, 1, 1, 0], 'Ode à la joie': [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1] };
    function piano(root) {
        let song = null, idx = 0;
        const render = () => {
            root.innerHTML = `<div class="tw-qtext">Studio piano</div>
                <div class="at-modes"><button class="${song ? '' : 'on'}" data-s="">🎹 Jeu libre</button>${Object.keys(SONGS).map(s => `<button class="${song === s ? 'on' : ''}" data-s="${s}">🎼 ${s}</button>`).join('')}</div>
                <p class="tw-status">${song ? `Appuie sur la touche allumée (${idx}/${SONGS[song].length})` : 'Appuie sur les touches pour composer ta musique.'}</p>
                <div class="piano">${KEYS.map(([n], i) => `<button class="tw-key ${song && SONGS[song][idx] === i ? 'next' : ''}" data-i="${i}"><span>${n}</span></button>`).join('')}</div>`;
            root.querySelectorAll('.at-modes button').forEach(b => b.onclick = () => { song = b.dataset.s || null; idx = 0; render(); });
            root.querySelectorAll('.tw-key').forEach(k => k.addEventListener('pointerdown', () => {
                const i = +k.dataset.i; T.tone(KEYS[i][1], 0.6, 0.15, 'triangle'); k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 160);
                if (!song || SONGS[song][idx] !== i) return;
                if (++idx >= SONGS[song].length) {
                    const first = !(S.best['song_' + song]); S.best['song_' + song] = 1; T.unlock('first'); T.save();
                    return result(root, { emoji: '🎶', title: 'Bravo, musicien !', big: song, xp: first ? 18 : 3, again: () => piano(root), sub: 'Tu as joué le morceau en entier. Rejoue-le sans la touche allumée pour t\'entraîner à le retenir !' });
                }
                render();
            }));
        };
        render();
    }
    reg({ id: 'piano', cat: 'creer', title: 'Studio piano', emoji: '🎹', color: '#FF4FA3', desc: 'Joue librement ou apprends 3 morceaux guidés, note par note.', start: piano });

    /* =========== 🎨 LABO DES COULEURS =========== */
    function colorLab(root) {
        let r = 0, tot = 0;
        const round = () => {
            const t = [rnd(256), rnd(256), rnd(256)], v = [128, 128, 128], css = c => `rgb(${c.join(',')})`;
            root.innerHTML = `<div class="tw-score"><span>Couleur ${r + 1} sur 5</span><span>Précision moyenne : <b>${r ? Math.round(tot / r) : '–'}%</b></span></div>
                <div class="at-sw2"><div><span style="background:${css(t)}"></span>À reproduire</div><div><span id="mine" style="background:${css(v)}"></span>Ton mélange</div></div>
                ${['Rouge', 'Vert', 'Bleu'].map((n, i) => `<label class="at-sl">${n}<input type="range" min="0" max="255" value="128" data-i="${i}"><b>128</b></label>`).join('')}
                <div class="tw-r-btns"><button class="tw-btn pri" id="clOk">Valider</button></div><p class="tw-status" id="clMsg"></p>`;
            root.querySelectorAll('input').forEach(s => s.oninput = () => { v[+s.dataset.i] = +s.value; s.nextElementSibling.textContent = s.value; $('#mine', root).style.background = css(v); });
            $('#clOk', root).onclick = () => {
                const d = Math.hypot(t[0] - v[0], t[1] - v[1], t[2] - v[2]), acc = Math.max(0, Math.round(100 - d / 2.2));
                tot += acc; r++; T.tone(300 + acc * 5, 0.25, 0.09);
                $('#clMsg', root).innerHTML = `${acc}% de précision · la couleur cachée était <b>rgb(${t.join(', ')})</b>. <button class="tw-btn gh" id="clNext" style="padding:8px 16px;margin-left:8px">${r < 5 ? 'Suivante' : 'Résultat'}</button>`;
                $('#clOk', root).disabled = true;
                $('#clNext', root).onclick = () => r < 5 ? round() : (T.unlock('first'), result(root, {
                    emoji: '🎨', title: 'Œil d\'artiste !', big: Math.round(tot / 5) + '%', xp: Math.round(tot / 5 / 5) + 6, again: () => colorLab(root),
                    sub: 'À la lumière, rouge + vert = jaune, rouge + bleu = magenta, vert + bleu = cyan. Ce sont les couleurs des écrans !'
                }));
            };
        };
        round();
    }
    reg({ id: 'couleurs', cat: 'creer', title: 'Labo des couleurs', emoji: '🌈', color: '#29D3F5', desc: 'Mélange du rouge, du vert et du bleu pour reproduire des couleurs mystères.', start: colorLab });

    /* =========== 📖 CONTEUR D'HISTOIRES =========== */
    const SLOTS = [
        ['Le héros', ['une petite exploratrice nommée Maya', 'un robot curieux nommé Zip', 'un jeune dragon timide nommé Bako', 'un chat astronaute nommé Mistral', 'une apprentie sorcière nommée Lila']],
        ['Le lieu', ['au bord d\'une immense forêt', 'dans une ville flottante sur les nuages', 'sur une île où il ne pleut jamais', 'au fond d\'un volcan endormi', 'dans un village au pied des montagnes']],
        ['L\'objet mystère', ['une carte au trésor qui brillait', 'une clé en or sans serrure', 'un œuf qui chantait doucement', 'une boussole qui montrait les rêves', 'une lanterne qui parlait']],
        ['Le problème', ['le ciel devint tout noir', 'tous les animaux disparurent', 'un grand pont s\'écroula', 'le vent emporta la carte', 'une porte secrète se referma']],
        ['L\'aide', ['un vieux hibou très sage', 'une bande de fourmis courageuses', 'une petite fille aux cheveux de feu', 'un robot gentil tombé du ciel', 'une licorne timide']],
        ['La fin', ['tout redevint lumineux et chacun rentra chez soi, heureux', 'ils organisèrent une grande fête qui dura sept jours', 'ils partagèrent le trésor avec tout le monde', 'ils se promirent de se retrouver chaque été', 'ils comprirent que l\'amitié est la plus belle des magies']]
    ];
    function story(root) {
        const ch = SLOTS.map(() => 0);
        root.innerHTML = `<div class="tw-qtext">Conteur d'histoires</div><p class="tw-sub">Une bonne histoire a un début, un problème, une solution et une fin. Choisis chaque élément !</p>
            ${SLOTS.map(([n, o], i) => `<label class="at-sel">${n}<select data-i="${i}">${o.map((x, j) => `<option value="${j}">${x}</option>`).join('')}</select></label>`).join('')}
            <div class="tw-r-btns"><button class="tw-btn gh" id="stRnd">🎲 Au hasard</button><button class="tw-btn pri" id="stGo">✨ Raconter</button></div><div id="stOut"></div>`;
        const sels = [...root.querySelectorAll('select')];
        $('#stRnd', root).onclick = () => sels.forEach(s => s.value = rnd(5));
        $('#stGo', root).onclick = () => {
            const [h, l, o, p, a, f] = sels.map((s, i) => SLOTS[i][1][+s.value]);
            const txt = `Il était une fois ${h}, qui vivait ${l}. Un jour, ${o} apparut. Mais soudain, ${p}. Heureusement, ${a} arriva. Ensemble, ${f}.`;
            $('#stOut', root).innerHTML = `<div class="at-book">${txt}</div><div class="tw-r-btns"><button class="tw-btn gh" id="stSay">🔊 Écouter</button></div>`;
            $('#stSay', root).onclick = () => { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = .92; speechSynthesis.speak(u); };
            if (!story.rewarded) { story.rewarded = true; T.addXP(10); T.unlock('first'); T.toast('+10 XP · première histoire créée !'); }
        };
        cleanup = () => window.speechSynthesis && speechSynthesis.cancel();
    }
    reg({ id: 'histoires', cat: 'creer', title: 'Conteur d\'histoires', emoji: '📖', color: '#8E5BFF', desc: 'Invente ton aventure en choisissant héros, lieu, problème et fin, puis écoute-la.', start: story });

    /* =========== 🎨 PIXEL ART (atelier existant) =========== */
    reg({
        id: 'pixel', cat: 'creer', title: 'Pixel art', emoji: '🖼️', color: '#B6F24A', desc: 'Dessine pixel par pixel et enregistre ton œuvre en image.',
        start: root => { root.innerHTML = '<div class="tw-qtext">Pixel art</div>'; root.appendChild(pxBox); }
    });

    /* ---------- Badges + hub ---------- */
    T.BADGES.push(
        { id: 'artisan', e: '🛠️', n: 'Artisan', d: 'Essayer 5 ateliers' },
        { id: 'chef', e: '👨‍🍳', n: 'Petit chef', d: 'Réussir 3 recettes' },
        { id: 'codeur', e: '💻', n: 'Codeur', d: 'Terminer 4 niveaux du robot' });
    T.renderHUD();
    // Ordre des catégories dans le hub : cuisine en premier
    const cats = $('#atCats');['cuisine', 'vie', 'code', 'creer'].forEach(c => { const g = $('#atc-' + c); if (g) { const h = g.previousElementSibling; cats.appendChild(h); cats.appendChild(g); } });
})();
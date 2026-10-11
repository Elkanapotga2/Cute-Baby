/* =========================================================
   CUTE BABY LIFE — logique de l'interface 18+
   Dépend de app.js (getCtx, playTone) et gateway.js (backToGateway)
   ========================================================= */
(function () {
    const app = document.getElementById('adultApp');
    if (!app) return;
    const $ = (s, r = app) => r.querySelector(s);
    const $$ = (s, r = app) => [...r.querySelectorAll(s)];
    const pad = n => String(n).padStart(2, '0');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const DAY = 864e5, num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };

    /* ---------- Données (enregistrées sur l'appareil) ---------- */
    const KEY = 'cutebaby_adults_v1';
    const fresh = () => ({
        name: '', cur: 'FCFA',
        cv: { tpl: 'modern', name: '', title: '', email: '', phone: '', city: '', summary: '', skills: '', langs: '', exp: [{ role: '', org: '', period: '', desc: '' }], edu: [{ deg: '', school: '', period: '' }] },
        letter: {}, inc: [{ n: 'Salaire', a: 0 }],
        exp: [{ n: 'Loyer', a: 0, t: 'besoin' }, { n: 'Alimentation', a: 0, t: 'besoin' }, { n: 'Transport', a: 0, t: 'besoin' }, { n: 'Loisirs', a: 0, t: 'envie' }, { n: 'Épargne', a: 0, t: 'epargne' }],
        sim: null, loan: null, habits: [], wheel: {}, goals: [], med: [], stress: null, grat: [], iv: 0
    });
    function load() {
        try { const r = JSON.parse(localStorage.getItem(KEY)); if (!r) return fresh(); const f = fresh(); return Object.assign(f, r, { cv: Object.assign(f.cv, r.cv) }); }
        catch (e) { return fresh(); }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
    let S = load();

    const CUR = { FCFA: { s: 'FCFA', after: true, dec: 0 }, EUR: { s: '€', after: true, dec: 2 }, USD: { s: '$', after: false, dec: 2 } };
    const money = v => { const c = CUR[S.cur] || CUR.FCFA, n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec }).format(v || 0); return c.after ? `${n}\u00A0${c.s}` : `${c.s}${n}`; };
    const bigAmt = () => S.cur === 'FCFA';

    function toast(m) { const b = $('#adToasts'), t = document.createElement('div'); t.className = 'ad-toast'; t.textContent = m; b.appendChild(t); setTimeout(() => t.classList.add('out'), 2400); setTimeout(() => t.remove(), 2800); }
    function tone(f, d = 0.3, v = 0.08, type = 'sine') { try { const c = getCtx(); if (c.state === 'suspended') c.resume(); playTone(f, c.currentTime, d, v, type); } catch (e) { } }
    const field = (label, attr, val, type = 'text', ph = '') => `<label class="ad-fld"><span>${label}</span><input class="ad-in" type="${type}" ${attr} value="${esc(val)}" placeholder="${esc(ph)}"></label>`;
    const area = (label, attr, val, ph = '') => `<label class="ad-fld"><span>${label}</span><textarea class="ad-in" ${attr} placeholder="${esc(ph)}">${esc(val)}</textarea></label>`;

    /* ---------- Navigation ---------- */
    const heroVideo = $('#adHeroVideo');
    heroVideo.addEventListener('error', () => { heroVideo.style.display = 'none'; });
    function go(id) {
        $$('.ad-page').forEach(p => p.classList.toggle('active', p.id === 'ad-' + id));
        $$('#adNav button').forEach(b => b.classList.toggle('on', b.dataset.ad === id));
        if (id !== 'calm') medStop();
        if (id !== 'media') closeTV();
        if (id === 'home') renderHome();
        if (id === 'habits') renderHabits();
        if (id === 'calm') renderCalm();
        if (id === 'goals') renderGoals();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
    $$('[data-ad]').forEach(b => b.addEventListener('click', () => go(b.dataset.ad)));
    $('#adBack').addEventListener('click', () => backToGateway());
    $('#adToDash').addEventListener('click', () => $('#adDash').scrollIntoView({ behavior: 'smooth' }));
    new MutationObserver(() => {
        if (document.body.dataset.zone !== 'adults') { medStop(); closeTV(); heroVideo.pause(); } else heroVideo.play().catch(() => { });
    }).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

    /* =========== ACCUEIL =========== */
    const QUOTES = ['Un petit pas chaque jour vaut mieux qu\'un grand saut une fois par an.', 'La clarté précède l\'action.', 'Prendre soin de soi n\'est pas un luxe : c\'est ce qui permet de tenir dans la durée.', 'Ce que l\'on répète finit par nous définir.', 'Décider, même imparfaitement, vaut mieux que reporter parfaitement.', 'On ne gère bien que ce que l\'on regarde en face.', 'Le repos fait partie du travail.', 'Se fixer un cap, c\'est déjà avancer.'];
    function totals() { const inc = S.inc.reduce((a, x) => a + num(x.a), 0), exp = S.exp.reduce((a, x) => a + num(x.a), 0); return { inc, exp, left: inc - exp }; }
    function habitsToday() { const d = dk(), n = S.habits.length; return { n, done: S.habits.filter(h => h.log[d]).length }; }
    function medWeek() { const lim = Date.now() - 7 * DAY; return S.med.filter(m => m.t > lim).reduce((a, m) => a + m.min, 0); }
    function goalStats() { const a = S.goals.filter(g => !g.done); const p = a.length ? Math.round(a.reduce((s, g) => s + goalPct(g), 0) / a.length) : 0; return { n: a.length, p }; }
    function renderHome() {
        const h = new Date().getHours(), hello = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
        $('#adHello').textContent = S.name ? `${hello}, ${S.name}` : hello;
        $('#adDate').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        $('#adQuote').textContent = QUOTES[Math.floor(Date.now() / DAY) % QUOTES.length];
        const t = totals(), hb = habitsToday(), g = goalStats();
        $('#adMetrics').innerHTML = `
            <div class="ad-metric"><small>Habitudes du jour</small><div class="ad-big">${hb.n ? `${hb.done}/${hb.n}` : '–'}</div><p>${hb.n ? (hb.done === hb.n ? 'Journée complète' : 'Encore ' + (hb.n - hb.done) + ' à valider') : 'Aucune habitude suivie'}</p></div>
            <div class="ad-metric"><small>Solde mensuel</small><div class="ad-big ${t.inc ? (t.left >= 0 ? 'pos' : 'neg') : ''}">${t.inc ? money(t.left) : '–'}</div><p>${t.inc ? 'Revenus : ' + money(t.inc) : 'Renseignez votre budget'}</p></div>
            <div class="ad-metric"><small>Objectifs en cours</small><div class="ad-big">${g.n}</div><p>${g.n ? 'Progression moyenne : ' + g.p + ' %' : 'Aucun objectif défini'}</p></div>
            <div class="ad-metric"><small>Méditation · 7 jours</small><div class="ad-big">${medWeek()}<span style="font-size:1rem"> min</span></div><p>${S.med.length} séance(s) au total</p></div>`;
    }
    $('#adName').value = S.name;
    $('#adName').addEventListener('input', e => { S.name = e.target.value.trim(); save(); renderHome(); });

    /* =========== CARRIÈRE =========== */
    const CV_CSS = `.cvp{font-family:Inter,Arial,sans-serif;color:#1c1f2a;background:#fff;padding:38px 42px;font-size:11.5px;line-height:1.5;min-height:600px}
.cvp h1{font-size:27px;margin:0;font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.01em}
.cvp .t{color:#6a6f7e;font-size:13px;margin-top:3px}.cvp .ct{margin-top:9px;color:#4a4f5e;display:flex;flex-wrap:wrap;gap:3px 14px;font-size:11px}
.cvp h2{font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #d9dbe3;color:#1B2A4A}
.cvp .it{margin-bottom:10px}.cvp .it b{font-size:12px}.cvp .it .m{color:#6a6f7e;font-size:11px}.cvp .it p,.cvp p{margin:3px 0 0;white-space:pre-line}
.cvp.classic{font-family:Georgia,'Times New Roman',serif}.cvp.classic header{text-align:center;border-bottom:2px solid #1B2A4A;padding-bottom:12px}.cvp.classic .ct{justify-content:center}
.cvp.minimal h1{font-family:Inter,Arial,sans-serif;font-weight:700;letter-spacing:-.02em}.cvp.minimal h2{border:0;color:#9A7B2F;margin-top:22px}
.cvp.modern{display:grid;grid-template-columns:34% 1fr;padding:0}.cvp.modern aside{background:#1B2A4A;color:#eef0f7;padding:38px 22px}.cvp.modern aside .t,.cvp.modern aside .ct{color:#c5cbe0}
.cvp.modern aside .ct{flex-direction:column}.cvp.modern aside h2{border-color:rgba(255,255,255,.25);color:#D9B66A}.cvp.modern main{padding:38px 28px}.cvp.modern main h2:first-child{margin-top:0}`;
    const st = document.createElement('style'); st.textContent = CV_CSS; document.head.appendChild(st);

    function cvHTML(d) {
        const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
        const contact = [d.email, d.phone, d.city].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('');
        const head = `<header><h1>${esc(d.name) || 'Votre nom'}</h1><div class="t">${esc(d.title) || 'Intitulé du poste'}</div><div class="ct">${contact}</div></header>`;
        const sum = d.summary ? `<h2>Profil</h2><p>${esc(d.summary)}</p>` : '';
        const exp = d.exp.filter(e => e.role || e.org).map(e => `<div class="it"><b>${esc(e.role)}</b><div class="m">${esc(e.org)}${e.period ? ' · ' + esc(e.period) : ''}</div>${e.desc ? `<p>${esc(e.desc)}</p>` : ''}</div>`).join('');
        const edu = d.edu.filter(e => e.deg || e.school).map(e => `<div class="it"><b>${esc(e.deg)}</b><div class="m">${esc(e.school)}${e.period ? ' · ' + esc(e.period) : ''}</div></div>`).join('');
        const sk = list(d.skills).length ? `<h2>Compétences</h2><p>${list(d.skills).map(esc).join(' · ')}</p>` : '';
        const lg = list(d.langs).length ? `<h2>Langues</h2><p>${list(d.langs).map(esc).join('\n')}</p>` : '';
        const E = exp ? `<h2>Expérience</h2>${exp}` : '', F = edu ? `<h2>Formation</h2>${edu}` : '';
        if (d.tpl === 'modern') return `<div class="cvp modern"><aside>${head}${sk}${lg}</aside><main>${sum}${E}${F}</main></div>`;
        return `<div class="cvp ${d.tpl}">${head}${sum}${E}${F}${sk}${lg}</div>`;
    }
    function printDoc(html, css) {
        const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
        document.body.appendChild(f);
        f.onload = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 3000); };
        f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}${css}</style></head><body>${html}</body></html>`;
    }
    const IV = [
        ['Parlez-moi de vous.', 'Résumez en 90 secondes : parcours, point fort, ce qui vous amène ici. Évitez de réciter votre CV.'],
        ['Pourquoi ce poste, pourquoi notre entreprise ?', 'Montrez que vous vous êtes renseigné(e) : un produit, une valeur, un projet précis qui vous attire.'],
        ['Quelles sont vos principales qualités ?', 'Choisissez 2 ou 3 qualités et prouvez-les par un exemple concret.'],
        ['Quel est votre principal défaut ?', 'Citez un vrai point d\'amélioration qui n\'est pas rédhibitoire, et expliquez ce que vous faites pour progresser.'],
        ['Racontez une réussite professionnelle dont vous êtes fier(ère).', 'Méthode STAR : Situation, Tâche, Action, Résultat (chiffré si possible).'],
        ['Décrivez un échec et ce que vous en avez appris.', 'Assumez, restez factuel(le), et insistez sur l\'apprentissage et ce que vous faites différemment depuis.'],
        ['Comment gérez-vous la pression ou un conflit ?', 'Donnez un exemple réel : écoute, recherche de solution, communication claire.'],
        ['Où vous voyez-vous dans cinq ans ?', 'Montrez de l\'ambition cohérente avec le poste, sans promettre un départ ni écraser le recrutement actuel.'],
        ['Quelles sont vos prétentions salariales ?', 'Renseignez-vous sur les fourchettes du marché et donnez une fourchette argumentée, pas un chiffre isolé.'],
        ['Pourquoi quittez-vous votre poste actuel ?', 'Restez positif(ve) : parlez de ce que vous cherchez, jamais de ce que vous fuyez.'],
        ['Avez-vous des questions pour nous ?', 'Préparez-en 3 : l\'équipe, les priorités des six premiers mois, la façon dont le succès est mesuré.'],
        ['Que feriez-vous durant vos 90 premiers jours ?', 'Écouter, comprendre l\'existant, identifier une victoire rapide, puis proposer un plan.']
    ];
    let ivTimer = null;
    function renderCareer(tab) {
        $$('#crTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
        clearInterval(ivTimer);
        const body = $('#crBody'), d = S.cv;
        if (tab === 'cv') {
            body.innerHTML = `<div class="ad-cvwrap"><div class="ad-card">
                <div class="ad-tpls">${[['modern', 'Moderne'], ['classic', 'Classique'], ['minimal', 'Épuré']].map(([k, l]) => `<button data-tpl="${k}" class="${d.tpl === k ? 'on' : ''}">${l}</button>`).join('')}</div>
                <div class="ad-two">${field('Nom complet', 'data-k="name"', d.name)}${field('Intitulé', 'data-k="title"', d.title, 'text', 'Chef de projet')}</div>
                <div class="ad-three">${field('Email', 'data-k="email"', d.email, 'email')}${field('Téléphone', 'data-k="phone"', d.phone)}${field('Ville', 'data-k="city"', d.city)}</div>
                ${area('Profil (3 lignes max)', 'data-k="summary"', d.summary)}
                <small class="l" style="display:block;font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:.7rem;margin:6px 0 8px">Expériences</small>
                ${d.exp.map((e, i) => `<div class="ad-sub-card"><div class="ad-two">${field('Poste', `data-g="exp" data-i="${i}" data-f="role"`, e.role)}${field('Entreprise', `data-g="exp" data-i="${i}" data-f="org"`, e.org)}</div>${field('Période', `data-g="exp" data-i="${i}" data-f="period"`, e.period, 'text', '2021 – 2024')}${area('Missions et résultats', `data-g="exp" data-i="${i}" data-f="desc"`, e.desc)}<button class="ad-x" data-del="exp:${i}">Supprimer</button></div>`).join('')}
                <button class="ad-btn out sm" data-add="exp">+ Expérience</button>
                <small class="l" style="display:block;font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:.7rem;margin:18px 0 8px">Formation</small>
                ${d.edu.map((e, i) => `<div class="ad-sub-card"><div class="ad-two">${field('Diplôme', `data-g="edu" data-i="${i}" data-f="deg"`, e.deg)}${field('Établissement', `data-g="edu" data-i="${i}" data-f="school"`, e.school)}</div>${field('Période', `data-g="edu" data-i="${i}" data-f="period"`, e.period)}<button class="ad-x" data-del="edu:${i}">Supprimer</button></div>`).join('')}
                <button class="ad-btn out sm" data-add="edu">+ Formation</button>
                <div style="margin-top:18px">${field('Compétences (séparées par des virgules)', 'data-k="skills"', d.skills)}${field('Langues (séparées par des virgules)', 'data-k="langs"', d.langs, 'text', 'Français (natif), Anglais (B2)')}</div>
                </div><div><div class="ad-paper" id="cvPrev"></div><div class="ad-row-btns"><button class="ad-btn dark" id="cvPrint">Télécharger en PDF</button></div>
                <p class="ad-sub" style="margin:10px 0 0;font-size:.82rem">Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF ». Vos données restent sur cet appareil.</p></div></div>`;
            const prev = () => { $('#cvPrev').innerHTML = cvHTML(S.cv); }; prev();
            body.oninput = e => { const t = e.target; if (t.dataset.k) S.cv[t.dataset.k] = t.value; else if (t.dataset.g) S.cv[t.dataset.g][+t.dataset.i][t.dataset.f] = t.value; else return; save(); prev(); };
            body.onclick = e => {
                const b = e.target.closest('button'); if (!b) return;
                if (b.dataset.tpl) { S.cv.tpl = b.dataset.tpl; save(); renderCareer('cv'); }
                else if (b.dataset.add) { S.cv[b.dataset.add].push(b.dataset.add === 'exp' ? { role: '', org: '', period: '', desc: '' } : { deg: '', school: '', period: '' }); save(); renderCareer('cv'); }
                else if (b.dataset.del) { const [g, i] = b.dataset.del.split(':'); S.cv[g].splice(+i, 1); if (!S.cv[g].length) S.cv[g].push(g === 'exp' ? { role: '', org: '', period: '', desc: '' } : { deg: '', school: '', period: '' }); save(); renderCareer('cv'); }
                else if (b.id === 'cvPrint') printDoc(cvHTML(S.cv), CV_CSS);
            };
        } else if (tab === 'letter') {
            const L = S.letter;
            body.innerHTML = `<div class="ad-cvwrap"><div class="ad-card"><h3>Votre candidature</h3>
                <div class="ad-two">${field('Poste visé', 'data-l="job"', L.job)}${field('Entreprise', 'data-l="company"', L.company)}</div>
                ${field('Destinataire', 'data-l="to"', L.to, 'text', 'Madame, Monsieur')}
                ${area('Votre expérience clé (1 phrase)', 'data-l="exp"', L.exp, 'Forte de 4 ans en gestion de projet, …')}
                ${field('3 atouts (séparés par des virgules)', 'data-l="strengths"', L.strengths, 'text', 'rigueur, sens du service, autonomie')}
                ${area('Pourquoi ce poste ? (1 à 2 phrases)', 'data-l="why"', L.why)}
                <label class="ad-fld"><span>Ton</span><select class="ad-in" data-l="tone"><option value="formal" ${L.tone !== 'dyn' ? 'selected' : ''}>Formel</option><option value="dyn" ${L.tone === 'dyn' ? 'selected' : ''}>Dynamique</option></select></label>
                <button class="ad-btn gold" id="ltGen">Générer la lettre</button></div>
                <div><textarea class="ad-in ad-letter" id="ltOut" placeholder="Votre lettre apparaîtra ici : vous pourrez la modifier librement."></textarea>
                <div class="ad-row-btns"><button class="ad-btn out sm" id="ltCopy">Copier</button><button class="ad-btn dark sm" id="ltPrint">Imprimer / PDF</button></div></div></div>`;
            body.oninput = e => { if (e.target.dataset.l) { S.letter[e.target.dataset.l] = e.target.value; save(); } };
            body.onchange = body.oninput;
            body.onclick = e => {
                const id = e.target.id;
                if (id === 'ltGen') {
                    const atouts = String(L.strengths || '').split(',').map(s => s.trim()).filter(Boolean), civ = L.to || 'Madame, Monsieur';
                    const list = atouts.length > 1 ? atouts.slice(0, -1).join(', ') + ' et ' + atouts.slice(-1) : atouts[0] || '';
                    const formal = L.tone !== 'dyn';
                    $('#ltOut').value = `${S.cv.name || ''}\n\nObjet : candidature au poste de ${L.job || '[poste]'}\n\n${civ},\n\n${L.exp ? L.exp + ' ' : ''}C'est avec un vif intérêt que je vous adresse ma candidature au poste de ${L.job || '[poste]'} au sein de ${L.company || '[entreprise]'}.\n\n${L.why ? L.why + '\n\n' : ''}${list ? `Mes principaux atouts sont ${list}. Je suis convaincu(e) qu'ils me permettront de contribuer rapidement à vos objectifs.\n\n` : ''}${formal ? `Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail ma motivation.\n\nVeuillez agréer, ${civ}, l'expression de mes salutations distinguées.` : 'Je serais ravi(e) d\'échanger avec vous pour vous présenter ma motivation de vive voix.\n\nBien cordialement,'}\n\n${S.cv.name || ''}`;
                } else if (id === 'ltCopy') { navigator.clipboard && navigator.clipboard.writeText($('#ltOut').value).then(() => toast('Lettre copiée')); }
                else if (id === 'ltPrint') printDoc(`<div style="font-family:Georgia,serif;font-size:13px;line-height:1.7;padding:60px 70px;white-space:pre-wrap">${esc($('#ltOut').value)}</div>`, '');
            };
        } else {
            const q = IV[S.iv % IV.length];
            body.innerHTML = `<div class="ad-grid"><div class="ad-card"><small class="l">Question ${S.iv % IV.length + 1} / ${IV.length}</small><h3 style="font-size:1.8rem;margin-bottom:12px">${q[0]}</h3>
                <div class="ad-tip"><b>Conseil :</b> ${q[1]}</div>
                <div class="ad-big" id="ivT" style="margin:20px 0 4px">2:00</div><small>Entraînez-vous à répondre à voix haute, chrono en main.</small>
                <div class="ad-row-btns"><button class="ad-btn dark sm" id="ivGo">Lancer le chrono</button><button class="ad-btn out sm" id="ivNext">Question suivante</button></div></div>
                <div class="ad-card"><h3>La méthode STAR</h3>${[['S', 'Situation', 'Quel était le contexte ?'], ['T', 'Tâche', 'Quel était votre objectif ou votre rôle ?'], ['A', 'Action', 'Qu\'avez-vous fait concrètement ?'], ['R', 'Résultat', 'Qu\'est-ce qui a changé, chiffres à l\'appui ?']].map(([a, b, c]) => `<div class="ad-item"><b style="font-family:Fraunces,serif;font-size:1.4rem;color:var(--gold);width:28px">${a}</b><div><b>${b}</b><br><small>${c}</small></div></div>`).join('')}</div></div>`;
            $('#ivNext').onclick = () => { S.iv++; save(); renderCareer('iv'); };
            $('#ivGo').onclick = () => {
                clearInterval(ivTimer); const end = Date.now() + 120000;
                ivTimer = setInterval(() => { const l = Math.max(0, Math.ceil((end - Date.now()) / 1000)); $('#ivT').textContent = `${Math.floor(l / 60)}:${pad(l % 60)}`; if (!l) { clearInterval(ivTimer); tone(660, 0.6); toast('Temps écoulé : bravo pour cet entraînement'); } }, 250);
            };
        }
    }
    $$('#crTabs button').forEach(b => b.addEventListener('click', () => renderCareer(b.dataset.t)));
    renderCareer('cv');

    /* =========== FINANCES =========== */
    function lineChart(series, labels) {
        const W = 700, H = 240, p = 42, max = Math.max(1, ...series.flatMap(s => s.pts)), L = labels.length - 1 || 1;
        const x = i => p + i * (W - p - 14) / L, y = v => H - 30 - (v / max) * (H - 54);
        const grid = [0, .25, .5, .75, 1].map(f => `<line class="grid" x1="${p}" x2="${W - 14}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${p - 6}" y="${y(max * f) + 4}" text-anchor="end">${new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(max * f)}</text>`).join('');
        const xl = labels.map((l, i) => (labels.length < 12 || i % Math.ceil(labels.length / 8) === 0) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${l}</text>` : '').join('');
        const lines = series.map(s => { const pts = s.pts.map((v, i) => `${x(i)},${y(v)}`).join(' '); return `${s.fill ? `<polygon points="${p},${y(0)} ${pts} ${x(s.pts.length - 1)},${y(0)}" fill="${s.color}" opacity=".16"/>` : ''}<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>`; }).join('');
        return `<svg class="ad-chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${xl}${lines}</svg>`;
    }
    function renderMoney(tab) {
        $$('#mnTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
        $('#mnCur').value = S.cur;
        const body = $('#mnBody');
        if (tab === 'budget') {
            body.innerHTML = `<div class="ad-grid"><div class="ad-card"><h3>Revenus mensuels</h3>
                ${S.inc.map((r, i) => `<div class="ad-line inc"><input class="ad-in" data-b="inc" data-i="${i}" data-f="n" value="${esc(r.n)}" placeholder="Source"><input class="ad-in" type="number" min="0" data-b="inc" data-i="${i}" data-f="a" value="${r.a || ''}" placeholder="0"><button class="ad-x" data-del="inc:${i}" aria-label="Supprimer">✕</button></div>`).join('')}
                <button class="ad-btn out sm" data-add="inc">+ Revenu</button></div>
                <div class="ad-card"><h3>Dépenses mensuelles</h3>
                ${S.exp.map((r, i) => `<div class="ad-line"><input class="ad-in" data-b="exp" data-i="${i}" data-f="n" value="${esc(r.n)}" placeholder="Poste"><input class="ad-in" type="number" min="0" data-b="exp" data-i="${i}" data-f="a" value="${r.a || ''}" placeholder="0"><select class="ad-in" data-b="exp" data-i="${i}" data-f="t"><option value="besoin" ${r.t === 'besoin' ? 'selected' : ''}>Besoin</option><option value="envie" ${r.t === 'envie' ? 'selected' : ''}>Envie</option><option value="epargne" ${r.t === 'epargne' ? 'selected' : ''}>Épargne</option></select><button class="ad-x" data-del="exp:${i}" aria-label="Supprimer">✕</button></div>`).join('')}
                <button class="ad-btn out sm" data-add="exp">+ Dépense</button></div></div>
                <div class="ad-card" style="margin-top:22px"><h3>Analyse 50 / 30 / 20</h3><div id="bdSum"></div></div>`;
            const sum = () => {
                const t = totals(), by = k => S.exp.filter(x => x.t === k).reduce((a, x) => a + num(x.a), 0);
                if (!t.inc) return $('#bdSum').innerHTML = '<div class="ad-empty">Saisissez vos revenus et vos dépenses pour obtenir l\'analyse.</div>';
                const P = [['Besoins', by('besoin'), 50], ['Envies', by('envie'), 30], ['Épargne', by('epargne'), 20]];
                const tip = (() => { const [b, e, s] = P.map(x => x[1] / t.inc * 100); if (t.left < 0) return 'Vos dépenses dépassent vos revenus : identifiez en priorité les postes réductibles.'; if (b > 55) return 'Vos besoins pèsent plus de la moitié de vos revenus : regardez le logement, les abonnements et les crédits.'; if (s < 10) return 'Votre épargne est faible : essayez d\'automatiser un virement dès la réception de votre revenu.'; if (e > 35) return 'Les envies dépassent 30 % : un plafond mensuel simplifie les arbitrages.'; return 'Votre répartition est proche de l\'équilibre 50/30/20. Continuez ainsi.'; })();
                $('#bdSum').innerHTML = `<div class="ad-res"><div><small>Revenus</small><div class="ad-big">${money(t.inc)}</div></div><div><small>Dépenses</small><div class="ad-big">${money(t.exp)}</div></div><div><small>Reste à vivre</small><div class="ad-big ${t.left >= 0 ? 'pos' : 'neg'}">${money(t.left)}</div></div></div>
                    <div class="ad-bars">${P.map(([n, v, tg]) => { const pc = Math.round(v / t.inc * 100); return `<div><div class="top"><span>${n} · ${pc} %</span><span style="color:var(--mute);font-weight:500">cible ${tg} % · ${money(v)}</span></div><div class="ad-track"><i style="width:${Math.min(100, pc)}%"></i><b style="left:${tg}%"></b></div></div>`; }).join('')}</div><div class="ad-tip">${tip}</div>`;
            }; sum();
            body.oninput = e => { const t = e.target; if (!t.dataset.b) return; const r = S[t.dataset.b][+t.dataset.i]; r[t.dataset.f] = t.dataset.f === 'a' ? num(t.value) : t.value; save(); sum(); };
            body.onchange = body.oninput;
            body.onclick = e => {
                const b = e.target.closest('button'); if (!b) return;
                if (b.dataset.add) { S[b.dataset.add].push(b.dataset.add === 'inc' ? { n: '', a: 0 } : { n: '', a: 0, t: 'besoin' }); save(); renderMoney('budget'); }
                else if (b.dataset.del) { const [k, i] = b.dataset.del.split(':'); S[k].splice(+i, 1); save(); renderMoney('budget'); }
            };
        } else if (tab === 'save') {
            const m = S.sim || { P: 0, M: bigAmt() ? 50000 : 100, r: 5, y: 10 }; S.sim = m;
            body.innerHTML = `<div class="ad-grid"><div class="ad-card"><h3>Simulateur d'épargne</h3>${field('Capital de départ', 'data-s="P"', m.P, 'number')}${field('Versement mensuel', 'data-s="M"', m.M, 'number')}
                <div class="ad-two">${field('Rendement annuel (%)', 'data-s="r"', m.r, 'number')}${field('Durée (années)', 'data-s="y"', m.y, 'number')}</div>
                <p class="ad-sub" style="font-size:.82rem;margin:6px 0 0">Intérêts composés, capitalisation mensuelle. Estimation théorique, sans fiscalité ni frais, qui ne garantit aucun rendement.</p></div>
                <div class="ad-card"><div id="svOut"></div></div></div>`;
            const calc = () => {
                const P = num(m.P), M = num(m.M), r = num(m.r) / 100 / 12, Y = Math.min(60, Math.max(1, Math.round(num(m.y)))), pts = [], inv = [], lab = [];
                for (let y = 0; y <= Y; y++) { const k = y * 12, bal = r ? P * Math.pow(1 + r, k) + M * (Math.pow(1 + r, k) - 1) / r : P + M * k; pts.push(bal); inv.push(P + M * k); lab.push(y + ' a'); }
                const fin = pts[Y], tot = inv[Y];
                $('#svOut').innerHTML = `<div class="ad-res"><div><small>Capital final</small><div class="ad-big">${money(fin)}</div></div><div><small>Total versé</small><div class="ad-big">${money(tot)}</div></div><div><small>Intérêts</small><div class="ad-big pos">${money(fin - tot)}</div></div></div>${lineChart([{ pts: inv, color: '#8A8FA3' }, { pts, color: '#C9A24B', fill: true }], lab)}<div class="ad-legend"><span><i style="background:#8A8FA3"></i>Total versé</span><span><i style="background:#C9A24B"></i>Capital avec intérêts</span></div>`;
            }; calc();
            body.oninput = e => { if (e.target.dataset.s) { m[e.target.dataset.s] = e.target.value; save(); calc(); } };
        } else {
            const m = S.loan || { L: bigAmt() ? 5000000 : 20000, r: 8, y: 5 }; S.loan = m;
            body.innerHTML = `<div class="ad-grid"><div class="ad-card"><h3>Calculateur de crédit</h3>${field('Montant emprunté', 'data-s="L"', m.L, 'number')}
                <div class="ad-two">${field('Taux annuel (%)', 'data-s="r"', m.r, 'number')}${field('Durée (années)', 'data-s="y"', m.y, 'number')}</div>
                <p class="ad-sub" style="font-size:.82rem;margin:6px 0 0">Estimation hors assurance et frais de dossier. Comparez toujours plusieurs offres.</p></div><div class="ad-card"><div id="lnOut"></div></div></div>`;
            const calc = () => {
                const L = num(m.L), n = Math.max(1, Math.round(num(m.y) * 12)), r = num(m.r) / 100 / 12;
                const pay = r ? L * r / (1 - Math.pow(1 + r, -n)) : L / n, tot = pay * n, it = tot - L, pc = tot ? Math.round(it / tot * 100) : 0;
                $('#lnOut').innerHTML = `<div class="ad-res"><div><small>Mensualité</small><div class="ad-big">${money(pay)}</div></div><div><small>Coût du crédit</small><div class="ad-big neg">${money(it)}</div></div><div><small>Total remboursé</small><div class="ad-big">${money(tot)}</div></div></div>
                    <div class="ad-bars"><div><div class="top"><span>Part des intérêts · ${pc} %</span></div><div class="ad-track"><i style="width:${pc}%"></i></div></div></div>
                    <div class="ad-tip">Une mensualité raisonnable reste généralement sous un tiers de vos revenus nets (tous crédits confondus).</div>`;
            }; calc();
            body.oninput = e => { if (e.target.dataset.s) { m[e.target.dataset.s] = e.target.value; save(); calc(); } };
        }
    }
    $$('#mnTabs button').forEach(b => b.addEventListener('click', () => renderMoney(b.dataset.t)));
    $('#mnCur').addEventListener('change', e => { S.cur = e.target.value; S.sim = null; S.loan = null; save(); renderMoney($('#mnTabs .on').dataset.t); });
    renderMoney('budget');

    /* =========== HABITUDES =========== */
    const SUGG = ['Boire 2 L d\'eau', 'Marcher 30 minutes', 'Lire 20 minutes', 'Se coucher avant 23 h', 'Méditer 5 minutes', 'Pas d\'écran au lit', 'Étirements', 'Planifier ma journée'];
    const streakOf = h => { let n = 0, d = new Date(); if (!h.log[dk(d)]) d = new Date(Date.now() - DAY); while (h.log[dk(d)]) { n++; d = new Date(d.getTime() - DAY); } return n; };
    const rate30 = h => { let c = 0; for (let i = 0; i < 30; i++) if (h.log[dk(new Date(Date.now() - i * DAY))]) c++; return Math.round(c / 30 * 100); };
    function renderHabits() {
        const body = $('#hbBody'), hb = habitsToday(), pc = hb.n ? Math.round(hb.done / hb.n * 100) : 0;
        const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * DAY));
        body.innerHTML = `<div class="ad-grid" style="grid-template-columns:minmax(260px,320px) 1fr"><div class="ad-card ad-center"><small class="l">Aujourd'hui</small><div class="ad-ring" style="--p:${pc};margin:10px auto 14px"><div>${hb.done}/${hb.n}</div></div>
            <p style="margin:0 0 18px;color:var(--mute);font-size:.9rem">${hb.n ? (pc === 100 ? 'Journée complète, bravo.' : 'Continuez, il reste ' + (hb.n - hb.done) + ' habitude(s).') : 'Ajoutez votre première habitude.'}</p>
            <div class="ad-add" style="display:flex;gap:8px"><input class="ad-in" id="hbIn" placeholder="Nouvelle habitude" maxlength="50"><button class="ad-btn dark sm" id="hbAdd">Ajouter</button></div>
            <div class="ad-chips">${SUGG.filter(s => !S.habits.some(h => h.n === s)).slice(0, 5).map(s => `<button data-s="${esc(s)}">+ ${s}</button>`).join('')}</div></div>
            <div class="ad-card">${S.habits.length ? S.habits.map((h, i) => `<div class="ad-habit"><div><h4>${esc(h.n)}</h4><small>🔥 ${streakOf(h)} jour(s) de suite · ${rate30(h)} % sur 30 jours</small></div>
                <div class="ad-days">${days.map(d => `<div class="ad-day ${dk(d) === dk() ? 'today' : ''}">${'dlmmjvs'[d.getDay()]}<button class="${h.log[dk(d)] ? 'on' : ''}" data-h="${i}" data-d="${dk(d)}" aria-label="${dk(d)}">${h.log[dk(d)] ? '✓' : ''}</button></div>`).join('')}<button class="ad-x" data-del="${i}" aria-label="Supprimer">✕</button></div></div>`).join('') : '<div class="ad-empty">Aucune habitude pour le moment. Choisissez-en une suggestion ou créez la vôtre.</div>'}</div></div>`;
        const add = n => { n = n.trim(); if (!n) return; S.habits.push({ n, log: {} }); save(); renderHabits(); };
        $('#hbAdd').onclick = () => add($('#hbIn').value); $('#hbIn').onkeydown = e => { if (e.key === 'Enter') add(e.target.value); };
        body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => add(b.dataset.s));
        body.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const h = S.habits[+b.dataset.h]; h.log[b.dataset.d] ? delete h.log[b.dataset.d] : (h.log[b.dataset.d] = 1, tone(660, 0.15)); save(); renderHabits(); });
        body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette habitude ?')) { S.habits.splice(+b.dataset.del, 1); save(); renderHabits(); } });
    }

    /* =========== SÉRÉNITÉ =========== */
    const MEDS = {
        souffle: ['Respiration', ['Installez-vous confortablement, le dos droit, les épaules relâchées.', 'Fermez les yeux. Portez l\'attention sur votre souffle, sans le modifier.', 'Inspirez lentement par le nez… puis expirez doucement par la bouche.', 'Si votre esprit s\'égare, ramenez-le simplement au souffle, sans vous juger.', 'Sentez le poids de votre corps soutenu par le siège.', 'Laissez la respiration trouver son propre rythme.']],
        corps: ['Scan corporel', ['Fermez les yeux et prenez trois respirations profondes.', 'Portez l\'attention sur vos pieds : sentez le contact, la chaleur.', 'Remontez vers les jambes, les genoux, les cuisses. Relâchez.', 'Ressentez le ventre, le dos, la poitrine. Laissez tomber les tensions.', 'Relâchez les épaules, les bras, les mains.', 'Détendez la nuque, la mâchoire, le front. Le visage est doux.']],
        gratitude: ['Gratitude', ['Prenez une respiration profonde et laissez les épaules descendre.', 'Pensez à une chose simple dont vous êtes reconnaissant(e) aujourd\'hui.', 'Ressentez ce que cela vous fait dans le corps.', 'Pensez à une personne qui compte pour vous. Remerciez-la en silence.', 'Pensez à une qualité en vous que vous appréciez.', 'Gardez cette sensation de gratitude en vous.']]
    };
    let medT = null, medNoise = null, medKind = 'souffle', medMin = 5;
    function stopNoise() { if (medNoise) { try { medNoise.stop(); } catch (e) { } medNoise = null; } }
    function medStop() { clearInterval(medT); medT = null; stopNoise(); }
    const STRESS = [['Au cours du dernier mois, combien de fois vous êtes-vous senti(e) incapable de contrôler les choses importantes de votre vie ?', 0], ['… vous êtes-vous senti(e) confiant(e) dans votre capacité à gérer vos problèmes personnels ?', 1], ['… avez-vous senti que les choses allaient comme vous le souhaitiez ?', 1], ['… avez-vous senti que les difficultés s\'accumulaient au point de ne pouvoir les surmonter ?', 0]];
    const SC = ['Jamais', 'Presque jamais', 'Parfois', 'Assez souvent', 'Très souvent'];
    function renderCalm() {
        const body = $('#clBody'), wk = medWeek(), sess = S.med.length;
        body.innerHTML = `<div class="ad-grid"><div class="ad-card ad-center"><h3>Méditation guidée</h3>
            <div class="ad-chips" style="justify-content:center;margin:0 0 6px">${Object.entries(MEDS).map(([k, v]) => `<button data-k="${k}" style="${medKind === k ? 'background:var(--ink);color:var(--bg)' : ''}">${v[0]}</button>`).join('')}</div>
            <div class="ad-chips" style="justify-content:center;margin:0 0 6px">${[3, 5, 10, 20].map(m => `<button data-m="${m}" style="${medMin === m ? 'background:var(--ink);color:var(--bg)' : ''}">${m} min</button>`).join('')}</div>
            <div class="ad-orb" id="mdOrb"><span id="mdT">${medMin}:00</span></div><div class="ad-guide" id="mdG">Choisissez un thème et une durée, puis commencez.</div>
            <div class="ad-row-btns" style="justify-content:center"><button class="ad-btn dark" id="mdGo">Commencer</button><button class="ad-btn out" id="mdNoise">Ambiance sonore</button></div>
            <small style="display:block;margin-top:14px">Cette semaine : ${wk} min · ${sess} séance(s) au total</small></div>
            <div class="ad-card"><h3>Évaluer mon stress</h3><div id="stBox"></div></div></div>
            <div class="ad-card" style="margin-top:22px"><h3>Journal de gratitude</h3><textarea class="ad-in" id="grTxt" placeholder="Trois choses positives de votre journée…"></textarea><div class="ad-row-btns"><button class="ad-btn dark sm" id="grSave">Enregistrer</button></div>
            ${S.grat.slice(0, 4).map((g, i) => `<div class="ad-item"><div><small>${g.d}</small><br>${esc(g.t)}</div><button class="ad-x" data-g="${i}" aria-label="Supprimer">✕</button></div>`).join('')}</div>`;
        body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { medStop(); medKind = b.dataset.k; renderCalm(); });
        body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { medStop(); medMin = +b.dataset.m; renderCalm(); });
        $('#mdGo').onclick = () => medT ? (medStop(), renderCalm()) : medStart();
        $('#mdNoise').onclick = () => {
            if (medNoise) return stopNoise();
            const c = getCtx(); if (c.state === 'suspended') c.resume();
            const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
            for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
            const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0.28; src.connect(g).connect(c.destination); src.start(); medNoise = src;
        };
        $('#grSave').onclick = () => { const v = $('#grTxt').value.trim(); if (!v) return; S.grat.unshift({ d: new Date().toLocaleDateString('fr-FR'), t: v }); S.grat = S.grat.slice(0, 40); save(); renderCalm(); toast('Enregistré sur cet appareil'); };
        body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { S.grat.splice(+b.dataset.g, 1); save(); renderCalm(); });
        renderStress();
    }
    function medStart() {
        const total = medMin * 60, end = Date.now() + total * 1000, steps = MEDS[medKind][1], every = Math.max(18, total / steps.length);
        $('#mdOrb').classList.add('go'); $('#mdGo').textContent = 'Arrêter';
        const tick = () => {
            const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)), el = total - left;
            $('#mdT').textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
            $('#mdG').textContent = steps[Math.min(steps.length - 1, Math.floor(el / every))];
            if (!left) { medStop(); S.med.push({ t: Date.now(), min: medMin }); save();[528, 660, 792].forEach((f, i) => setTimeout(() => tone(f, 2.5, 0.07), i * 400)); toast(`Séance terminée · ${medMin} min`); renderCalm(); }
        };
        tick(); medT = setInterval(tick, 500);
    }
    function renderStress() {
        const box = $('#stBox');
        if (S.stress && S.stress.done) {
            const sc = S.stress.score, band = sc <= 5 ? ['Faible', 'Votre niveau de stress perçu semble faible. Continuez vos routines protectrices (sommeil, mouvement, liens).'] : sc <= 10 ? ['Modéré', 'Un stress modéré est courant. Essayez une courte méditation quotidienne et repérez ce qui vous charge le plus.'] : ['Élevé', 'Votre stress perçu est élevé. Si cela dure, parlez-en à votre médecin ou à un professionnel de santé mentale : vous n\'avez pas à tout porter seul(e).'];
            box.innerHTML = `<small class="l">Score : ${sc} / 16</small><div class="ad-big">${band[0]}</div><div class="ad-tip">${band[1]}</div><p class="ad-sub" style="font-size:.78rem;margin:12px 0">Questionnaire d'auto-évaluation indicatif (inspiré de l'échelle PSS-4). Il ne constitue pas un diagnostic.</p><button class="ad-btn out sm" id="stRe">Refaire</button>`;
            return void ($('#stRe').onclick = () => { S.stress = null; save(); renderStress(); });
        }
        const a = (S.stress && S.stress.a) || [], i = a.length;
        if (i >= STRESS.length) { const score = a.reduce((s, v, k) => s + (STRESS[k][1] ? 4 - v : v), 0); S.stress = { done: 1, score }; save(); return renderStress(); }
        box.innerHTML = `<small class="l">Question ${i + 1} / ${STRESS.length}</small><p style="font-family:Fraunces,serif;font-size:1.15rem;line-height:1.5;margin:0 0 6px">${STRESS[i][0]}</p><div class="ad-opts">${SC.map((s, v) => `<button data-v="${v}">${s}</button>`).join('')}</div>`;
        box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { S.stress = { a: [...a, +b.dataset.v] }; save(); renderStress(); });
    }

    /* =========== OBJECTIFS =========== */
    const DOMS = ['Santé', 'Carrière', 'Finances', 'Famille', 'Vie sociale', 'Couple', 'Développement', 'Loisirs'];
    const goalPct = g => g.done ? 100 : g.steps.length ? Math.round(g.steps.filter(s => s.d).length / g.steps.length * 100) : 0;
    function radar(vals, size = 380) {
        const c = size / 2, R = size * 0.3, n = vals.length, pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * R * v / 10, c + Math.sin(a) * R * v / 10]; };
        const rings = [2, 4, 6, 8, 10].map(v => `<polygon class="g" points="${vals.map((_, i) => pt(i, v).join(',')).join(' ')}"/>`).join('');
        const axes = vals.map((_, i) => `<line class="g" x1="${c}" y1="${c}" x2="${pt(i, 10)[0]}" y2="${pt(i, 10)[1]}"/>`).join('');
        const poly = `<polygon points="${vals.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="#C9A24B" fill-opacity=".3" stroke="#C9A24B" stroke-width="2.5"/>`;
        const lab = vals.map((_, i) => { const [x, y] = pt(i, 11.8), anchor = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end'; return `<text x="${x}" y="${y + 4}" text-anchor="${anchor}">${DOMS[i]}</text>`; }).join('');
        return `<svg class="ad-radar" viewBox="0 0 ${size} ${size}" role="img">${rings}${axes}${poly}${lab}</svg>`;
    }
    function renderGoals() {
        const body = $('#glBody'), vals = DOMS.map(d => S.wheel[d] == null ? 5 : S.wheel[d]);
        const sorted = DOMS.map((d, i) => [d, vals[i]]).sort((a, b) => a[1] - b[1]);
        body.innerHTML = `<div class="ad-grid"><div class="ad-card"><h3>Roue de la vie</h3><p class="ad-sub" style="margin:0 0 12px;font-size:.9rem">Notez de 1 à 10 votre satisfaction dans chaque domaine.</p>
            ${DOMS.map((d, i) => `<label class="ad-sl">${d}<input type="range" min="1" max="10" value="${vals[i]}" data-w="${d}"><b>${vals[i]}</b></label>`).join('')}</div>
            <div class="ad-card"><div id="rdr">${radar(vals)}</div><div class="ad-tip" id="rdTip">À nourrir en priorité : <b>${sorted[0][0]}</b> et <b>${sorted[1][0]}</b>. Votre point fort : <b>${sorted[7][0]}</b>.</div></div></div>
            <div class="ad-card" style="margin-top:22px"><h3>Mes objectifs</h3>
            <div class="ad-two" style="grid-template-columns:2fr 1fr 1fr auto;align-items:end"><label class="ad-fld" style="margin:0"><span>Objectif</span><input class="ad-in" id="glT" placeholder="Courir un semi-marathon" maxlength="80"></label><label class="ad-fld" style="margin:0"><span>Domaine</span><select class="ad-in" id="glD">${DOMS.map(d => `<option>${d}</option>`).join('')}</select></label><label class="ad-fld" style="margin:0"><span>Échéance</span><input class="ad-in" type="date" id="glE"></label><button class="ad-btn dark sm" id="glAdd" style="height:46px">Ajouter</button></div>
            <div style="margin-top:12px">${S.goals.length ? S.goals.map((g, gi) => {
            const p = goalPct(g), left = g.due ? Math.ceil((new Date(g.due) - Date.now()) / DAY) : null; return `<div class="ad-goal"><div class="meta"><div><h4>${esc(g.t)}${g.done ? ' ✅' : ''}</h4><small>${esc(g.dom)}${left !== null ? ' · ' + (left >= 0 ? left + ' jour(s) restants' : 'échéance dépassée') : ''}</small></div><div><button class="ad-x" data-tg="${gi}">${g.done ? 'Rouvrir' : 'Terminer'}</button><button class="ad-x" data-dg="${gi}">Supprimer</button></div></div>
                <div class="ad-track" style="margin:10px 0"><i style="width:${p}%"></i></div><small>${p} %</small>
                <ul class="ad-steps">${g.steps.map((s, si) => `<li class="${s.d ? 'done' : ''}"><input type="checkbox" data-gs="${gi}:${si}" ${s.d ? 'checked' : ''}><span>${esc(s.t)}</span><button class="ad-x" data-ds="${gi}:${si}" aria-label="Supprimer">✕</button></li>`).join('')}</ul>
                <div style="display:flex;gap:8px"><input class="ad-in" data-ns="${gi}" placeholder="Ajouter une étape concrète…" maxlength="80"><button class="ad-btn out sm" data-as="${gi}">+</button></div></div>`;
        }).join('') : '<div class="ad-empty">Aucun objectif. Un bon objectif est précis, mesurable et daté.</div>'}</div></div>`;
        body.querySelectorAll('[data-w]').forEach(r => r.oninput = () => { S.wheel[r.dataset.w] = +r.value; r.nextElementSibling.textContent = r.value; save(); const v = DOMS.map(d => S.wheel[d] == null ? 5 : S.wheel[d]); $('#rdr').innerHTML = radar(v); const s = DOMS.map((d, i) => [d, v[i]]).sort((a, b) => a[1] - b[1]); $('#rdTip').innerHTML = `À nourrir en priorité : <b>${s[0][0]}</b> et <b>${s[1][0]}</b>. Votre point fort : <b>${s[7][0]}</b>.`; });
        $('#glAdd').onclick = () => { const t = $('#glT').value.trim(); if (!t) return; S.goals.unshift({ t, dom: $('#glD').value, due: $('#glE').value, steps: [], done: false }); save(); renderGoals(); };
        body.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { const g = S.goals[+b.dataset.tg]; g.done = !g.done; if (g.done) { toast('Objectif atteint, félicitations'); tone(784, 0.5); } save(); renderGoals(); });
        body.querySelectorAll('[data-dg]').forEach(b => b.onclick = () => { if (confirm('Supprimer cet objectif ?')) { S.goals.splice(+b.dataset.dg, 1); save(); renderGoals(); } });
        body.querySelectorAll('[data-gs]').forEach(c => c.onchange = () => { const [g, s] = c.dataset.gs.split(':'); S.goals[+g].steps[+s].d = c.checked; save(); renderGoals(); });
        body.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => { const [g, s] = b.dataset.ds.split(':'); S.goals[+g].steps.splice(+s, 1); save(); renderGoals(); });
        const addStep = gi => { const i = body.querySelector(`[data-ns="${gi}"]`), v = i.value.trim(); if (!v) return; S.goals[gi].steps.push({ t: v, d: false }); save(); renderGoals(); };
        body.querySelectorAll('[data-as]').forEach(b => b.onclick = () => addStep(+b.dataset.as));
        body.querySelectorAll('[data-ns]').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') addStep(+i.dataset.ns); });
    }

    /* =========== MÉDIAS =========== */
    // ➕ POUR AJOUTER UNE VIDÉO : copie un bloc et modifie-le.
    //   type : 'file' (vidéo de ton site, ex. assets/media/conf1.mp4) ou 'youtube' (src = identifiant de la vidéo)
    const TV = [
        // { title: 'Conférence : gérer son budget', desc: 'Intervenant · 38 min', duration: '38:10', type: 'youtube', src: 'ABC123xyz',
        //   poster: '', emoji: '🎙️', color: 'linear-gradient(135deg,#1B2A4A,#C9A24B)' }
    ];
    const tvModal = $('#adTvModal'), tvScreen = $('#adTvScreen');
    function renderTV() {
        const g = $('#adTvGrid');
        if (!TV.length) { g.innerHTML = '<div class="tv-empty"><span>🎞️</span><h3 style="font-family:Fraunces,serif">Votre médiathèque arrive bientôt</h3><p>Les premiers contenus seront ajoutés ici.</p></div>'; return; }
        g.innerHTML = TV.map((c, i) => {
            const p = c.poster || (c.type === 'youtube' ? `https://i.ytimg.com/vi/${c.src}/hqdefault.jpg` : '');
            const s = p ? `background-image:url('${p}')` : `background:${c.color || 'linear-gradient(135deg,#1B2A4A,#C9A24B)'}`;
            return `<button class="tv-card" data-i="${i}"><span class="tv-thumb" style="${s}">${p ? '' : `<span class="e">${c.emoji || '🎞️'}</span>`}<span class="tv-play">▶</span>${c.duration ? `<span class="tv-dur">${c.duration}</span>` : ''}</span><span class="tv-info"><strong>${esc(c.title)}</strong><small>${esc(c.desc || '')}</small></span></button>`;
        }).join('');
        $$('.tv-card', g).forEach(b => b.addEventListener('click', () => openTV(+b.dataset.i)));
    }
    function openTV(i) {
        const c = TV[i]; if (!c) return; medStop();
        if (c.type === 'youtube') tvScreen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.src)}?autoplay=1&rel=0&modestbranding=1" title="${esc(c.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
        else { const v = document.createElement('video'); v.controls = v.autoplay = v.playsInline = true; if (c.poster) v.poster = c.poster; v.src = c.src; tvScreen.innerHTML = ''; tvScreen.appendChild(v); v.addEventListener('error', () => { tvScreen.innerHTML = `<div class="tv-err">Vidéo introuvable.<br>Vérifiez le chemin : ${esc(c.src)}</div>`; }); }
        $('#adTvTitle').textContent = c.title; tvModal.classList.add('active'); tvModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    }
    function closeTV() { tvScreen.innerHTML = ''; tvModal.classList.remove('active'); tvModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    $('#adTvClose').addEventListener('click', closeTV);
    tvModal.addEventListener('click', e => { if (e.target === tvModal) closeTV(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tvModal.classList.contains('active')) closeTV(); });
    renderTV();

    renderHome(); renderHabits(); renderGoals();
})();
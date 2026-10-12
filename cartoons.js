/* =========================================================
   DESSINS ANIMÉS (cercle 0-7 ans) — 20 vidéos YouTube + lecteur
   Remplace entièrement l'ancien cartoons.js
   ========================================================= */

// ➕ POUR AJOUTER UN DESSIN ANIMÉ : copie un bloc et modifie-le.
//   g     : le personnage / la série (sert aux boutons de filtre)
//   type  : 'youtube' (src = identifiant de la vidéo) ou 'file' (src = chemin d'un .mp4 de ton site)
//   La miniature YouTube s'affiche toute seule.
// 🔗 Où trouver l'identifiant : c'est ce qui suit « v= » dans le lien YouTube.
const CARTOONS = [
    // ---------- Trotro ----------
    { g: 'Trotro', title: 'Trotro · Compilation (Trotro arrose)', desc: 'Les aventures du petit âne Trotro', type: 'youtube', src: 'j7ns7oBIrC0' },
    { g: 'Trotro', title: 'Trotro · 1 heure de compilation #01', desc: 'Plusieurs épisodes à la suite', duration: '1 h', type: 'youtube', src: 'uMmgbfNLQAY' },
    { g: 'Trotro', title: 'Trotro · 1 h, nouveau format #02', desc: 'Compilation de Trotro', duration: '1 h', type: 'youtube', src: 'GXHtYOsLw48' },
    { g: 'Trotro', title: 'Trotro est un gentil petit âne', desc: 'Un épisode tout doux', type: 'youtube', src: 'gtoSMTzufhk' },

    // ---------- T'choupi ----------
    { g: 'T\'choupi', title: 'T\'choupi à l\'école · Le labyrinthe géant', desc: 'Compilation de 8 épisodes', duration: '1 h', type: 'youtube', src: 'Rn9YvZXbuT4' },
    { g: 'T\'choupi', title: 'T\'choupi à l\'école · Le cadeau des mamans', desc: 'Compilation de 8 épisodes', duration: '1 h', type: 'youtube', src: 'yxYUQA8xrNc' },
    { g: 'T\'choupi', title: 'T\'choupi et Doudou · Au bord de la mer', desc: 'Compilation d\'épisodes', duration: '1 h', type: 'youtube', src: 'gICUcb71DCg' },
    { g: 'T\'choupi', title: 'T\'choupi et ses amis · Spécial animaux', desc: 'Compilation de 10 épisodes', duration: '1 h', type: 'youtube', src: 'gAw4TSiT8IQ' },

    // ---------- Petit Ours Brun ----------
    { g: 'Petit Ours Brun', title: 'Petit Ours Brun · 1 h d\'épisodes complets', desc: 'Petit Ours Brun officiel', duration: '1 h', type: 'youtube', src: 'pLyNtjGf47Y' },
    { g: 'Petit Ours Brun', title: 'Petit Ours Brun · Marathon d\'épisodes', desc: 'Dessin animé pour enfants', type: 'youtube', src: 'pkN-Hr0t_n4' },
    { g: 'Petit Ours Brun', title: 'Petit Ours Brun · Compilation de comptines', desc: 'Dessin animé pour bébé', type: 'youtube', src: 'JnnssAjQ0tQ' },

    // ---------- Pocoyo ----------
    { g: 'Pocoyo', title: 'Pocoyo · Les épisodes les plus regardés', desc: 'Saison 1, en français', duration: '66 min', type: 'youtube', src: 'GMImTBuydUY' },
    { g: 'Pocoyo', title: 'Pocoyo · La clé', desc: 'Saison 1, épisode 13', type: 'youtube', src: 'eCvG5yvGLXA' },
    { g: 'Pocoyo', title: 'Pocoyo · Le coup de chaleur', desc: 'Compilation en français', duration: '91 min', type: 'youtube', src: '4S1au1YTGik' },

    // ---------- Comptines ----------
    { g: 'Comptines', title: 'Titounis · Mon bébé', desc: '1 heure de comptines pour les petits', duration: '1 h', type: 'youtube', src: '98DS22rnA-o' },
    { g: 'Comptines', title: 'Titounis · Comptines et chansons', desc: 'Pour bébés et enfants', type: 'youtube', src: 'EAaaauMqoJ8' },
    { g: 'Comptines', title: 'Monde des Titounis · Ah les crocodiles', desc: '3 heures de comptines et chansons', duration: '3 h', type: 'youtube', src: '1RFpSYrxsTA' },

    // ---------- Masha et Michka ----------
    { g: 'Masha et Michka', title: 'Masha et Michka · Mon bébé est affamé', desc: 'Collection d\'épisodes', type: 'youtube', src: '4eJbgZSifbY' },
    { g: 'Masha et Michka', title: 'Masha et Michka · Toutes les historiettes', desc: 'Collection d\'épisodes', type: 'youtube', src: '2EaOmSiY0p8' },
    { g: 'Masha et Michka', title: 'Masha et Michka · Bonjour, Michka !', desc: 'Collection d\'épisodes', type: 'youtube', src: 'dMVlUXfhvIU' }
];

const cartoonGrid = document.getElementById('cartoonGrid');
const cartoonModal = document.getElementById('cartoonModal');
const cartoonScreen = document.getElementById('cartoonScreen');
const cartoonModalTitle = document.getElementById('cartoonModalTitle');
let cartoonFilter = 'Tous';

function cartoonEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderCartoonFilters() {
    if (!cartoonGrid) return;
    let bar = document.getElementById('cartoonFilters');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'cartoonFilters';
        bar.className = 'cartoon-filters';
        cartoonGrid.parentNode.insertBefore(bar, cartoonGrid);
    }
    const groups = ['Tous', ...new Set(CARTOONS.map(c => c.g).filter(Boolean))];
    bar.style.display = groups.length > 2 ? '' : 'none';
    bar.innerHTML = groups.map(g => `<button type="button" class="cartoon-chip ${g === cartoonFilter ? 'active' : ''}" data-g="${cartoonEsc(g)}">${cartoonEsc(g)}</button>`).join('');
    bar.querySelectorAll('.cartoon-chip').forEach(b => b.addEventListener('click', () => {
        cartoonFilter = b.dataset.g;
        renderCartoonFilters();
        renderCartoons();
    }));
}

function renderCartoons() {
    if (!cartoonGrid) return;
    if (CARTOONS.length === 0) {
        cartoonGrid.innerHTML = `
            <div class="cartoon-empty">
                <span>🎬</span>
                <h3>Les dessins animés arrivent bientôt !</h3>
                <p>De nouveaux petits films seront ajoutés ici très prochainement.</p>
            </div>`;
        return;
    }
    cartoonGrid.innerHTML = CARTOONS.map((c, i) => {
        if (cartoonFilter !== 'Tous' && c.g !== cartoonFilter) return '';
        const posterUrl = c.poster || (c.type === 'youtube' ? `https://i.ytimg.com/vi/${encodeURIComponent(c.src)}/hqdefault.jpg` : null);
        const thumbStyle = posterUrl
            ? `background-image:url('${posterUrl}');`
            : `background:${c.color || 'linear-gradient(135deg,#FF8B6A,#453B52)'};`;
        return `
        <button class="cartoon-card" type="button" data-index="${i}">
            <span class="cartoon-thumb" style="${thumbStyle}">
                ${posterUrl ? '' : `<span class="cartoon-thumb-emoji">${c.emoji || '🎬'}</span>`}
                <span class="cartoon-play">▶</span>
                ${c.duration ? `<span class="cartoon-duration">${cartoonEsc(c.duration)}</span>` : ''}
            </span>
            <span class="cartoon-info">
                <strong>${cartoonEsc(c.title)}</strong>
                <small>${cartoonEsc(c.desc || '')}</small>
            </span>
        </button>`;
    }).join('');

    cartoonGrid.querySelectorAll('.cartoon-card').forEach(card => {
        card.addEventListener('click', () => openCartoon(parseInt(card.dataset.index, 10)));
    });
}

function openCartoon(index) {
    const c = CARTOONS[index];
    if (!c) return;

    // On coupe tout le son du site (voix, mélodies) pour laisser place à la vidéo
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (typeof stopMelody === 'function') stopMelody();
    if (typeof stopStoryNarration === 'function') stopStoryNarration();
    document.querySelectorAll('.playlist .play-icon').forEach(i => i.textContent = '▶');

    if (c.type === 'youtube') {
        cartoonScreen.innerHTML = `<iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.src)}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
            title="${cartoonEsc(c.title)}"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen></iframe>`;
    } else {
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'metadata';
        if (c.poster) video.poster = c.poster;
        video.src = c.src;
        cartoonScreen.innerHTML = '';
        cartoonScreen.appendChild(video);
        video.addEventListener('error', () => {
            cartoonScreen.innerHTML = `<div class="cartoon-error">😢 Cette vidéo n'a pas pu être chargée.<br><small>Vérifie le chemin : ${cartoonEsc(c.src)}</small></div>`;
        });
    }

    cartoonModalTitle.textContent = c.title;
    cartoonModal.classList.add('active');
    cartoonModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeCartoon() {
    // Vider l'écran arrête immédiatement la lecture (vidéo ou YouTube)
    cartoonScreen.innerHTML = '';
    cartoonModal.classList.remove('active');
    cartoonModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

document.getElementById('cartoonClose').addEventListener('click', closeCartoon);
cartoonModal.addEventListener('click', (e) => { if (e.target === cartoonModal) closeCartoon(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartoonModal.classList.contains('active')) closeCartoon();
});

// Si on change d'onglet ou qu'on retourne aux cercles, la vidéo s'arrête
const _goToPageOriginal = goToPage;
goToPage = function (id) {
    if (cartoonModal.classList.contains('active')) closeCartoon();
    _goToPageOriginal(id);
};
// Retour aux cercles : on arrête aussi la vidéo
new MutationObserver(() => {
    if (document.body.dataset.zone !== 'kids' && cartoonModal.classList.contains('active')) closeCartoon();
}).observe(document.body, { attributes: true, attributeFilter: ['data-zone'] });

renderCartoonFilters();
renderCartoons();

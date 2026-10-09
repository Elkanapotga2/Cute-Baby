/* =========================================================
   DESSINS ANIMÉS — ta collection + lecteur vidéo
   ========================================================= */

// ➕ POUR AJOUTER UN DESSIN ANIMÉ : copie un bloc ci-dessous et modifie-le.
//   type  : 'file'    → vidéo hébergée avec ton site (ex. assets/cartoons/lapin.mp4)
//           'youtube' → lien YouTube (mets juste l'identifiant de la vidéo)
//   src   : chemin du fichier OU identifiant YouTube
//   poster: (facultatif) image de couverture, ex. 'assets/cartoons/lapin.jpg'
//   emoji / color : utilisés si tu n'as pas d'image de couverture
const CARTOONS = [
    // Exemples à remplacer par tes vrais dessins animés :
    // {
    //     title: 'Câlin le petit lapin',
    //     desc: 'Épisode 1 · Le doudou perdu',
    //     duration: '3:20',
    //     type: 'file',
    //     src: 'assets/cartoons/calin-ep1.mp4',
    //     poster: 'assets/cartoons/calin-ep1.jpg',
    //     emoji: '🐰',
    //     color: 'linear-gradient(135deg, #C6A8E0, #453B52)'
    // },
    // {
    //     title: 'La chanson des couleurs',
    //     desc: 'Chanson animée',
    //     duration: '2:05',
    //     type: 'youtube',
    //     src: 'dQw4w9WgXcQ',
    //     emoji: '🌈',
    //     color: 'linear-gradient(135deg, #74C7E3, #453B52)'
    // }
];

const cartoonGrid = document.getElementById('cartoonGrid');
const cartoonModal = document.getElementById('cartoonModal');
const cartoonScreen = document.getElementById('cartoonScreen');
const cartoonModalTitle = document.getElementById('cartoonModalTitle');

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
        const thumbStyle = c.poster
            ? `background-image:url('${c.poster}');`
            : `background:${c.color || 'linear-gradient(135deg,#FF8B6A,#453B52)'};`;
        return `
        <button class="cartoon-card" type="button" data-index="${i}">
            <span class="cartoon-thumb" style="${thumbStyle}">
                ${c.poster ? '' : `<span class="cartoon-thumb-emoji">${c.emoji || '🎬'}</span>`}
                <span class="cartoon-play">▶</span>
                ${c.duration ? `<span class="cartoon-duration">${c.duration}</span>` : ''}
            </span>
            <span class="cartoon-info">
                <strong>${c.title}</strong>
                <small>${c.desc || ''}</small>
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
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.src)}?autoplay=1&rel=0&modestbranding=1"
            title="${c.title.replace(/"/g, '&quot;')}"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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
            cartoonScreen.innerHTML = `<div class="cartoon-error">😢 Cette vidéo n'a pas pu être chargée.<br><small>Vérifie le chemin : ${c.src}</small></div>`;
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

renderCartoons();
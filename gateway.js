/* =========================================================
   PORTE D'ENTRÉE — navigation entre les 4 cercles
   ========================================================= */
const ZONE_SCREENS = {
    teens: {
        age: '13–18', c1: '#9B6FD0', c2: '#F08BB5', emoji: '🎧',
        title: 'Cercle des ados',
        text: "Cette interface arrive bientôt, avec ses propres activités pour les 13 à 18 ans.",
        ideas: ['⏱️ Minuteur de révisions', '🧭 Orientation', '🧘 Bien-être & stress', '🗣️ Langues', '📓 Journal perso']
    },
    adults: {
        age: '18+', c1: '#2E3F6B', c2: '#74C7E3', emoji: '🌟',
        title: 'Cercle des grands',
        text: "Cette interface arrive bientôt, avec ses propres activités pour les 18 ans et plus.",
        ideas: ['💼 Générateur de CV', '💰 Budget', '✅ Suivi d’habitudes', '🧘 Méditation', '🎯 Objectifs de vie']
    }
};

// Construit les écrans « en construction » à partir de la config ci-dessus
Object.entries(ZONE_SCREENS).forEach(([zone, z]) => {
    const screen = document.createElement('section');
    screen.className = 'zone-screen';
    screen.id = 'zone-' + zone;
    screen.style.setProperty('--c1', z.c1);
    screen.style.setProperty('--c2', z.c2);
    screen.innerHTML = `
        <button class="zone-back" type="button">← Changer de cercle</button>
        <button class="gw-theme-btn js-theme-btn" type="button" aria-label="Changer de thème">🌙</button>
        <div class="zone-badge"><span>${z.emoji}</span>${z.age}<small>ans</small></div>
        <h2>${z.title}</h2>
        <p>${z.text}</p>
        <div class="zone-chips">${z.ideas.map(i => `<span class="zone-chip">${i}</span>`).join('')}</div>
    `;
    document.body.appendChild(screen);
});

function enterZone(zone) {
    document.body.dataset.zone = zone;
    document.querySelectorAll('.zone-screen').forEach(s => s.classList.toggle('active', s.id === 'zone-' + zone));
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function backToGateway() {
    // On coupe proprement tout ce qui tourne dans le site bébé
    exitAnyFullscreen();
    stopAutoplay();
    stopSong();
    stopMelody();
    stopFireworks();
    stopStoryNarration();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.querySelectorAll('.playlist .play-icon').forEach(i => i.textContent = '▶');
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    document.body.style.overflow = '';
    goToPage('home');                      // le site bébé redémarre sur l'accueil
    document.body.dataset.zone = 'gateway';
    document.querySelectorAll('.zone-screen').forEach(s => s.classList.remove('active'));
}

// Clic sur un cercle
document.querySelectorAll('.gw-circle').forEach(btn => {
    btn.addEventListener('click', () => enterZone(btn.dataset.zone));
});

// Boutons de retour (site bébé + écrans en construction)
document.getElementById('backToGateway').addEventListener('click', backToGateway);
document.querySelectorAll('.zone-back').forEach(btn => btn.addEventListener('click', backToGateway));

// Boutons de thème ajoutés par ce fichier (celui du site bébé est déjà géré dans app.js)
document.querySelectorAll('.js-theme-btn:not(#themeToggle)').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
});
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

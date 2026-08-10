/* =========================================================
   Cute Baby — logique de la plateforme
   ========================================================= */

/* ---------- NAVIGATION ---------- */
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.bubble-btn, [data-page]');

function goToPage(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    document.querySelectorAll('.bubble-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'dessiner') setTimeout(setupCanvas, 50);
}
navBtns.forEach(btn => {
    if (btn.dataset.page) {
        btn.addEventListener('click', () => goToPage(btn.dataset.page));
    }
});

/* ---------- HERO VIDEO FALLBACK ----------
   Si aucune vidéo n'est trouvée à assets/hero-baby.mp4,
   on affiche un joli dégradé animé à la place. */
const heroVideo = document.getElementById('heroVideo');
const heroFallback = document.getElementById('heroFallback');
// Le dégradé reste visible en dessous jusqu'à ce que la vidéo soit
// vraiment prête à jouer — pas de délai arbitraire qui pourrait la
// masquer à tort sur une connexion plus lente (ex: en production).
heroVideo.addEventListener('error', () => {
    heroVideo.style.display = 'none';
    heroFallback.style.display = 'block';
});
heroVideo.addEventListener('loadeddata', () => { heroFallback.style.display = 'none'; });
heroVideo.addEventListener('canplay', () => { heroFallback.style.display = 'none'; });

/* =========================================================
   AUDIO — petit synthétiseur pour mélodies douces (aucun
   fichier externe nécessaire, tout est généré en direct)
   ========================================================= */
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playTone(freq, startTime, duration, gainPeak = 0.09, type = 'sine') {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

const NOTE = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392.0, A4: 440.0, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3 };

// Mélodies traditionnelles (domaine public)
const MELODIES = {
    twinkle: [ // Ah vous dirai-je maman
        ['C4', 0.4], ['C4', 0.4], ['G4', 0.4], ['G4', 0.4], ['A4', 0.4], ['A4', 0.4], ['G4', 0.8],
        ['F4', 0.4], ['F4', 0.4], ['E4', 0.4], ['E4', 0.4], ['D4', 0.4], ['D4', 0.4], ['C4', 0.8]
    ],
    frere_jacques: [
        ['C4', 0.4], ['D4', 0.4], ['E4', 0.4], ['C4', 0.4], ['C4', 0.4], ['D4', 0.4], ['E4', 0.4], ['C4', 0.4],
        ['E4', 0.4], ['F4', 0.4], ['G4', 0.8], ['E4', 0.4], ['F4', 0.4], ['G4', 0.8]
    ],
    clair_lune: [
        ['C4', 0.4], ['C4', 0.4], ['C4', 0.4], ['D4', 0.4], ['E4', 0.8],
        ['D4', 0.4], ['C4', 0.4], ['E4', 0.4], ['D4', 0.4], ['D4', 0.4], ['C4', 1.0]
    ]
};

let melodyLoopHandle = null;
function playMelody(key, loop = false, soft = false) {
    stopMelody();
    const ctx = getCtx();
    const seq = MELODIES[key] || MELODIES.twinkle;
    const playOnce = () => {
        let t = ctx.currentTime + 0.05;
        seq.forEach(([note, dur]) => {
            playTone(NOTE[note], t, dur, soft ? 0.045 : 0.09, 'triangle');
            t += dur;
        });
        return (t - ctx.currentTime) * 1000;
    };
    const totalMs = playOnce();
    if (loop) {
        melodyLoopHandle = setInterval(playOnce, totalMs + 900);
    }
}
function stopMelody() {
    if (melodyLoopHandle) { clearInterval(melodyLoopHandle); melodyLoopHandle = null; }
}

/* =========================================================
   ALPHABET
   ========================================================= */
const ALPHABETS = {
    fr: {
        voiceLang: 'fr-FR',
        letters: [
            ['A', 'Ananas'], ['B', 'Ballon'], ['C', 'Chat'], ['D', 'Dauphin'], ['E', 'Étoile'],
            ['F', 'Fleur'], ['G', 'Girafe'], ['H', 'Hibou'], ['I', 'Île'], ['J', 'Jouet'],
            ['K', 'Koala'], ['L', 'Lune'], ['M', 'Maman'], ['N', 'Nuage'], ['O', 'Oiseau'],
            ['P', 'Papillon'], ['Q', 'Quatre'], ['R', 'Renard'], ['S', 'Soleil'], ['T', 'Tortue'],
            ['U', 'Univers'], ['V', 'Vache'], ['W', 'Wagon'], ['X', 'Xylophone'], ['Y', 'Yaourt'], ['Z', 'Zèbre']
        ]
    },
    en: {
        voiceLang: 'en-US',
        letters: [
            ['A', 'Apple'], ['B', 'Ball'], ['C', 'Cat'], ['D', 'Duck'], ['E', 'Elephant'],
            ['F', 'Flower'], ['G', 'Giraffe'], ['H', 'Hat'], ['I', 'Ice cream'], ['J', 'Juice'],
            ['K', 'Kite'], ['L', 'Lion'], ['M', 'Moon'], ['N', 'Nest'], ['O', 'Owl'],
            ['P', 'Panda'], ['Q', 'Queen'], ['R', 'Rainbow'], ['S', 'Sun'], ['T', 'Teddy bear'],
            ['U', 'Umbrella'], ['V', 'Violin'], ['W', 'Whale'], ['X', 'Xylophone'], ['Y', 'Yo-yo'], ['Z', 'Zebra']
        ]
    }
};
const LETTER_COLORS = ['#FF8B6A', '#FFC857', '#8FD9A8', '#74C7E3', '#C6A8E0', '#F4653F', '#5FBF9F'];

let currentLang = 'fr';
let currentLetterIndex = 0;
let melodyOn = true;

const langScreen = document.getElementById('langScreen');
const alphabetPlayer = document.getElementById('alphabetPlayer');
const letterStage = document.getElementById('letterStage');
const letterChar = document.getElementById('letterChar');
const letterWord = document.getElementById('letterWord');

document.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('click', () => {
        currentLang = card.dataset.lang;
        currentLetterIndex = 0;
        langScreen.style.display = 'none';
        alphabetPlayer.classList.add('active');
        renderLetter();
    });
});
document.getElementById('alphaBack').addEventListener('click', () => {
    stopMelody();
    window.speechSynthesis && window.speechSynthesis.cancel();
    alphabetPlayer.classList.remove('active');
    langScreen.style.display = 'flex';
});

function renderLetter() {
    const data = ALPHABETS[currentLang];
    const [letter, word] = data.letters[currentLetterIndex];
    const color = LETTER_COLORS[currentLetterIndex % LETTER_COLORS.length];
    letterChar.textContent = letter;
    letterWord.textContent = `${letter} ${currentLang === 'fr' ? 'comme' : 'for'} ${word}`;
    letterStage.style.background = color;
    speakLetter();
    if (melodyOn) {
        playMelody(['twinkle', 'frere_jacques', 'clair_lune'][currentLetterIndex % 3], false, true);
    }
}
function speakLetter() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const data = ALPHABETS[currentLang];
    const [letter, word] = data.letters[currentLetterIndex];
    const utter = new SpeechSynthesisUtterance(`${letter}. ${word}`);
    utter.lang = data.voiceLang;
    utter.rate = 0.85;
    utter.pitch = 1.15;
    window.speechSynthesis.speak(utter);
}
document.getElementById('nextLetter').addEventListener('click', () => {
    const data = ALPHABETS[currentLang];
    currentLetterIndex = (currentLetterIndex + 1) % data.letters.length;
    renderLetter();
});
document.getElementById('prevLetter').addEventListener('click', () => {
    const data = ALPHABETS[currentLang];
    currentLetterIndex = (currentLetterIndex - 1 + data.letters.length) % data.letters.length;
    renderLetter();
});
document.getElementById('sayLetter').addEventListener('click', speakLetter);
document.getElementById('melodySwitch').addEventListener('click', function () {
    melodyOn = !melodyOn;
    this.classList.toggle('on', melodyOn);
    if (!melodyOn) stopMelody();
});

/* =========================================================
   DESSINER — tableau noir magique
   ========================================================= */
let canvasReady = false;
function setupCanvas() {
    const canvas = document.getElementById('drawCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // adapte la résolution interne à la taille affichée
    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
    resize();
    window.addEventListener('resize', resize);

    let drawing = false;
    let hue = 20;
    let last = { x: 0, y: 0 };

    function pos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const point = e.touches ? e.touches[0] : e;
        return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
    }
    function start(e) {
        drawing = true;
        last = pos(e);
        e.preventDefault();
    }
    function move(e) {
        if (!drawing) return;
        const p = pos(e);
        hue = (hue + 2) % 360;
        ctx.strokeStyle = `hsl(${hue},85%,65%)`;
        ctx.lineWidth = 14;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `hsl(${hue},85%,65%)`;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last = p;
        e.preventDefault();
    }
    function end() { drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    document.getElementById('clearCanvas').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    canvasReady = true;
}

/* =========================================================
   MUSIQUE — playlist de berceuses (synthétisées, sans fichiers externes)
   ========================================================= */
const TRACKS = [
    { name: 'Ah vous dirai-je maman', desc: 'Berceuse traditionnelle française', key: 'twinkle', color: 'var(--coral)', duration: '0:14' },
    { name: 'Frère Jacques', desc: 'Comptine classique douce', key: 'frere_jacques', color: 'var(--sky)', duration: '0:12' },
    { name: 'Au clair de la lune', desc: 'Chanson populaire pour bébé', key: 'clair_lune', color: 'var(--mint)', duration: '0:11' },
];
const playlistEl = document.getElementById('playlist');
let currentTrackBtn = null;
TRACKS.forEach(t => {
    const row = document.createElement('div');
    row.className = 'track';
    row.innerHTML = `
    <div class="play-icon" style="background:${t.color}">▶</div>
    <div class="meta">
      <div class="t-name">${t.name}</div>
      <div class="t-desc">${t.desc}</div>
    </div>
    <div class="duration">${t.duration}</div>
  `;
    const icon = row.querySelector('.play-icon');
    row.addEventListener('click', () => {
        const isPlaying = icon.textContent === '⏸';
        document.querySelectorAll('.playlist .play-icon').forEach(i => i.textContent = '▶');
        stopMelody();
        if (!isPlaying) {
            icon.textContent = '⏸';
            playMelody(t.key, true, false);
        }
    });
    playlistEl.appendChild(row);
});
document.getElementById('musicSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('musicSearch').value.trim() || 'musique douce pour bébé';
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
});

/* =========================================================
   JEUX
   ========================================================= */
document.querySelectorAll('.play-cta').forEach(btn => {
    btn.addEventListener('click', () => {
        const game = btn.dataset.game;
        document.querySelectorAll('.game-stage').forEach(s => s.classList.remove('active'));
        const stage = document.getElementById('stage-' + game);
        stage.classList.add('active');
        if (game === 'bubbles') startBubbles();
        if (game === 'colors') startColorGame();
        if (game === 'memory') startMemory();
    });
});

/* --- Jeu 1 : Éclate les bulles --- */
let bubbleInterval = null;
let bubbleScore = 0;
function startBubbles() {
    const area = document.getElementById('bubblesArea');
    area.innerHTML = '';
    bubbleScore = 0;
    document.getElementById('bubbleScore').textContent = bubbleScore;
    clearInterval(bubbleInterval);
    const colors = ['#FF8B6A', '#FFC857', '#8FD9A8', '#74C7E3', '#C6A8E0'];
    bubbleInterval = setInterval(() => {
        if (document.querySelectorAll('.bubbles-area .bubble').length > 8) return;
        const b = document.createElement('div');
        const size = 30 + Math.random() * 40;
        b.className = 'bubble';
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = Math.random() * 85 + '%';
        b.style.background = colors[Math.floor(Math.random() * colors.length)];
        const duration = 4 + Math.random() * 2;
        b.style.transition = `bottom ${duration}s linear`;
        area.appendChild(b);
        requestAnimationFrame(() => { b.style.bottom = '110%'; });
        const remove = setTimeout(() => b.remove(), duration * 1000);
        b.addEventListener('click', () => {
            clearTimeout(remove);
            bubbleScore++;
            document.getElementById('bubbleScore').textContent = bubbleScore;
            playTone(500 + Math.random() * 300, getCtx().currentTime, 0.25, 0.08, 'sine');
            b.remove();
        });
    }, 700);
}

/* --- Jeu 2 : Trouve la couleur --- */
const COLOR_BANK = [
    { name: 'Rouge', hex: '#E8543F' }, { name: 'Jaune', hex: '#FFC857' }, { name: 'Bleu', hex: '#4FA9D6' },
    { name: 'Vert', hex: '#6FC08A' }, { name: 'Violet', hex: '#B48BD9' }, { name: 'Orange', hex: '#FF9B54' }
];
let colorScore = 0;
function startColorGame() {
    colorScore = 0;
    document.getElementById('colorScore').textContent = colorScore;
    nextColorRound();
}
function nextColorRound() {
    const shuffled = [...COLOR_BANK].sort(() => Math.random() - 0.5).slice(0, 4);
    const target = shuffled[Math.floor(Math.random() * shuffled.length)];
    document.getElementById('colorTarget').textContent = target.name;
    const optionsEl = document.getElementById('colorOptions');
    optionsEl.innerHTML = '';
    shuffled.forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        dot.style.background = c.hex;
        dot.addEventListener('click', () => {
            if (c.name === target.name) {
                colorScore++;
                document.getElementById('colorScore').textContent = colorScore;
                playTone(660, getCtx().currentTime, 0.3, 0.09, 'sine');
                nextColorRound();
            } else {
                playTone(180, getCtx().currentTime, 0.3, 0.08, 'sawtooth');
            }
        });
        optionsEl.appendChild(dot);
    });
}

/* --- Jeu 3 : Mémory des animaux --- */
const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐸', '🐷'];
let memoryScore = 0;
let flippedCards = [];
let lockBoard = false;
function startMemory() {
    memoryScore = 0;
    document.getElementById('memoryScore').textContent = memoryScore;
    flippedCards = [];
    lockBoard = false;
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    const deck = [...ANIMALS, ...ANIMALS].sort(() => Math.random() - 0.5);
    deck.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.animal = animal;
        card.textContent = '❔';
        card.addEventListener('click', () => flipMemoryCard(card));
        grid.appendChild(card);
    });
}
function flipMemoryCard(card) {
    if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.textContent = card.dataset.animal;
    flippedCards.push(card);
    if (flippedCards.length === 2) {
        lockBoard = true;
        const [a, b] = flippedCards;
        if (a.dataset.animal === b.dataset.animal) {
            a.classList.add('matched'); b.classList.add('matched');
            memoryScore++;
            document.getElementById('memoryScore').textContent = memoryScore;
            flippedCards = [];
            lockBoard = false;
            playTone(700, getCtx().currentTime, 0.25, 0.08, 'sine');
        } else {
            setTimeout(() => {
                a.classList.remove('flipped'); a.textContent = '❔';
                b.classList.remove('flipped'); b.textContent = '❔';
                flippedCards = [];
                lockBoard = false;
            }, 800);
        }
    }
}
document.getElementById('gameSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('gameSearch').value.trim() || 'jeux pour bébé';
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
});

/* =========================================================
   ASTUCES POUR MAMANS — onglets
   ========================================================= */
document.querySelectorAll('.a-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.a-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

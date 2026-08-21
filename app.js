/* =========================================================
   Cute Baby — logique de la plateforme
   ========================================================= */

/* ---------- NAVIGATION ---------- */
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.bubble-btn, [data-page]');

function goToPage(id) {
    exitAnyFullscreen();
    if (id !== 'alphabet') {
        if (typeof stopAutoplay === 'function') stopAutoplay();
        if (typeof stopSong === 'function') stopSong();
        window.speechSynthesis && window.speechSynthesis.cancel();
    }
    if (id !== 'jeux' && typeof stopFireworks === 'function') stopFireworks();
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
heroFallback.style.display = 'none';
heroVideo.addEventListener('error', () => {
    heroVideo.style.display = 'none';
    heroFallback.style.display = 'block';
});
heroVideo.addEventListener('loadeddata', () => { heroFallback.style.display = 'none'; });
// Vérifie tout de suite si la source est valide
setTimeout(() => {
    if (heroVideo.readyState === 0) { heroVideo.style.display = 'none'; heroFallback.style.display = 'block'; }
}, 900);

/* =========================================================
   THÈME — mode jour / nuit
   ========================================================= */
const THEME_KEY_ATTR = 'data-theme';
function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_KEY_ATTR, theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit');
    }
}
function initTheme() {
    // Pas de stockage persistant requis : on démarre en mode jour à chaque
    // visite, et on respecte simplement le choix de l'utilisateur pendant
    // la session en cours.
    applyTheme('light');
}
function toggleTheme() {
    const current = document.documentElement.getAttribute(THEME_KEY_ATTR) || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
}
document.addEventListener('DOMContentLoaded', initTheme);
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

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
   FÉLICITATIONS — voix "Bravo !" / "Super !" + petit motif
   sonore, générés en direct (aucun fichier audio externe)
   ========================================================= */
const PRAISE_WORDS_FR = ['Bravo !', 'Super !', 'Génial !', 'Bien joué !', 'Youpi !'];
function speakPraise() {
    if (!window.speechSynthesis) return;
    const word = PRAISE_WORDS_FR[Math.floor(Math.random() * PRAISE_WORDS_FR.length)];
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'fr-FR';
    utter.rate = 1.05;
    utter.pitch = 1.35;
    utter.volume = 0.9;
    window.speechSynthesis.speak(utter);
}
function playApplauseChime() {
    // Petit arpège joyeux façon "clochettes" pour accompagner la voix,
    // qui fonctionne même sur les navigateurs sans synthèse vocale.
    const ctx = getCtx();
    const t0 = ctx.currentTime;
    const notes = [NOTE.C5, NOTE.E4 * 2, NOTE.G4 * 2, NOTE.C5 * 1.5];
    notes.forEach((f, i) => playTone(f, t0 + i * 0.09, 0.35, 0.07, 'sine'));
}
function celebrate(targetEl) {
    speakPraise();
    playApplauseChime();
    spawnParticles(targetEl);
}

/* =========================================================
   PARTICULES — confettis / étoiles qui tombent lors d'une
   réussite (bonne réponse, lettre terminée, etc.)
   ========================================================= */
let particleLayer = null;
function getParticleLayer() {
    if (!particleLayer) {
        particleLayer = document.createElement('div');
        particleLayer.className = 'particle-layer';
        document.body.appendChild(particleLayer);
    }
    return particleLayer;
}
const PARTICLE_EMOJIS = ['✨', '⭐', '🎉', '💛', '🌟'];
const PARTICLE_COLORS = ['#FF8B6A', '#FFC857', '#8FD9A8', '#74C7E3', '#C6A8E0'];
function spawnParticles(anchorEl, count = 22) {
    const layer = getParticleLayer();
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;
    if (anchorEl && anchorEl.getBoundingClientRect) {
        const rect = anchorEl.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
    }
    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        const useEmoji = Math.random() > 0.45;
        p.className = 'confetti-piece';
        if (useEmoji) {
            p.textContent = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];
            p.style.fontSize = (14 + Math.random() * 16) + 'px';
        } else {
            p.style.background = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
            p.style.width = p.style.height = (6 + Math.random() * 8) + 'px';
            p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        }
        const spreadX = (Math.random() - 0.5) * 260;
        const fallY = 220 + Math.random() * 220;
        const rotate = (Math.random() - 0.5) * 720;
        const drift = (Math.random() - 0.5) * 120;
        const duration = 1100 + Math.random() * 900;
        p.style.left = originX + 'px';
        p.style.top = originY + 'px';
        p.style.setProperty('--dx0', (Math.random() - 0.5) * 40 + 'px');
        p.style.setProperty('--dy1', -Math.abs(spreadX) * 0.15 - 20 + 'px');
        p.style.setProperty('--dx1', spreadX + 'px');
        p.style.setProperty('--dy2', fallY + 'px');
        p.style.setProperty('--dx2', (spreadX + drift) + 'px');
        p.style.setProperty('--rot', rotate + 'deg');
        p.style.animationDuration = duration + 'ms';
        layer.appendChild(p);
        setTimeout(() => p.remove(), duration + 60);
    }
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
    },
    // Le "pinyin" est la romanisation officielle du chinois : c'est justement
    // cet alphabet de 26 lettres latines que les enfants chinois apprennent
    // en premier à l'école. Quelques lettres rares en début de mot (I, U, V)
    // utilisent un mot proche phonétiquement, faute de mot chinois naturel.
    zh: {
        voiceLang: 'zh-CN',
        letters: [
            ['A', '阿姨 (āyí)'], ['B', '菠萝 (bōluó)'], ['C', '草莓 (cǎoméi)'], ['D', '蛋糕 (dàngāo)'], ['E', '鹅 (é)'],
            ['F', '飞机 (fēijī)'], ['G', '狗狗 (gǒugou)'], ['H', '花朵 (huāduǒ)'], ['I', '衣服 (yīfu)'], ['J', '橘子 (júzi)'],
            ['K', '咖啡 (kāfēi)'], ['L', '蓝天 (lántiān)'], ['M', '猫咪 (māomī)'], ['N', '牛奶 (niúnǎi)'], ['O', '藕 (ǒu)'],
            ['P', '苹果 (píngguǒ)'], ['Q', '汽车 (qìchē)'], ['R', '热狗 (règǒu)'], ['S', '狮子 (shīzi)'], ['T', '兔子 (tùzi)'],
            ['U', '鱼 (yú)'], ['V', '维生素 (wéishēngsù)'], ['W', '娃娃 (wáwa)'], ['X', '西瓜 (xīguā)'], ['Y', '鸭子 (yāzi)'], ['Z', '枣 (zǎo)']
        ]
    },
    // Alphabet hiragana (les 46 sons de base du japonais). Les caractères
    // を et ん ne commencent jamais un mot japonais : on utilise un mot où
    // le son apparaît, comme le veut l'usage pédagogique courant.
    ja: {
        voiceLang: 'ja-JP',
        letters: [
            ['あ', 'あひる'], ['い', 'いぬ'], ['う', 'うさぎ'], ['え', 'えんぴつ'], ['お', 'おにぎり'],
            ['か', 'かえる'], ['き', 'きりん'], ['く', 'くつ'], ['け', 'けーき'], ['こ', 'こおり'],
            ['さ', 'さかな'], ['し', 'しまうま'], ['す', 'すいか'], ['せ', 'せみ'], ['そ', 'そら'],
            ['た', 'たまご'], ['ち', 'ちょうちょ'], ['つ', 'つき'], ['て', 'てぶくろ'], ['と', 'とけい'],
            ['な', 'なす'], ['に', 'にじ'], ['ぬ', 'ぬいぐるみ'], ['ね', 'ねこ'], ['の', 'のり'],
            ['は', 'はな'], ['ひ', 'ひまわり'], ['ふ', 'ふうせん'], ['へ', 'へび'], ['ほ', 'ほし'],
            ['ま', 'まくら'], ['み', 'みかん'], ['む', 'むし'], ['め', 'めがね'], ['も', 'もも'],
            ['や', 'やま'], ['ゆ', 'ゆき'], ['よ', 'よる'],
            ['ら', 'らいおん'], ['り', 'りんご'], ['る', 'るすばん'], ['れ', 'れいぞうこ'], ['ろ', 'ろうそく'],
            ['わ', 'わに'], ['を', 'きをつけて'], ['ん', 'ほん']
        ]
    },
    ar: {
        voiceLang: 'ar-SA',
        letters: [
            ['أ', 'أرنب'], ['ب', 'بطة'], ['ت', 'تفاح'], ['ث', 'ثعلب'], ['ج', 'جمل'],
            ['ح', 'حصان'], ['خ', 'خروف'], ['د', 'دب'], ['ذ', 'ذئب'], ['ر', 'رمان'],
            ['ز', 'زرافة'], ['س', 'سمكة'], ['ش', 'شمس'], ['ص', 'صقر'], ['ض', 'ضفدع'],
            ['ط', 'طائرة'], ['ظ', 'ظبي'], ['ع', 'عصفور'], ['غ', 'غزال'], ['ف', 'فيل'],
            ['ق', 'قطة'], ['ك', 'كتاب'], ['ل', 'ليمون'], ['م', 'موز'], ['ن', 'نجمة'],
            ['ه', 'هلال'], ['و', 'وردة'], ['ي', 'يد']
        ]
    },
    // Ъ, Ы et Ь ne commencent jamais un mot russe : on illustre avec un mot
    // où la lettre apparaît, comme le font les abécédaires russes pour enfants.
    ru: {
        voiceLang: 'ru-RU',
        letters: [
            ['А', 'Арбуз'], ['Б', 'Банан'], ['В', 'Волк'], ['Г', 'Гриб'], ['Д', 'Дом'],
            ['Е', 'Ель'], ['Ё', 'Ёжик'], ['Ж', 'Жираф'], ['З', 'Зайка'], ['И', 'Игрушка'],
            ['Й', 'Йогурт'], ['К', 'Кот'], ['Л', 'Лев'], ['М', 'Мама'], ['Н', 'Нос'],
            ['О', 'Облако'], ['П', 'Панда'], ['Р', 'Радуга'], ['С', 'Солнце'], ['Т', 'Тигр'],
            ['У', 'Утка'], ['Ф', 'Фрукт'], ['Х', 'Хомяк'], ['Ц', 'Цветок'], ['Ч', 'Черепаха'],
            ['Ш', 'Шар'], ['Щ', 'Щенок'], ['Ъ', 'Объект'], ['Ы', 'Мы'], ['Ь', 'Мать'],
            ['Э', 'Экскаватор'], ['Ю', 'Юла'], ['Я', 'Яблоко']
        ]
    }
};

// Petites illustrations (emoji) pour chaque mot, alignées index par index
// avec ALPHABETS[lang].letters — utilisées pour l'animation "qui danse"
// à côté de chaque lettre.
const ILLUSTRATIONS = {
    fr: ['🍍', '🎈', '🐱', '🐬', '⭐', '🌸', '🦒', '🦉', '🏝️', '🧸', '🐨', '🌙', '👩', '☁️', '🐦',
        '🦋', '4️⃣', '🦊', '☀️', '🐢', '🌌', '🐄', '🚃', '🎵', '🥣', '🦓'],
    en: ['🍎', '⚽', '🐱', '🦆', '🐘', '🌸', '🦒', '🎩', '🍦', '🧃', '🪁', '🦁', '🌙', '🪺', '🦉',
        '🐼', '👑', '🌈', '☀️', '🧸', '☂️', '🎻', '🐳', '🎵', '🪀', '🦓'],
    zh: ['👩', '🍍', '🍓', '🎂', '🦢', '✈️', '🐶', '🌸', '👕', '🍊', '☕', '🌤️', '🐱', '🥛', '🪷',
        '🍎', '🚗', '🌭', '🦁', '🐰', '🐟', '💊', '🪆', '🍉', '🦆', '🍒'],
    ja: ['🦆', '🐶', '🐰', '✏️', '🍙', '🐸', '🦒', '👟', '🎂', '🧊', '🐟', '🦓', '🍉', '🦗', '🌌',
        '🥚', '🦋', '🌙', '🧤', '🕐', '🍆', '🌈', '🧸', '🐱', '🌿', '🌸', '🌻', '🎈', '🐍', '⭐',
        '🛏️', '🍊', '🐛', '👓', '🍑', '⛰️', '❄️', '🌙', '🦁', '🍎', '🏠', '🧊', '🕯️', '🐊', '⚠️', '📖'],
    ar: ['🐰', '🦆', '🍎', '🦊', '🐫', '🐴', '🐑', '🐻', '🐺', '🍎', '🦒', '🐟', '☀️', '🦅', '🐸',
        '✈️', '🦌', '🐦', '🦌', '🐘', '🐱', '📖', '🍋', '🍌', '⭐', '🌙', '🌹', '✋'],
    ru: ['🍉', '🍌', '🐺', '🍄', '🏠', '🌲', '🦔', '🦒', '🐰', '🧸', '🥣', '🐱', '🦁', '👩', '👃',
        '☁️', '🐼', '🌈', '☀️', '🐯', '🐥', '🍏', '🐹', '🌸', '🐢', '🎈', '🐶', '📦', '🙌', '👩',
        '🚜', '🌀', '🍎']
};
function getIllustration(lang, index) {
    const arr = ILLUSTRATIONS[lang];
    if (!arr || !arr[index]) return '✨';
    return arr[index];
}

// Construit la phrase "Lettre + mot" dans le bon ordre et avec le bon
// connecteur pour chaque langue — utilisée à la fois pour l'affichage
// ET pour la voix, afin qu'ils disent toujours exactement la même chose.
const PHRASE_TEMPLATES = {
    fr: (letter, word) => `${letter} comme ${word}`,
    en: (letter, word) => `${letter} is for ${word}`,
    zh: (letter, word) => `${letter} 就像 ${word}`,
    ja: (letter, word) => `${letter} は ${word} の ${letter}`,
    ar: (letter, word) => `${letter} مثل ${word}`,
    ru: (letter, word) => `${letter} как ${word}`
};
function buildLetterPhrase(lang, letter, word) {
    const template = PHRASE_TEMPLATES[lang] || PHRASE_TEMPLATES.en;
    return template(letter, word);
}
const LETTER_COLORS = ['#FF8B6A', '#FFC857', '#8FD9A8', '#74C7E3', '#C6A8E0', '#F4653F', '#5FBF9F'];

let currentLang = 'fr';
let currentLetterIndex = 0;
let melodyOn = true;

const langScreen = document.getElementById('langScreen');
const alphabetPlayer = document.getElementById('alphabetPlayer');
const letterStage = document.getElementById('letterStage');
const letterChar = document.getElementById('letterChar');
const letterWord = document.getElementById('letterWord');
const letterIllustration = document.getElementById('letterIllustration');

document.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('click', () => {
        stopAutoplay();
        stopSong();
        if (traceModeOn) toggleTraceMode();
        currentLang = card.dataset.lang;
        currentLetterIndex = 0;
        langScreen.style.display = 'none';
        alphabetPlayer.classList.add('active');
        renderLetter();
    });
});
document.getElementById('alphaBack').addEventListener('click', () => {
    exitFullscreenIfActive(document.getElementById('alphabetPlayer'));
    stopAutoplay();
    stopSong();
    if (traceModeOn) toggleTraceMode();
    stopMelody();
    window.speechSynthesis && window.speechSynthesis.cancel();
    alphabetPlayer.classList.remove('active');
    langScreen.style.display = 'flex';
});

// Met à jour uniquement l'affichage (lettre, mot, couleur, illustration,
// guide de tracé) sans déclencher la voix ni la mélodie — réutilisé par
// la lecture auto et la chanson de l'alphabet, qui gèrent leur propre audio.
function updateLetterVisual(index) {
    const data = ALPHABETS[currentLang];
    const [letter, word] = data.letters[index];
    const color = LETTER_COLORS[index % LETTER_COLORS.length];
    letterChar.textContent = letter;
    letterWord.textContent = buildLetterPhrase(currentLang, letter, word);
    letterStage.style.background = color;
    if (letterIllustration) {
        letterIllustration.textContent = getIllustration(currentLang, index);
        // On relance l'animation "qui danse" à chaque nouvelle lettre
        letterIllustration.classList.remove('bounce');
        void letterIllustration.offsetWidth;
        letterIllustration.classList.add('bounce');
    }
    if (traceModeOn) drawTraceGuide();
}

function renderLetter() {
    updateLetterVisual(currentLetterIndex);
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
    // Même phrase que celle affichée à l'écran (donc plus de décalage entre
    // texte et audio) — sauf le pinyin entre parenthèses, qui reste utile à
    // l'écran pour les parents mais ne doit pas être lu tel quel par la voix.
    const spokenWord = word.replace(/\s*\([^)]*\)/g, '');
    const phrase = buildLetterPhrase(currentLang, letter, spokenWord);
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = data.voiceLang;
    utter.rate = 0.85;
    utter.pitch = 1.15;
    window.speechSynthesis.speak(utter);
}
document.getElementById('nextLetter').addEventListener('click', () => {
    stopAutoplay();
    stopSong();
    const data = ALPHABETS[currentLang];
    // On célèbre la lettre qu'on vient de terminer avant de passer à la suivante.
    celebrate(letterStage);
    currentLetterIndex = (currentLetterIndex + 1) % data.letters.length;
    renderLetter();
});
document.getElementById('prevLetter').addEventListener('click', () => {
    stopAutoplay();
    stopSong();
    const data = ALPHABETS[currentLang];
    currentLetterIndex = (currentLetterIndex - 1 + data.letters.length) % data.letters.length;
    renderLetter();
});
document.getElementById('sayLetter').addEventListener('click', speakLetter);

/* =========================================================
   LECTURE AUTO — défile les lettres toute seule, comme une
   petite vidéo éducative (son + mélodie inclus)
   ========================================================= */
let autoplayOn = false;
let autoplayTimer = null;
const AUTOPLAY_DELAY_MS = 3400;

function stopAutoplay() {
    autoplayOn = false;
    if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; }
    const btn = document.getElementById('autoplayToggle');
    if (btn) btn.classList.remove('active');
}
function autoplayStep() {
    if (!autoplayOn) return;
    renderLetter();
    autoplayTimer = setTimeout(() => {
        if (!autoplayOn) return;
        const data = ALPHABETS[currentLang];
        currentLetterIndex = (currentLetterIndex + 1) % data.letters.length;
        if (currentLetterIndex === 0) celebrate(letterStage); // un tour complet !
        autoplayStep();
    }, AUTOPLAY_DELAY_MS);
}
document.getElementById('autoplayToggle').addEventListener('click', function () {
    if (autoplayOn) { stopAutoplay(); return; }
    stopSong();
    if (traceModeOn) toggleTraceMode();
    autoplayOn = true;
    this.classList.add('active');
    autoplayStep();
});

/* =========================================================
   CHANSON DE L'ALPHABET — chante toutes les lettres à la
   suite, dans la langue sélectionnée
   ========================================================= */
let isSinging = false;
function stopSong() {
    isSinging = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const btn = document.getElementById('songBtn');
    if (btn) btn.classList.remove('active');
}
function singStep() {
    if (!isSinging) return;
    const data = ALPHABETS[currentLang];
    if (currentLetterIndex >= data.letters.length) {
        // Chanson terminée : petite célébration puis retour à la 1ère lettre.
        stopSong();
        celebrate(letterStage);
        currentLetterIndex = 0;
        updateLetterVisual(currentLetterIndex);
        return;
    }
    updateLetterVisual(currentLetterIndex);
    if (!window.speechSynthesis) {
        // Navigateur sans synthèse vocale : on avance quand même, en rythme.
        setTimeout(() => {
            if (!isSinging) return;
            currentLetterIndex++;
            singStep();
        }, 800);
        return;
    }
    const [letter, word] = data.letters[currentLetterIndex];
    const spokenWord = word.replace(/\s*\([^)]*\)/g, '');
    const phrase = buildLetterPhrase(currentLang, letter, spokenWord);
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = data.voiceLang;
    utter.rate = 1.0;
    utter.pitch = 1.2;
    utter.onend = () => {
        if (!isSinging) return;
        currentLetterIndex++;
        singStep();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
}
document.getElementById('songBtn').addEventListener('click', function () {
    if (isSinging) { stopSong(); return; }
    stopAutoplay();
    if (traceModeOn) toggleTraceMode();
    stopMelody();
    isSinging = true;
    this.classList.add('active');
    currentLetterIndex = 0;
    singStep();
});

/* =========================================================
   ÉCRITURE DES LETTRES — tracer la lettre du doigt sur un
   calque semi-transparent, par-dessus la lettre en cours
   ========================================================= */
let traceModeOn = false;
let traceCtx = null;
let tracing = false;
let traceLast = { x: 0, y: 0 };

function traceCanvasEl() { return document.getElementById('traceCanvas'); }

function setupTraceCanvas() {
    const canvas = traceCanvasEl();
    if (!canvas || !letterStage) return;
    const rect = letterStage.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    traceCtx = canvas.getContext('2d');
    traceCtx.lineJoin = 'round';
    traceCtx.lineCap = 'round';
    drawTraceGuide();
}
function drawTraceGuide() {
    if (!traceCtx) return;
    const canvas = traceCanvasEl();
    traceCtx.clearRect(0, 0, canvas.width, canvas.height);
    const data = ALPHABETS[currentLang];
    const [letter] = data.letters[currentLetterIndex];
    traceCtx.save();
    traceCtx.globalAlpha = 0.4;
    traceCtx.fillStyle = '#ffffff';
    traceCtx.font = `800 ${canvas.height * 0.62}px 'Baloo 2', sans-serif`;
    traceCtx.textAlign = 'center';
    traceCtx.textBaseline = 'middle';
    traceCtx.fillText(letter, canvas.width / 2, canvas.height / 2 + canvas.height * 0.03);
    traceCtx.restore();
}
function tracePointerPos(e) {
    const canvas = traceCanvasEl();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
}
function traceStart(e) {
    if (!traceModeOn || !traceCtx) return;
    tracing = true;
    traceLast = tracePointerPos(e);
    e.preventDefault();
}
function traceMove(e) {
    if (!tracing || !traceCtx) return;
    const p = tracePointerPos(e);
    const canvas = traceCanvasEl();
    traceCtx.strokeStyle = '#FFC857';
    traceCtx.lineWidth = canvas.width * 0.028;
    traceCtx.shadowBlur = 12;
    traceCtx.shadowColor = '#FFC857';
    traceCtx.beginPath();
    traceCtx.moveTo(traceLast.x, traceLast.y);
    traceCtx.lineTo(p.x, p.y);
    traceCtx.stroke();
    traceLast = p;
    e.preventDefault();
}
function traceEnd() { tracing = false; }

(function initTraceListeners() {
    const canvas = traceCanvasEl();
    if (!canvas) return;
    canvas.addEventListener('mousedown', traceStart);
    canvas.addEventListener('mousemove', traceMove);
    window.addEventListener('mouseup', traceEnd);
    canvas.addEventListener('touchstart', traceStart, { passive: false });
    canvas.addEventListener('touchmove', traceMove, { passive: false });
    canvas.addEventListener('touchend', traceEnd);
    window.addEventListener('resize', () => { if (traceModeOn) setupTraceCanvas(); });
})();

function toggleTraceMode() {
    traceModeOn = !traceModeOn;
    const btn = document.getElementById('traceToggle');
    const tools = document.getElementById('traceTools');
    if (btn) btn.classList.toggle('active', traceModeOn);
    if (tools) tools.classList.toggle('active', traceModeOn);
    letterStage.classList.toggle('tracing', traceModeOn);
    if (traceModeOn) {
        stopAutoplay();
        stopSong();
        setTimeout(setupTraceCanvas, 50);
    }
}
document.getElementById('traceToggle').addEventListener('click', toggleTraceMode);
document.getElementById('traceClear').addEventListener('click', drawTraceGuide);
document.getElementById('traceDone').addEventListener('click', () => {
    drawTraceGuide();
    celebrate(letterStage);
});
document.getElementById('melodySwitch').addEventListener('click', function () {
    melodyOn = !melodyOn;
    this.classList.toggle('on', melodyOn);
    if (!melodyOn) stopMelody();
});


/* =========================================================
   DESSINER — tableau noir magique
   ========================================================= */
let canvasReady = false;
let currentBrush = 'rainbow';
let drawCanvasResizeFn = null;

function setupCanvas() {
    const canvas = document.getElementById('drawCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
    resize();
    drawCanvasResizeFn = resize; // réutilisable depuis le mode plein écran

    if (canvasReady) return; // les écouteurs ne sont attachés qu'une seule fois

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

    // --- Pinceau Arc-en-ciel (ton code original) ---
    function drawRainbow(x, y) {
        hue = (hue + 2) % 360;
        ctx.strokeStyle = `hsl(${hue},85%,65%)`;
        ctx.lineWidth = 14;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `hsl(${hue},85%,65%)`;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // --- Pinceau Étoile ---
    function drawStar(x, y) {
        const starSize = 25 + Math.random() * 15;
        const rotation = Math.random() * Math.PI * 2;
        const colorHue = (hue + Math.random() * 40) % 360;

        // Une couleur par étoile, qui change progressivement
        ctx.shadowColor = `hsl(${colorHue}, 100%, 70%)`;
        ctx.shadowBlur = 35;
        ctx.fillStyle = `hsl(${colorHue}, 100%, 65%)`;

        // Dessiner une étoile à 5 branches
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = starSize;
        const innerRadius = starSize * 0.4;

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + rotation;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Noyau brillant
        const glow = ctx.createRadialGradient(x, y, 0, x, y, starSize * 0.2);
        glow.addColorStop(0, `hsla(0, 0%, 100%, 0.7)`);
        glow.addColorStop(1, `hsla(0, 0%, 100%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, starSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Petites étincelles
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + rotation;
            const dist = starSize * (0.5 + Math.random() * 0.5);
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            const sparkleSize = 2 + Math.random() * 3;
            ctx.fillStyle = `hsla(50, 100%, 95%, ${0.3 + Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Faire évoluer la couleur pour la prochaine étoile
        hue = (hue + 12) % 360;
    }

    function start(e) {
        drawing = true;
        const p = pos(e);
        last = p;
        e.preventDefault();

        // Si pinceau étoile : dessiner une étoile au clic
        if (currentBrush === 'star') {
            drawStar(p.x, p.y);
        }
    }

    function move(e) {
        if (!drawing) return;
        const p = pos(e);

        if (currentBrush === 'rainbow') {
            // Arc-en-ciel : tracé continu
            drawRainbow(p.x, p.y);
        } else if (currentBrush === 'star') {
            // Étoile : une étoile tous les 20px
            const dist = Math.hypot(p.x - last.x, p.y - last.y);
            if (dist > 20) {
                drawStar(p.x, p.y);
                last = p;
            }
        }

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
        hue = 20; // Réinitialiser la couleur
    };

    // Sélection du pinceau
    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBrush = btn.dataset.brush;
        });
    });

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
        stopFireworks(); // on coupe l'animation si on quitte ce jeu
        if (game === 'bubbles') startBubbles();
        if (game === 'colors') startColorGame();
        if (game === 'memory') startMemory();
        if (game === 'shapes') startShapeGame();
        if (game === 'puzzle') startPuzzle();
        if (game === 'matchsound') startMatchSound();
        if (game === 'fireworks') startFireworks();
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
            spawnParticles(b, 8);
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

/* --- Jeu 4 : Trouve la forme géométrique --- */
const SHAPES = [
    { name: 'Carré', emoji: '🟦', color: '#4FA9D6' },
    { name: 'Cercle', emoji: '🔴', color: '#E8543F' },
    { name: 'Triangle', emoji: '🔺', color: '#FFC857' },
    { name: 'Étoile', emoji: '⭐', color: '#FF9B54' },
    { name: 'Coeur', emoji: '❤️', color: '#E8543F' },
    { name: 'Losange', emoji: '♦️', color: '#6FC08A' },
    { name: 'Hexagone', emoji: '⬡', color: '#B48BD9' },
    { name: 'Croissant', emoji: '🌙', color: '#FFC857' }
];

let shapeScore = 0;

function startShapeGame() {
    shapeScore = 0;
    document.getElementById('shapeScore').textContent = shapeScore;
    nextShapeRound();
}

function nextShapeRound() {
    // Mélanger et choisir 4 formes aléatoires
    const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 4);
    const target = options[Math.floor(Math.random() * options.length)];

    document.getElementById('shapeTarget').textContent = target.emoji + ' ' + target.name;

    const optionsEl = document.getElementById('shapeOptions');
    optionsEl.innerHTML = '';

    // Mélanger les options pour qu'elles ne soient pas toujours dans le même ordre
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(shape => {
        const card = document.createElement('div');
        card.className = 'shape-card';
        card.dataset.name = shape.name;

        // Conteneur pour l'emoji et le nom
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'shape-emoji';
        emojiSpan.textContent = shape.emoji;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'shape-name';
        nameSpan.textContent = shape.name;

        card.appendChild(emojiSpan);
        card.appendChild(nameSpan);

        // Ajouter une couleur de fond subtile
        card.style.setProperty('--shape-color', shape.color);

        card.addEventListener('click', () => {
            if (shape.name === target.name) {
                shapeScore++;
                document.getElementById('shapeScore').textContent = shapeScore;
                playTone(660, getCtx().currentTime, 0.3, 0.09, 'sine');
                spawnParticles(card, 14);
                // Animation de réussite
                card.style.transform = 'scale(1.2)';
                card.style.borderColor = '#6FC08A';
                card.style.background = '#e8f5e9';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                    card.style.borderColor = 'transparent';
                    card.style.background = '';
                    nextShapeRound();
                }, 400);
            } else {
                playTone(180, getCtx().currentTime, 0.3, 0.08, 'sawtooth');
                // Animation d'erreur
                card.style.transform = 'scale(0.9)';
                card.style.borderColor = '#E8543F';
                card.style.background = '#ffebee';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                    card.style.borderColor = 'transparent';
                    card.style.background = '';
                }, 300);
            }
        });
        optionsEl.appendChild(card);
    });
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
                spawnParticles(dot, 14);
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
            spawnParticles(b, 12);
            if (memoryScore === ANIMALS.length) celebrate(document.getElementById('memoryGrid'));
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

/* --- Jeu 5 : Puzzle numéroté (taquin 3x3) --- */
let puzzleTiles = [];
let puzzleMoves = 0;
function getPuzzleNeighbors(index) {
    const row = Math.floor(index / 3), col = index % 3;
    const neighbors = [];
    if (row > 0) neighbors.push(index - 3);
    if (row < 2) neighbors.push(index + 3);
    if (col > 0) neighbors.push(index - 1);
    if (col < 2) neighbors.push(index + 1);
    return neighbors;
}
function shufflePuzzle() {
    // On part de l'état résolu et on fait de nombreux déplacements valides
    // au hasard : le puzzle reste ainsi toujours solvable.
    let emptyIndex = 8;
    for (let i = 0; i < 150; i++) {
        const neighbors = getPuzzleNeighbors(emptyIndex);
        const swapIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
        [puzzleTiles[emptyIndex], puzzleTiles[swapIndex]] = [puzzleTiles[swapIndex], puzzleTiles[emptyIndex]];
        emptyIndex = swapIndex;
    }
}
function renderPuzzle() {
    const grid = document.getElementById('puzzleGrid');
    grid.innerHTML = '';
    puzzleTiles.forEach((val, idx) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile' + (val === 0 ? ' empty' : '');
        tile.textContent = val === 0 ? '' : val;
        tile.addEventListener('click', () => tryMovePuzzle(idx));
        grid.appendChild(tile);
    });
}
function tryMovePuzzle(idx) {
    const emptyIndex = puzzleTiles.indexOf(0);
    const neighbors = getPuzzleNeighbors(emptyIndex);
    if (!neighbors.includes(idx)) return; // on ne peut glisser que les cases voisines de la case vide
    [puzzleTiles[emptyIndex], puzzleTiles[idx]] = [puzzleTiles[idx], puzzleTiles[emptyIndex]];
    puzzleMoves++;
    document.getElementById('puzzleMoves').textContent = puzzleMoves;
    playTone(440, getCtx().currentTime, 0.15, 0.06, 'sine');
    renderPuzzle();
    if (isPuzzleSolved()) {
        celebrate(document.getElementById('puzzleGrid'));
    }
}
function isPuzzleSolved() {
    for (let i = 0; i < 8; i++) { if (puzzleTiles[i] !== i + 1) return false; }
    return puzzleTiles[8] === 0;
}
function startPuzzle() {
    puzzleMoves = 0;
    document.getElementById('puzzleMoves').textContent = puzzleMoves;
    puzzleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    shufflePuzzle();
    renderPuzzle();
}
document.getElementById('puzzleNew').addEventListener('click', startPuzzle);

/* --- Jeu 6 : Correspondance — qui fait quel bruit ? --- */
const ANIMAL_SOUNDS = [
    { emoji: '🐄', sound: 'Meuh' },
    { emoji: '🐱', sound: 'Miaou' },
    { emoji: '🐶', sound: 'Wouaf' },
    { emoji: '🐑', sound: 'Bêê' },
    { emoji: '🐸', sound: 'Coâ' },
    { emoji: '🐔', sound: 'Cot cot' }
];
let matchSelectedLeft = null;
let matchScore = 0;
function startMatchSound() {
    matchScore = 0;
    matchSelectedLeft = null;
    document.getElementById('matchScore').textContent = matchScore;
    const leftCol = document.getElementById('matchLeft');
    const rightCol = document.getElementById('matchRight');
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';
    const leftItems = [...ANIMAL_SOUNDS].sort(() => Math.random() - 0.5);
    const rightItems = [...ANIMAL_SOUNDS].sort(() => Math.random() - 0.5);
    leftItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'match-item';
        el.textContent = item.emoji;
        el.dataset.sound = item.sound;
        el.addEventListener('click', () => selectMatchLeft(el));
        leftCol.appendChild(el);
    });
    rightItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'match-item match-sound';
        el.textContent = item.sound;
        el.dataset.sound = item.sound;
        el.addEventListener('click', () => selectMatchRight(el));
        rightCol.appendChild(el);
    });
}
function selectMatchLeft(el) {
    if (el.classList.contains('matched')) return;
    document.querySelectorAll('#matchLeft .match-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    matchSelectedLeft = el;
}
function selectMatchRight(el) {
    if (el.classList.contains('matched') || !matchSelectedLeft) return;
    if (matchSelectedLeft.dataset.sound === el.dataset.sound) {
        matchSelectedLeft.classList.add('matched');
        matchSelectedLeft.classList.remove('selected');
        el.classList.add('matched');
        matchScore++;
        document.getElementById('matchScore').textContent = matchScore;
        playTone(660, getCtx().currentTime, 0.3, 0.09, 'sine');
        spawnParticles(el, 10);
        matchSelectedLeft = null;
        if (matchScore === ANIMAL_SOUNDS.length) {
            celebrate(document.getElementById('stage-matchsound'));
        }
    } else {
        el.classList.add('wrong');
        playTone(180, getCtx().currentTime, 0.3, 0.08, 'sawtooth');
        const leftRef = matchSelectedLeft;
        setTimeout(() => {
            el.classList.remove('wrong');
            leftRef.classList.remove('selected');
        }, 500);
        matchSelectedLeft = null;
    }
}


/* --- Jeu 7 : Feux d'artifice --- */
let fireworksAnimId = null;
let fireworksParticles = [];
let fireworksRockets = [];
let fireworksFrameCount = 0;
let fireworksStars = [];
let fireworksWidth = 0, fireworksHeight = 0;
let fireworksInitialTimers = [];

const FIREWORKS_PALETTES = [
    ['#ff0040', '#ff6600', '#ffaa00', '#ffcc66'],
    ['#0066ff', '#00ccff', '#66ccff', '#ffffff'],
    ['#00ff44', '#66ff00', '#ccff00', '#aaff66'],
    ['#cc00ff', '#ff00aa', '#ff66cc', '#ff99ff'],
    ['#ffffff', '#ffdd88', '#ffaa44', '#ff8844'],
    ['#ff0044', '#ffaa00', '#00ff66', '#0066ff', '#cc00ff'],
    ['#ff0000', '#cc0033', '#ff3366', '#ff6699'],
    ['#00ffcc', '#00ff88', '#66ffaa', '#ccffee'],
];

function fwRandom(min, max) { return Math.random() * (max - min) + min; }
function fwRandomInt(min, max) { return Math.floor(fwRandom(min, max + 1)); }

class FireworkParticle {
    constructor(x, y, color, velocity, size, life, gravity = 0.05, fade = true) {
        this.x = x; this.y = y; this.color = color;
        this.vx = velocity.x; this.vy = velocity.y;
        this.size = size; this.life = life; this.maxLife = life;
        this.gravity = gravity; this.fade = fade; this.alpha = 1;
        this.trail = []; this.maxTrail = 5;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.vx *= 0.99;
        this.vy += this.gravity;
        this.x += this.vx; this.y += this.vy;
        this.life--;
        if (this.fade) this.alpha = this.life / this.maxLife;
        this.size *= 0.998;
    }
    draw(ctx) {
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * this.alpha * 0.4;
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.strokeStyle = this.color.replace('1)', alpha + ')');
                ctx.lineWidth = this.size * (i / this.trail.length) * 0.8;
                ctx.stroke();
            }
        }
        const alpha = this.fade ? this.alpha : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.shadowBlur = this.size * 4;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (this.size > 2) {
            ctx.shadowBlur = this.size * 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
        }
        ctx.restore();
    }
    isDead() { return this.life <= 0 || this.size < 0.3 || this.alpha < 0.01; }
}

class FireworkRocket {
    constructor(startX, startY, targetX, targetY, palette) {
        this.startX = startX; this.startY = startY;
        this.targetX = targetX; this.targetY = targetY;
        const dx = targetX - startX, dy = targetY - startY;
        this.speed = fwRandom(6, 10);
        this.angle = Math.atan2(dy, dx);
        this.x = startX; this.y = startY;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.trail = []; this.maxTrail = 16;
        this.alive = true;
        this.palette = palette || FIREWORKS_PALETTES[fwRandomInt(0, FIREWORKS_PALETTES.length - 1)];
        this.explosionSize = fwRandom(40, 90);
        this.particleCount = fwRandomInt(50, 120);
        this.sparkle = 0;
    }
    update(width, height) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.sparkle = Math.random() * 0.5 + 0.5;
        const dx = this.targetX - this.x, dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10 || this.y > height + 50 || this.x < -50 || this.x > width + 50) {
            this.alive = false;
            this.explode();
        }
    }
    explode() {
        const count = this.particleCount;
        const colors = this.palette;
        for (let i = 0; i < count; i++) {
            const theta = fwRandom(0, Math.PI * 2);
            const phi = fwRandom(0, Math.PI);
            const speed = fwRandom(1, 6) * (this.explosionSize / 100);
            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.sin(phi) * Math.sin(theta) * speed - fwRandom(0, 1);
            const color = colors[fwRandomInt(0, colors.length - 1)];
            const size = fwRandom(1.5, 4);
            const life = fwRandomInt(35, 80);
            const isStar = Math.random() < 0.08;
            const particle = new FireworkParticle(this.x, this.y, color, { x: vx, y: vy },
                isStar ? size * 2 : size, isStar ? life * 1.5 : life, 0.04 + fwRandom(0, 0.03), true);
            if (isStar) { particle.maxTrail = 10; particle.gravity = 0.02; }
            fireworksParticles.push(particle);
        }
        for (let i = 0; i < 15; i++) {
            const theta = fwRandom(0, Math.PI * 2);
            const speed = fwRandom(0, 2);
            const particle = new FireworkParticle(this.x + fwRandom(-3, 3), this.y + fwRandom(-3, 3),
                'rgba(255,255,255,0.9)', { x: Math.cos(theta) * speed, y: Math.sin(theta) * speed - 0.5 },
                fwRandom(3, 6), fwRandomInt(5, 12), 0.01, true);
            fireworksParticles.push(particle);
        }
    }
    draw(ctx) {
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.6;
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
                ctx.lineWidth = (i / this.trail.length) * 2.5;
                ctx.stroke();
            }
        }
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 6);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * this.sparkle})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.6 * this.sparkle})`);
        gradient.addColorStop(1, `rgba(255, 100, 50, 0)`);
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#ffaa44';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }
    isDead() { return !this.alive; }
}

function fwCreateFirework(x, y) {
    const startX = x + fwRandom(-20, 20);
    const startY = fireworksHeight + fwRandom(-10, 10);
    const targetX = x + fwRandom(-30, 30);
    const targetY = y + fwRandom(-40, 0);
    fireworksRockets.push(new FireworkRocket(startX, startY, targetX, targetY));
}

function fwInitStars() {
    fireworksStars = [];
    for (let i = 0; i < 60; i++) {
        fireworksStars.push({
            x: fwRandom(0, fireworksWidth), y: fwRandom(0, fireworksHeight),
            size: fwRandom(0.5, 1.6), brightness: fwRandom(0.3, 1),
            speed: fwRandom(0.001, 0.01), phase: fwRandom(0, Math.PI * 2)
        });
    }
}
function fwDrawStars(ctx) {
    for (const star of fireworksStars) {
        const alpha = star.brightness * (0.5 + 0.5 * Math.sin(fireworksFrameCount * star.speed + star.phase));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }
}

function fwResizeCanvas() {
    const canvas = document.getElementById('fireworksCanvas');
    const area = document.getElementById('fireworksArea');
    if (!canvas || !area) return;
    const rect = area.getBoundingClientRect();
    fireworksWidth = canvas.width = rect.width;
    fireworksHeight = canvas.height = rect.height;
    fwInitStars();
}

function fwLoop() {
    const canvas = document.getElementById('fireworksCanvas');
    if (!canvas) { fireworksAnimId = null; return; }
    const ctx = canvas.getContext('2d');

    for (let i = fireworksRockets.length - 1; i >= 0; i--) {
        fireworksRockets[i].update(fireworksWidth, fireworksHeight);
        if (fireworksRockets[i].isDead()) fireworksRockets.splice(i, 1);
    }
    for (let i = fireworksParticles.length - 1; i >= 0; i--) {
        fireworksParticles[i].update();
        if (fireworksParticles[i].isDead()) fireworksParticles.splice(i, 1);
    }
    if (fireworksParticles.length > 1200) fireworksParticles.splice(0, fireworksParticles.length - 1200);
    fireworksFrameCount++;

    ctx.fillStyle = 'rgba(10, 10, 26, 0.28)';
    ctx.fillRect(0, 0, fireworksWidth, fireworksHeight);
    if (fireworksFrameCount % 60 === 0) fwDrawStars(ctx);
    for (const rocket of fireworksRockets) rocket.draw(ctx);
    for (const particle of fireworksParticles) particle.draw(ctx);

    fireworksAnimId = requestAnimationFrame(fwLoop);
}

function startFireworks() {
    stopFireworks(); // repart d'un écran propre à chaque ouverture
    fireworksParticles = [];
    fireworksRockets = [];
    fireworksFrameCount = 0;
    fwResizeCanvas();

    const canvas = document.getElementById('fireworksCanvas');
    if (canvas && !canvas.dataset.fwBound) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const count = fwRandomInt(1, 2);
            for (let i = 0; i < count; i++) {
                setTimeout(() => fwCreateFirework(x + fwRandom(-30, 30), y + fwRandom(-20, 20)), i * fwRandom(80, 200));
            }
            playTone(400 + Math.random() * 200, getCtx().currentTime, 0.2, 0.05, 'sine');
        });
        canvas.dataset.fwBound = 'true';
    }
    window.addEventListener('resize', fwResizeCanvas);

    // Petit spectacle de bienvenue
    for (let i = 0; i < 3; i++) {
        const t = setTimeout(() => {
            fwCreateFirework(fwRandom(fireworksWidth * 0.2, fireworksWidth * 0.8), fwRandom(fireworksHeight * 0.2, fireworksHeight * 0.5));
        }, 300 + i * 450);
        fireworksInitialTimers.push(t);
    }

    fwLoop();
}

function stopFireworks() {
    if (fireworksAnimId) { cancelAnimationFrame(fireworksAnimId); fireworksAnimId = null; }
    fireworksInitialTimers.forEach(t => clearTimeout(t));
    fireworksInitialTimers = [];
    window.removeEventListener('resize', fwResizeCanvas);
}

/* =========================================================
   ASTUCES POUR MAMANS
   ========================================================= */

/* ---------- 17. CARROUSEL DE CONSEILS ---------- */
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.querySelectorAll('.carousel-dot');
const CAROUSEL_SLIDE_COUNT = carouselDots.length;
let carouselIndex = 0;

function updateCarousel() {
    if (!carouselTrack) return;
    carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
    carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === carouselIndex));
}
function goToSlide(i) {
    carouselIndex = (i + CAROUSEL_SLIDE_COUNT) % CAROUSEL_SLIDE_COUNT;
    updateCarousel();
}
const carouselPrevBtn = document.getElementById('carouselPrev');
const carouselNextBtn = document.getElementById('carouselNext');
if (carouselPrevBtn) carouselPrevBtn.addEventListener('click', () => goToSlide(carouselIndex - 1));
if (carouselNextBtn) carouselNextBtn.addEventListener('click', () => goToSlide(carouselIndex + 1));
carouselDots.forEach(dot => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index, 10)));
});
// Glisser du doigt sur mobile pour changer de conseil
(function initCarouselSwipe() {
    const viewport = document.querySelector('.carousel-viewport');
    if (!viewport) return;
    let startX = 0;
    let touching = false;
    viewport.addEventListener('touchstart', e => { touching = true; startX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', e => {
        if (!touching) return;
        touching = false;
        const deltaX = e.changedTouches[0].clientX - startX;
        if (Math.abs(deltaX) > 40) {
            goToSlide(carouselIndex + (deltaX < 0 ? 1 : -1));
        }
    });
})();

/* ---------- 19. CHECKLIST DE MAMAN (persistée sur l'appareil) ---------- */
const CHECKLIST_STORAGE_KEY = 'cutebaby_checklist_v1';
const CHECKLIST_DATA = [
    {
        id: 'valise', title: '🎒 Valise de maternité', items: [
            "Vêtements pour bébé (naissance à 1 mois)",
            "Couches taille naissance",
            "Vêtements confortables et amples pour toi",
            "Nécessaire de toilette (le tien + celui de bébé)",
            "Chargeur de téléphone et batterie externe",
            "Coussin ou écharpe d'allaitement",
            "Carnet de santé et dossier médical",
            "Serviettes hygiéniques post-partum"
        ]
    },
    {
        id: 'rdv', title: '🩺 Rendez-vous & démarches', items: [
            "Échographies planifiées",
            "Cours de préparation à la naissance",
            "Choix de la maternité",
            "Déclaration de grossesse (CAF / Sécurité sociale)",
            "Congé maternité déclaré à l'employeur",
            "Choix du pédiatre ou médecin traitant"
        ]
    },
    {
        id: 'maison', title: "🏠 Avant l'arrivée à la maison", items: [
            "Lit de bébé installé et testé",
            "Siège auto vérifié et bien fixé",
            "Stock de couches et lingettes",
            "Chambre prête, aérée et à bonne température",
            "Numéros utiles enregistrés (pédiatre, urgences)",
            "Quelques repas préparés à l'avance"
        ]
    }
];
function loadChecklistState() {
    try {
        const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}
function saveChecklistState(state) {
    try { localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible, tant pis */ }
}
let checklistState = loadChecklistState();

function renderChecklists() {
    const grid = document.getElementById('checklistGrid');
    if (!grid) return;
    grid.innerHTML = '';
    CHECKLIST_DATA.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'checklist-card';

        const checkedCount = card.items.filter((_, i) => checklistState[card.id + '-' + i]).length;
        const percent = Math.round((checkedCount / card.items.length) * 100);

        const itemsHtml = card.items.map((item, i) => {
            const key = card.id + '-' + i;
            const checked = !!checklistState[key];
            return `<li class="checklist-item${checked ? ' checked' : ''}" data-key="${key}">
                <input type="checkbox" ${checked ? 'checked' : ''} />
                <span>${item}</span>
            </li>`;
        }).join('');

        cardEl.innerHTML = `
            <h4>${card.title}</h4>
            <div class="checklist-progress-bar"><div class="checklist-progress-fill" style="width:${percent}%"></div></div>
            <ul class="checklist-items">${itemsHtml}</ul>
            <button class="checklist-reset-btn" data-reset="${card.id}">Réinitialiser cette liste</button>
        `;
        grid.appendChild(cardEl);
    });

    // Cocher / décocher un élément
    grid.querySelectorAll('.checklist-item').forEach(li => {
        li.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return; // le clic sur la case suit son cours normalement
            toggleChecklistItem(li.dataset.key);
        });
        li.querySelector('input').addEventListener('change', () => toggleChecklistItem(li.dataset.key));
    });
    // Réinitialiser une liste
    grid.querySelectorAll('.checklist-reset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cardId = btn.dataset.reset;
            const card = CHECKLIST_DATA.find(c => c.id === cardId);
            card.items.forEach((_, i) => { delete checklistState[cardId + '-' + i]; });
            saveChecklistState(checklistState);
            renderChecklists();
        });
    });
}
function toggleChecklistItem(key) {
    checklistState[key] = !checklistState[key];
    saveChecklistState(checklistState);
    renderChecklists();
    // Petite célébration si une liste vient d'être complétée à 100%
    const [cardId] = key.split('-');
    const card = CHECKLIST_DATA.find(c => c.id === cardId);
    if (card) {
        const allChecked = card.items.every((_, i) => checklistState[cardId + '-' + i]);
        if (allChecked) celebrate(document.getElementById('checklistGrid'));
    }
}
renderChecklists();

/* ---------- 20. ARTICLES / BLOG ---------- */
const ARTICLES = [
    {
        emoji: '😴',
        title: 'Comprendre le sommeil de bébé (0-6 mois)',
        excerpt: "Pourquoi bébé se réveille autant, et comment installer peu à peu des repères jour/nuit.",
        content: [
            "Les tout premiers mois, le sommeil de bébé n'a rien à voir avec le nôtre : ses cycles sont plus courts, souvent 45 à 60 minutes, et il passe beaucoup de temps en sommeil léger, ce qui explique les réveils fréquents.",
            "Vers 6-8 semaines, tu peux commencer à l'aider à différencier le jour de la nuit : lumière et activité le jour, calme et pénombre la nuit, même pour les tétées ou changes nocturnes.",
            "Un rituel court et répété avant le coucher (bain, câlin, berceuse) envoie un signal rassurant à son cerveau : c'est bientôt l'heure de dormir.",
            "Chaque bébé a son rythme propre. Certains font des nuits plus longues tôt, d'autres beaucoup plus tard — ce n'est pas un signe de ta compétence en tant que maman."
        ]
    },
    {
        emoji: '🍼',
        title: 'Allaitement : dépasser les débuts difficiles',
        excerpt: "Crevasses, doutes sur la quantité, fatigue... des pistes concrètes pour tenir le cap si tu le souhaites.",
        content: [
            "Les premières semaines d'allaitement sont souvent les plus rudes : la mise en route peut être douloureuse, et le doute sur la quantité de lait est presque universel chez les jeunes mamans.",
            "Une bonne prise du sein change tout : le nez de bébé au niveau du mamelon, la bouche grande ouverte, et une bonne partie de l'aréole dans sa bouche, pas seulement le bout du sein.",
            "Les tétées fréquentes les premiers jours ne signifient pas que tu manques de lait — c'est ainsi que la production s'installe et se régule.",
            "Si la douleur persiste au-delà des premières secondes de chaque tétée, ou si tu as de la fièvre, une consultante en lactation ou une sage-femme peut identifier rapidement ce qui coince."
        ]
    },
    {
        emoji: '🌧️',
        title: 'Le baby blues, et après ?',
        excerpt: "Faire la différence entre les larmes passagères du post-partum et un mal-être qui mérite d'être écouté.",
        content: [
            "Le baby blues touche une grande majorité de jeunes mamans autour du 3ᵉ-5ᵉ jour après l'accouchement : hypersensibilité, larmes soudaines, fatigue émotionnelle. C'est lié aux bouleversements hormonaux et passe en général en quelques jours.",
            "Ce qui est différent d'une dépression du post-partum : le baby blues s'estompe naturellement, sans s'installer, et n'empêche pas de ressentir aussi de la joie et de l'attachement pour bébé.",
            "Si la tristesse persiste au-delà de deux semaines, s'intensifie, ou s'accompagne d'un sentiment de vide, d'anxiété forte ou de pensées inquiétantes, il est important d'en parler vite à un professionnel de santé — sage-femme, médecin, psychologue.",
            "Demander de l'aide à ce moment-là n'est ni un échec, ni une faiblesse : c'est un acte de soin, pour toi et pour ton bébé."
        ]
    },
    {
        emoji: '💼',
        title: 'Préparer sereinement le retour au travail',
        excerpt: "Anticiper le mode de garde, la séparation, et retrouver un équilibre sans culpabiliser.",
        content: [
            "Anticiper le mode de garde plusieurs semaines à l'avance (crèche, assistante maternelle, famille) permet d'aborder la reprise avec moins de stress logistique.",
            "Une période d'adaptation progressive avec le mode de garde, même de quelques jours, aide bébé — et toi — à vivre la séparation plus en douceur.",
            "Il est normal de ressentir un mélange d'émotions : hâte de retrouver une part de sa vie d'avant, et tristesse à l'idée de la séparation. Les deux peuvent coexister sans contradiction.",
            "Mettre en place quelques repères stables (photo de toi dans son sac, doudou familier, rituel de départ toujours identique) aide bébé à se sentir en sécurité même en ton absence."
        ]
    }
];
function renderArticles() {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    ARTICLES.forEach((article, index) => {
        const card = document.createElement('div');
        card.className = 'article-card';
        const paragraphs = article.content.map(p => `<p>${p}</p>`).join('');
        card.innerHTML = `
            <span class="article-emoji">${article.emoji}</span>
            <h4>${article.title}</h4>
            <p class="article-excerpt">${article.excerpt}</p>
            <button class="article-read-btn" data-index="${index}">Lire l'article →</button>
            <div class="article-full">${paragraphs}</div>
        `;
        grid.appendChild(card);
    });
    grid.querySelectorAll('.article-read-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.article-card');
            const expanding = !card.classList.contains('expanded');
            card.classList.toggle('expanded');
            btn.textContent = expanding ? 'Réduire ↑' : "Lire l'article →";
        });
    });
}
renderArticles();

/* ---------- 18. TÉMOIGNAGES / MUR DE LA COMMUNAUTÉ ---------- */
const TESTIMONIAL_STORAGE_KEY = 'cutebaby_testimonials_v1';
// Témoignages de base, écrits pour donner le ton chaleureux et varié du mur
const CURATED_TESTIMONIALS = [
    { author: 'Une maman de jumeaux', text: "Les six premiers mois, j'ai vécu en pilote automatique. Et puis un matin, ils ont ri en même temps, et j'ai compris que ça allait aller. 💛" },
    { author: 'Maman pour la 1ère fois', text: "Personne ne m'avait dit qu'on pouvait pleurer de fatigue ET rire aux éclats dans la même heure. Bienvenue dans le grand n'importe quoi de la maternité !" },
    { author: 'Une maman qui recommence à zéro chaque jour', text: "Mon astuce n°1 : le café se boit froid, et c'est très bien comme ça." },
    { author: 'Maman allaitante convertie au biberon', text: "J'ai culpabilisé pendant des semaines avant de passer au biberon. Bébé va très bien, et moi aussi. Fais ce qui marche pour vous deux." },
    { author: 'Une maman qui a survécu au 4ᵉ trimestre', text: "Le rangement peut attendre. Les câlins, beaucoup moins longtemps." },
    { author: 'Maman solo et fière de l’être', text: "On me demande souvent comment j'y arrive. La vérité : un jour à la fois, et beaucoup d'indulgence envers moi-même." }
];
function loadCommunityTestimonials() {
    try {
        const raw = localStorage.getItem(TESTIMONIAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}
function saveCommunityTestimonials(list) {
    try { localStorage.setItem(TESTIMONIAL_STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* stockage indisponible */ }
}
function renderTestimonials() {
    const wall = document.getElementById('testimonialWall');
    if (!wall) return;
    const community = loadCommunityTestimonials();
    const all = [...community, ...CURATED_TESTIMONIALS];
    wall.innerHTML = all.map(t => `
        <div class="testimonial-card">
            <div class="t-quote">${escapeHtml(t.text)}</div>
            <div class="t-author">💬 ${escapeHtml(t.author || 'Une maman anonyme')}</div>
        </div>
    `).join('');
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
renderTestimonials();

/* =========================================================
   STORYTIME — bibliothèque d'histoires + lecteur narré
   ========================================================= */
const STORIES = [
    {
        id: 'nuage-curieux',
        emoji: '☁️',
        title: 'Le petit nuage curieux',
        desc: "Un tout petit nuage part à la découverte du grand ciel bleu.",
        stageBg: 'linear-gradient(135deg, #74C7E3, #453B52)',
        pages: [
            { illu: '☁️', text: "Il était une fois un tout petit nuage, tout rond et tout doux, qui vivait haut dans le ciel." },
            { illu: '🌤️', text: "Un matin, il regarda le grand ciel bleu et se dit : je voudrais voir ce qu'il y a de l'autre côté des montagnes." },
            { illu: '🏔️', text: "Alors il se laissa porter par le vent, tout doucement, en dansant au-dessus des sommets enneigés." },
            { illu: '🌈', text: "En chemin, il croisa un arc-en-ciel qui lui offrit toutes ses couleurs pour la route." },
            { illu: '🌙', text: "Le soir venu, fatigué mais heureux, le petit nuage se blottit près de la lune et s'endormit paisiblement." }
        ]
    },
    {
        id: 'lapin-doudou',
        emoji: '🐰',
        title: 'Le lapin et son doudou',
        desc: "Un petit lapin cherche partout son doudou avant l'heure du dodo.",
        stageBg: 'linear-gradient(135deg, #C6A8E0, #453B52)',
        pages: [
            { illu: '🐰', text: "Ce soir, le petit lapin Câlin ne trouve plus son doudou préféré. Où a-t-il bien pu passer ?" },
            { illu: '🛋️', text: "Il regarde sous le canapé... rien. Il regarde derrière les coussins... toujours rien." },
            { illu: '🧸', text: "Il demande à son ami l'ourson en peluche, qui secoue gentiment la tête." },
            { illu: '🛏️', text: "Puis, en refaisant son lit, il aperçoit une petite oreille qui dépasse sous la couverture." },
            { illu: '💤', text: "Le doudou était caché là depuis le début ! Le petit lapin le serre fort et s'endort tout content." }
        ]
    },
    {
        id: 'graine-magique',
        emoji: '🌱',
        title: 'La petite graine magique',
        desc: "Une graine minuscule rêve de devenir la plus belle fleur du jardin.",
        stageBg: 'linear-gradient(135deg, #8FD9A8, #453B52)',
        pages: [
            { illu: '🌱', text: "Au fond du jardin, une toute petite graine dormait sous la terre bien chaude." },
            { illu: '💧', text: "Chaque matin, une goutte de pluie venait lui chanter une berceuse pour l'aider à grandir." },
            { illu: '☀️', text: "Le soleil, lui, lui envoyait de la lumière et de la chaleur, tout doucement, jour après jour." },
            { illu: '🌿', text: "Petit à petit, une tige verte pointa hors de la terre, curieuse de découvrir le monde." },
            { illu: '🌸', text: "Et un beau matin, elle devint la plus jolie fleur du jardin, fière d'avoir grandi avec patience." }
        ]
    },
    {
        id: 'etoile-filante',
        emoji: '⭐',
        title: "L'étoile qui n'osait pas briller",
        desc: "Une petite étoile timide apprend à laisser sa lumière briller.",
        stageBg: 'linear-gradient(135deg, #FFC857, #453B52)',
        pages: [
            { illu: '✨', text: "Tout en haut du ciel nocturne, une petite étoile n'osait pas briller trop fort, de peur de déranger ses voisines." },
            { illu: '🌌', text: "Elle regardait les autres étoiles scintiller et se trouvait bien pâle à côté d'elles." },
            { illu: '🌠', text: "Une nuit, la lune lui murmura : chaque étoile brille à sa façon, et c'est ce qui rend le ciel si beau." },
            { illu: '💫', text: "Rassurée, la petite étoile ferma les yeux et laissa sa lumière sortir, toute douce et toute unique." },
            { illu: '🌙', text: "Depuis ce jour-là, un enfant en bas, en la regardant, fait toujours un vœu avant de s'endormir." }
        ]
    }
];

let currentStory = null;
let currentPageIndex = 0;
let storyIsPlaying = false;

function renderStoryLibrary() {
    const library = document.getElementById('storyLibrary');
    if (!library) return;
    library.innerHTML = STORIES.map(story => `
        <button class="story-card" data-story="${story.id}" type="button">
            <span class="story-emoji">${story.emoji}</span>
            <h3>${story.title}</h3>
            <p>${story.desc}</p>
            <span class="story-play-cta">▶ Écouter</span>
        </button>
    `).join('');
    library.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => openStory(card.dataset.story));
    });
}

function openStory(storyId) {
    const story = STORIES.find(s => s.id === storyId);
    if (!story) return;
    currentStory = story;
    currentPageIndex = 0;

    const library = document.getElementById('storyLibrary');
    const player = document.getElementById('storyPlayer');
    if (library) library.style.display = 'none';
    if (player) player.classList.add('active');

    renderStoryDots();
    showStoryPage(0, true);
}

function closeStory() {
    exitFullscreenIfActive(document.getElementById('storyPlayer'));
    stopStoryNarration();
    currentStory = null;
    const library = document.getElementById('storyLibrary');
    const player = document.getElementById('storyPlayer');
    if (player) player.classList.remove('active');
    if (library) library.style.display = '';
}

function renderStoryDots() {
    const dotsWrap = document.getElementById('storyDots');
    if (!dotsWrap || !currentStory) return;
    dotsWrap.innerHTML = currentStory.pages.map((_, i) =>
        `<span class="${i === currentPageIndex ? 'on' : ''}"></span>`
    ).join('');
}

function showStoryPage(index, autoplay) {
    if (!currentStory) return;
    currentPageIndex = Math.max(0, Math.min(index, currentStory.pages.length - 1));
    const page = currentStory.pages[currentPageIndex];

    const stage = document.getElementById('storyStage');
    const illu = document.getElementById('storyIllustration');
    const text = document.getElementById('storyText');
    if (stage) stage.style.background = currentStory.stageBg;
    if (illu) illu.textContent = page.illu;
    if (text) text.textContent = page.text;

    renderStoryDots();

    if (autoplay !== false) {
        speakStoryPage();
    } else {
        stopStoryNarration();
    }
}

function speakStoryPage() {
    if (!window.speechSynthesis || !currentStory) return;
    window.speechSynthesis.cancel();
    const page = currentStory.pages[currentPageIndex];
    const utter = new SpeechSynthesisUtterance(page.text);
    utter.lang = 'fr-FR';
    utter.rate = 0.92;
    utter.pitch = 1.05;
    storyIsPlaying = true;
    updatePlayPauseBtn();
    utter.onend = () => {
        storyIsPlaying = false;
        updatePlayPauseBtn();
    };
    window.speechSynthesis.speak(utter);
}

function stopStoryNarration() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    storyIsPlaying = false;
    updatePlayPauseBtn();
}

function updatePlayPauseBtn() {
    const btn = document.getElementById('storyPlayPause');
    if (btn) btn.textContent = storyIsPlaying ? '⏸️' : '🔊';
}

function toggleStoryPlayPause() {
    if (storyIsPlaying) {
        stopStoryNarration();
    } else {
        speakStoryPage();
    }
}

function goToStoryPage(delta) {
    if (!currentStory) return;
    const nextIndex = currentPageIndex + delta;
    if (nextIndex < 0 || nextIndex >= currentStory.pages.length) return;
    showStoryPage(nextIndex, true);
}

renderStoryLibrary();

const storyBackBtn = document.getElementById('storyBack');
if (storyBackBtn) storyBackBtn.addEventListener('click', closeStory);

const storyPrevBtn = document.getElementById('storyPrev');
if (storyPrevBtn) storyPrevBtn.addEventListener('click', () => goToStoryPage(-1));

const storyNextBtn = document.getElementById('storyNext');
if (storyNextBtn) storyNextBtn.addEventListener('click', () => goToStoryPage(1));

const storyPlayPauseBtn = document.getElementById('storyPlayPause');
if (storyPlayPauseBtn) storyPlayPauseBtn.addEventListener('click', toggleStoryPlayPause);


/* =========================================================
   PARAMÈTRES / ABONNEMENT — modale ouverte par le bouton engrenage
   ========================================================= */
(function () {
    const toggleBtn = document.getElementById('settingsToggle');
    const modal = document.getElementById('settingsModal');
    const modalInner = document.getElementById('settingsModalInner');
    const closeBtn = document.getElementById('settingsClose');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const successPanel = document.getElementById('subscribeSuccess');
    if (!toggleBtn || !modal) return;

    function openSettingsModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSettingsModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', openSettingsModal);
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);
    // Clic en dehors de la carte = fermeture
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSettingsModal();
    });
    // Touche Échap = fermeture
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeSettingsModal();
    });

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            // Démonstration : aucun paiement réel n'est effectué ici.
            // Une vraie intégration relierait ce bouton à un prestataire
            // de paiement (ex. Stripe) côté serveur.
            if (modalInner) modalInner.classList.add('confirmed');
            if (successPanel) successPanel.classList.add('active');
        });
    }
})();

const testimonialSubmitBtn = document.getElementById('testimonialSubmit');
if (testimonialSubmitBtn) {
    testimonialSubmitBtn.addEventListener('click', () => {
        const textEl = document.getElementById('testimonialText');
        const authorEl = document.getElementById('testimonialAuthor');
        const text = textEl.value.trim();
        if (!text) { textEl.focus(); return; }
        const author = authorEl.value.trim() || 'Une maman anonyme';
        const community = loadCommunityTestimonials();
        community.unshift({ author, text });
        saveCommunityTestimonials(community);
        textEl.value = '';
        authorEl.value = '';
        renderTestimonials();
        celebrate(document.getElementById('testimonialWall'));
    });
}

/* =========================================================
   MODE PLEIN ÉCRAN — API Fullscreen native du navigateur
   On utilise l'API Fullscreen standard : l'élément est rendu
   par le navigateur/l'OS dans une couche indépendante de tout
   parent CSS. Cela évite tout conflit avec les transforms de
   hover (.game-card:hover etc.), et donne un VRAI plein écran
   sur Android/Chrome (barre d'adresse masquée). Un repli en
   CSS fixed n'est utilisé qu'en tout dernier recours, pour les
   très rares navigateurs sans support de l'API.
   ========================================================= */
function fsCurrentElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}
function fsRequest(el) {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    return Promise.reject(new Error('Fullscreen API non supportée'));
}
function fsExit() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
}
function exitAnyFullscreen() {
    if (fsCurrentElement()) fsExit();
    document.querySelectorAll('.fs-fallback-active').forEach(el => el.classList.remove('fs-fallback-active'));
    document.body.classList.remove('fs-lock');
}

function onFsResize(container) {
    setTimeout(() => {
        if (container.id === 'drawStageWrap' && typeof drawCanvasResizeFn === 'function') drawCanvasResizeFn();
        if (container.id === 'stage-fireworks' && typeof fwResizeCanvas === 'function') fwResizeCanvas();
        if (container.id === 'alphabetPlayer' && traceModeOn && typeof setupTraceCanvas === 'function') setupTraceCanvas();
    }, 80);
}

function makeFullscreenable(container) {
    if (!container || container.dataset.fsReady) return;
    container.dataset.fsReady = 'true';
    container.setAttribute('data-fs-container', '');

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'fs-toggle-btn';
    openBtn.innerHTML = '⛶';
    openBtn.setAttribute('aria-label', 'Plein écran');
    container.appendChild(openBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'fs-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Quitter le plein écran');
    container.appendChild(closeBtn);

    openBtn.addEventListener('click', () => {
        fsRequest(container)
            .then(() => onFsResize(container))
            .catch(() => {
                // Repli pour les navigateurs sans API Fullscreen
                container.classList.add('fs-fallback-active');
                document.body.classList.add('fs-lock');
                onFsResize(container);
            });
    });
    closeBtn.addEventListener('click', () => {
        if (fsCurrentElement() === container) fsExit();
        container.classList.remove('fs-fallback-active');
        document.body.classList.remove('fs-lock');
    });
}

['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
    document.addEventListener(evt, () => {
        const active = fsCurrentElement();
        if (active) onFsResize(active);
    });
});

function initAllFullscreenActivities() {
    document.querySelectorAll('.game-stage').forEach(makeFullscreenable);
    const drawWrap = document.getElementById('drawStageWrap');
    if (drawWrap) makeFullscreenable(drawWrap);
    const alphaPlayer = document.getElementById('alphabetPlayer');
    if (alphaPlayer) makeFullscreenable(alphaPlayer);
    const storyPlayerEl = document.getElementById('storyPlayer');
    if (storyPlayerEl) makeFullscreenable(storyPlayerEl);
}
document.addEventListener('DOMContentLoaded', initAllFullscreenActivities);

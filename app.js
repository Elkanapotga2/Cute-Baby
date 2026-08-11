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
    letterWord.textContent = buildLetterPhrase(currentLang, letter, word);
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
   DESSINER — tableau noir magique avec 3 pinceaux
   ========================================================= */
let canvasReady = false;
let currentBrush = 'rainbow'; // 'rainbow', 'star', 'fire'
let particles = [];
let animationId = null;

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
    window.addEventListener('resize', resize);

    let drawing = false;
    let hue = 0;
    let last = { x: 0, y: 0 };
    let points = [];

    function pos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const point = e.touches ? e.touches[0] : e;
        return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
    }

    // --- Pinceau Arc-en-ciel amélioré ---
    function drawRainbowBrush(ctx, x, y, size = 22) {
        const colors = [
            '#FF1744', '#FF6F00', '#FFEA00', '#00E676', '#2979FF', '#D500F9'
        ];
        const steps = 12;
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2 + hue * 0.05;
            const radius = size * (0.3 + 0.7 * (i / steps));
            const cx = x + Math.cos(angle) * radius * 0.3;
            const cy = y + Math.sin(angle) * radius * 0.3;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.8);
            grad.addColorStop(0, colors[i % colors.length]);
            grad.addColorStop(0.5, colors[(i + 3) % colors.length]);
            grad.addColorStop(1, colors[(i + 5) % colors.length] + '33');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.5 + 4, 0, Math.PI * 2);
            ctx.fill();
        }
        // Noyau brillant
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.3, `hsl(${hue % 360}, 100%, 70%)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- Pinceau Étoile ---
    function drawStarBrush(ctx, x, y, size = 28) {
        const numStars = 5 + Math.floor(Math.random() * 4);
        for (let s = 0; s < numStars; s++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * size * 0.8;
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            const starSize = 6 + Math.random() * 14;
            const brightness = 60 + Math.random() * 40;
            const color = `hsl(${40 + Math.random() * 30}, 100%, ${brightness}%)`;

            // Étoile à 5 branches
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = starSize;
            const innerRadius = starSize * 0.4;
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                const px = sx + Math.cos(a) * radius;
                const py = sy + Math.sin(a) * radius;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        // Poussière d'étoile
        for (let s = 0; s < 8; s++) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * size;
            const sx = x + Math.cos(a) * d;
            const sy = y + Math.sin(a) * d;
            ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- Pinceau Feu ---
    let fireParticles = [];

    function drawFireBrush(ctx, x, y, size = 30) {
        // Ajouter des particules de feu
        for (let i = 0; i < 6; i++) {
            const angle = (Math.random() - 0.5) * Math.PI * 1.2 - Math.PI / 2;
            const speed = 0.5 + Math.random() * 1.5;
            const dist = Math.random() * size * 0.5;
            fireParticles.push({
                x: x + (Math.random() - 0.5) * size * 0.4,
                y: y + (Math.random() - 0.5) * size * 0.4,
                vx: Math.cos(angle) * speed * 0.5 + (Math.random() - 0.5) * 0.3,
                vy: Math.sin(angle) * speed * 1.5 - 0.5 + Math.random() * 0.3,
                life: 0.5 + Math.random() * 0.8,
                maxLife: 0.5 + Math.random() * 0.8,
                size: 4 + Math.random() * 16,
                hue: 15 + Math.random() * 35
            });
        }

        // Limiter le nombre de particules
        if (fireParticles.length > 200) {
            fireParticles.splice(0, fireParticles.length - 200);
        }

        // Mettre à jour et dessiner les particules
        for (let i = fireParticles.length - 1; i >= 0; i--) {
            const p = fireParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.02;
            p.life -= 0.01;
            p.size *= 0.998;

            if (p.life <= 0 || p.size < 0.5) {
                fireParticles.splice(i, 1);
                continue;
            }

            const alpha = Math.min(1, p.life / p.maxLife * 1.5);
            const brightness = 60 + p.life / p.maxLife * 40;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, `hsla(${p.hue}, 100%, ${brightness + 30}%, ${alpha})`);
            grad.addColorStop(0.4, `hsla(${p.hue + 10}, 100%, ${brightness}%, ${alpha * 0.9})`);
            grad.addColorStop(0.7, `hsla(${p.hue + 20}, 90%, ${brightness - 20}%, ${alpha * 0.5})`);
            grad.addColorStop(1, `hsla(${p.hue + 30}, 80%, ${brightness - 40}%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Lueur
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            glow.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${alpha * 0.15})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Noyau de feu
        const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 0.3);
        coreGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        coreGrad.addColorStop(0.3, 'rgba(255, 200, 50, 0.7)');
        coreGrad.addColorStop(0.7, 'rgba(255, 100, 20, 0.4)');
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function start(e) {
        drawing = true;
        const p = pos(e);
        last = p;
        points = [p];
        e.preventDefault();

        // Ajouter des particules initiales pour le feu
        if (currentBrush === 'fire') {
            for (let i = 0; i < 15; i++) {
                const angle = (Math.random() - 0.5) * Math.PI * 1.2 - Math.PI / 2;
                const speed = 0.5 + Math.random() * 2;
                fireParticles.push({
                    x: p.x + (Math.random() - 0.5) * 20,
                    y: p.y + (Math.random() - 0.5) * 20,
                    vx: Math.cos(angle) * speed * 0.5 + (Math.random() - 0.5) * 0.3,
                    vy: Math.sin(angle) * speed * 1.5 - 0.5 + Math.random() * 0.3,
                    life: 0.5 + Math.random() * 1,
                    maxLife: 0.5 + Math.random() * 1,
                    size: 4 + Math.random() * 20,
                    hue: 15 + Math.random() * 35
                });
            }
        }
    }

    function move(e) {
        if (!drawing) return;
        const p = pos(e);
        const dist = Math.hypot(p.x - last.x, p.y - last.y);

        // Dessiner selon le pinceau sélectionné
        const steps = Math.max(1, Math.floor(dist / 3));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = last.x + (p.x - last.x) * t;
            const cy = last.y + (p.y - last.y) * t;

            hue = (hue + 0.5) % 360;

            switch (currentBrush) {
                case 'rainbow':
                    drawRainbowBrush(ctx, cx, cy, 18 + Math.sin(hue * 0.05) * 6);
                    break;
                case 'star':
                    drawStarBrush(ctx, cx, cy, 22 + Math.sin(hue * 0.08) * 8);
                    break;
                case 'fire':
                    drawFireBrush(ctx, cx, cy, 25);
                    break;
            }
        }

        last = p;
        e.preventDefault();

        // Animation continue pour le feu
        if (currentBrush === 'fire' && !animationId) {
            animateFire();
        }
    }

    function animateFire() {
        if (currentBrush !== 'fire' || fireParticles.length === 0) {
            animationId = null;
            return;
        }

        // Redessiner une partie des particules
        const canvas = document.getElementById('drawCanvas');
        const ctx2 = canvas.getContext('2d');

        // On ne redessine que si on dessine
        if (drawing) {
            // Mettre à jour les particules
            for (let i = fireParticles.length - 1; i >= 0; i--) {
                const p = fireParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy -= 0.015;
                p.life -= 0.008;
                p.size *= 0.998;
                if (p.life <= 0 || p.size < 0.5) {
                    fireParticles.splice(i, 1);
                }
            }
        }

        animationId = requestAnimationFrame(animateFire);
    }

    function end() {
        drawing = false;
        if (currentBrush !== 'fire') {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    document.getElementById('clearCanvas').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireParticles = [];
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    // Sélection du pinceau
    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBrush = btn.dataset.brush;
            if (currentBrush !== 'fire') {
                fireParticles = [];
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
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

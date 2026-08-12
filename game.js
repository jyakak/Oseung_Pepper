// ===== 오승과 전설의 풋고추 - BGM 개별 조절 & 언더테일 스타일 보스전 완벽판 =====

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// 초기 실행 시 오버레이 숨김 처리
const initialOverlay = document.getElementById('overlay');
if (initialOverlay) initialOverlay.classList.add('hidden');

// ===== [설정 1] 이미지 및 사운드 외부 에셋 경로 설정 =====
const IMG_PATH = 'assets/images/';
const SOUND_PATH = 'assets/sounds/';

// 준비하신 오디오 및 점프스케어 이미지 연결
const jumpscareImg = new Image();
jumpscareImg.src = IMG_PATH + 'owl_jumpscare.png';

const sounds = {
  move: new Audio(SOUND_PATH + 'move.mp3'),
  select: new Audio(SOUND_PATH + 'select.mp3'),
  hit: new Audio(SOUND_PATH + 'hit.mp3'),
  jumpscare: new Audio(SOUND_PATH + 'owl_scream.mp3'),
  bossAttack: new Audio(SOUND_PATH + 'boss_attack.mp3')
};

// 개별 BGM 음량 설정 (0.0 ~ 1.0)
const bgmVolumes = {
  overworld: 0.1,
  cave: 0.65,
  sans: 0.5,    // 1차 각성 - 언더테일 샌즈 테마 (Megalovania 등)
  flowey: 0.5   // 2차 각성 - 언더테일 플라워(각성) 테마 (Your Best Nightmare 등)
};

// 배경음악(BGM) 에셋 설정
const bgm = {
  overworld: new Audio(SOUND_PATH + 'bgm_overworld.mp3'),
  cave: new Audio(SOUND_PATH + 'bgm_cave.mp3'),
  sans: new Audio(SOUND_PATH + 'bgm_sans.mp3'),
  flowey: new Audio(SOUND_PATH + 'bgm_flowey.mp3')
};

// BGM 루프 및 개별 음량 초기화
Object.keys(bgm).forEach(type => {
  bgm[type].loop = true;
  bgm[type].volume = bgmVolumes[type] !== undefined ? bgmVolumes[type] : 0.4;
});

// 개별 BGM 음량 조절 함수 (외부 호출 가능)
function setBgmVolume(type, volume) {
  if (bgm[type]) {
    bgmVolumes[type] = Math.max(0, Math.min(1, volume));
    bgm[type].volume = bgmVolumes[type];
  }
}
window.setBgmVolume = setBgmVolume;

let currentBgm = null;

function playBgm(type) {
  const targetBgm = bgm[type] || bgm['sans'];
  if (currentBgm === targetBgm) return;
  
  stopBgm();
  if (targetBgm) {
    currentBgm = targetBgm;
    currentBgm.currentTime = 0;
    currentBgm.play().catch(() => {});
  }
}

function stopBgm() {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = null;
  }
}

function playSfx(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

// ===== [설정 2] 타일 & 추격자 설정 =====
const TILE = 96;

const CHASER_CONFIG = [
  { id: 1, name: '멧돼지 A',    enabled: true,  x: 8,  y: 4,  endingId: 1, range: 5, interval: 18 },
  { id: 2, name: '델타 (버섯A)', enabled: true,  x: 18, y: 3,  endingId: 2, range: 7, interval: 15 },
  { id: 3, name: '절벽 괴물 A', enabled: true,  x: 35, y: 4,  endingId: 4, range: 5, interval: 18 },
  { id: 4, name: '분노한 꿀벌', enabled: true,  x: 6,  y: 15, endingId: 7, range: 7, interval: 14 },
  { id: 5, name: '광란의 닭',   enabled: true,  x: 12, y: 27, endingId: 17, range: 6, interval: 15 },
  { id: 6, name: '멧돼지 B',    enabled: true,  x: 20, y: 18, endingId: 1, range: 5, interval: 18 },
  { id: 7, name: '버섯 댄서 B', enabled: true,  x: 30, y: 8,  endingId: 2, range: 5, interval: 16 },
  { id: 8, name: '절벽 괴물 B', enabled: true,  x: 42, y: 22, endingId: 4, range: 6, interval: 18 }
];

const chasers = CHASER_CONFIG.filter(c => c.enabled);

const VIEW_W = 15;
const VIEW_H = 10;
canvas.width = VIEW_W * TILE;
canvas.height = VIEW_H * TILE;

const MAP_W = 50;
const MAP_H = 30;
const CAVE_W = 25;
const CAVE_H = 15;

// ===== 기본 이미지 에셋 로드 =====
const images = {
  start: new Image(), grass: new Image(), wall: new Image(), shrine: new Image(),
  water: new Image(), sign: new Image(), player: new Image(), chest: new Image(),
  cave: new Image(), trap: new Image()
};

images.start.src = IMG_PATH + 'start.png';
images.grass.src = IMG_PATH + 'grass.png';
images.wall.src = IMG_PATH + 'wall.png';
images.shrine.src = IMG_PATH + 'shrine.png';
images.water.src = IMG_PATH + 'water.png';
images.sign.src = IMG_PATH + 'sign.png';
images.player.src = IMG_PATH + 'player.png';
images.chest.src = IMG_PATH + 'chest.png';
images.cave.src = IMG_PATH + 'cave.png';
images.trap.src = IMG_PATH + 'trap.png';

const eventImages = {};
for (let i = 1; i <= 23; i++) {
  eventImages[i] = new Image();
  eventImages[i].src = `${IMG_PATH}event${i}.png`;
}

// ===== 보스전 이미지 (1차/2차 각성 × idle / hit / down) =====
// assets/images/ 폴더에 PNG를 넣으면 자동 로드됩니다.
const BOSS_IMAGE_FILES = {
  phase1: {
    idle: 'boss_phase1_idle.png',
    hit: 'boss_phase1_hit.png',
    down: 'boss_phase1_down.png'
  },
  phase2: {
    idle: 'boss_phase2_idle.png',
    hit: 'boss_phase2_hit.png',
    down: 'boss_phase2_down.png'
  }
};

const bossImages = {
  phase1: { idle: new Image(), hit: new Image(), down: new Image() },
  phase2: { idle: new Image(), hit: new Image(), down: new Image() }
};

for (const phase of ['phase1', 'phase2']) {
  for (const state of ['idle', 'hit', 'down']) {
    bossImages[phase][state].src = IMG_PATH + BOSS_IMAGE_FILES[phase][state];
  }
}

const BOSS_SPRITE = { x: 980, y: 50, w: 280, h: 280 };
const BOSS_HIT_IMAGE_DURATION = 30; // 0.5초 @ 60fps

// 언더테일 UI 레이아웃 (640×480 비율을 1440×960에 맞춤)
const UT = {
  bg: '#000000',
  border: '#ffffff',
  yellow: '#ffff00',
  red: '#ff0000',
  white: '#ffffff',
  hpBarBg: '#bf0000',
  hpBarFill: '#ffff00',
  battleBox: { x: 120, y: 500, w: 1200, h: 340 },
  dialogueH: 130
};

const SANS_ATTACKS = ['boneGapSlide', 'boneTopDown', 'boneHorizontalWave', 'blaster'];
const FLOWEY_ATTACKS = ['friendlinessPellets', 'cornerNukes', 'edgeSpiral', 'vineSweep'];

function drawHeart(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.25);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size * 0.25);
  ctx.bezierCurveTo(x - size / 2, y + size * 0.55, x, y + size * 0.75, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size * 0.55, x + size / 2, y + size * 0.25);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size * 0.25);
  ctx.fill();
}

function soulHitsObject(soul, b) {
  if (b.grace > 0) return false;
  const soulR = 7;
  if (b.type === 'bone_h' || b.type === 'bone_v' || b.type === 'beam') {
    const cx = Math.max(b.x, Math.min(soul.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(soul.y, b.y + b.h));
    return Math.hypot(soul.x - cx, soul.y - cy) < soulR;
  }
  return Math.hypot(b.x - soul.x, b.y - soul.y) < (b.r || 6) + soulR;
}

function drawBossObject(b) {
  if (b.type === 'blaster_warn') {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(frame * 0.4) * 0.25;
    ctx.fillStyle = '#ffffff';
    if (b.angle === 0) {
      ctx.fillRect(b.x - 8, b.y - 40, 16, 80);
      ctx.fillRect(b.x - 60, b.y - 6, 120, 12);
    } else {
      ctx.fillRect(b.x - 40, b.y - 8, 80, 16);
      ctx.fillRect(b.x - 6, b.y - 60, 12, 120);
    }
    ctx.restore();
    return;
  }
  if (b.type === 'bone_h' || b.type === 'bone_v') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    return;
  }
  if (b.type === 'beam') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    return;
  }
  if (b.type === 'vine') {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + b.w, b.y + b.h);
    ctx.stroke();
    return;
  }
  // pellet / friendliness pellet (플라워)
  ctx.fillStyle = b.color || '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r || 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function startDodgePhase() {
  boss.turn = 'DODGE';
  boss.timer = boss.phase === 1 ? 300 : 360;
  boss.bullets = [];
  boss.attackTimer = 0;
  boss.attackData = {};
  boss.dodgeGrace = 100;
  boss.playerInvuln = 100;
  const attacks = boss.phase === 1 ? SANS_ATTACKS : FLOWEY_ATTACKS;
  boss.attackName = attacks[boss.attackIndex % attacks.length];
  boss.attackIndex = (boss.attackIndex + 1) % attacks.length;
  boss.soul.x = boss.box.x + boss.box.w / 2;
  boss.soul.y = boss.box.y + boss.box.h - 36;
}

function updateSansAttack() {
  const box = boss.box;
  boss.attackTimer++;

  switch (boss.attackName) {
    case 'boneGapSlide': {
      if (boss.attackTimer % 70 === 1) {
        playSfx('bossAttack');
        const gapCenter = box.y + 50 + Math.random() * (box.h - 100);
        const gapHalf = 60;
        const topH = Math.max(10, gapCenter - gapHalf - box.y);
        const botY = gapCenter + gapHalf;
        const botH = Math.max(10, box.y + box.h - botY);
        const wallW = 220;
        boss.bullets.push({ type: 'bone_h', x: box.x - wallW, y: box.y, w: wallW, h: topH, vx: 3, vy: 0, grace: 18 });
        boss.bullets.push({ type: 'bone_h', x: box.x - wallW, y: botY, w: wallW, h: botH, vx: 3, vy: 0, grace: 18 });
      }
      break;
    }
    case 'boneTopDown': {
      if (boss.attackTimer % 55 === 1) {
        playSfx('bossAttack');
        const cols = 6;
        const gapCol = Math.floor(Math.random() * (cols - 1));
        const colW = box.w / cols;
        for (let c = 0; c < cols; c++) {
          if (c === gapCol || c === gapCol + 1) continue;
          boss.bullets.push({
            type: 'bone_v', x: box.x + c * colW + colW / 2 - 9,
            y: box.y - 220, w: 18, h: 220, vx: 0, vy: 3.5, grace: 20
          });
        }
      }
      break;
    }
    case 'boneHorizontalWave': {
      if (boss.attackTimer % 45 === 1) {
        playSfx('bossAttack');
        const rows = 5;
        const gapRow = boss.attackData.lastGapRow === undefined
          ? 2
          : (boss.attackData.lastGapRow + 1 + Math.floor(Math.random() * 2)) % rows;
        boss.attackData.lastGapRow = gapRow;
        const gapRow2 = (gapRow + 1) % rows;
        const rowH = (box.h - 20) / rows;
        for (let r = 0; r < rows; r++) {
          if (r === gapRow || r === gapRow2) continue;
          boss.bullets.push({
            type: 'bone_h', x: box.x - 300, y: box.y + 10 + r * rowH,
            w: 300, h: Math.max(12, rowH - 8), vx: 3.5, vy: 0, grace: 18
          });
        }
      }
      break;
    }
    case 'blaster': {
      const ad = boss.attackData;
      if (!ad.phase) {
        ad.phase = 'warn';
        ad.warnTimer = 48;
        ad.bx = box.x + box.w * (0.25 + Math.random() * 0.5);
        ad.by = box.y + box.h * (0.25 + Math.random() * 0.5);
        ad.angle = Math.random() < 0.5 ? 0 : 1;
        boss.bullets.push({ type: 'blaster_warn', x: ad.bx, y: ad.by, angle: ad.angle, grace: 999 });
      }
      if (ad.phase === 'warn') {
        ad.warnTimer--;
        if (ad.warnTimer <= 0) {
          ad.phase = 'fire';
          playSfx('bossAttack');
          boss.bullets = boss.bullets.filter(b => b.type !== 'blaster_warn');
          if (ad.angle === 0) {
            boss.bullets.push({ type: 'beam', x: box.x, y: ad.by - 18, w: box.w, h: 36, vx: 0, vy: 0, lifetime: 22, grace: 0 });
          } else {
            boss.bullets.push({ type: 'beam', x: ad.bx - 18, y: box.y, w: 36, h: box.h, vx: 0, vy: 0, lifetime: 22, grace: 0 });
          }
        }
      }
      if (ad.phase === 'fire' && boss.attackTimer % 90 === 0 && boss.attackTimer > 60) {
        ad.phase = null;
      }
      break;
    }
  }
}

function updateFloweyAttack() {
  const box = boss.box;
  boss.attackTimer++;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  switch (boss.attackName) {
    case 'friendlinessPellets': {
      if (boss.attackTimer % 85 === 1) {
        playSfx('bossAttack');
        const rows = 5;
        const gapRow = Math.floor(Math.random() * (rows - 1));
        const gapRow2 = gapRow + 1;
        for (let r = 0; r < rows; r++) {
          if (r === gapRow || r === gapRow2) continue;
          const rowY = box.y + 30 + r * ((box.h - 60) / (rows - 1));
          for (let i = 0; i < 7; i++) {
            boss.bullets.push({
              type: 'pellet', x: box.x - 40 - i * 55, y: rowY,
              vx: 2.5, vy: 0, r: 5, grace: 25, color: '#ffffff'
            });
          }
        }
      }
      break;
    }
    case 'cornerNukes': {
      if (boss.attackTimer === 30) {
        playSfx('bossAttack');
        const corners = [
          [box.x - 10, box.y - 10],
          [box.x + box.w + 10, box.y - 10],
          [box.x - 10, box.y + box.h + 10],
          [box.x + box.w + 10, box.y + box.h + 10]
        ];
        corners.forEach(([px, py]) => {
          for (let i = 0; i < 5; i++) {
            const angle = Math.atan2(cy - py, cx - px) + (Math.random() - 0.5) * 0.5;
            boss.bullets.push({
              type: 'pellet', x: px, y: py,
              vx: Math.cos(angle) * 2.0, vy: Math.sin(angle) * 2.0,
              r: 5, grace: 45, color: '#ffff00'
            });
          }
        });
      }
      if (boss.attackTimer === 140) {
        playSfx('bossAttack');
        for (let i = 0; i < 10; i++) {
          const side = i % 4;
          let px, py, vx, vy;
          if (side === 0) { px = box.x - 20; py = box.y + (i / 10) * box.h; vx = 3; vy = 0; }
          else if (side === 1) { px = box.x + box.w + 20; py = box.y + (i / 10) * box.h; vx = -3; vy = 0; }
          else if (side === 2) { px = box.x + (i / 10) * box.w; py = box.y - 20; vx = 0; vy = 3; }
          else { px = box.x + (i / 10) * box.w; py = box.y + box.h + 20; vx = 0; vy = -3; }
          boss.bullets.push({ type: 'pellet', x: px, y: py, vx, vy, r: 5, grace: 40, color: '#ff5500' });
        }
      }
      break;
    }
    case 'edgeSpiral': {
      // 가장자리에서 안쪽으로 수렴 — 중앙 스폰 금지 (스폰킬 방지)
      if (boss.attackTimer % 16 === 0) {
        playSfx('bossAttack');
        const angle = boss.attackTimer * 0.07;
        const spawnR = Math.max(box.w, box.h) * 0.55;
        boss.bullets.push({
          type: 'pellet',
          x: cx + Math.cos(angle) * spawnR,
          y: cy + Math.sin(angle) * spawnR,
          vx: -Math.cos(angle) * 1.6,
          vy: -Math.sin(angle) * 1.6,
          r: 5, grace: 50, color: ['#ff0000', '#ffff00', '#ff00ff'][boss.attackTimer % 3]
        });
      }
      if (boss.attackTimer % 60 === 0 && boss.attackTimer > 60) {
        for (let k = 0; k < 5; k++) {
          const ang = (boss.attackTimer * 0.05 + k * Math.PI * 2 / 5);
          const spawnR = Math.max(box.w, box.h) * 0.52;
          const px = cx + Math.cos(ang) * spawnR;
          const py = cy + Math.sin(ang) * spawnR;
          boss.bullets.push({
            type: 'pellet', x: px, y: py,
            vx: -Math.cos(ang) * 1.4, vy: -Math.sin(ang) * 1.4,
            r: 5, grace: 55, color: '#ff3300'
          });
        }
      }
      break;
    }
    case 'vineSweep': {
      if (boss.attackTimer % 100 === 1) {
        playSfx('bossAttack');
        const fromTop = Math.random() < 0.5;
        for (let i = 0; i < 4; i++) {
          if (fromTop) {
            boss.bullets.push({
              type: 'pellet', x: box.x + 80 + i * ((box.w - 160) / 3), y: box.y - 30,
              vx: 0, vy: 2.5, r: 6, grace: 30, color: '#00ff00'
            });
          } else {
            boss.bullets.push({
              type: 'pellet', x: box.x - 30, y: box.y + 50 + i * ((box.h - 100) / 3),
              vx: 2.5, vy: 0, r: 6, grace: 30, color: '#00ff00'
            });
          }
        }
      }
      if (boss.attackTimer % 100 === 50) {
        const gapY = box.y + 60 + Math.random() * (box.h - 120);
        boss.bullets.push({
          type: 'bone_h', x: box.x - 200, y: box.y, w: box.w + 200, h: gapY - box.y - 50,
          vx: 2.8, vy: 0, grace: 20
        });
        boss.bullets.push({
          type: 'bone_h', x: box.x - 200, y: gapY + 50, w: box.w + 200, h: box.y + box.h - gapY - 50,
          vx: 2.8, vy: 0, grace: 20
        });
      }
      break;
    }
  }
}

function getCurrentBossImage() {
  const imgs = boss.phase === 2 ? bossImages.phase2 : bossImages.phase1;
  if (boss.isDown) return imgs.down;
  if (boss.hitImageTimer > 0) return imgs.hit;
  return imgs.idle;
}

function drawBossSprite() {
  const img = getCurrentBossImage();
  const s = BOSS_SPRITE;
  const fallback = boss.phase === 2 ? '#660000' : '#1a1a2e';
  drawSafeImage(img, s.x, s.y, s.w, s.h, fallback);

  if (boss.flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${(boss.flashTimer / 8) * 0.35})`;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

function drawSafeImage(img, x, y, width, height, fallbackColor) {
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, x, y, width, height);
  } else if (fallbackColor) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, width, height);
  }
}

// ===== 게임 상태 =====
let gameState = 'TITLE'; // TITLE, PLAYING, DIALOGUE, ENDING, BOSS
let currentDialogue = null;
let currentMap = 'overworld'; 
let statusNotice = '';
let noticeTimer = null;
let jumpscareTimer = 0;

function startGame() {
  if (gameState === 'TITLE') {
    gameState = 'PLAYING';
    showNotice('🌶️ 오승과 전설의 풋고추 - 모험의 시작!');
    playSfx('select');
  }
}

function showNotice(msg) {
  statusNotice = msg;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { statusNotice = ''; }, 4000);
}

// ===== 플레이어 =====
const player = { x: 3, y: 3, dir: 'down', inventory: [] };

// ===== 동굴 함정 데이터 =====
const caveTraps = [
  { x: 8,  y: 3, dirY: 1,  minY: 3,  maxY: 5 },
  { x: 12, y: 5, dirY: -1, minY: 3,  maxY: 5 },
  { x: 16, y: 3, dirY: 1,  minY: 3,  maxY: 5 },
  { x: 9,  y: 8, dirX: 1,  minX: 8,  maxX: 10 },
  { x: 12, y: 10, dirY: 1, minY: 10, maxY: 12 },
  { x: 17, y: 12, dirY: -1, minY: 10, maxY: 12 }
];

// ===== 풋고추 폭발 지역 데이터 =====
const pepperExplosion = {
  centerX: 16, centerY: 14, radius: 2,
  cycleFrames: 90, warningFrames: 60
};

// ===== 엔딩 데이터 (1~24) =====
const endings = {
  1:{name:'멧돼지',desc:'멧돼지가 달려들어 심정지로 사망.',type:'bad'},
  2:{name:'델타',desc:'델타를 사용한 민수가 습격해 충격으로 사망.',type:'bad'},
  3:{name:'박쥐',desc:'박쥐에 물려서 기절해 뇌진탕으로 사망.',type:'bad'},
  4:{name:'풋고추 바이러스',desc:'풋고추 바이러스에 감염되어 사망.',type:'bad'},
  5:{name:'오승',desc:'!@%#&=82(&).',type:'bad'},
  6:{name:'감옥',desc:'감옥에 갇혀 늙어 사망.',type:'bad'},
  7:{name:'부엉이',desc:'부엉이의 공포스러운 날갯짓과 비명에 넘어져 사망.',type:'bad'},
  8:{name:'풋고추 폭발',desc:'풋고추 폭발에 휘말려 신체가 분해되어 사망.',type:'bad'},
  9:{name:'상인 인턴',desc:'상인에게 속아 하루 종일 장사하다 과로로 사망.',type:'bad'},
  10:{name:'수프 냄비 입수',desc:'거대한 수프 냄비에 빠져 온 몸이 익어 사망.',type:'bad'},
  11:{name:'버섯',desc:'살인 버섯에게 납치당해 고문당하다 사망.',type:'bad'},
  12:{name:'고먐미',desc:'고먐미가 네모네모빔을 쏴 자괴감으로 사망.',type:'bad'},
  13:{name:'보물상자 감금',desc:'상자를 열었더니 안에 갇혀버려 사망.',type:'bad'},
  14:{name:'절벽',desc:'절벽에서 떨어져 사망.',type:'bad'},
  15:{name:'바위',desc:'바위에 걸려 넘어져 뒤통수가 가격되어 사망.',type:'bad'},
  16:{name:'씨앗호떡',desc:'씨앗이 목에 걸려 기침하다 사망.',type:'bad'},
  17:{name:'닭',desc:'분노한 닭에게 쫓겨 물려 사망.',type:'bad'},
  18:{name:'축제',desc:'사은품에 담겨 있던 마약에 중독되어 사망.',type:'bad'},
  19:{name:'온천',desc:'뜨거운 온천에 너무 오래 들어가 있어 뜨거워 사망.',type:'bad'},
  20:{name:'전설의 낮잠',desc:'신전 앞에서 잠들어 영원히 깨어나지 못해 사망.',type:'bad'},
  21:{name:'전설의 풋고추',desc:'전설의 풋고추를 획득했다!',type:'good'},
  22:{name:'풋고추의 신',desc:'풋고추 그 자체가 되었다!',type:'secret'},
  23:{name:'풋고추',desc:'풋고추를 자비없이 해치웠다',type:'boss'},
  24:{name:'끝',desc:'모두 다 깨셨네요.......made by 윤정.',type:'final'}
};

let discovered = JSON.parse(localStorage.getItem('osung_endings') || '[]');

function saveEnding(id){
  if(!discovered.includes(id)){
    discovered.push(id);
    localStorage.setItem('osung_endings', JSON.stringify(discovered));
  }
  updateCount();
}

function updateCount(){
  const countEl = document.getElementById('count');
  if(countEl) countEl.textContent = `수집 ${discovered.length}/24`;
}
updateCount();

function checkAllPreEndings() {
  for (let i = 1; i <= 21; i++) {
    if (!discovered.includes(i)) return false;
  }
  return true;
}

const book = document.getElementById('book');
const endingList = document.getElementById('endingList');
const bookBtn = document.getElementById('bookBtn');
const closeBook = document.getElementById('closeBook');
const resetBtn = document.getElementById('resetBtn');
const resetDataBtn = document.getElementById('resetDataBtn');

if (bookBtn) bookBtn.onclick = () => { playSfx('select'); openBook(); };
if (closeBook) closeBook.onclick = () => { playSfx('select'); book.classList.add('hidden'); };

if (resetBtn) {
  resetBtn.onclick = () => {
    playSfx('select');
    if (confirm('🔄 게임을 재시작 하시겠습니까?')) {
      location.reload();
    }
  };
}

if (resetDataBtn) {
  resetDataBtn.onclick = () => {
    playSfx('select');
    if (confirm('⚠️ 도감 수집 기록을 완전히 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('osung_endings');
      discovered = [];
      updateCount();
      openBook();
      location.reload();
    }
  };
}

function openBook(){
  if (!endingList) return;
  endingList.innerHTML = '';

  for(let i = 1; i <= 24; i++){
    const e = endings[i];
    const div = document.createElement('div');
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid #444';

    if(discovered.includes(i)){
      div.innerHTML = `<b>${i}. ${e.name}</b><br><small>${e.desc}</small>`;
      if(e.type==='good') div.style.color='#7dff8c';
      if(e.type==='secret') div.style.color='#ffd166';
      if(e.type==='bad') div.style.color='#ffb4b4';
      if(e.type==='boss') div.style.color='#ff2222';
      if(e.type==='final') div.style.color='#ffffff';
    } else {
      div.innerHTML = `${i}. ???`;
      div.style.color = '#666';
    }
    endingList.appendChild(div);
  }

  if (book) book.classList.remove('hidden');
}

// ===== 맵 생성 =====
const overworldMap = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(0));
for (let x = 0; x < MAP_W; x++) { overworldMap[0][x] = 1; overworldMap[MAP_H-1][x] = 1; }
for (let y = 0; y < MAP_H; y++) { overworldMap[y][0] = 1; overworldMap[y][MAP_W-1] = 1; }

for (let x = 10; x < 15; x++) for (let y = 5; y < 12; y++) overworldMap[y][x] = 3; 
for (let x = 20; x < 40; x += 2) for (let y = 2; y < 25; y += 3) overworldMap[y][x] = 1;

overworldMap[3][2] = 4;   
overworldMap[3][12] = 5;  
overworldMap[27][47] = 2; 

const caveMap = Array.from({ length: CAVE_H }, () => Array(CAVE_W).fill(1));
for (let x = 1; x <= 5; x++) for (let y = 2; y <= 5; y++) caveMap[y][x] = 0;
for (let x = 4; x <= 22; x++) for (let y = 3; y <= 5; y++) caveMap[y][x] = 0;
for (let x = 8; x <= 10; x++) for (let y = 5; y <= 11; y++) caveMap[y][x] = 0;
for (let x = 8; x <= 22; x++) for (let y = 10; y <= 12; y++) caveMap[y][x] = 0;

caveMap[3][22] = 7; 

function getActiveMap() { return currentMap === 'cave' ? caveMap : overworldMap; }
function getMapBounds() { return currentMap === 'cave' ? { w: CAVE_W, h: CAVE_H } : { w: MAP_W, h: MAP_H }; }

function isWalkable(x, y) {
  const curMap = getActiveMap();
  const { w, h } = getMapBounds();
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  const tile = curMap[y][x];
  return tile === 0 || tile === 2 || tile === 5 || tile === 7;
}

// ===== 상호작용 오브젝트 =====
const interactables = [
  { map: 'overworld', x: 2, y: 3, type: 'sign', name: '안내 표지판', text: '📜 [안내판] 모든 엔딩 수집 후 동굴에 들어가 보시오' },
  { map: 'overworld', x: 11, y: 3, type: 'sign', name: '안내 표지판', text: '📜 [안내판] 모든 엔딩 수집 후 아래쪽으로 가라' },
  { map: 'cave', x: 21, y: 3, type: 'chest', name: '비밀 상자', text: '🎁 움직이는 함정을 뚫고 [비밀의 열쇠]를 발견했습니다', action: () => {
      if(!player.inventory.includes('secret_key')) player.inventory.push('secret_key');
  }},

  { map: 'overworld', x: 25, y: 5, type: 'event', endingId: 3 },
  { map: 'overworld', x: 45, y: 6, type: 'event', endingId: 6 },
  { map: 'overworld', x: 28, y: 12, type: 'event', endingId: 9 },
  { map: 'overworld', x: 38, y: 15, type: 'event', endingId: 10 },
  { map: 'overworld', x: 44, y: 14, type: 'event', endingId: 11 },
  { map: 'overworld', x: 5, y: 22, type: 'event', endingId: 12 },
  { map: 'overworld', x: 14, y: 24, type: 'event', endingId: 13 },
  { map: 'overworld', x: 22, y: 20, type: 'event', endingId: 14 },
  { map: 'overworld', x: 30, y: 22, type: 'event', endingId: 15 },
  { map: 'overworld', x: 40, y: 20, type: 'event', endingId: 16 },
  { map: 'overworld', x: 24, y: 26, type: 'event', endingId: 18 },
  { map: 'overworld', x: 46, y: 27, type: 'event', endingId: 20 },
  { map: 'overworld', x: 34, y: 25, type: 'event', endingId: 19 }
];

// ===== 입력 핸들러 =====
function handleStartInput() {
  if (gameState === 'TITLE') startGame();
}

window.addEventListener('click', handleStartInput);
canvas.addEventListener('click', handleStartInput);
window.addEventListener('touchstart', handleStartInput);

const keys = { up: false, down: false, left: false, right: false };

window.addEventListener('keydown', (e) => {
  if (gameState === 'TITLE') { startGame(); return; }

  if (gameState === 'DIALOGUE' && (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter')) {
    closeDialogue();
    return;
  }

  // 방향키 상태는 게임 상태와 무관하게 항상 갱신한다.
  // (보스전 회피(DODGE) 턴에서 소울을 움직이려면 keys.up/down/left/right가 필요함)
  switch(e.code){
    case 'ArrowUp': case 'KeyW': keys.up = true; break;
    case 'ArrowDown': case 'KeyS': keys.down = true; break;
    case 'ArrowLeft': case 'KeyA': keys.left = true; break;
    case 'ArrowRight': case 'KeyD': keys.right = true; break;
  }

  if (gameState === 'BOSS') {
    handleBossInput(e.code);
    return;
  }

  if (e.code === 'KeyE') interact();
});

window.addEventListener('keyup', (e) => {
  switch(e.code){
    case 'ArrowUp': case 'KeyW': keys.up = false; break;
    case 'ArrowDown': case 'KeyS': keys.down = false; break;
    case 'ArrowLeft': case 'KeyA': keys.left = false; break;
    case 'ArrowRight': case 'KeyD': keys.right = false; break;
  }
});

// ===== 언더테일 스타일 보스전 =====
const boss = {
  hp: 150, maxHp: 150, playerHp: 20, maxPlayerHp: 20,
  displayHp: 150,
  turn: 'MENU',
  menuIndex: 0, timer: 0, bullets: [],
  soul: { x: 0, y: 0, speed: 5 },
  box: { ...UT.battleBox },
  dialogue: '',
  phase: 1,
  isDown: false,
  isTransitioning: false,
  attackBar: { x: 0, speed: 10, dir: 1, stopped: false, showSlash: 0, rating: '', ratingTimer: 0 },
  playerInvuln: 0,
  flashTimer: 0,
  hitImageTimer: 0,
  dodgeGrace: 0,
  attackName: '',
  attackTimer: 0,
  attackData: {},
  attackIndex: 0
};

// ===== 이펙트 시스템: 화면 흔들림 / 파티클 / 피격 플래시 =====
// 보스전을 포함해 어디서든 재사용할 수 있는 간단한 연출 유틸리티.
let screenShakeTime = 0;
let screenShakeIntensity = 0;
let particles = [];
let playerFlashTimer = 0; // 플레이어(소울)가 맞았을 때 화면 가장자리를 붉게 번쩍이는 타이머

function triggerShake(duration, intensity) {
  screenShakeTime = Math.max(screenShakeTime, duration);
  screenShakeIntensity = Math.max(screenShakeIntensity, intensity);
}

function spawnParticles(x, y, count, color, speedRange) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * speedRange;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      r: 2 + Math.random() * 3,
      color
    });
  }
}

function updateEffects() {
  if (screenShakeTime > 0) screenShakeTime--;
  if (playerFlashTimer > 0) playerFlashTimer--;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ===== 보스전 시작 시 초기화 =====
function startBossFight() {
  gameState = 'BOSS';
  boss.phase = 1;
  boss.isDown = false;
  boss.isTransitioning = false;
  boss.hp = 150;
  boss.maxHp = 150;
  boss.displayHp = 150;
  boss.playerHp = 20;
  boss.maxPlayerHp = 20;
  boss.turn = 'MENU';
  boss.menuIndex = 0;
  boss.playerInvuln = 0;
  boss.flashTimer = 0;
  boss.hitImageTimer = 0;
  boss.attackIndex = 0;
  boss.dialogue = '* 풋고추가 나타났다.';
  boss.soul.x = boss.box.x + boss.box.w / 2;
  boss.soul.y = boss.box.y + boss.box.h / 2;

  particles = [];
  triggerShake(20, 14);

  keys.up = keys.down = keys.left = keys.right = false;
  playSfx('jumpscare');
}

// ===== 보스전 입력 처리 =====
function handleBossInput(code) {
  if (boss.isTransitioning) return;

  // [1] 언더테일 게이지 타격 턴 처리
  if (boss.turn === 'ATTACK_BAR') {
    if (code === 'Space' || code === 'KeyE' || code === 'Enter') {
      if (boss.attackBar.stopped) return;
      boss.attackBar.stopped = true;
      playSfx('hit');

      // 타이밍에 따른 데미지 계산
      const barBoxW = boss.box.w - 60;
      const center = barBoxW / 2;
      const diff = Math.abs(boss.attackBar.x - center);
      const accuracy = 1 - diff / center; // 1에 가까울수록 정중앙
      const dmg = Math.max(10, Math.floor(accuracy * (boss.phase === 1 ? 40 : 50)));

      boss.hp -= dmg;
      boss.attackBar.showSlash = 25;
      boss.flashTimer = 8;
      boss.hitImageTimer = BOSS_HIT_IMAGE_DURATION;

      // 타격 판정 텍스트 (PERFECT / GREAT / OK) - 데미지 공식은 그대로 두고 연출만 추가
      if (accuracy >= 0.88) boss.attackBar.rating = '💥 PERFECT!';
      else if (accuracy >= 0.6) boss.attackBar.rating = '👍 GREAT!';
      else boss.attackBar.rating = 'OK...';
      boss.attackBar.ratingTimer = 40;

      // 타격 지점(공격 게이지 커서 위치)에 파티클을 흩뿌리고 데미지에 비례해 화면을 흔든다
      const hitScreenX = boss.box.x + 30 + boss.attackBar.x;
      spawnParticles(hitScreenX, boss.box.y + 70 + 60, 12 + Math.floor(dmg / 4), '#ffd166', 5);
      triggerShake(10, 4 + dmg / 8);

      if (boss.hp <= 0) {
        boss.hp = 0;
        if (boss.phase === 1) {
          boss.isDown = true;
          boss.dialogue = '* "젠장...."\n* [공격] 또는 [자비]를 선택하라.';
          boss.turn = 'MENU';
          triggerShake(18, 10);
          return;
        } else {
          boss.dialogue = '💥 "크아ㅏㅏ아ㅏ악!!"';
          playSfx('bossAttack');
          triggerShake(30, 16);
          spawnParticles(canvas.width / 2, canvas.height / 2, 40, '#ff5500', 8);
          setTimeout(() => {
            if (gameState !== 'BOSS') return; // 안전장치: 지연 실행 중 상태가 바뀌었다면 무시
            triggerEnding(24);
          }, 1200);
          return;
        }
      } else {
        boss.dialogue = `⚔️ 공격 성공! 풋고추에게 ${dmg}의 피해를 입혔다!`;
      }

      setTimeout(() => {
        if (gameState !== 'BOSS') return;
        startDodgePhase();
      }, 600);
    }
    return;
  }

  // [2] 메뉴 선택 턴 처리
  if (boss.turn === 'MENU') {
    if (code === 'ArrowLeft' || code === 'KeyA') {
      boss.menuIndex = (boss.menuIndex + 3) % 4;
      playSfx('move');
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      boss.menuIndex = (boss.menuIndex + 1) % 4;
      playSfx('move');
    }
    if (code === 'Space' || code === 'KeyE' || code === 'Enter') {
      playSfx('select');
      keys.up = keys.down = keys.left = keys.right = false;

      // 쓰러진 상태 처리
      if (boss.phase === 1 && boss.isDown) {
        if (boss.menuIndex === 0) { // 쓰러진 후 공격 -> 23번 엔딩
          playSfx('hit');
          boss.hitImageTimer = BOSS_HIT_IMAGE_DURATION;
          triggerEnding(23);
          return;
        } else if (boss.menuIndex === 3) { // 쓰러진 후 자비 -> 2차 각성
          stopBgm();
          boss.dialogue = '* "멍청한 놈......"\n* 뭔가 끔찍한 기운이 느껴진다...';
          boss.isTransitioning = true;
          playBgm('flowey');
          triggerShake(45, 8);

          setTimeout(() => {
            if (gameState !== 'BOSS') return; // 안전장치: 지연 실행 중 상태가 바뀌었다면 무시
            boss.phase = 2;
            boss.isDown = false;
            boss.isTransitioning = false;
            boss.hp = 250;
            boss.maxHp = 250;
            boss.displayHp = 250;
            boss.dialogue = '* [2차 각성] 진정한 풋고추가 깨어났다.\n* 네 최악의 악몽이 시작된다.';
            boss.turn = 'MENU';
            triggerShake(30, 18);
            spawnParticles(canvas.width / 2, canvas.height / 2, 50, '#ff3300', 9);
          }, 3000);
          return;
        } else {
          boss.dialogue = '* 보스는 쓰러진 채 "젠장...."이라 중얼거린다.\n* [공격] 또는 [자비]를 선택하라.';
          return;
        }
      }

      // 일반 메뉴 선택
      if (boss.menuIndex === 0) { // 공격 선택 시 게이지바 시작
        boss.turn = 'ATTACK_BAR';
        boss.attackBar = {
          x: 0,
          speed: boss.phase === 1 ? 11 : 15,
          dir: 1,
          stopped: false,
          showSlash: 0,
          rating: '',
          ratingTimer: 0
        };
        boss.dialogue = boss.phase === 1
          ? '* 타이밍에 맞춰 [스페이스/엔터/E]로 공격하라.'
          : '* 풋고추를 피하며 [스페이스/엔터/E]로 공격하라!';
        return;
      } else if (boss.menuIndex === 1) { // 대화
        boss.dialogue = boss.phase === 1
          ? '* "heh. 압도적인 풋고추의 기운이지."\n* 숨이 턱 막히지 않나?'
          : '* "더 이상 대화는 없다."\n* 네 최악의 악몽이 거부한다.';
      } else if (boss.menuIndex === 2) { // 아이템
        boss.playerHp = Math.min(boss.maxPlayerHp, boss.playerHp + 10);
        boss.dialogue = '* 스파게티를 먹었다.\n* HP가 10 회복되었다.';
        spawnParticles(canvas.width / 2, 208, 14, '#7dff8c', 3);
      } else if (boss.menuIndex === 3) { // 자비
        boss.dialogue = boss.phase === 1
          ? '* "자비? 재미없는데."\n* 풋고추는 물러서지 않는다.'
          : '* "자비? 이미 늦었어."\n* 꽃잎이 더 거세게 흩날린다.';
      }

      // 회피 턴 진입
      startDodgePhase();
    }
  }
}

function updateBossFight() {
  updateEffects();

  // 보스 HP 바를 실제 hp 값으로 서서히 보간 (스냅되지 않고 부드럽게 줄어드는 연출)
  boss.displayHp += (boss.hp - boss.displayHp) * 0.15;
  if (Math.abs(boss.displayHp - boss.hp) < 0.5) boss.displayHp = boss.hp;

  if (boss.flashTimer > 0) boss.flashTimer--;
  if (boss.hitImageTimer > 0) boss.hitImageTimer--;
  if (boss.playerInvuln > 0) boss.playerInvuln--;
  if (boss.dodgeGrace > 0) boss.dodgeGrace--;
  if (boss.attackBar.ratingTimer > 0) boss.attackBar.ratingTimer--;

  if (boss.turn === 'ATTACK_BAR') {
    if (!boss.attackBar.stopped) {
      boss.attackBar.x += boss.attackBar.speed * boss.attackBar.dir;
      if (boss.attackBar.x >= boss.box.w - 60) {
        boss.attackBar.x = boss.box.w - 60;
        boss.attackBar.dir = -1;
      } else if (boss.attackBar.x <= 0) {
        boss.attackBar.x = 0;
        boss.attackBar.dir = 1;
      }
    }
    if (boss.attackBar.showSlash > 0) {
      boss.attackBar.showSlash--;
    }
  }

  if (boss.turn === 'DODGE') {
    boss.timer--;

    if (keys.up) boss.soul.y = Math.max(boss.box.y + 14, boss.soul.y - boss.soul.speed);
    if (keys.down) boss.soul.y = Math.min(boss.box.y + boss.box.h - 14, boss.soul.y + boss.soul.speed);
    if (keys.left) boss.soul.x = Math.max(boss.box.x + 14, boss.soul.x - boss.soul.speed);
    if (keys.right) boss.soul.x = Math.min(boss.box.x + boss.box.w - 14, boss.soul.x + boss.soul.speed);

    if (boss.phase === 1) updateSansAttack();
    else updateFloweyAttack();

    for (let i = boss.bullets.length - 1; i >= 0; i--) {
      let b = boss.bullets[i];
      if (b.grace > 0) b.grace--;
      if (b.lifetime !== undefined) {
        b.lifetime--;
        if (b.lifetime <= 0) { boss.bullets.splice(i, 1); continue; }
      } else {
        b.x += b.vx || 0;
        b.y += b.vy || 0;
      }

      if (b.type === 'blaster_warn') continue;

      if (b.x > boss.box.x + boss.box.w + 400 || b.x + (b.w || 0) < boss.box.x - 400 ||
          b.y > boss.box.y + boss.box.h + 400 || b.y + (b.h || 0) < boss.box.y - 400) {
        if (b.type !== 'beam') { boss.bullets.splice(i, 1); continue; }
      }

      if (boss.dodgeGrace <= 0 && soulHitsObject(boss.soul, b) && boss.playerInvuln <= 0) {
        boss.playerHp -= boss.phase === 1 ? 2 : 3;
        playSfx('hit');
        if (b.type !== 'beam') boss.bullets.splice(i, 1);

        boss.playerInvuln = 50;
        playerFlashTimer = 12;
        triggerShake(12, 6);
        spawnParticles(boss.soul.x, boss.soul.y, 10, '#ff4d4d', 4);

        if (boss.playerHp <= 0) {
          triggerEnding(5);
          return;
        }
      }
    }

    if (boss.timer <= 0) {
      boss.turn = 'MENU';
      boss.bullets = [];
      boss.dialogue = boss.phase === 1
        ? '* "풋고추는 재미없어 보인다."'
        : '* 풋고추는 아우라 파밍을 하고있다.';
    }
  }
}

function drawBossFight() {
  ctx.save();

  // 화면 흔들림: 랜덤 오프셋을 살짝 주고 끝나면 원위치로 복구(ctx.restore)
  if (screenShakeTime > 0) {
    const dx = (Math.random() - 0.5) * screenShakeIntensity;
    const dy = (Math.random() - 0.5) * screenShakeIntensity;
    ctx.translate(dx, dy);
  }

  // 배경: 1차=샌즈(검은 화면), 2차=플라워 각성(붉은 글리치)
  if (boss.phase === 2) {
    ctx.fillStyle = '#0a0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const glitchAlpha = 0.08 + Math.sin(frame * 0.2) * 0.04;
    ctx.fillStyle = `rgba(255, 0, 0, ${glitchAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (frame % 47 < 2) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.06)';
      ctx.fillRect((frame * 37) % canvas.width, 0, 120, canvas.height);
    }
  } else {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const bossFont = boss.phase === 1
    ? '"Comic Sans MS", "Comic Sans", cursive'
    : 'Georgia, "Times New Roman", serif';
  const accentColor = boss.phase === 2 ? '#ff3300' : '#0099ff';
  const hpColor = boss.phase === 2 ? '#ff0055' : '#ffff00';

  ctx.fillStyle = accentColor;
  ctx.font = boss.phase === 1 ? 'bold 36px "Comic Sans MS", "Comic Sans", cursive' : 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  const bossTitle = boss.phase === 2
    ? 'THE 풋고추 [2차 각성]'
    : (boss.isDown ? '풋고추 [무력화]' : '풋고추');
  ctx.fillText(bossTitle, canvas.width / 2 - 120, 100);
  if (boss.phase === 1) {
    ctx.font = '18px "Comic Sans MS", "Comic Sans", cursive';
    ctx.fillStyle = '#888';
    ctx.fillText('* sans. | 1 ATK  1 DEF', canvas.width / 2 - 120, 125);
  } else {
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#aa0000';
    ctx.fillText('* your best nightmare', canvas.width / 2 - 120, 125);
  }

  drawBossSprite();

  // 보스 HP 바 (언더테일 스타일)
  const barX = 80, barY = 150, barW = 360, barH = 22;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(barX, barY, (boss.displayHp / boss.maxHp) * barW, barH);
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX, barY, (boss.hp / boss.maxHp) * barW, barH);
  if (boss.flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${(boss.flashTimer / 8).toFixed(2)})`;
    ctx.fillRect(barX, barY, barW, barH);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('풋고추', barX, barY - 8);

  // 플레이어 HP (언더테일 LV/HP 스타일)
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`오승  LV 1`, 80, 210);
  ctx.fillStyle = '#ff0000';
  ctx.fillText(`HP ${Math.max(0, boss.playerHp)} / ${boss.maxPlayerHp}`, 80, 235);

  const pBarX = 80, pBarY = 242, pBarW = 200, pBarH = 12;
  ctx.fillStyle = '#333';
  ctx.fillRect(pBarX, pBarY, pBarW, pBarH);
  ctx.fillStyle = (boss.playerInvuln > 0 && frame % 6 < 3) ? '#ffaaaa' : '#ff0000';
  ctx.fillRect(pBarX, pBarY, Math.max(0, boss.playerHp / boss.maxPlayerHp) * pBarW, pBarH);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(pBarX, pBarY, pBarW, pBarH);

  // 대화창
  ctx.fillStyle = '#000';
  ctx.strokeStyle = boss.phase === 2 ? '#ff4d4d' : '#fff';
  ctx.lineWidth = 3;
  ctx.fillRect(boss.box.x, 260, boss.box.w, 180);
  ctx.strokeRect(boss.box.x, 260, boss.box.w, 180);

  ctx.fillStyle = '#fff';
  ctx.font = `20px ${bossFont}`;
  ctx.textAlign = 'left';
  const dialogueLines = boss.dialogue.split('\n');
  dialogueLines.forEach((line, i) => {
    ctx.fillText(line, boss.box.x + 20, 300 + i * 28);
  });

  ctx.strokeStyle = boss.phase === 2 ? '#ff3300' : '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(boss.box.x, boss.box.y, boss.box.w, boss.box.h);

  if (boss.turn === 'ATTACK_BAR') {
    const barBoxX = boss.box.x + 30;
    const barBoxY = boss.box.y + 70;
    const barBoxW = boss.box.w - 60;
    const barBoxH = 120;

    ctx.fillStyle = '#000000';
    ctx.fillRect(barBoxX, barBoxY, barBoxW, barBoxH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(barBoxX, barBoxY, barBoxW, barBoxH);

    const centerX = barBoxX + barBoxW / 2;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.fillRect(centerX - 35, barBoxY, 70, barBoxH);
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(centerX - 8, barBoxY, 16, barBoxH);

    const curX = barBoxX + boss.attackBar.x;
    ctx.fillStyle = boss.attackBar.stopped ? '#00ff66' : '#ffffff';
    ctx.fillRect(curX - 5, barBoxY - 8, 10, barBoxH + 16);

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('중앙(주황색) 표적에 맞춰 [스페이스 / 엔터 / E] 키 누르기!', boss.box.x + boss.box.w / 2, boss.box.y + boss.box.h - 35);

    if (boss.attackBar.showSlash > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      const progress = 1 - (boss.attackBar.showSlash / 25);
      const startX = canvas.width / 2 - 140 + progress * 280;
      ctx.moveTo(startX - 50, 80);
      ctx.lineTo(startX + 50, 180);
      ctx.stroke();
    }

    // 타격 판정(PERFECT/GREAT/OK) 텍스트를 잠깐 띄웠다가 서서히 사라지게
    if (boss.attackBar.ratingTimer > 0) {
      ctx.globalAlpha = Math.min(1, boss.attackBar.ratingTimer / 15);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.attackBar.rating, boss.box.x + boss.box.w / 2, boss.box.y - 20);
      ctx.globalAlpha = 1;
    }
  } else if (boss.turn === 'DODGE') {
    // 무적 시간 동안에는 소울이 깜빡이도록 해서 "지금은 안전하다"는 걸 알려준다
    const soulVisible = boss.playerInvuln <= 0 || frame % 6 < 4;
    if (soulVisible) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(boss.soul.x, boss.soul.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let b of boss.bullets) {
      drawBossObject(b);
    }
  } else {
    const menuItems = ['공격', '대화', '아이템', '자비'];
    ctx.textAlign = 'center';
    for (let i = 0; i < menuItems.length; i++) {
      const selected = boss.menuIndex === i;
      ctx.fillStyle = selected ? '#ffff00' : '#ffffff';
      ctx.font = selected
        ? `bold 28px ${bossFont}`
        : `24px ${bossFont}`;
      const label = selected ? `* ${menuItems[i]}` : menuItems[i];
      ctx.fillText(label, boss.box.x + 75 + i * 150, boss.box.y + 190);
    }
  }

  drawParticles();
  ctx.restore();

  // 플레이어가 맞았을 때 화면 가장자리가 붉게 번쩍이는 비네트 효과
  if (playerFlashTimer > 0) {
    const alpha = (playerFlashTimer / 12) * 0.45;
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height / 3,
      canvas.width / 2, canvas.height / 2, canvas.height
    );
    grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
    grad.addColorStop(1, `rgba(255, 0, 0, ${alpha.toFixed(2)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ===== 이동 및 이벤트 =====
function move(dx, dy) {
  if (gameState !== 'PLAYING') return;

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (dx > 0) player.dir = 'right';
  if (dx < 0) player.dir = 'left';
  if (dy > 0) player.dir = 'down';
  if (dy < 0) player.dir = 'up';

  if (isWalkable(nextX, nextY)) {
    player.x = nextX;
    player.y = nextY;
    playSfx('move');
    checkTileEvents();
  }
}

function checkTileEvents() {
  const curMap = getActiveMap();
  const currentTile = curMap[player.y][player.x];

  if (currentMap === 'cave' && player.y >= 11 && player.x >= 8 && player.x <= 22) {
    if (checkAllPreEndings()) {
      startBossFight();
      return;
    } else {
      showNotice('🔒 거대한 풋고추의 기운으로 막혀있습니다... (1~21번 엔딩 모두 수집 필요)');
    }
  }

  if (currentMap === 'overworld' && currentTile === 5) {
    currentMap = 'cave';
    player.x = 2; player.y = 3;
    showNotice('🕳️ 동굴에 들어왔습니다! 움직이는 함정을 피하세요. + 상자를 상호작용 해 보시오');
    return;
  }

  if (currentMap === 'cave' && currentTile === 7) {
    currentMap = 'overworld';
    player.x = 46; player.y = 26;
    showNotice('🚪 동굴 탈출 성공! 바로 앞이 신전입니다.');
    return;
  }

  if (currentMap === 'overworld' && currentTile === 2) {
    if (player.inventory.includes('secret_key')) triggerEnding(22);
    else triggerEnding(21);
    return;
  }

  const eventObj = interactables.find(e => e.map === currentMap && e.x === player.x && e.y === player.y && e.type === 'event');
  if (eventObj) triggerEnding(eventObj.endingId);
}

function updateTraps() {
  if (currentMap !== 'cave' || gameState !== 'PLAYING') return;

  for (const trap of caveTraps) {
    if (trap.dirY) {
      trap.y += trap.dirY;
      if (trap.y >= trap.maxY || trap.y <= trap.minY) trap.dirY *= -1;
    } else if (trap.dirX) {
      trap.x += trap.dirX;
      if (trap.x >= trap.maxX || trap.x <= trap.minX) trap.dirX *= -1;
    }

    if (trap.x === player.x && trap.y === player.y) {
      triggerEnding(5);
      break;
    }
  }
}

function updatePepperExplosion() {
  if (gameState !== 'PLAYING' || currentMap !== 'overworld') return;

  const currentFrameInCycle = frame % pepperExplosion.cycleFrames;
  
  if (currentFrameInCycle >= pepperExplosion.warningFrames) {
    const minX = pepperExplosion.centerX - pepperExplosion.radius;
    const maxX = pepperExplosion.centerX + pepperExplosion.radius;
    const minY = pepperExplosion.centerY - pepperExplosion.radius;
    const maxY = pepperExplosion.centerY + pepperExplosion.radius;

    if (player.x >= minX && player.x <= maxX && player.y >= minY && player.y <= maxY) {
      triggerEnding(8);
    }
  }
}

function updateChasers() {
  if (gameState !== 'PLAYING' || currentMap !== 'overworld') return;

  for (const chaser of chasers) {
    if (frame % chaser.interval !== 0) continue;

    const dist = Math.abs(player.x - chaser.x) + Math.abs(player.y - chaser.y);

    if (dist <= chaser.range) {
      let nextX = chaser.x;
      let nextY = chaser.y;

      if (player.x > chaser.x && isWalkable(chaser.x + 1, chaser.y)) nextX++;
      else if (player.x < chaser.x && isWalkable(chaser.x - 1, chaser.y)) nextX--;
      else if (player.y > chaser.y && isWalkable(chaser.x, chaser.y + 1)) nextY++;
      else if (player.y < chaser.y && isWalkable(chaser.x, chaser.y - 1)) nextY--;

      chaser.x = nextX;
      chaser.y = nextY;

      if (chaser.x === player.x && chaser.y === player.y) {
        triggerEnding(chaser.endingId);
        break;
      }
    }
  }
}

function interact() {
  if (gameState !== 'PLAYING') return;

  let targetX = player.x;
  let targetY = player.y;
  if (player.dir === 'up') targetY--;
  if (player.dir === 'down') targetY++;
  if (player.dir === 'left') targetX--;
  if (player.dir === 'right') targetX++;

  const curMap = getActiveMap();
  
  if (currentMap === 'overworld' && curMap[targetY] && curMap[targetY][targetX] === 2) {
    if (player.inventory.includes('secret_key')) triggerEnding(22);
    else triggerEnding(21);
    return;
  }

  const item = interactables.find(obj => 
    obj.map === currentMap && 
    ((obj.x === player.x && obj.y === player.y) || (obj.x === targetX && obj.y === targetY))
  );

  if (item) {
    playSfx('select');
    if (item.action) item.action();

    if (item.endingId) triggerEnding(item.endingId);
    else if (item.type === 'sign' || item.text) showNotice(item.text);
  }
}

function closeDialogue() {
  gameState = 'PLAYING';
  currentDialogue = null;
}

function triggerEnding(id) {
  if (id === 7) {
    jumpscareTimer = 60;
    playSfx('jumpscare');
    triggerShake(15, 10);
  } else {
    playSfx('hit');
  }

  gameState = 'ENDING';
  saveEnding(id);

  const titleEl = document.getElementById('endingTitle');
  const textEl = document.getElementById('endingText');
  const overlayEl = document.getElementById('overlay');

  if (titleEl) titleEl.textContent = `${id}번 엔딩 - ${endings[id].name}`;
  if (textEl) textEl.textContent = endings[id].desc;
  if (overlayEl) overlayEl.classList.remove('hidden');
}

function getCameraOffset() {
  const { w, h } = getMapBounds();

  let camX = player.x - Math.floor(VIEW_W / 2);
  let camY = player.y - Math.floor(VIEW_H / 2);

  camX = Math.max(0, Math.min(w - VIEW_W, camX));
  camY = Math.max(0, Math.min(h - VIEW_H, camY));

  return { camX, camY };
}

// ===== 화면 그리기 함수 =====
function drawTitleScreen() {
  if (images.start && images.start.complete && images.start.naturalWidth !== 0) {
    ctx.drawImage(images.start, 0, 0, canvas.width, canvas.height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a0003');
    grad.addColorStop(0.5, '#400008');
    grad.addColorStop(1, '#0f2027');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌶️ 오승과 전설의 풋고추 🌶️', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#ffd166';
    ctx.font = '24px sans-serif';
    ctx.fillText('24가지 다채로운 엔딩을 찾아 모험을 떠나세요!', canvas.width / 2, canvas.height / 2 + 20);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  ctx.fillStyle = blink ? '#ffd166' : '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👉 화면을 클릭하거나 아무 키나 눌러 시작 👈', canvas.width / 2, canvas.height - 50);

  ctx.textAlign = 'left';
}

function drawTile(x, y, id, camX, camY) {
  const drawX = (x - camX) * TILE;
  const drawY = (y - camY) * TILE;

  if (id === 0) drawSafeImage(images.grass, drawX, drawY, TILE, TILE, currentMap === 'cave' ? '#222' : '#40916c');
  else if (id === 1) drawSafeImage(images.wall, drawX, drawY, TILE, TILE, currentMap === 'cave' ? '#111' : '#2d6a4f');
  else if (id === 2) drawSafeImage(images.shrine, drawX, drawY, TILE, TILE, '#f4d35e');
  else if (id === 3) drawSafeImage(images.water, drawX, drawY, TILE, TILE, '#48cae4');
  else if (id === 4) drawSafeImage(images.sign, drawX, drawY, TILE, TILE, '#8d5524');
  else if (id === 5) drawSafeImage(images.cave, drawX, drawY, TILE, TILE, '#3a0ca3');
  else if (id === 7) drawSafeImage(images.cave, drawX, drawY, TILE, TILE, '#4cc9f0');
}

function drawPepperExplosion(camX, camY) {
  if (currentMap !== 'overworld') return;

  const minX = pepperExplosion.centerX - pepperExplosion.radius;
  const maxX = pepperExplosion.centerX + pepperExplosion.radius;
  const minY = pepperExplosion.centerY - pepperExplosion.radius;
  const maxY = pepperExplosion.centerY + pepperExplosion.radius;

  const currentFrameInCycle = frame % pepperExplosion.cycleFrames;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (x >= camX && x < camX + VIEW_W && y >= camY && y < camY + VIEW_H) {
        const drawX = (x - camX) * TILE;
        const drawY = (y - camY) * TILE;

        if (currentFrameInCycle < pepperExplosion.warningFrames) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
          ctx.fillRect(drawX, drawY, TILE, TILE);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, drawY, TILE, TILE);
        } else {
          ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
          ctx.fillRect(drawX, drawY, TILE, TILE);
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💥', drawX + TILE / 2, drawY + TILE / 2 + 12);
        }
      }
    }
  }
}

function drawMinimap() {
  const miniW = 200;
  const miniH = 120;
  const miniX = canvas.width - miniW - 16;
  const miniY = 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.fillRect(miniX, miniY, miniW, miniH);
  ctx.strokeRect(miniX, miniY, miniW, miniH);

  const { w, h } = getMapBounds();
  const curMap = getActiveMap();

  const scaleX = miniW / w;
  const scaleY = miniH / h;

  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const tile = curMap[y][x];
      if (tile === 1) ctx.fillStyle = '#2d6a4f';
      else if (tile === 2) ctx.fillStyle = '#f4d35e';
      else if (tile === 5) ctx.fillStyle = '#7209b7';
      else ctx.fillStyle = '#1b4332';

      ctx.fillRect(miniX + x * scaleX, miniY + y * scaleY, scaleX * 2, scaleY * 2);
    }
  }

  if (currentMap === 'cave') {
    ctx.fillStyle = '#ff2a2a';
    for (const t of caveTraps) ctx.fillRect(miniX + t.x * scaleX, miniY + t.y * scaleY, 5, 5);
  } else if (currentMap === 'overworld') {
    ctx.fillStyle = '#ff4d4d';
    for (const c of chasers) ctx.fillRect(miniX + c.x * scaleX, miniY + c.y * scaleY, 6, 6);
  }

  ctx.fillStyle = '#00b4d8';
  ctx.fillRect(miniX + player.x * scaleX - 2, miniY + player.y * scaleY - 2, 7, 7);
}

function drawUI() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width - 230, 56);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  const keyInfo = player.inventory.includes('secret_key') ? '🔑 비밀의 열쇠 보유' : '🔑 열쇠 없음';
  const mapInfo = currentMap === 'cave' ? '🗺️ 동굴 내부' : '🗺️ 필드';
  ctx.fillText(`.............................| ${mapInfo} | ${keyInfo}`, 20, 36);

  if (statusNotice) {
    ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.fillRect(20, 66, canvas.width - 270, 48);
    ctx.strokeRect(20, 66, canvas.width - 270, 48);

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(statusNotice, 35, 96);
  }

  drawMinimap();
}

function updateJumpscare() {
  if (jumpscareTimer > 0) jumpscareTimer--;
}

function drawJumpscare() {
  if (jumpscareTimer > 0) {
    if (jumpscareImg.complete && jumpscareImg.naturalWidth !== 0) {
      ctx.drawImage(jumpscareImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = jumpscareTimer % 4 < 2 ? '#ff0000' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 140px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😱 🦉 😱', canvas.width / 2, canvas.height / 2);
    }
  }
}

function updateBgmManager() {
  if (gameState === 'TITLE' || gameState === 'ENDING') {
    stopBgm();
  } else if (gameState === 'BOSS') {
    if (boss.phase === 2) {
      playBgm('flowey');
    } else if (!boss.isTransitioning) {
      playBgm('sans');
    }
  } else if (gameState === 'PLAYING') {
    if (currentMap === 'overworld') playBgm('overworld');
    else if (currentMap === 'cave') playBgm('cave');
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateBgmManager();

  if (gameState === 'TITLE') { drawTitleScreen(); return; }
  if (gameState === 'BOSS') { drawBossFight(); return; }

  const { camX, camY } = getCameraOffset();
  const { w, h } = getMapBounds();
  const curMap = getActiveMap();

  for (let y = camY; y < camY + VIEW_H && y < h; y++) {
    for (let x = camX; x < camX + VIEW_W && x < w; x++) {
      drawTile(x, y, curMap[y][x], camX, camY);
    }
  }

  drawPepperExplosion(camX, camY);

  for (const item of interactables) {
    if (item.map === currentMap && item.x >= camX && item.x < camX + VIEW_W && item.y >= camY && item.y < camY + VIEW_H) {
      const drawX = (item.x - camX) * TILE;
      const drawY = (item.y - camY) * TILE;

      if (item.type === 'event') {
        const customImg = eventImages[item.endingId];
        drawSafeImage(customImg, drawX, drawY, TILE, TILE, '#e63946');
      } else if (item.type === 'chest') {
        drawSafeImage(images.chest, drawX, drawY, TILE, TILE, '#ffb703');
      }
    }
  }

  if (currentMap === 'cave') {
    for (const trap of caveTraps) {
      if (trap.x >= camX && trap.x < camX + VIEW_W && trap.y >= camY && trap.y < camY + VIEW_H) {
        const drawX = (trap.x - camX) * TILE;
        const drawY = (trap.y - camY) * TILE;
        drawSafeImage(images.trap, drawX, drawY, TILE, TILE, '#d90429');
      }
    }
  }

  if (currentMap === 'overworld') {
    for (const c of chasers) {
      if (c.x >= camX && c.x < camX + VIEW_W && c.y >= camY && c.y < camY + VIEW_H) {
        const drawX = (c.x - camX) * TILE;
        const drawY = (c.y - camY) * TILE;
        const customImg = eventImages[c.endingId];
        drawSafeImage(customImg, drawX, drawY, TILE, TILE, '#d90429');
      }
    }
  }

  const playerDrawX = (player.x - camX) * TILE;
  const playerDrawY = (player.y - camY) * TILE;
  drawSafeImage(images.player, playerDrawX, playerDrawY, TILE, TILE, '#4ea8ff');

  drawUI();
  drawJumpscare();
}

let frame = 0;

function updateGameLogic() {
  frame++;

  if (gameState === 'PLAYING' && frame % 8 === 0) {
    if (keys.up) move(0, -1);
    else if (keys.down) move(0, 1);
    else if (keys.left) move(-1, 0);
    else if (keys.right) move(1, 0);
  }

  if (gameState === 'PLAYING' && frame % 24 === 0) updateTraps();
  if (gameState === 'PLAYING') updateChasers();
  if (gameState === 'PLAYING') updatePepperExplosion();
  if (gameState === 'BOSS') updateBossFight();
  if (gameState !== 'TITLE' && gameState !== 'BOSS') updateJumpscare();
}

// ===== 고정 타임스텝 메인 루프 =====
// 기존에는 requestAnimationFrame이 호출되는 속도(모니터 주사율)에 게임 로직 속도가
// 그대로 종속되어 있었다. 즉 60Hz 모니터와 120/144Hz 모니터에서 이동 속도, 추격자
// 속도, 보스 총알 속도와 판정 타이밍이 실제로 달라지는 문제가 있었음.
// 아래처럼 누적된 시간(delta)만큼 고정된 간격(1000/60ms)으로 로직을 갱신하고,
// 화면을 그리는 건 매 requestAnimationFrame마다 한 번만 수행하도록 분리했다.
const LOGIC_STEP_MS = 1000 / 60;
let logicAccumulator = 0;
let lastTimestamp = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  if (!lastTimestamp) lastTimestamp = timestamp;
  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // 탭이 백그라운드에 있다가 돌아오는 등 delta가 비정상적으로 커지면
  // 로직이 한꺼번에 몰아서 실행되는 "스파이럴 오브 데스"를 방지
  if (delta > 250) delta = 250;

  logicAccumulator += delta;
  while (logicAccumulator >= LOGIC_STEP_MS) {
    updateGameLogic();
    logicAccumulator -= LOGIC_STEP_MS;
  }

  draw();
}

// ===== 모바일 대응: 캔버스 리사이징 및 터치 입력 =====
function resizeCanvas() {
  const gameRatio = 1440 / 960;
  const windowRatio = window.innerWidth / window.innerHeight;
  
  let cssWidth, cssHeight;
  if (windowRatio > gameRatio) {
    cssHeight = window.innerHeight;
    cssWidth = cssHeight * gameRatio;
  } else {
    cssWidth = window.innerWidth;
    cssHeight = cssWidth / gameRatio;
  }
  
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (isTouchDevice) {
  const touchControls = document.getElementById('touchControls');
  if (touchControls) touchControls.classList.remove('hidden');
}

const setupTouchButton = (btnId, keyName, altCode) => {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  const press = (e) => {
    if (e.cancelable) e.preventDefault();
    keys[keyName] = true;
    if (gameState === 'TITLE') startGame();
    if (gameState === 'BOSS' && altCode) {
      handleBossInput(altCode);
    }
  };
  
  const release = (e) => {
    if (e.cancelable) e.preventDefault();
    keys[keyName] = false;
  };
  
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('touchcancel', release, { passive: false });
};

setupTouchButton('btnUp', 'up');
setupTouchButton('btnDown', 'down');
setupTouchButton('btnLeft', 'left', 'ArrowLeft');
setupTouchButton('btnRight', 'right', 'ArrowRight');

const btnInteract = document.getElementById('btnInteract');
if (btnInteract) {
  btnInteract.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    if (gameState === 'TITLE') startGame();
    else if (gameState === 'DIALOGUE') closeDialogue();
    else if (gameState === 'PLAYING') interact();
  }, { passive: false });
}

const btnAttack = document.getElementById('btnAttack');
if (btnAttack) {
  btnAttack.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    if (gameState === 'TITLE') startGame();
    else if (gameState === 'DIALOGUE') closeDialogue();
    else if (gameState === 'BOSS') handleBossInput('Space');
  }, { passive: false });
}

requestAnimationFrame(loop);
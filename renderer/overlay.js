// 냥멍마실 (NyangMeongStroll) — 동물 행동/렌더링
(() => {
  const API = window.catAPI || { // 브라우저에서 단독 테스트할 때용
    getState: async () => ({ settings: { cats: [{ id: 'a', breed: 'tabby', name: '고등어' }, { id: 'b', breed: 'black', name: '까망이' }], size: 90, region: null, sound: false, activity: 1 }, display: { width: innerWidth, height: innerHeight, workArea: { x: 0, y: 0, w: innerWidth, h: innerHeight } } }),
    setIgnore() {}, endSelectRegion() {}, onSettings() {}, onBeginSelect() {}, onSummon() {}
  };
  const { drawCat, drawSnack, drawBowl, drawTree, drawToy, frameSize, hasRole, voice } = window.CatArt;

  // 동물 종류별 말투
  const LINES = {
    cat: {
      hello: ['냥!', '야옹~', '왔다옹'], talk: ['야옹~', '냐옹', '미야옹!', '냥냥', '먀아~', '냐아앙'], wake: ['냥..?'],
      feed: ['밥이다냥!', '와앙!', '맛있겠다옹'], play: ['놀자냥!', '잡았다옹!', '냥냥펀치!'], pet: ['골골골~', '냐앙♡', '좋다옹'],
      morning: ['하암~ 기지개', '잘 잤다옹'], perch: ['높다냥!', '내가 왕이다옹', '야옹~'], full: ['맛있다옹~', '배부르다냥', '냠냠♡'],
      done: ['재밌었다옹!', '또 놀자냥', '헥헥..'], held: ['냐앗?!', '으냥!', '놔줘냥~'], zoom: ['우다다다!'], ball: ['공이다냥!', '데굴데굴~', '냥냥 톡!']
    },
    dog: {
      hello: ['멍!', '왔어요 멍', '왈!'], talk: ['멍멍!', '왈왈!', '멍~', '낑낑', '아우~'], wake: ['멍..?'],
      feed: ['밥이다멍!', '와앙!', '꼬리 살랑살랑'], play: ['놀자멍!', '잡았다!', '왈왈!'], pet: ['헥헥♡', '좋아멍', '꼬리 살랑~'],
      morning: ['하암~', '잘 잤다멍'], perch: ['멍!'], full: ['맛있다멍~', '배부르다멍', '냠냠♡'],
      done: ['재밌었다멍!', '또 놀자멍', '헥헥..'], held: ['멍?!', '낑!', '높다멍~'], zoom: ['우다다다!', '신난다멍!'], ball: ['공이다멍!', '공 좋아멍!', '내 공이야!']
    },
    other: {
      hello: ['안녕!', '♪'], talk: ['♪', '~♪', '헤헤', '!'], wake: ['..?'],
      feed: ['밥이다!', '와앙!'], play: ['놀자!', '잡아라!'], pet: ['좋아♡', '헤헤'],
      morning: ['하암~'], perch: ['♪'], full: ['맛있다~', '냠냠♡'],
      done: ['재밌었다!', '또 놀자'], held: ['앗?!', '으앗!'], zoom: ['신난다!'], ball: ['공이다!', '데굴데굴~']
    }
  };
  const LINES_EN = {
    cat: {
      hello: ['Meow!', "I'm here~", 'Mew!'], talk: ['Meow~', 'Mew!', 'Mrrow!', 'Nya~', 'Meeow'], wake: ['Mew..?'],
      feed: ['Food!!', 'Nom!', 'Yummy~'], play: ["Let's play!", 'Gotcha!', 'Paw punch!'], pet: ['Purr~', 'Mrrr♡', 'Nice~'],
      morning: ['Yawn~ stretch', 'Good nap~'], perch: ['So high!', "I'm the king~", 'Meow~'], full: ['Yummy~', "I'm full", 'Nom nom♡'],
      done: ['That was fun!', 'Play again?', 'Huff huff..'], held: ['Mew?!', 'Eek!', 'Put me down~'], zoom: ['Zoomies!'], ball: ['A ball!', 'Roll roll~', 'Boop!']
    },
    dog: {
      hello: ['Woof!', "I'm here!", 'Arf!'], talk: ['Woof woof!', 'Arf arf!', 'Wuff~', 'Whine..', 'Awoo~'], wake: ['Woof..?'],
      feed: ['Food!!', 'Nom!', '*tail wag*'], play: ["Let's play!", 'Got it!', 'Arf arf!'], pet: ['Pant pant♡', 'Good boy?', '*wag wag*'],
      morning: ['Yawn~', 'Good nap!'], perch: ['Woof!'], full: ['Yummy~', "I'm full", 'Nom nom♡'],
      done: ['So fun!', 'Again again!', 'Pant pant..'], held: ['Woof?!', 'Yip!', 'So high~'], zoom: ['Zoomies!', 'Wheee!'], ball: ['Ball!!', 'My ball!', 'Fetch!']
    },
    other: {
      hello: ['Hi!', '♪'], talk: ['♪', '~♪', 'Hehe', '!'], wake: ['..?'],
      feed: ['Food!', 'Nom!'], play: ["Let's play!", 'Catch me!'], pet: ['Nice♡', 'Hehe'],
      morning: ['Yawn~'], perch: ['♪'], full: ['Yummy~', 'Nom nom♡'],
      done: ['Fun!', 'Again!'], held: ['Eek?!', 'Whoa!'], zoom: ['Wheee!'], ball: ['A ball!', 'Roll~']
    }
  };
  const line = (c, key) => {
    const T = I18N.lang === 'en' ? LINES_EN : LINES;
    return pick((T[voice(c.breed)] || T.other)[key] || ['♪']);
  };

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const menu = document.getElementById('menu');
  const menuName = document.getElementById('menuName');

  let S = null, D = null, R = { x: 0, y: 0, w: innerWidth, h: innerHeight };
  let cats = [];
  let props = [];
  let parts = [];
  const mouse = { x: -9999, y: -9999, inside: false, down: false, sx: 0, sy: 0, moved: 0 };
  let menuOver = false; // 마우스가 메뉴 위에 있음
  let capturing = false;
  let hoverCat = null, menuCat = null, menuHideAt = 0;
  let dragCat = null, pressCat = null;
  let selecting = false;
  let dpr = 1;
  let audioCtx = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => performance.now() / 1000;

  // ---------- 크기 / 범위 ----------
  function resize() {
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
  }
  addEventListener('resize', () => { resize(); computeRegion(); });

  function computeRegion() {
    const full = D ? D.workArea : { x: 0, y: 0, w: innerWidth, h: innerHeight };
    const r = (S && S.region) || full;
    R = { x: r.x, y: r.y, w: r.w, h: r.h };
    cats.forEach(c => { const p = clampPos(c, c.x, c.y); c.x = p.x; c.y = p.y; });
  }

  const size = () => (S ? S.size : 90);
  const act = () => (S ? S.activity || 1 : 1);

  function clampPos(c, x, y) {
    const s = size();
    const minX = R.x + s * 0.5, maxX = R.x + R.w - s * 0.5;
    const minY = R.y + s * 1.05, maxY = R.y + R.h - 4;
    return {
      x: minX > maxX ? R.x + R.w / 2 : clamp(x, minX, maxX),
      y: minY > maxY ? R.y + R.h - 4 : clamp(y, minY, maxY)
    };
  }
  function randomPoint(c) {
    return clampPos(c, rand(R.x, R.x + R.w), rand(R.y, R.y + R.h));
  }

  // ---------- 고양이 생성 ----------
  function makeCat(def, i) {
    const c = {
      id: def.id, breed: def.breed, name: def.name || '',
      x: 0, y: 0, z: 0, rot: 0, dir: Math.random() < 0.5 ? 1 : -1,
      state: 'idle', st: 0, dur: rand(1, 3), pose: 'sit',
      t: rand(0, 10), walkPhase: 0, moving: false,
      eyes: 'open', mouth: 'w', pawUp: 0, pawTarget: null, headDY: 0, headTilt: 0,
      look: { x: 0, y: 0 }, lookT: 0, blink: 0, nextBlink: rand(1, 4), earFlick: 0,
      bubble: null, petT: 0, pending: null, tree: null, snack: null, bowl: null,
      lastAction: '', partT: 0, speedMul: 1,
      gait: 'walk', pauseT: 0, pauseLeft: 0
    };
    const p = randomPoint(c); c.x = p.x; c.y = p.y;
    return c;
  }

  function syncCats() {
    const old = new Map(cats.map(c => [c.id, c]));
    cats = (S.cats || []).map((def, i) => {
      const c = old.get(def.id);
      if (c) { c.breed = def.breed; c.name = def.name || ''; return c; }
      const n = makeCat(def, i);
      say(n, line(n, 'hello'), 1.6);
      return n;
    });
    props = props.filter(p => cats.some(c => c === p.owner));
  }

  // ---------- 소리 ----------
  // 소리: 설정에서 고른 고양이/강아지 소리 (sounds.js)
  function voiceSound(c, pitch) {
    if (!S || !S.sound || !window.PetSounds) return;
    const v = voice(c.breed);
    const idx = v === 'cat' ? S.catSound : S.dogSound;
    PetSounds.play(v, idx ?? PetSounds.RANDOM, S.volume ?? 0.6, (pitch || 1) * rand(0.95, 1.05));
  }

  // ---------- 말풍선 / 파티클 ----------
  function say(c, text, dur) { c.bubble = { text, t: 0, dur: dur || 1.8 }; }

  function emit(type, x, y, n) {
    for (let i = 0; i < (n || 1); i++) {
      parts.push({
        type, x: x + rand(-6, 6), y: y + rand(-4, 4),
        vx: type === 'crumb' ? rand(-30, 30) : rand(-10, 10),
        vy: type === 'crumb' ? rand(-50, -20) : rand(-40, -24),
        life: 0, max: type === 'z' ? 2.2 : type === 'crumb' ? 0.7 : 1.4,
        s: rand(0.8, 1.2), rot: rand(-0.3, 0.3)
      });
    }
  }

  // ---------- 상태 전환 ----------
  function setState(c, state, dur) {
    c.state = state; c.st = 0; c.dur = dur || 2;
    c.moving = false; c.pawUp = 0; c.headDY = 0; c.headTilt = 0;
    c.z = 0; c.rot = 0; c.speedMul = 1; c.tilt = 0; c.squash = 0; c.runPose = null;
  }

  // ---------- 걸음걸이 ----------
  // speed: 빠르기, step: 발 구르는 속도, hop: 통통 뛰는 높이, squash: 몸 출렁임, lean: 앞으로 숙이기
  // 뛰거나 크게 튀는 동작 없이, 걷는 속도와 리듬만 조금씩 달라요
  const GAITS = {
    walk:   { speed: 1.0,  step: 1.0,  hop: 0.006, squash: 0.012, lean: 0 },     // 사뿐사뿐
    stroll: { speed: 0.75, step: 0.85, hop: 0.004, squash: 0.01,  lean: 0 },     // 느긋느긋
    trot:   { speed: 1.2,  step: 1.2,  hop: 0.01,  squash: 0.015, lean: 0.008 }, // 종종종 (조금 빠른 걸음)
    sneak:  { speed: 0.6,  step: 0.75, hop: 0,     squash: -0.03, lean: 0.006 }  // 살금살금 (몸 살짝 낮게)
  };
  function pickGait(c) {
    const dog = voice(c.breed) === 'dog';
    const w = dog ? [['walk', 45], ['stroll', 25], ['trot', 25], ['sneak', 5]]
                  : [['walk', 40], ['stroll', 30], ['trot', 12], ['sneak', 18]];
    let r = Math.random() * w.reduce((t, x) => t + x[1], 0);
    for (const [k, v] of w) if ((r -= v) <= 0) return k;
    return 'walk';
  }
  // 이동 중 자세: 걷기 프레임을 번갈아 쓰고, 통통 뛸 때는 점프 프레임을 섞어요
  function movePose(c, g) {
    if (g.jumpPose && hasRole(c.breed, 'jump')) {
      const k = Math.sin(c.walkPhase * 0.5);
      return k > g.jumpPose ? 'jump' : 'walk';
    }
    return 'walk';
  }
  function moveBody(c, g, s) {
    const ph = c.walkPhase * 0.5;
    c.z = Math.abs(Math.sin(ph)) * s * g.hop;
    c.squash = g.squash < 0 ? -g.squash * 0.5 + Math.sin(ph * 2) * 0.01 : Math.sin(ph * 2) * g.squash;
    c.tilt = (g.lean + Math.sin(ph) * 0.008) * c.dir;
  }

  function walkTo(c, x, y, then, speedMul, gait) {
    const p = clampPos(c, x, y);
    setState(c, 'walk', 999);
    c.tx = p.x; c.ty = p.y; c.then = then || null; c.speedMul = speedMul || 1;
    c.gait = gait || (then ? (speedMul > 1.05 ? 'trot' : 'walk') : pickGait(c));
    c.pauseT = rand(1.5, 4); c.pauseLeft = 0;
  }

  function nextAction(c) {
    if (c.pending) { const p = c.pending; c.pending = null; return p(); }
    const a = act();
    const options = [
      ['walk', 34], ['idle', 14], ['meow', 10], ['sleep', 7], ['groom', 11], ['tree', 3], ['snack', 12], ['ball', 9]
    ].filter(([k]) => !(k === c.lastAction && k !== 'walk'));
    let total = options.reduce((s, o) => s + o[1], 0), r = Math.random() * total, choice = 'walk';
    for (const [k, w] of options) { if ((r -= w) <= 0) { choice = k; break; } }
    c.lastAction = choice;
    const s = size();
    switch (choice) {
      case 'walk': {
        const p = Math.random() < 0.25 ? randomPoint(c) : clampPos(c, c.x + rand(-4, 4) * s, c.y + rand(-1.5, 1.5) * s);
        return walkTo(c, p.x, p.y);
      }
      case 'idle':
        setState(c, 'idle', rand(2, 5) / a); c.pose = pick(['sit', 'sit', 'loaf', hasRole(c.breed, 'stand') ? 'stand' : 'sit']); return;
      case 'meow': return startMeow(c);
      case 'sleep':
        setState(c, 'sleep', rand(12, 28) / Math.sqrt(a)); c.pose = 'sleep'; return;
      case 'groom':
        if (voice(c.breed) !== 'cat' && hasRole(c.breed, 'back')) { setState(c, 'idle', rand(3, 5)); c.pose = 'back'; return; }
        setState(c, 'groom', rand(4, 7)); c.pose = 'sit'; return;
      case 'tree': return voice(c.breed) === 'cat' ? startTree(c) : startZoomies(c);
      case 'snack': return startSnack(c);
      case 'ball': return startBall(c, 2 + Math.floor(Math.random() * 2));
    }
  }

  function startMeow(c) {
    setState(c, 'meow', 1.9); c.pose = hasRole(c.breed, 'talk') ? 'talk' : 'sit';
    say(c, line(c, 'talk'), 1.7);
    voiceSound(c, rand(0.9, 1.2));
  }

  // 근처를 천천히 몇 걸음씩 산책 (사이사이 멈춰서 두리번)
  function startZoomies(c, n) {
    n = n == null ? 3 : n;
    if (n <= 0) { setState(c, 'idle', rand(1.5, 3)); c.pose = pick(['sit', 'stand']); return; }
    const s = size();
    const p = clampPos(c, c.x + rand(-2.5, 2.5) * s, c.y + rand(-1, 1) * s);
    walkTo(c, p.x, p.y, () => { setState(c, 'idle', rand(0.6, 1.4)); c.pose = 'stand'; c.pending = () => startZoomies(c, n - 1); }, 1, 'stroll');
  }

  function startTree(c) {
    const s = size(), u = s / 100;
    const h = 210 * u;
    // 나무를 놓을 위치: 꼭대기까지 범위 안에 들어와야 함
    const minY = R.y + h + s * 1.1;
    if (minY > R.y + R.h - 4) return startMeow(c);
    let x = clamp(c.x + rand(-4, 4) * s, R.x + 40 * u + s * 0.5, R.x + R.w - 40 * u - s * 0.5);
    let y = clamp(c.y + rand(-1, 1) * s, minY, R.y + R.h - 4);
    if (props.some(p => p.kind === 'tree' && Math.abs(p.x - x) < s * 1.2)) return walkTo(c, c.x + rand(-3, 3) * s, c.y);
    const tree = { kind: 'tree', x, y, h, alpha: 0, fade: 1, owner: c };
    props.push(tree);
    c.tree = tree;
    walkTo(c, x, y, () => { setState(c, 'climb', 999); c.pose = 'walk'; c.dir = 1; c.rot = -Math.PI / 2; c.x = tree.x; c.y = tree.y; });
  }

  function startSnack(c) {
    const s = size();
    const p = clampPos(c, c.x + rand(-5, 5) * s, c.y + rand(-2, 2) * s);
    const snack = { kind: 'snack', x: p.x, y: p.y, type: Math.random() < 0.7 ? 'fish' : 'churu', alpha: 0, fade: 1, owner: c, left: 1 };
    props.push(snack);
    c.snack = snack;
    emit('star', p.x, p.y - 10, 2);
    const side = c.x < p.x ? -1 : 1;
    walkTo(c, p.x + side * s * 0.42, p.y, () => {
      c.dir = side > 0 ? -1 : 1;
      setState(c, 'eat', 3.8); c.pose = 'eat'; c.food = snack; if (hasRole(c.breed, 'eat')) snack.fade = -1;
    });
  }

  // ---------- 공놀이 ----------
  // 공을 굴려주면 동물이 걸어가서 톡 차고, 공이 멈추면 다시 가서 차요 (n번)
  const ballR = () => size() * 0.11;
  function startBall(c, kicks) {
    const s = size(), r = ballR();
    const side = Math.random() < 0.5 ? -1 : 1;
    const bx = clamp(c.x + side * rand(1.6, 2.6) * s, R.x + r + s * 0.5, R.x + R.w - r - s * 0.5);
    const by = clamp(c.y + rand(-0.6, 0.6) * s, R.y + s * 1.05, R.y + R.h - 6);
    const ball = { kind: 'ball', x: bx, y: by, z: s * 0.9, vz: 0, vx: 0, vy: 0, rot: 0, alpha: 0, fade: 1, owner: c,
                   ...pick([{ color: '#FFD84D', color2: '#FF8FB8' }, { color: '#6FB8FF', color2: '#7FD98F' }]) }; // 노랑+핑크 공 / 파랑+초록 공
    props.push(ball);
    c.ball = ball; c.kicks = kicks;
    say(c, line(c, 'ball'), 1.5);
    setState(c, 'ballwatch', 999); c.pose = 'sit';
  }
  function goToBall(c) {
    const b = c.ball; if (!b) return;
    const s = size();
    // 화면 가운데 쪽으로 차도록 공 반대편에 서요
    const cx = R.x + R.w / 2;
    c.kickDir = Math.abs(b.x - cx) > R.w * 0.3 ? (b.x < cx ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1);
    walkTo(c, b.x - c.kickDir * s * 0.42, b.y, () => {
      c.dir = c.kickDir; setState(c, 'kick', 0.7); c.pose = 'yarn'; c.kicked = false;
    }, 1, 'trot');
  }
  function endBall(c) {
    if (c.ball) { c.ball.fadeDelay = 1.5; c.ball = null; }
    setState(c, 'idle', 1.8); c.pose = 'cheer';
    say(c, line(c, 'done'), 1.6);
    emit('heart', c.x, c.y - size(), 8);
  }

  // 사용자 액션 ----------------------------------------------------------
  function interrupt(c, fn) {
    // 나무 위에 있으면 먼저 내려오게
    if (c.state === 'climb' || c.state === 'perch') { c.pending = fn; setState(c, 'descend', 999); c.pose = 'walk'; c.dir = 1; c.rot = Math.PI / 2; c.z = c.tree ? c.tree.h : 0; return; }
    if (c.state === 'descend') { c.pending = fn; return; }
    if (c.state === 'sleep') { say(c, line(c, 'wake'), 1); }
    if (c.snack) { c.snack.fade = -1; c.snack = null; }
    if (c.food) { c.food.fade = -1; c.food = null; c.bowl = null; }
    if (c.ball) { c.ball.fade = -1; c.ball = null; }
    c.pounce = 0;
    fn();
  }

  function feed(c) {
    interrupt(c, () => {
      const s = size();
      // 그림 속에 밥그릇이 함께 있어요
      setState(c, 'eat', 6); c.pose = 'eat';
      if (hasRole(c.breed, 'eat')) {
        c.food = { kind: 'bowl' }; // 그림 속에 밥그릇이 함께 있어요
      } else {
        const bowl = { kind: 'bowl', x: clampPos(c, c.x + c.dir * s * 0.5, c.y).x, y: c.y + 2, alpha: 0, fade: 1, owner: c, left: 1 };
        props.push(bowl); c.food = bowl; c.bowl = bowl;
      }
      emit('star', c.x - c.dir * s * 0.3, c.y - s * 0.2, 2);
      say(c, line(c, 'feed'), 1.5);
      voiceSound(c, 1.1);
    });
  }

  function play(c) {
    interrupt(c, () => {
      setState(c, 'play', 10); c.pose = 'sit';
      c.playX = mouse.x; c.playY = mouse.y; mouse.moved = now();
      say(c, line(c, 'play'), 1.4);
      voiceSound(c, 1.1);

    });
  }

  function pet(c) {
    c.petT = 1.6;
    emit('heart', c.x, c.y - size() * 0.95, 8);
    if (Math.random() < 0.5) say(c, line(c, 'pet'), 1.3);
    if (Math.random() < 0.4) voiceSound(c, 1.05);
  }

  // ---------- 업데이트 ----------
  function updateCat(c, dt) {
    const s = size(), u = s / 100, a = act();
    c.t += dt; c.st += dt;
    if (c.bubble) { c.bubble.t += dt; if (c.bubble.t > c.bubble.dur) c.bubble = null; }
    if (c.petT > 0) c.petT -= dt;
    // 눈 깜빡임
    c.nextBlink -= dt;
    if (c.nextBlink <= 0) { c.blinkT = 0.16; c.nextBlink = rand(2, 5.5); }
    if (c.blinkT > 0) { c.blinkT -= dt; c.blink = Math.sin((1 - c.blinkT / 0.16) * Math.PI); } else c.blink = 0;
    // 귀 쫑긋
    c.earFlick = Math.max(0, Math.sin(c.t * 0.7) ** 40) * 0.35;

    // 메뉴 위에 마우스가 있어도 그 동물은 가만히 기다려요 (메뉴가 도망가지 않게)
    const hovered = (hoverCat === c || (menuOver && menuCat === c)) && !dragCat;
    const calmStates = ['idle', 'walk', 'meow', 'groom'];

    if (c.state === 'held') {
      c.pose = 'cheer'; c.moving = false;
      c.x = mouse.x; c.y = mouse.y + s * 0.62; c.z = 0;
      c.rot = Math.sin(c.t * 7) * 0.12;
      return;
    }

    if (hovered && calmStates.includes(c.state)) {
      if (c.state !== 'attention') { setState(c, 'attention', 999); c.pose = 'sit'; }
    }
    if (c.state === 'attention') {
      if (!hovered) { if (c.ball) { setState(c, 'ballwatch', 999); c.pose = 'sit'; return; } setState(c, 'idle', rand(0.8, 2)); c.pose = 'sit'; return; }
      c.dir = mouse.x >= c.x ? 1 : -1;
      lookAt(c, mouse.x, mouse.y);
      const petting = c.st > 1.0 || c.petT > 0;
      c.eyes = petting ? 'happy' : 'open';
      c.tilt = petting ? Math.sin(c.t * 3) * 0.06 : 0;
      c.squash = petting ? Math.max(0, Math.sin(c.t * 6)) * 0.03 : 0;
      c.wagAmp = 1.8;
      c.partT -= dt;
      if (petting && c.partT <= 0) { emit('heart', c.x + c.dir * s * 0.1, c.y - s * 0.95, 4); c.partT = 0.7; }
      return;
    }
    c.wagAmp = 1;

    switch (c.state) {
      case 'idle': {
        c.lookT -= dt;
        if (c.lookT <= 0) { c.lookTarget = { x: rand(-1, 1), y: rand(-0.6, 0.6) }; c.lookT = rand(0.8, 2.2); }
        c.look.x += ((c.lookTarget?.x || 0) - c.look.x) * dt * 4;
        c.look.y += ((c.lookTarget?.y || 0) - c.look.y) * dt * 4;
        if (c.st > c.dur) nextAction(c);
        break;
      }
      case 'walk': {
        const g = GAITS[c.gait] || GAITS.walk;
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        // 가다가 잠깐 멈춰서 두리번 (그냥 걷는 중일 때만)
        if (c.pauseLeft > 0) {
          c.pauseLeft -= dt; c.moving = false; c.z = 0; c.tilt = 0;
          c.pose = c.pausePose; c.squash = Math.max(0, Math.sin(c.t * 5)) * 0.015;
          c.lookT -= dt;
          if (c.lookT <= 0) { c.look = { x: rand(-1, 1), y: rand(-0.5, 0.5) }; c.lookT = rand(0.4, 0.9); if (Math.random() < 0.35) c.dir *= -1; }
          if (c.pauseLeft <= 0) { c.dir = dx > 0 ? 1 : -1; if (Math.random() < 0.4) c.gait = pickGait(c); }
          break;
        }
        if (d < 3) {
          c.moving = false; c.z = 0; c.tilt = 0; c.squash = 0;
          const then = c.then; c.then = null;
          if (then) then(); else { setState(c, 'idle', rand(0.6, 2) / a); c.pose = pick(['sit', 'sit', 'loaf', 'stand']); }
          break;
        }
        if (!c.then && d > s * 1.5) {
          c.pauseT -= dt;
          if (c.pauseT <= 0) {
            c.pauseT = rand(2.5, 6); c.pauseLeft = rand(0.6, 1.6); c.lookT = 0;
            c.pausePose = pick(['sit', 'stand', 'stand', hasRole(c.breed, 'talk') ? 'talk' : 'sit']);
            break;
          }
        }
        // 출발할 때 살짝 가속, 도착할 때 살짝 감속
        const ease = clamp(Math.min(c.st * 3 + 0.35, d / (s * 0.6) + 0.3), 0.3, 1);
        const speed = s * 0.62 * Math.max(0.5, a) * (c.speedMul || 1) * g.speed * ease;
        c.moving = true;
        const st = Math.min(d, speed * dt);
        c.x += dx / d * st; c.y += dy / d * st;
        if (Math.abs(dx) > 2) c.dir = dx > 0 ? 1 : -1;
        c.walkPhase += dt * (4.5 + speed / s * 6) * g.step;
        c.pose = movePose(c, g);
        moveBody(c, g, s);
        c.look.x = 0.5; c.look.y = 0;
        break;
      }
      case 'meow': {
        const k = c.st;
        c.mouth = (k > 0.15 && k < 0.75) || (k > 0.95 && k < 1.35) ? 'open' : 'w';
        c.mouthOpen = 0.6 + Math.sin(k * 9) * 0.4;
        c.eyes = c.mouth === 'open' ? 'happy' : 'open';
        // 야옹할 때 몸을 쭉 폈다가 통 튀기
        c.squash = c.mouth === 'open' ? -0.05 - Math.sin(k * 9) * 0.02 : 0;
        if (c.st > c.dur) nextAction(c);
        break;
      }
      case 'sleep': {
        c.pose = 'sleep'; c.eyes = 'sleep';
        c.partT -= dt;
        if (c.st > c.dur) { setState(c, 'idle', 1.6); c.pose = 'stretch'; say(c, line(c, 'morning'), 1.4); }
        break;
      }
      case 'groom': {
        // 앉아서 몸단장: 살랑살랑 흔들며 반짝반짝
        c.pose = 'sit';
        c.tilt = Math.sin(c.st * 5) * 0.07;
        c.squash = Math.max(0, Math.sin(c.st * 10)) * 0.025;
        c.partT -= dt;
        if (c.partT <= 0) { emit('star', c.x + rand(-0.25, 0.25) * s, c.y - rand(0.3, 0.8) * s, 1); c.partT = 0.6; }
        if (c.st > c.dur) { setState(c, 'idle', 1); c.pose = 'sit'; }
        break;
      }
      case 'climb': {
        const tr = c.tree;
        if (!tr) { setState(c, 'idle', 1); break; }
        c.moving = true; c.walkPhase += dt * 12;
        c.z += dt * s * 0.9;
        c.rot = -Math.PI / 2;
        if (c.z >= tr.h) { c.z = tr.h + 3 * (s / 100); setState(c, 'perch', rand(6, 12)); c.z = tr.h + 3 * (s / 100); c.pose = pick(['sleep', 'sit', 'loaf']); c.dir = Math.random() < 0.5 ? 1 : -1; if (c.pose === 'sit') say(c, line(c, 'perch'), 1.6); }
        break;
      }
      case 'perch': {
        const tr = c.tree; c.z = tr ? tr.h + 3 * u : 0;
        if (c.pose === 'sleep') { /* 그림에 zzz 포함 */ }
        else { c.lookT -= dt; if (c.lookT <= 0) { c.look = { x: rand(-1, 1), y: rand(0, 0.8) }; c.lookT = rand(1, 2); } }
        if (c.st > c.dur) { const z = c.z; setState(c, 'descend', 999); c.pose = 'walk'; c.dir = 1; c.rot = Math.PI / 2; c.z = z; }
        break;
      }
      case 'descend': {
        c.pose = 'walk'; c.moving = true; c.walkPhase += dt * 12; c.rot = Math.PI / 2; c.dir = 1;
        c.z -= dt * s * 1.1;
        if (c.z <= 0) {
          c.z = 0; c.rot = 0;
          if (c.tree) { c.tree.fade = -1; c.tree = null; }
          setState(c, 'idle', 0.4); c.pose = 'sit'; c.x += s * 0.3;
          const p = clampPos(c, c.x, c.y); c.x = p.x;
        }
        break;
      }
      case 'eat': {
        const f = c.food;
        c.pose = 'eat'; c.squash = Math.sin(c.t * 9) * 0.025;
        c.look.x = 0.3; c.look.y = 0.6;
        c.partT -= dt;
        if (c.partT <= 0) { emit('crumb', c.x - c.dir * s * 0.35, c.y - s * 0.15, 1); if (Math.random() < 0.35) { const hk = f && f.kind === 'bowl' ? 'note' : 'heart'; emit(hk, c.x, c.y - s * 0.9, hk === 'heart' ? 4 : 1); } c.partT = 0.35; }
        if (f) f.left = Math.max(0, 1 - c.st / c.dur);
        if (c.st > c.dur) {
          if (f) f.fade = -1;
          if (c.snack === f) c.snack = null;
          if (c.bowl === f) c.bowl = null;
          c.food = null;
          setState(c, 'idle', 1.6); c.pose = 'cheer';
          say(c, line(c, 'full'), 1.6);
          emit('heart', c.x, c.y - s, 8);
        }
        break;
      }
      case 'play': {
        // 클릭 통과 모드로 바뀔 때 mouseleave가 잘못 와서 놀이가 바로 끝나던 문제 → 마지막 마우스 위치 사용
        if (mouse.x > -9000) { c.playX = mouse.x; c.playY = mouse.y; }
        const toy = { x: c.playX, y: c.playY };
        const still = now() - (mouse.moved || 0);
        if (c.st > c.dur || (c.st > 3 && still > 6)) {
          setState(c, 'idle', 1.6); c.pose = 'cheer';
          say(c, line(c, 'done'), 1.6);
          emit('heart', c.x, c.y - s, 12);
          break;
        }
        // 장난감 옆, 앞발이 닿는 자리로
        const side = toy.x >= c.x ? 1 : -1;
        const tx = toy.x - side * s * 0.4, ty = toy.y + s * 0.62;
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        c.dir = side;
        lookAt(c, toy.x, toy.y);
        if (d > s * 0.35 && !c.pounce) {
          c.moving = true;
          const step = Math.min(d, s * 1.3 * dt);
          const p = clampPos(c, c.x + dx / d * step, c.y + dy / d * step);
          c.x = p.x; c.y = p.y; c.walkPhase += dt * 11;
          c.pose = 'walk'; moveBody(c, GAITS.trot, s);
          c.pawUp = 0;
        } else {
          c.moving = false; c.squash = 0; c.tilt = 0; if (!c.pounce) c.z = 0;
          c.pose = Math.floor(c.st / 0.7) % 2 ? 'pounce' : 'yarn';
          // 냥냥펀치
          c.swipe = (c.swipe || 0) + dt * 7;
          c.pawUp = Math.max(0, Math.sin(c.swipe));
          c.pawTarget = [24, -46];
          if (!c.pounce && Math.random() < dt * 0.25) c.pounce = 0.0001;
        }
        if (c.pounce) { // 깡총
          c.pounce += dt;
          c.z = Math.sin(Math.min(1, c.pounce / 0.45) * Math.PI) * s * 0.08;
          c.moving = false;
          if (c.pounce > 0.45) { c.pounce = 0; c.z = 0; emit('star', tx, ty, 1); if (Math.random() < 0.3) voiceSound(c, 1.15); }
        }
        break;
      }
      case 'ballwatch': { // 공이 멈출 때까지 바라보기
        const b = c.ball;
        if (!b) { setState(c, 'idle', 1); c.pose = 'sit'; break; }
        lookAt(c, b.x, b.y - b.z);
        c.dir = b.x >= c.x ? 1 : -1;
        c.squash = Math.max(0, Math.sin(c.t * 4)) * 0.015;
        const moving = Math.hypot(b.vx, b.vy) > s * 0.2 || b.z > 0.5;
        if (!moving && c.st > 0.5) { if (c.kicks > 0) goToBall(c); else endBall(c); }
        else if (c.st > 8) endBall(c);
        break;
      }
      case 'kick': { // 앞발로 톡
        const b = c.ball;
        if (!b) { setState(c, 'idle', 1); c.pose = 'sit'; break; }
        c.dir = c.kickDir; lookAt(c, b.x, b.y);
        c.pose = c.st < 0.3 ? 'yarn' : 'pounce';
        c.pawUp = Math.max(0, Math.sin(c.st / 0.7 * Math.PI));
        if (!c.kicked && c.st > 0.3) {
          c.kicked = true; c.kicks--;
          const sp = s * rand(2.4, 3.6);
          b.vx = c.kickDir * sp; b.vy = rand(-0.35, 0.35) * sp; b.vz = s * rand(0.4, 0.9);
          emit('heart', b.x, b.y - s * 0.3, 2);
          emit('star', b.x, b.y - 6, 1);
          if (Math.random() < 0.3) voiceSound(c, 1.1);
        }
        if (c.st > c.dur) { setState(c, 'ballwatch', 999); c.pose = 'sit'; }
        break;
      }
      case 'land': {
        c.eyes = 'squint'; c.pose = 'sit';
        if (c.st > 0.5) { setState(c, 'idle', 1.2); c.pose = 'sit'; }
        break;
      }
      default:
        if (c.st > c.dur) nextAction(c);
    }
  }

  function lookAt(c, x, y) {
    const hx = c.x + c.dir * size() * 0.1, hy = c.y - c.z - size() * 0.5;
    const dx = (x - hx) * c.dir, dy = y - hy;
    const d = Math.max(1, Math.hypot(dx, dy));
    c.look.x = clamp(dx / d * 1.2, -1, 1);
    c.look.y = clamp(dy / d * 1.2, -1, 1);
  }

  function updateProps(dt) {
    props.forEach(p => { p.alpha = clamp(p.alpha + p.fade * dt * 3, 0, 1); });
    props.forEach(p => {
      if (p.fadeDelay > 0) { p.fadeDelay -= dt; if (p.fadeDelay <= 0) p.fade = -1; }
      if (p.kind !== 'ball') return;
      const s = size(), r = ballR();
      // 통통 떨어지기
      if (p.z > 0 || p.vz) {
        p.vz -= s * 6 * dt; p.z += p.vz * dt;
        if (p.z <= 0) { p.z = 0; p.vz = Math.abs(p.vz) > s * 0.6 ? -p.vz * 0.4 : 0; }
      }
      // 굴러가기 (점점 느려짐)
      const fr = Math.exp(-1.7 * dt);
      p.vx *= fr; p.vy *= fr;
      if (Math.hypot(p.vx, p.vy) < s * 0.05) { p.vx = 0; p.vy = 0; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vx * dt / r;
      // 범위 벽에 닿으면 튕기기
      const minX = R.x + r + 4, maxX = R.x + R.w - r - 4, minY = R.y + s * 1.05, maxY = R.y + R.h - 6;
      if (p.x < minX) { p.x = minX; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < minY) { p.y = minY; p.vy = Math.abs(p.vy) * 0.6; }
      if (p.y > maxY) { p.y = maxY; p.vy = -Math.abs(p.vy) * 0.6; }
    });
    props = props.filter(p => !(p.fade < 0 && p.alpha <= 0));
    parts.forEach(p => {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'crumb') p.vy += 160 * dt;
      else p.vx *= 0.98;
    });
    parts = parts.filter(p => p.life < p.max);
  }

  // ---------- 그리기 ----------
  function heartPath(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  }

  function drawParticles() {
    const s = size();
    parts.forEach(p => {
      const k = p.life / p.max, a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      if (p.type === 'heart') {
        heartPath(p.x, p.y, s * 0.075 * p.s); ctx.fillStyle = '#FF7FA3'; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke();
      } else if (p.type === 'z') {
        ctx.font = `900 ${Math.round(s * (0.13 + k * 0.08))}px "Arial Rounded MT Bold", sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#8C9BD8';
        ctx.strokeText('z', p.x + Math.sin(p.life * 3) * 6, p.y); ctx.fillText('z', p.x + Math.sin(p.life * 3) * 6, p.y);
      } else if (p.type === 'note') {
        ctx.font = `700 ${Math.round(s * 0.17)}px sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#FFA94D';
        ctx.strokeText('♪', p.x, p.y); ctx.fillText('♪', p.x, p.y);
      } else if (p.type === 'star') {
        ctx.translate(p.x, p.y); ctx.rotate(p.life * 3); ctx.fillStyle = '#FFD45E';
        const r = s * 0.06;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const an = i * Math.PI / 5; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill();
      } else if (p.type === 'crumb') {
        ctx.fillStyle = '#D49253'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, s * 0.018), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawBubble(c) {
    const b = c.bubble; if (!b) return;
    const s = size();
    const a = Math.min(1, b.t * 6, (b.dur - b.t) * 4);
    const pop = 1 + Math.max(0, 0.25 - b.t) * 1.2;
    const fs = Math.max(11, Math.round(s * 0.16));
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = `800 ${fs}px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
    const w = ctx.measureText(b.text).width + fs * 1.1, h = fs * 1.7;
    const hx = c.x + c.dir * s * 0.12;
    const top = c.y - c.z - frameSize(c.breed, c.pose, c.walkPhase).h * s / 100 - s * 0.05;
    let bx = hx + c.dir * s * 0.3, by = top - h;
    bx = clamp(bx, w / 2 + 4, innerWidth - w / 2 - 4); by = Math.max(4, by);
    ctx.translate(bx, by + h / 2); ctx.scale(pop, pop);
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#F2B8C6'; ctx.lineWidth = 2;
    roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    // 꼬리
    ctx.beginPath(); ctx.moveTo(-c.dir * w * 0.18 - 5, h / 2 - 1); ctx.lineTo(-c.dir * w * 0.3, h / 2 + 7); ctx.lineTo(-c.dir * w * 0.18 + 5, h / 2 - 1);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-c.dir * w * 0.18 - 4, h / 2 - 3, 8, 3);
    ctx.fillStyle = '#6B4350'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.text, 0, 1);
    ctx.restore();
  }

  function drawOneCat(c) {
    const s = size(), u = s / 100;
    ctx.save();
    ctx.translate(c.x, c.y - c.z);
    if (c.rot) ctx.rotate(c.rot);
    if (c.tilt) ctx.rotate(c.tilt);
    // 착지 찌그러짐
    if (c.state === 'land') { const k = Math.max(0, 1 - c.st / 0.35); ctx.scale(1 + k * 0.15, 1 - k * 0.15); }
    ctx.scale(c.dir * u, u);
    drawCat(ctx, c.breed, {
      pose: c.pose, t: c.t, walkPhase: c.walkPhase, moving: c.moving, squash: c.squash,
      eyes: c.eyes, mouth: c.mouth, mouthOpen: c.mouthOpen, blink: c.blink,
      look: c.look, pawUp: c.pawUp, pawTarget: c.pawTarget, headDY: c.headDY,
      headTilt: c.headTilt, earFlick: c.earFlick, wagAmp: c.wagAmp,
      shadow: !c.rot && c.state !== 'held' && c.z === 0
    });
    ctx.restore();
    // 들려 있거나 점프 중이면 바닥 그림자
    if (c.z > 0 && !c.rot) {
      ctx.save(); ctx.fillStyle = 'rgba(30,20,40,0.12)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, s * 0.26, s * 0.045, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (S && S.showNames && c.name) {
      ctx.save();
      const fs = Math.max(10, Math.round(s * 0.12));
      ctx.font = `700 ${fs}px "Pretendard", "Malgun Gothic", sans-serif`;
      ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = '#7A5260';
      const ny = c.y - c.z + fs + 4;
      ctx.strokeText(c.name, c.x, ny); ctx.fillText(c.name, c.x, ny);
      ctx.restore();
    }
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!S || S.paused || selecting) return;
    const s = size(), u = s / 100;
    // 깊이 순서(아래쪽이 앞)로 정렬
    const items = [
      ...props.map(p => ({ y: p.kind === 'tree' ? p.y - 0.5 : p.y, draw: () => drawProp(p, u) })),
      ...cats.map(c => ({ y: c.state === 'held' ? 1e9 : c.y, draw: () => drawOneCat(c) }))
    ].sort((a, b) => a.y - b.y);
    items.forEach(i => i.draw());
    cats.forEach(drawBubble);
    drawParticles();
    // 놀이 중일 때 커서에 깃털 장난감
    if (cats.some(c => c.state === 'play') && mouse.x > -9000) {
      ctx.save(); ctx.translate(mouse.x + 2, mouse.y + 14); ctx.scale(u * 1.4, u * 1.4); drawToy(ctx, now()); ctx.restore();
    }
  }

  function drawBall(p) {
    const r = ballR();
    // 그림자 (공이 뜨면 작아져요)
    const k = 1 / (1 + p.z / (r * 4));
    ctx.fillStyle = 'rgba(30,20,40,0.15)';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95 * k, r * 0.28 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -p.z - r);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-r, -r * 0.32, r * 2, r * 0.64);          // 가운데 줄무늬
    ctx.fillStyle = p.color2;
    ctx.beginPath(); ctx.arc(0, -r * 1.05, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, r * 1.05, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = 'rgba(120,80,100,0.55)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';                // 반짝
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
  }

  function drawProp(p, u) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    if (p.kind === 'tree') { ctx.scale(u, u); drawTree(ctx, p.h / u, 1); }
    else if (p.kind === 'snack') { { const k = u * 1.7 * (0.8 + 0.2 * p.left); ctx.scale(k, k); } drawSnack(ctx, p.type); }
    else if (p.kind === 'bowl') { ctx.scale(u * 1.25, u * 1.25); drawBowl(ctx, p.left); }
    else if (p.kind === 'ball') drawBall(p);
    ctx.restore();
  }

  // ---------- 마우스 / 클릭 통과 ----------
  function catBox(c) {
    const s = size();
    if (c.rot) return { x: c.x - s * 0.55, y: c.y - c.z - s * 0.6, w: s * 1.1, h: s * 1.0 };
    const f = frameSize(c.breed, c.pose, c.walkPhase);
    const w = f.w * s / 100, h = f.h * s / 100;
    return { x: c.x - w / 2, y: c.y - c.z - h, w, h };
  }
  const inBox = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  function catAt(x, y) {
    if (!S || S.paused) return null;
    // 앞쪽(아래쪽) 고양이 우선
    const sorted = [...cats].sort((a, b) => b.y - a.y);
    return sorted.find(c => inBox(catBox(c), x, y)) || null;
  }

  function menuHit(x, y) {
    if (!menu.classList.contains('show')) return false;
    const r = menu.getBoundingClientRect();
    return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 14;
  }

  function setCapture(on) {
    if (on === capturing) return;
    capturing = on;
    API.setIgnore(!on);
  }

  function updateHover() {
    if (selecting) return;
    const playing = cats.some(c => c.state === 'play');
    const c = mouse.inside ? catAt(mouse.x, mouse.y) : null;
    const onMenu = mouse.inside && menuHit(mouse.x, mouse.y);
    menuOver = onMenu && !playing;
    // 놀이 중에는 고양이가 커서를 쫓아와도 다른 작업을 방해하지 않도록 클릭 통과 유지
    hoverCat = playing ? null : c;
    if (menuOver && menuCat) menuHideAt = 0;                  // 메뉴 위에서는 사라지지 않게 (다른 동물로 바뀌지도 않게)
    else if (c && !playing) { menuCat = c; menuHideAt = 0; }
    else if (!onMenu && menuCat && !menuHideAt) menuHideAt = now() + 0.45;
    setCapture(!!dragCat || (!playing && (!!c || onMenu)));
  }

  function updateMenu() {
    if (menuHideAt && now() > menuHideAt) { menuCat = null; menuHideAt = 0; }
    const c = menuCat;
    const show = c && !dragCat && !selecting && !(S && S.paused) && cats.includes(c) && c.state !== 'play';
    if (!show) { menu.classList.remove('show'); return; }
    const b = catBox(c);
    menuName.textContent = c.name || '';
    menuName.style.display = c.name ? '' : 'none';
    menu.classList.add('show');
    const mw = menu.offsetWidth || 200;
    const x = clamp(c.x, mw / 2 + 6, innerWidth - mw / 2 - 6);
    const y = Math.max(menu.offsetHeight + 8, b.y - 10);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
  }

  addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; mouse.moved = now();
    if (pressCat && !dragCat && Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy) > 6) {
      dragCat = pressCat; pressCat = null;
      if (dragCat.tree) { dragCat.tree.fade = -1; dragCat.tree = null; }
      if (dragCat.food) { dragCat.food.fade = -1; dragCat.food = null; dragCat.snack = null; dragCat.bowl = null; }
      if (dragCat.ball) { dragCat.ball.fade = -1; dragCat.ball = null; }
      dragCat.pending = null;
      setState(dragCat, 'held', 999);
      say(dragCat, line(dragCat, 'held'), 1.2);
    }
    updateHover();
  });
  document.addEventListener('mouseleave', () => { mouse.inside = false; if (!dragCat) updateHover(); });

  addEventListener('mousedown', (e) => {
    if (selecting || e.button !== 0) return;
    const c = catAt(e.clientX, e.clientY);
    if (c && !menuHit(e.clientX, e.clientY) && !e.target.closest('#menu')) { pressCat = c; mouse.sx = e.clientX; mouse.sy = e.clientY; }
  });
  addEventListener('mouseup', () => {
    if (dragCat) {
      const c = dragCat; dragCat = null;
      const p = clampPos(c, c.x, c.y); c.x = p.x; c.y = p.y;
      setState(c, 'land', 1); c.pose = 'sit';
      emit('star', c.x, c.y - 4, 2);
      updateHover();
    } else if (pressCat) {
      pet(pressCat); pressCat = null;
    }
  });

  // 버튼은 누르는 순간(pointerdown) 바로 실행 — 메뉴가 움직여서 click이 안 잡히던 문제 방지
  function menuAction(fn) {
    return (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const c = menuCat;
      if (!c || !cats.includes(c)) return;
      menuCat = null; menuHideAt = 0; menuOver = false; pressCat = null;
      menu.classList.remove('show');
      fn(c); updateHover();
    };
  }
  document.getElementById('btnPlay').addEventListener('pointerdown', menuAction(play));
  document.getElementById('btnFeed').addEventListener('pointerdown', menuAction(feed));

  // ---------- 범위 지정 ----------
  const selector = document.getElementById('selector');
  const selbox = document.getElementById('selbox');
  const curbox = document.getElementById('curbox');
  let selStart = null;

  function beginSelect() {
    selecting = true; menuCat = null; dragCat = null; pressCat = null;
    capturing = true;
    selector.classList.add('show');
    Object.assign(curbox.style, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px' });
    selbox.style.display = 'none';
  }
  function endSelect(region) {
    selecting = false; selStart = null;
    selector.classList.remove('show');
    capturing = false;
    API.endSelectRegion(region);
  }
  selector.addEventListener('mousedown', (e) => {
    if (e.target.closest('#hint')) return;
    selStart = { x: e.clientX, y: e.clientY };
    selbox.style.display = 'block';
    Object.assign(selbox.style, { left: e.clientX + 'px', top: e.clientY + 'px', width: '0px', height: '0px' });
  });
  selector.addEventListener('mousemove', (e) => {
    if (!selStart) return;
    const x = Math.min(selStart.x, e.clientX), y = Math.min(selStart.y, e.clientY);
    Object.assign(selbox.style, { left: x + 'px', top: y + 'px', width: Math.abs(e.clientX - selStart.x) + 'px', height: Math.abs(e.clientY - selStart.y) + 'px' });
  });
  selector.addEventListener('mouseup', (e) => {
    if (!selStart) return;
    const x = Math.round(Math.min(selStart.x, e.clientX)), y = Math.round(Math.min(selStart.y, e.clientY));
    const w = Math.round(Math.abs(e.clientX - selStart.x)), h = Math.round(Math.abs(e.clientY - selStart.y));
    selStart = null;
    const min = Math.max(120, size() * 1.6);
    if (w < min || h < min) { selbox.style.display = 'none'; flashHint(); return; }
    endSelect({ x, y, w, h });
  });
  function flashHint() {
    const h = document.getElementById('selHint');
    h.textContent = I18N.t('selSmall');
    setTimeout(() => { h.textContent = I18N.t('selHint'); }, 2200);
  }
  document.getElementById('selFull').addEventListener('click', () => endSelect(D ? { ...D.workArea } : { x: 0, y: 0, w: innerWidth, h: innerHeight }));
  document.getElementById('selCancel').addEventListener('click', () => endSelect(null));
  addEventListener('keydown', (e) => { if (selecting && e.key === 'Escape') endSelect(null); });

  // ---------- 설정 수신 ----------
  function applyState(st) {
    S = st.settings; D = st.display;
    I18N.set(S.lang || 'ko'); I18N.apply();
    computeRegion();
    syncCats();
    computeRegion();
    if (S.paused) { menuCat = null; hoverCat = null; setCapture(false); }
  }

  API.onSettings(applyState);
  API.onBeginSelect(beginSelect);
  API.onSummon(() => {
    const cx = R.x + R.w / 2, cy = R.y + R.h * 0.6;
    cats.forEach((c, i) => {
      interrupt(c, () => {
        walkTo(c, cx + (i - (cats.length - 1) / 2) * size() * 0.9, cy, () => startMeow(c), 1.1);
      });
    });
  });

  // ---------- 루프 ----------
  let last = now();
  function loop() {
    const t = now();
    const dt = Math.min(0.05, t - last); last = t;
    if (S && !S.paused && !selecting) {
      cats.forEach(c => updateCat(c, dt));
      updateProps(dt);
    }
    updateMenu();
    render();
    requestAnimationFrame(loop);
  }

  resize();
  async function loadPacks() {
    try { window.CatArt.setCustomPacks(API.getPacks ? await API.getPacks() : []); } catch (e) { console.error(e); }
  }
  if (API.onPacksChanged) API.onPacksChanged(loadPacks);
  async function loadSounds() { try { if (API.getSoundFiles) PetSounds.setFiles(await API.getSoundFiles()); } catch (e) { console.error(e); } }
  if (API.onSoundsChanged) API.onSoundsChanged(loadSounds);
  loadSounds();
  loadPacks().then(() => API.getState()).then(st => { applyState(st); loop(); });

  // 테스트 훅
  window.__cats = { get cats() { return cats; }, feed, play, startBall, startTree, startSnack, startMeow, setState, pet };
})();

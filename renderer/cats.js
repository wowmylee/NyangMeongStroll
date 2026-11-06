// 동물 그리기 (오버레이와 설정 미리보기에서 함께 사용)
// 그림 묶음(팩) 안에 종류(breed)들이 있고, 종류마다 프레임과 역할(걷기·앉기 등)이 있어요.
// 좌표계: 발바닥 중앙이 (0,0), 오른쪽을 바라봄, 앉은 키 = 100 단위
(function (global) {
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); }

  const LEGACY = { cheese: 'calico', gray: 'tabby', tuxedo: 'british', cream: 'fold', siamese: 'himalayan', ragdoll: 'himalayan', russian: 'british', black: 'abyssinian', white: 'persian' };
  const ROLE_FALLBACK = {
    sit: ['stand'], stand: ['sit'], talk: ['sit', 'stand'], back: ['sit'], loaf: ['sleep', 'sit'], sleep: ['loaf', 'sit'],
    jump: ['walk'], play: ['jump', 'cheer', 'sit'], stretch: ['loaf', 'sit'], eat: ['loaf', 'sit'], cheer: ['sit'], walk: ['jump', 'stand', 'sit']
  };
  const ROLES = ['walk', 'sit', 'stand', 'loaf', 'sleep', 'jump', 'play', 'stretch', 'eat', 'cheer', 'talk', 'back'];
  const ROLE_LABELS = { walk: '걷기', sit: '앉기', stand: '서 있기', loaf: '엎드리기', sleep: '잠자기', jump: '점프·달리기', play: '놀기', stretch: '기지개', eat: '밥먹기', cheer: '만세·기쁨', talk: '울기·짖기', back: '뒤돌기' };

  const images = {};   // src → { img, ready, waiters }
  let packs = [];
  let BREEDS = {};
  const readyCbs = [];

  function loadImg(src) {
    if (images[src]) return images[src];
    const rec = { img: new Image(), ready: false };
    rec.img.onload = () => { rec.ready = true; readyCbs.forEach(f => f()); };
    rec.img.src = src;
    images[src] = rec;
    return rec;
  }

  function rebuild() {
    BREEDS = {};
    packs.forEach(p => {
      loadImg(p.img);
      Object.entries(p.breeds).forEach(([k, b]) => {
        BREEDS[k] = { ...b, key: k, pack: p.id, packName: p.name, voice: p.voice || 'other', img: p.img, builtin: !!p.builtin };
      });
    });
  }
  packs = (global.PET_PACKS || []).slice();
  rebuild();

  function setCustomPacks(list) {
    packs = (global.PET_PACKS || []).concat((list || []).map(p => ({ ...p, builtin: false })));
    rebuild();
  }

  const resolve = (k) => (BREEDS[k] ? k : (BREEDS[LEGACY[k]] ? LEGACY[k] : (BREEDS.tabby ? 'tabby' : Object.keys(BREEDS)[0])));

  function roleFrames(b, role, seen) {
    const r = b.roles[role];
    if (r && r.length) return r;
    seen = seen || new Set([role]);
    for (const f of ROLE_FALLBACK[role] || []) {
      if (seen.has(f)) continue; seen.add(f);
      const got = roleFrames(b, f, seen);
      if (got) return got;
    }
    return null;
  }
  function hasRole(key, role) { const b = BREEDS[resolve(key)]; return !!(b && b.roles[role] && b.roles[role].length); }

  // 행동 이름 → 실제 프레임 이름
  function frameName(b, pose, walkPhase) {
    let role = pose, pick = 0;
    if (pose === 'yarn') { role = 'play'; pick = 0; }
    else if (pose === 'pounce') { role = 'play'; pick = 1; }
    else if (pose === 'stand' && !b.roles.stand) role = 'walk';
    const list = roleFrames(b, role) || roleFrames(b, 'sit') || [Object.keys(b.frames)[0]];
    if (role === 'walk' || (role !== pose && list === b.roles.walk)) {
      return list[Math.floor((walkPhase || 0) / (Math.PI / 2)) % list.length | 0] || list[0];
    }
    return list[pick % list.length];
  }

  function unit(b) {
    const ref = (roleFrames(b, 'sit') || [Object.keys(b.frames)[0]])[0];
    return 100 / b.frames[ref][3];
  }

  function frameSize(key, pose, walkPhase) {
    const b = BREEDS[resolve(key)];
    if (!b) return { w: 80, h: 100 };
    const f = b.frames[frameName(b, pose, walkPhase)], k = unit(b);
    return { w: f[2] * k, h: f[3] * k };
  }

  function drawCat(ctx, key, o) {
    const b = BREEDS[resolve(key)];
    if (!b) return;
    const rec = images[b.img];
    if (!rec || !rec.ready) return;
    const name = frameName(b, o.pose, o.walkPhase);
    const [sx, sy, sw, sh, face] = b.frames[name];
    const k = unit(b);
    const w = sw * k, h = sh * k;
    ctx.save();
    if (o.shadow !== false && o.pose !== 'jump') {
      ctx.fillStyle = 'rgba(30,20,40,0.12)';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    const sq = o.squash || 0;
    const lying = o.pose === 'sleep' || o.pose === 'loaf';
    const breath = lying ? Math.sin((o.t || 0) * 2.2) * 0.03 : Math.sin((o.t || 0) * 2.6) * 0.012;
    ctx.scale(1 + sq * 0.6 - breath * 0.4, 1 - sq + breath);
    if (face === -1) ctx.scale(-1, 1); // 왼쪽을 보는 그림은 뒤집어서 오른쪽 기준으로
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(rec.img, sx, sy, sw, sh, -w / 2, -h, w, h);
    ctx.restore();
  }

  // ---- 소품 ----
  function drawSnack(ctx, kind, t) { // 생선 모양 간식
    ctx.save();
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    if (kind === 'churu') {
      ctx.rotate(-0.25);
      ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#C98B5A';
      ctx.beginPath(); ctx.roundRect(-10, -9, 20, 6, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F7A24B'; ctx.beginPath(); ctx.roundRect(-10, -9, 8, 6, 3); ctx.fill();
    } else {
      ctx.fillStyle = '#F7A24B'; ctx.strokeStyle = '#B8692E';
      ctx.beginPath(); ctx.ellipse(0, -5, 8, 4.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-13, -10); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3A2B2B'; ctx.beginPath(); ctx.arc(4, -6, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(184,105,46,0.7)'; ctx.beginPath(); ctx.arc(-1, -5, 3, -1, 1); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBowl(ctx, fill) {
    ctx.save();
    ctx.fillStyle = 'rgba(30,20,40,0.12)'; ell(ctx, 0, 0.5, 17, 3.5); ctx.fill();
    // 사료
    if (fill > 0) {
      const n = Math.ceil(9 * fill);
      const pts = [[-8, -9], [-3, -11], [3, -10], [8, -9], [-5, -12.5], [1, -13], [6, -12], [-1, -15], [4, -14.5]];
      for (let i = 0; i < n; i++) { const [x, y] = pts[i]; ctx.fillStyle = i % 2 ? '#B9783F' : '#D49253'; ell(ctx, x, y, 2.6, 2); ctx.fill(); }
    }
    ctx.fillStyle = '#FF9DB4'; ctx.strokeStyle = '#D9607F'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-15, -9); ctx.lineTo(15, -9); ctx.lineTo(12, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🐟', 0, -2);
    ctx.restore();
  }

  // 캣타워 (발 위치 기준, 높이 h)
  function drawTree(ctx, h, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const ol = '#8A6440';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(30,20,40,0.13)'; ell(ctx, 0, 1, 34, 5); ctx.fill();
    // 받침
    ctx.fillStyle = '#E9D1AE'; ctx.strokeStyle = ol;
    ctx.beginPath(); ctx.roundRect(-30, -8, 60, 9, 4); ctx.fill(); ctx.stroke();
    // 기둥 (스크래처 줄무늬)
    ctx.fillStyle = '#D9B98A';
    ctx.beginPath(); ctx.roundRect(-7, -h + 8, 14, h - 14, 3); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(-7, -h + 8, 14, h - 14); ctx.clip();
    ctx.strokeStyle = 'rgba(138,100,64,0.45)'; ctx.lineWidth = 1.4;
    for (let y = -8; y > -h; y -= 4) { ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(8, y - 2.5); ctx.stroke(); }
    ctx.restore();
    // 중간 선반
    const mid = -h * 0.5;
    ctx.fillStyle = '#E9D1AE'; ctx.strokeStyle = ol; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-4, mid - 4, 34, 8, 4); ctx.fill(); ctx.stroke();
    // 매달린 방울 장난감
    const sway = Math.sin(performance.now() / 500) * 3;
    ctx.strokeStyle = '#9C7B5A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, mid + 4); ctx.lineTo(24 + sway, mid + 22); ctx.stroke();
    ctx.fillStyle = '#FF8FB0'; ctx.beginPath(); ctx.arc(24 + sway, mid + 25, 4, 0, Math.PI * 2); ctx.fill();
    // 꼭대기 쿠션
    ctx.fillStyle = '#E9D1AE'; ctx.strokeStyle = ol;
    ctx.beginPath(); ctx.roundRect(-30, -h - 2, 60, 10, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFC2D1';
    ctx.beginPath(); ctx.ellipse(0, -h - 2, 26, 4, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  function drawToy(ctx, t) { // 낚싯대 깃털
    ctx.save();
    ctx.rotate(Math.sin(t * 6) * 0.25);
    ctx.strokeStyle = '#9C7B5A'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -4); ctx.stroke();
    const cols = ['#FF7FA8', '#FFD25E', '#7FC8FF'];
    cols.forEach((c, i) => {
      ctx.save(); ctx.rotate((i - 1) * 0.45);
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 6, 3.4, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, -3, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  global.CatArt = {
    get BREEDS() { return BREEDS; }, get packs() { return packs; },
    ROLES, ROLE_LABELS, resolve, hasRole, setCustomPacks, drawCat, frameSize,
    voice: (k) => (BREEDS[resolve(k)] || {}).voice || 'other',
    onReady: (f) => readyCbs.push(f),
    drawSnack, drawBowl, drawTree, drawToy
  };
})(window);

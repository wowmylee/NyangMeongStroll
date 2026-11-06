// 스프라이트 시트 자동 자르기: 단색 배경 제거 → 동물 하나하나 찾기 → 줄(종류)별로 묶기
(function (global) {
  function rgb2hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, mx ? d / mx : 0, mx];
  }

  function median(a) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; }

  // imageData → { rows: [[frame, ...], ...] }, frame = { x, y, w, h, comps:[labels] }, plus label map
  function analyze(imgData) {
    const { width: W, height: H, data: D } = imgData;
    const N = W * H;
    // 1) 배경색: 가장자리 픽셀의 중앙값
    const br = [], bgc = [], bb = [];
    const pushPx = (i) => { br.push(D[i * 4]); bgc.push(D[i * 4 + 1]); bb.push(D[i * 4 + 2]); };
    for (let x = 0; x < W; x += 3) { pushPx(x); pushPx((H - 1) * W + x); }
    for (let y = 0; y < H; y += 3) { pushPx(y * W); pushPx(y * W + W - 1); }
    const bg = [median(br), median(bgc), median(bb)];
    const [bh, bs, bv] = rgb2hsv(...bg);
    const T = 34;

    const dist = new Float32Array(N);
    const bgLike = new Uint8Array(N); // 배경 또는 그림자 (엄격하게)
    for (let i = 0; i < N; i++) {
      const r = D[i * 4], g = D[i * 4 + 1], b = D[i * 4 + 2], a = D[i * 4 + 3];
      if (a < 20) { dist[i] = 0; bgLike[i] = 1; continue; }
      const d = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
      dist[i] = d;
      if (d < 16) { bgLike[i] = 1; continue; }
      // 바닥 그림자: 배경과 같은 색조인데 더 어둡고 더 진한 색
      const [h, s, v] = rgb2hsv(r, g, b);
      let dh = Math.abs(h - bh); if (dh > 180) dh = 360 - dh;
      if (bs > 0.05) { if (d < 75 && dh < 22 && s >= bs * 0.9 && s < 0.6 && v < bv - 0.015 && v > bv - 0.22) bgLike[i] = 1; }
      else if (s < 0.05 && v < bv - 0.04 && v > 0.6 && Math.abs(r - g) < 6 && Math.abs(g - b) < 6) bgLike[i] = 1;
    }
    // 2) 가장자리에서 이어진 배경을 채우기(flood fill)
    const isBg = new Uint8Array(N);
    const stack = new Int32Array(N);
    let sp = 0;
    const seed = (i) => { if (bgLike[i] && !isBg[i]) { isBg[i] = 1; stack[sp++] = i; } };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (sp) {
      const i = stack[--sp], x = i % W;
      if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1);
      if (i >= W) seed(i - W); if (i < N - W) seed(i + W);
    }
    // 테두리의 번진 픽셀 한 겹 정리
    for (let pass = 0; pass < 2; pass++) {
    const peel = [];
    for (let i = 0; i < N; i++) {
      if (isBg[i] || dist[i] >= 30) continue;
      const x = i % W;
      if ((x > 0 && isBg[i - 1]) || (x < W - 1 && isBg[i + 1]) || (i >= W && isBg[i - W]) || (i < N - W && isBg[i + W])) peel.push(i);
    }
    peel.forEach(i => { isBg[i] = 1; });
    }
    // 다리 사이처럼 갇힌 배경 구멍(어느 정도 큰 것만) 제거
    const seen = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (isBg[i] || seen[i] || dist[i] >= 9) continue;
      const reg = []; sp = 0; stack[sp++] = i; seen[i] = 1;
      while (sp) {
        const j = stack[--sp]; reg.push(j); const x = j % W;
        const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j >= W ? j - W : -1, j < N - W ? j + W : -1];
        for (const k of nb) if (k >= 0 && !seen[k] && !isBg[k] && dist[k] < 9) { seen[k] = 1; stack[sp++] = k; }
      }
      if (reg.length >= 40) reg.forEach(j => { isBg[j] = 1; });
    }

    // 3) 연결 요소 라벨링
    const lab = new Int32Array(N).fill(-1);
    const comps = [];
    for (let i = 0; i < N; i++) {
      if (isBg[i] || lab[i] >= 0) continue;
      const id = comps.length;
      let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0, sx = 0, sy = 0, sd = 0;
      sp = 0; stack[sp++] = i; lab[i] = id;
      while (sp) {
        const j = stack[--sp], x = j % W, y = (j / W) | 0;
        area++; sx += x; sy += y; sd += dist[j];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j >= W ? j - W : -1, j < N - W ? j + W : -1];
        for (const k of nb) if (k >= 0 && !isBg[k] && lab[k] < 0) { lab[k] = id; stack[sp++] = k; }
      }
      comps.push({ id, x0, y0, x1, y1, area, cx: sx / area, cy: sy / area, md: sd / area });
    }
    const real = comps.filter(c => c.area >= 12);
    const ref = median(real.filter(c => c.area >= 150).map(c => c.area)) || 1;
    const big = real.filter(c => c.area >= ref * 0.22);
    // 작은 조각 중 배경과 비슷하게 흐린 것(워터마크 등)은 버림
    const small = real.filter(c => c.area < ref * 0.22 && c.md > 48);
    if (!big.length) return { rows: [], lab, W, H, bg };

    // 4) 위아래 두 마리가 붙어서 한 덩어리가 된 경우 가장 가는 곳에서 나누기
    let mh = median(big.map(c => c.y1 - c.y0 + 1));
    const queue = [...big];
    while (queue.length) {
      const c = queue.shift();
      const h = c.y1 - c.y0 + 1;
      if (h < mh * 1.45) continue;
      const cnt = new Int32Array(h);
      for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (lab[y * W + x] === c.id) cnt[y - c.y0]++;
      let cut = -1, best = Infinity;
      for (let k = Math.floor(h * 0.3); k < Math.floor(h * 0.7); k++) if (cnt[k] < best) { best = cnt[k]; cut = k; }
      const nid = comps.length;
      const nc = { id: nid, x0: W, y0: H, x1: 0, y1: 0, area: 0, cx: 0, cy: 0, md: c.md };
      let sx = 0, sy = 0, ax = 0, ay = 0, aa = 0;
      c.x0 = W; c.x1 = 0;
      for (let y = c.y0; y <= c.y1; y++) for (let x = (c.x0 === W ? 0 : 0); x < W; x++) {
        const k = y * W + x; if (lab[k] !== c.id) continue;
        if (y - c.y0 > cut) { lab[k] = nid; nc.area++; sx += x; sy += y; nc.x0 = Math.min(nc.x0, x); nc.x1 = Math.max(nc.x1, x); nc.y0 = Math.min(nc.y0, y); nc.y1 = Math.max(nc.y1, y); }
        else { aa++; ax += x; ay += y; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); }
      }
      c.y1 = c.y0 + cut; c.area = aa; c.cx = ax / aa; c.cy = ay / aa;
      nc.cx = sx / nc.area; nc.cy = sy / nc.area;
      comps.push(nc); big.push(nc);
      if (aa > 50 && nc.area > 50) queue.push(c, nc); // 세 마리 이상 붙은 경우도 계속 나누기
    }
    mh = median(big.map(c => c.y1 - c.y0 + 1));
    // 줄 나누기: 중심 높이를 정렬해서 크게 벌어진 곳에서 끊기
    const byY = [...big].sort((a, b) => a.cy - b.cy);
    const rowGroups = [[byY[0]]];
    for (let k = 1; k < byY.length; k++) {
      if (byY[k].cy - byY[k - 1].cy > mh * 0.42) rowGroups.push([byY[k]]); else rowGroups[rowGroups.length - 1].push(byY[k]);
    }
    // 5) 줄 안에서 가로 위치로 프레임 만들기
    const mw = median(big.map(c => c.x1 - c.x0 + 1));
    const rows = rowGroups.map(g => {
      g.sort((a, b) => a.cx - b.cx);
      const frames = [];
      g.forEach(c => {
        const f = frames[frames.length - 1];
        // 서로 많이 겹치면 같은 프레임(예: 강아지와 밥그릇)
        const overlap = f ? Math.min(f.x1, c.x1) - Math.max(f.x0, c.x0) : -1;
        if (f && (overlap > Math.min(c.x1 - c.x0, f.x1 - f.x0) * 0.35 || c.cx - f.cx < mw * 0.3)) { add(f, c); }
        else frames.push({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, cx: c.cx, cy: c.cy, comps: [c.id], area: c.area });
      });
      // 너무 작은 프레임(옆에 떨어진 밥그릇 등)은 가까운 이웃과 합치기
      const ma = median(frames.map(f => f.area));
      for (let k = frames.length - 1; k >= 0 && frames.length > 1; k--) {
        const f = frames[k];
        if (f.area >= ma * 0.35) continue;
        const L = frames[k - 1], R = frames[k + 1];
        const gl = L ? f.x0 - L.x1 : Infinity, gr = R ? R.x0 - f.x1 : Infinity;
        const t = gl <= gr ? L : R;
        if (Math.min(gl, gr) < mw * 0.3) { f.comps.forEach(id => add(t, comps[id])); frames.splice(k, 1); }
      }
      return frames.filter(f => f.comps.length);
    });
    function add(f, c) {
      f.x0 = Math.min(f.x0, c.x0); f.y0 = Math.min(f.y0, c.y0); f.x1 = Math.max(f.x1, c.x1); f.y1 = Math.max(f.y1, c.y1);
      f.comps.push(c.id); f.area += c.area;
    }
    // 6) 작은 조각(공, 뼈다귀, zzz 등)은 가까운 프레임에 붙이기
    const all = rows.flat();
    small.forEach(c => {
      let best = null, bd = Infinity;
      all.forEach(f => {
        const dx = Math.max(f.x0 - c.cx, 0, c.cx - f.x1), dy = Math.max(f.y0 - c.cy, 0, c.cy - f.y1);
        const d = Math.hypot(dx, dy);
        if (d < bd) { bd = d; best = f; }
      });
      if (best && bd < Math.min(mw, mh) * 0.35) add(best, c);
    });
    rows.forEach(r => r.forEach(f => { f.x = f.x0; f.y = f.y0; f.w = f.x1 - f.x0 + 1; f.h = f.y1 - f.y0 + 1; }));
    return { rows: rows.filter(r => r.length), lab, W, H, bg };
  }

  // 테두리 누끼 정리: 바깥쪽 가장자리에서 배경색이 번진 픽셀을 몇 겹 깎고, 맨 바깥 한 겹은 반투명하게
  function cleanEdges(id, bg, iters) {
    const { width: w, height: h, data: d } = id, N = w * h;
    const alive = new Uint8Array(N);
    for (let i = 0; i < N; i++) alive[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    const isFringe = (i) => {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      if (a < 160) return true;
      const dist = bg ? Math.hypot(r - bg[0], g - bg[1], b - bg[2]) : 999;
      if (dist < 60) return true; // 배경색과 비슷
      const L = (r * 299 + g * 587 + b * 114) / 1000, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return (L > 150 && (mx - mn) / Math.max(mx, 1) < 0.35) || (b - r > 8 && L > 120);
    };
    const onEdge = (i) => {
      const x = i % w, y = (i / w) | 0;
      return x === 0 || y === 0 || x === w - 1 || y === h - 1 || !alive[i - 1] || !alive[i + 1] || !alive[i - w] || !alive[i + w];
    };
    for (let it = 0; it < (iters || 3); it++) {
      const kill = [];
      for (let i = 0; i < N; i++) if (alive[i] && onEdge(i) && isFringe(i)) kill.push(i);
      if (!kill.length) break;
      kill.forEach(i => { alive[i] = 0; });
    }
    for (let i = 0; i < N; i++) {
      if (!alive[i]) d[i * 4 + 3] = 0;
      else if (onEdge(i)) d[i * 4 + 3] = Math.round(d[i * 4 + 3] * 0.6);
    }
    return id;
  }

  // 머리가 어느 쪽인지 대충 추측: 윗부분 무게중심이 가운데보다 오른쪽이면 오른쪽을 봄
  function guessFacing(res, f) {
    const { lab, W } = res, set = new Set(f.comps);
    let sx = 0, n = 0;
    const yEnd = f.y + Math.floor(f.h * 0.45);
    for (let y = f.y; y < yEnd; y++) for (let x = f.x; x < f.x + f.w; x++) {
      if (set.has(lab[y * W + x])) { sx += x; n++; }
    }
    if (!n) return 1;
    const c = sx / n - (f.x + f.w / 2);
    return Math.abs(c) < f.w * 0.06 ? 0 : (c > 0 ? 1 : -1);
  }

  // 모양으로 역할 자동 배정 (설정에서 바꿀 수 있음)
  function guessRoles(res, frames) {
    const maxH = Math.max(...frames.map(f => f.h));
    const info = frames.map((f, i) => {
      const ar = f.w / f.h, face = guessFacing(res, f);
      let kind = 'up';
      if (ar > 1.12 || (face !== 0 && ar > 0.92)) kind = f.h < maxH * 0.72 && ar > 1.2 ? 'low' : 'side';
      return { i, ar, face, kind };
    });
    const roles = info.map(() => '');
    const take = (kind, role, n) => {
      const got = info.filter(o => o.kind === kind && !roles[o.i]).slice(0, n || 1);
      got.forEach(o => { roles[o.i] = role; });
      return got.length;
    };
    take('side', 'walk', 3);
    take('up', 'sit');
    take('low', 'sleep');
    take('low', 'loaf');
    take('side', 'jump');
    take('up', 'cheer');
    take('side', 'play', 2);
    take('low', 'play');
    take('up', 'stand');
    return info.map((o, i) => ({ role: roles[i] || '', face: o.face }));
  }

  // 원본 그림 + 프레임 → 투명 배경 아틀라스 캔버스
  function buildAtlas(srcCanvas, res, list, scale) {
    const S = scale || 2;
    const cw = Math.max(...list.map(f => f.w)) + 2, ch = Math.max(...list.map(f => f.h)) + 2;
    const cols = Math.min(12, list.length), rowsN = Math.ceil(list.length / cols);
    const out = document.createElement('canvas');
    out.width = cw * cols * S; out.height = ch * rowsN * S;
    const octx = out.getContext('2d');
    const sctx = srcCanvas.getContext('2d');
    const rects = [];
    list.forEach((f, k) => {
      const id = sctx.getImageData(f.x, f.y, f.w, f.h);
      const set = new Set(f.comps);
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        if (!set.has(res.lab[(f.y + y) * res.W + f.x + x])) id.data[(y * f.w + x) * 4 + 3] = 0;
      }
      const tmp = document.createElement('canvas'); tmp.width = f.w; tmp.height = f.h;
      cleanEdges(id, res.bg, 3);
      tmp.getContext('2d').putImageData(id, 0, 0);
      const ox = (k % cols) * cw * S, oy = Math.floor(k / cols) * ch * S;
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(tmp, ox, oy, f.w * S, f.h * S);
      rects.push([ox, oy, f.w * S, f.h * S]);
    });
    return { canvas: out, rects };
  }

  global.SheetSlicer = { analyze, guessRoles, guessFacing, buildAtlas, cleanEdges };
})(window);

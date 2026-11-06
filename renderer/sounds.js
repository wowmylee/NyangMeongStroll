// 동물 소리 — sounds 폴더의 녹음 파일(cat1~5, dog1~5)만 사용해요. (합성음 없음)
(function (global) {
  const N = 5;
  const RANDOM = -1; // 설정값: 매번 랜덤
  const CAT = Array.from({ length: N }, (_, i) => ({ ko: `고양이 소리 ${i + 1}`, en: `Cat sound ${i + 1}` }));
  const DOG = Array.from({ length: N }, (_, i) => ({ ko: `강아지 소리 ${i + 1}`, en: `Dog sound ${i + 1}` }));

  // { cat: [[url...] x5], dog: [[url...] x5] }
  let files = { cat: [], dog: [] };
  const cache = new Map(); // url → 미리 불러둔 Audio (첫 재생 지연 줄이기)
  function setFiles(f) {
    files = f || { cat: [], dog: [] };
    cache.clear();
    ['cat', 'dog'].forEach(k => (files[k] || []).flat().forEach(u => {
      try { const a = new Audio(); a.preload = 'auto'; a.src = u; cache.set(u, a); } catch (e) {}
    }));
  }
  const listOf = (kind, i) => (files[kind] || [])[i] || [];
  function hasFile(kind, i) { return listOf(kind, i).length > 0; }
  function available(kind) { const out = []; for (let i = 0; i < N; i++) if (hasFile(kind, i)) out.push(i); return out; }
  function count(kind) { return available(kind).length; }

  function fileFor(kind, index) {
    let i = index | 0;
    // 랜덤이거나 그 번호 파일이 없으면 있는 파일 중에서 골라요
    if (index === RANDOM || !hasFile(kind, i)) {
      const av = available(kind);
      if (!av.length) return null;
      i = av[Math.floor(Math.random() * av.length)];
    }
    const l = listOf(kind, i);
    return l[Math.floor(Math.random() * l.length)];
  }

  // 여러 마리가 동시에 울어서 시끄럽지 않게
  const playing = new Set();
  let lastAt = 0;
  const MAX_AT_ONCE = 2;

  // force: 설정 창 미리듣기처럼 무조건 재생
  function play(kind, index, volume, pitch, force) {
    if (kind !== 'cat' && kind !== 'dog') return false;
    const url = fileFor(kind, index);
    if (!url) return false;
    const t = performance.now();
    if (!force && (playing.size >= MAX_AT_ONCE || t - lastAt < 350)) return false;
    lastAt = t;
    try {
      const base = cache.get(url);
      const au = base && !playing.has(base) ? base : new Audio(url);
      au.currentTime = 0;
      au.volume = Math.max(0, Math.min(1, volume == null ? 0.6 : volume));
      au.preservesPitch = false; au.mozPreservesPitch = false; au.webkitPreservesPitch = false;
      au.playbackRate = Math.max(0.88, Math.min(1.15, pitch || 1)); // 매번 살짝 다르게
      playing.add(au);
      const done = () => playing.delete(au);
      au.onended = done; au.onerror = done;
      setTimeout(done, 4000);
      au.play().catch(done);
      return true;
    } catch (e) { return false; }
  }

  global.PetSounds = { CAT, DOG, RANDOM, play, setFiles, hasFile, count };
})(window);

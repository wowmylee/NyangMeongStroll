(() => {
  const API = window.catAPI || { // 브라우저 단독 테스트용
    getState: async () => ({ settings: { cats: [{ id: 'a', breed: 'tabby', name: '고등어' }, { id: 'b', breed: 'dog-corgi', name: '코기' }], size: 90, activity: 1, region: null, sound: false }, display: { width: 1920, height: 1080, workArea: { x: 0, y: 0, w: 1920, h: 1040 } } }),
    getDisplays: async () => [{ id: 1, label: '모니터 1 (1920×1080) · 주 모니터' }],
    getPacks: async () => window.__testPacks || [],
    savePack: async (p) => { (window.__testPacks = window.__testPacks || []).push({ ...p, img: p.png }); return p.id; },
    deletePack: async () => true,
    saveSettings() {}, startSelectRegion() {}, onSettings() {}, onPacksChanged() {}, quit() {}
  };
  const Art = window.CatArt;
  const I18N = window.I18N, T = I18N.t;
  const $ = (id) => document.getElementById(id);
  const MAX = 8;
  let S = null, D = null;
  const previews = []; // { canvas, breed(), pose, off, kind }

  const NAMES = {
    tabby: ['고등어', '보리', '구름'], himalayan: ['라떼', '모카', '솜이'], calico: ['삼색이', '봄이', '꽃님'], mainecoon: ['사자', '대장', '호랑'],
    persian: ['눈송이', '설기', '두부'], british: ['뭉치', '블루', '찹쌀'], devonrex: ['요정', '나비', '별이'], abyssinian: ['아비', '단풍', '여우'],
    fold: ['모찌', '푸딩', '크림'], sphynx: ['쭈글이', '복숭아', '토토'],
    'dog-maltese': ['몰티', '솜사탕'], 'dog-poodle': ['초코', '푸딩'], 'dog-pomeranian': ['뽀미', '단풍'], 'dog-bichon': ['구름이', '몽실'],
    'dog-corgi': ['코기', '식빵'], 'dog-golden': ['골디', '해피'], 'dog-shihtzu': ['시루', '복실'], 'dog-chihuahua': ['치치', '콩이'],
    'dog-jindo': ['백구', '진순'], 'dog-lab': ['라봉', '누룽지']
  };

  function save(patch) { Object.assign(S, patch); API.saveSettings(patch); }

  // ---- 미리보기 애니메이션 ----
  function paint(cv, breed, pose, t) {
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const f = Art.frameSize(breed, pose, t * 6);
    const k = Math.min(cv.height / (f.h + 18), cv.width / (f.w + 14));
    ctx.translate(cv.width / 2, cv.height - 6 * k);
    ctx.scale(k, k);
    Art.drawCat(ctx, breed, { pose, t, walkPhase: t * 6 });
  }
  function loop() {
    const t = performance.now() / 1000;
    previews.forEach(p => { if (p.canvas.isConnected) paint(p.canvas, p.breed(), p.pose, t + p.off); });
    drawSizePreview(t);
    requestAnimationFrame(loop);
  }
  function drawSizePreview(t) {
    const cv = $('sizePrev'); if (!S) return;
    const ctx = cv.getContext('2d');
    const r = cv.width / 380;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const h = S.size, fit = Math.min(1, 118 / h);
    const list = S.cats.length ? S.cats : [{ breed: 'tabby' }];
    const gap = Math.min(cv.width / (list.length + 1), h * fit * r * 0.95);
    list.forEach((c, i) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(cv.width / 2 + (i - (list.length - 1) / 2) * gap, cv.height - 8 * r);
      ctx.scale(h / 100 * fit * r, h / 100 * fit * r);
      Art.drawCat(ctx, c.breed, { pose: 'sit', t: t + i });
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#B9919D'; ctx.font = `${12 * r}px sans-serif`;
    ctx.fillText(fit < 1 ? T('shrunk', { p: Math.round(fit * 100) }) : T('realSize'), 8 * r, 16 * r);
  }

  // ---- 우리 집 동물 ----
  function breedOptions(sel, current) {
    sel.innerHTML = '';
    Art.packs.forEach(p => {
      const g = document.createElement('optgroup'); g.label = I18N.packName(p);
      Object.entries(p.breeds).forEach(([k, b]) => {
        const o = document.createElement('option'); o.value = k; o.textContent = I18N.breedLabel(k, b); if (k === current) o.selected = true; g.appendChild(o);
      });
      sel.appendChild(g);
    });
  }

  function renderCats() {
    const list = $('catList');
    list.innerHTML = '';
    for (let i = previews.length - 1; i >= 0; i--) if (previews[i].kind === 'cat') previews.splice(i, 1);
    S.cats.forEach((c, i) => {
      const row = document.createElement('div'); row.className = 'cat';
      const cv = document.createElement('canvas'); cv.width = 116; cv.height = 116;
      const fields = document.createElement('div'); fields.className = 'fields';
      const name = document.createElement('input'); name.type = 'text'; name.value = c.name || ''; name.placeholder = T('namePh'); name.maxLength = 12;
      // 설정이 저장될 때마다 S가 새 객체로 바뀌므로, 항상 id로 현재 동물을 찾아서 고쳐요
      const cur = () => S.cats.find(x => x.id === c.id) || c;
      let tmr, composing = false;
      const saveName = () => { clearTimeout(tmr); const v = name.value.trim(); const t = cur(); if (t.name === v) return; t.name = v; c.name = v; save({ cats: S.cats }); };
      name.addEventListener('compositionstart', () => { composing = true; });
      name.addEventListener('compositionend', () => { composing = false; clearTimeout(tmr); tmr = setTimeout(saveName, 300); });
      name.addEventListener('input', () => { if (composing) return; clearTimeout(tmr); tmr = setTimeout(saveName, 300); });
      name.addEventListener('change', saveName);
      name.addEventListener('blur', saveName);
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { saveName(); name.blur(); } });
      const sel = document.createElement('select');
      breedOptions(sel, c.breed);
      sel.addEventListener('change', () => { const t = cur(); t.breed = sel.value; c.breed = sel.value; save({ cats: S.cats }); });
      fields.append(name, sel);
      const del = document.createElement('button'); del.className = 'del'; del.title = T('sendHome'); del.textContent = '✕';
      del.addEventListener('click', () => {
        if (S.cats.length <= 1 && !confirm(T('lastPet'))) return;
        S.cats = S.cats.filter(x => x.id !== c.id); save({ cats: S.cats }); renderCats();
      });
      row.append(cv, fields, del);
      list.appendChild(row);
      previews.push({ kind: 'cat', canvas: cv, breed: () => cur().breed, pose: 'walk', off: i * 1.3 });
    });
    if (!S.cats.length) { list.innerHTML = '<p class="hint"></p>'; list.firstChild.textContent = T('noPets'); }
    $('catCount').textContent = T('petCount', { n: S.cats.length, max: MAX });
    $('breedGroups').style.opacity = S.cats.length >= MAX ? 0.45 : 1;
  }

  // ---- 데려올 동물 (그림 묶음별) ----
  function renderBreedGroups() {
    const root = $('breedGroups');
    root.innerHTML = '';
    for (let i = previews.length - 1; i >= 0; i--) if (previews[i].kind === 'grid') previews.splice(i, 1);
    Art.packs.forEach(p => {
      const head = document.createElement('div'); head.className = 'packHead';
      head.innerHTML = `<span></span><span class="tag ${p.builtin ? '' : 'mine'}">${p.builtin ? T('tagBuiltin') : T('tagMine')}</span>`;
      head.firstChild.textContent = I18N.packName(p);
      if (!p.builtin) {
        const del = document.createElement('button'); del.textContent = T('delPack');
        del.addEventListener('click', async () => {
          if (!confirm(T('delPackConfirm', { name: p.name }))) return;
          await API.deletePack(p.id);
          S.cats = S.cats.filter(c => !(c.breed in p.breeds));
          await reloadPacks();
        });
        head.appendChild(del);
      }
      root.appendChild(head);
      const g = document.createElement('div'); g.className = 'breeds';
      Object.entries(p.breeds).forEach(([k, b], i) => {
        const btn = document.createElement('button'); btn.className = 'breed'; btn.title = T('bring', { name: I18N.breedLabel(k, b) });
        const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120;
        btn.append(cv, document.createTextNode(I18N.breedLabel(k, b)));
        btn.addEventListener('click', () => {
          if (S.cats.length >= MAX) { alert(T('full', { max: MAX })); return; }
          const used = new Set(S.cats.map(c => c.name));
          const name = (I18N.lang === 'en' ? [] : (NAMES[k] || [])).find(n => !used.has(n)) || I18N.breedLabel(k, b);
          S.cats.push({ id: 'c' + Date.now().toString(36), breed: k, name });
          save({ cats: S.cats }); renderCats();
        });
        g.appendChild(btn);
        previews.push({ kind: 'grid', canvas: cv, breed: () => k, pose: 'sit', off: i * 0.7 });
      });
      root.appendChild(g);
    });
  }

  async function reloadPacks() {
    Art.setCustomPacks(await API.getPacks());
    renderBreedGroups(); renderCats();
  }

  // ---- 그림 추가 ----
  let imp = null; // { canvas, res, rows:[{ on, name, frames:[{f, role, face}] }] }

  function openImporter() {
    imp = null;
    $('impBody').hidden = true; $('drop').hidden = false; $('impSave').disabled = true;
    $('impMsg').textContent = ''; $('packName').value = ''; $('packVoice').value = 'other';
    $('importer').classList.add('show');
  }
  function closeImporter() { $('importer').classList.remove('show'); imp = null; for (let i = previews.length - 1; i >= 0; i--) if (previews[i].kind === 'imp') previews.splice(i, 1); }

  function readFile(file) {
    if (!file || !/^image\//.test(file.type)) { $('impMsg').textContent = T('notImage'); return; }
    $('impMsg').textContent = T('slicing');
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => setTimeout(() => analyzeImage(im, file.name), 30);
      im.onerror = () => { $('impMsg').textContent = T('cantOpen'); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function analyzeImage(im, fname) {
    const k = Math.min(1, 2600 / Math.max(im.width, im.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
    const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0, cv.width, cv.height);
    let res;
    try { res = SheetSlicer.analyze(ctx.getImageData(0, 0, cv.width, cv.height)); }
    catch (e) { console.error(e); $('impMsg').textContent = T('noAnimals'); return; }
    if (!res.rows.length) { $('impMsg').textContent = T('noAnimals'); return; }
    imp = {
      canvas: cv, res,
      rows: res.rows.map((frames, i) => {
        const g = SheetSlicer.guessRoles(res, frames);
        return { on: frames.length >= 2, name: T('rowName', { n: i + 1 }), frames: frames.map((f, j) => ({ f, role: g[j].role, face: g[j].face })) };
      })
    };
    if (!$('packName').value) $('packName').value = (fname || '').replace(/\.[^.]+$/, '').slice(0, 16) || T('myAnimal');
    $('drop').hidden = true; $('impBody').hidden = false; $('impSave').disabled = false;
    const n = imp.rows.reduce((s, r) => s + r.frames.length, 0);
    $('impMsg').textContent = T('found', { rows: imp.rows.length, n });
    renderImpRows();
  }

  const faceTxt = (f) => T(f === 1 ? 'faceR' : f === -1 ? 'faceL' : 'faceF');

  // 편집 중인 줄을 임시 종류로 만들어 미리보기 (원본 그림에서 바로 잘라 그림)
  function rowPreviewBreed(row) {
    const roles = {}, frames = {};
    row.frames.forEach((fr, j) => {
      const f = fr.f;
      frames['f' + j] = [f.x, f.y, f.w, f.h, fr.face];
      if (fr.role) (roles[fr.role] = roles[fr.role] || []).push('f' + j);
    });
    return { roles, frames };
  }

  function renderImpRows() {
    const root = $('impRows'); root.innerHTML = '';
    for (let i = previews.length - 1; i >= 0; i--) if (previews[i].kind === 'imp') previews.splice(i, 1);
    imp.rows.forEach((row, ri) => {
      const box = document.createElement('div'); box.className = 'impRow' + (row.on ? '' : ' off');
      const rh = document.createElement('div'); rh.className = 'rh';
      const chk = document.createElement('input'); chk.type = 'checkbox'; chk.checked = row.on;
      chk.addEventListener('change', () => { row.on = chk.checked; box.classList.toggle('off', !row.on); });
      const nm = document.createElement('input'); nm.type = 'text'; nm.value = row.name; nm.maxLength = 12; nm.placeholder = T('breedPh');
      nm.addEventListener('input', () => { row.name = nm.value.trim(); });
      const walkPrev = document.createElement('canvas'); walkPrev.width = 108; walkPrev.height = 108; walkPrev.title = T('walkPreview');
      rh.append(chk, nm, walkPrev);
      const strip = document.createElement('div'); strip.className = 'frames';
      row.frames.forEach((fr) => {
        const cell = document.createElement('div'); cell.className = 'fr';
        const c = document.createElement('canvas'); c.width = 148; c.height = 128;
        drawCutout(c, fr.f);
        const sel = document.createElement('select');
        sel.innerHTML = `<option value="">${T('unused')}</option>` + Art.ROLES.map(r => `<option value="${r}">${T('roles')[r]}</option>`).join('');
        sel.value = fr.role;
        sel.addEventListener('change', () => { fr.role = sel.value; });
        const face = document.createElement('button'); face.className = 'face'; face.textContent = faceTxt(fr.face);
        face.title = T('faceTip');
        face.addEventListener('click', () => { fr.face = fr.face === 1 ? -1 : fr.face === -1 ? 0 : 1; face.textContent = faceTxt(fr.face); });
        cell.append(c, sel, face);
        strip.appendChild(cell);
      });
      box.append(rh, strip);
      root.appendChild(box);
      previews.push({ kind: 'imp', canvas: walkPrev, custom: () => rowPreviewBreed(row), off: ri });
    });
  }

  function drawCutout(c, f) {
    const ctx = c.getContext('2d');
    const k = Math.min((c.width - 8) / f.w, (c.height - 8) / f.h);
    const tmp = cutFrame(f);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmp, (c.width - f.w * k) / 2, (c.height - f.h * k) / 2, f.w * k, f.h * k);
  }
  function cutFrame(f) {
    if (f._cut) return f._cut;
    const id = imp.canvas.getContext('2d').getImageData(f.x, f.y, f.w, f.h);
    const set = new Set(f.comps), { lab, W } = imp.res;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (!set.has(lab[(f.y + y) * W + f.x + x])) id.data[(y * f.w + x) * 4 + 3] = 0;
    SheetSlicer.cleanEdges(id, imp.res.bg, 3);
    const t = document.createElement('canvas'); t.width = f.w; t.height = f.h; t.getContext('2d').putImageData(id, 0, 0);
    return (f._cut = t);
  }

  // 편집 중 걷기 미리보기 (아틀라스 없이 잘라둔 조각으로)
  function paintImp(p, t) {
    const b = p.custom();
    const walk = b.roles.walk || b.roles.jump || b.roles.sit || b.roles.stand;
    const ctx = p.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
    if (!walk) { ctx.fillStyle = '#C9A9B3'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(T('noWalk'), 54, 58); return; }
    const name = walk[Math.floor(t * 5) % walk.length];
    const fr = imp.rows.flatMap(r => r.frames).find(x => b.frames[name][0] === x.f.x && b.frames[name][1] === x.f.y);
    if (!fr) return;
    const f = fr.f, cut = cutFrame(f);
    const k = Math.min(96 / f.w, 96 / f.h);
    ctx.translate(54, 102);
    if (fr.face === -1) ctx.scale(-1, 1);
    ctx.drawImage(cut, -f.w * k / 2, -f.h * k, f.w * k, f.h * k);
  }

  async function saveImport() {
    if (!imp) return;
    const rows = imp.rows.filter(r => r.on);
    if (!rows.length) { $('impMsg').textContent = T('pickRow'); return; }
    for (const r of rows) {
      const roles = new Set(r.frames.map(f => f.role));
      if (!['sit', 'stand', 'walk'].some(x => roles.has(x))) { $('impMsg').textContent = T('needBase', { name: r.name }); return; }
    }
    $('impSave').disabled = true; $('impMsg').textContent = T('saving');
    const id = 'p' + Date.now().toString(36);
    const used = rows.flatMap(r => r.frames.filter(f => f.role));
    const atlas = SheetSlicer.buildAtlas(imp.canvas, imp.res, used.map(u => u.f), 1.5);
    const breeds = {};
    let n = 0;
    rows.forEach((r, ri) => {
      const frames = {}, roles = {};
      r.frames.forEach((fr) => {
        if (!fr.role) return;
        const rect = atlas.rects[n++];
        const name = 'f' + Object.keys(frames).length;
        frames[name] = [...rect, fr.face];
        (roles[fr.role] = roles[fr.role] || []).push(name);
      });
      breeds[`${id}-${ri}`] = { label: r.name || T('rowName', { n: ri + 1 }), frames, roles };
    });
    await API.savePack({ id, name: $('packName').value.trim() || T('myAnimal'), voice: $('packVoice').value, breeds, png: atlas.canvas.toDataURL('image/png') });
    closeImporter();
    await reloadPacks();
    $('breedGroups').lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---- 범위 ----
  function renderRegion() {
    const full = D.workArea, r = S.region;
    $('regionText').textContent = r
      ? T('regionCustom', r)
      : T('regionFull', full);
  }
  async function renderDisplays() {
    const list = await API.getDisplays();
    const sel = $('display'); sel.innerHTML = '';
    list.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.label; sel.appendChild(o); });
    sel.value = S.displayId != null && list.some(d => d.id === S.displayId) ? S.displayId : list[0]?.id;
    sel.disabled = list.length < 2;
  }

  function bind() {
    $('size').value = S.size; $('sizeOut').textContent = S.size + 'px';
    $('size').addEventListener('input', (e) => { const v = +e.target.value; $('sizeOut').textContent = v + 'px'; save({ size: v }); });
    const actLabel = (v) => T(v < 0.8 ? 'actSlow' : v > 1.25 ? 'actFast' : 'actMid');
    $('activity').value = S.activity || 1; $('actOut').textContent = actLabel(S.activity || 1);
    $('activity').addEventListener('input', (e) => { const v = +e.target.value; $('actOut').textContent = actLabel(v); save({ activity: v }); });
    ['sound', 'showNames', 'paused', 'autoStart'].forEach(k => {
      $(k).checked = !!S[k];
      $(k).addEventListener('change', (e) => save({ [k]: e.target.checked }));
    });
    // 소리
    const fillSounds = () => {
      [['catSound', PetSounds.CAT], ['dogSound', PetSounds.DOG]].forEach(([id, list]) => {
        const sel = $(id), v = S[id] ?? PetSounds.RANDOM;
        const kind = id === 'catSound' ? 'cat' : 'dog';
        const n = PetSounds.count(kind);
        const rnd = `<option value="${PetSounds.RANDOM}">🎲 ${T('soundRandom')} (${n})</option>`;
        sel.innerHTML = rnd + list.map((x, i) => PetSounds.hasFile(kind, i)
          ? `<option value="${i}">🎵 ${I18N.lang === 'en' ? x.en : x.ko}</option>`
          : `<option value="${i}" disabled>${I18N.lang === 'en' ? x.en : x.ko} — ${T('noFile')}</option>`).join('');
        sel.value = v;
        if (sel.value === '') sel.value = PetSounds.RANDOM;
      });
    };
    fillSounds();
    $('openSounds').addEventListener('click', () => API.openSoundFolder && API.openSoundFolder());
    $('openImages').addEventListener('click', () => API.openImageFolder && API.openImageFolder());
    const loadSounds = async () => { try { if (API.getSoundFiles) PetSounds.setFiles(await API.getSoundFiles()); } catch (e) {} fillSounds(); };
    if (API.onSoundsChanged) API.onSoundsChanged(loadSounds);
    loadSounds();
    const preview = (kind, v) => PetSounds.play(kind, v, S.volume ?? 0.6, 1, true);
    $('catSound').addEventListener('change', (e) => { save({ catSound: +e.target.value }); preview('cat', +e.target.value); });
    $('dogSound').addEventListener('change', (e) => { save({ dogSound: +e.target.value }); preview('dog', +e.target.value); });
    $('testCat').addEventListener('click', () => preview('cat', S.catSound ?? PetSounds.RANDOM));
    $('testDog').addEventListener('click', () => preview('dog', S.dogSound ?? PetSounds.RANDOM));
    const volTxt = (v) => Math.round(v * 100) + '%';
    $('volume').value = S.volume ?? 0.6; $('volOut').textContent = volTxt(S.volume ?? 0.6);
    $('volume').addEventListener('input', (e) => { $('volOut').textContent = volTxt(+e.target.value); save({ volume: +e.target.value }); });
    // 언어
    $('lang').value = I18N.lang;
    $('lang').addEventListener('change', (e) => {
      save({ lang: e.target.value });
      I18N.set(e.target.value); I18N.apply(); document.title = T('settingsTitle');
      fillSounds(); $('actOut').textContent = actLabel(+$('activity').value);
      renderBreedGroups(); renderCats(); renderRegion();
      if (imp) renderImpRows();
    });
    $('display').addEventListener('change', (e) => save({ displayId: Number(e.target.value) }));
    $('pickRegion').addEventListener('click', () => API.startSelectRegion());
    $('fullRegion').addEventListener('click', () => { save({ region: null }); renderRegion(); });
    $('quit').addEventListener('click', () => API.quit());

    $('addPack').addEventListener('click', openImporter);
    $('impCancel').addEventListener('click', closeImporter);
    $('impSave').addEventListener('click', saveImport);
    $('drop').addEventListener('click', () => $('file').click());
    $('file').addEventListener('change', (e) => { readFile(e.target.files[0]); e.target.value = ''; });
    const drop = $('drop');
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); readFile(e.dataTransfer.files[0]); });
  }

  API.onSettings(({ settings, display }) => {
    S = settings; D = display;
    renderRegion();
    $('paused').checked = !!S.paused;
    if (S.cats.length !== $('catList').querySelectorAll('.cat').length) renderCats();
  });
  API.onPacksChanged(() => reloadPacks());

  // 미리보기 루프에 그림 추가 창 미리보기 포함
  function loopAll() {
    const t = performance.now() / 1000;
    previews.forEach(p => {
      if (!p.canvas.isConnected) return;
      if (p.kind === 'imp') paintImp(p, t); else paint(p.canvas, p.breed(), p.pose, t + p.off);
    });
    drawSizePreview(t);
    requestAnimationFrame(loopAll);
  }

  API.getState().then(async ({ settings, display }) => {
    S = settings; D = display;
    I18N.set(S.lang || 'ko'); I18N.apply(); document.title = T('settingsTitle');
    Art.setCustomPacks(await API.getPacks());
    // 예전 버전 종류 이름 / 지워진 그림의 동물 정리
    const fixed = S.cats.map(c => ({ ...c, breed: Art.resolve(c.breed) }));
    if (fixed.some((c, i) => c.breed !== S.cats[i].breed)) { S.cats = fixed; save({ cats: S.cats }); }
    previews.push({ kind: 'logo', canvas: $('logo'), breed: () => (S.cats[0] && S.cats[0].breed) || 'tabby', pose: 'sit', off: 0 });
    renderBreedGroups(); renderCats(); renderRegion(); bind();
    await renderDisplays();
    loopAll();
  });
})();

// 한국어 / English 화면 글자
(function (global) {
  const D = {
    ko: {
      appName: '냥멍마실', settingsTitle: '냥멍마실 설정',
      headerHelp: '동물에 마우스를 올리면 놀아주기·밥주기 · 클릭하면 쓰담 · 드래그하면 옮기기',
      myPets: '🏠 우리 집 동물', adopt: '🐾 데려올 동물', adoptHint: '눌러서 데려오기 (최대 8마리)',
      petCount: '{n} / {max}마리', noPets: '아직 아무도 없어요. 아래에서 데려와 주세요!',
      namePh: '이름', sendHome: '집으로 보내기', lastPet: '마지막 동물이에요. 정말 보낼까요?',
      full: '최대 {max}마리까지 함께 놀 수 있어요.', bring: '{name} 데려오기',
      tagBuiltin: '🔒 기본', tagMine: '내 그림', delPack: '🗑 그림 삭제',
      delPackConfirm: "'{name}' 그림을 삭제할까요?\n이 그림의 동물들도 화면에서 사라져요.",
      addPack: '➕ 내 그림으로 동물 추가하기',
      sizeSec: '📏 크기와 성격', size: '동물 크기', activity: '활동량', actSlow: '느긋', actMid: '보통', actFast: '활발',
      realSize: '실제 화면 크기', shrunk: '실제보다 {p}%로 축소해서 보여줘요',
      regionSec: '🗺️ 돌아다닐 범위', monitor: '모니터', drawRegion: '✏️ 마우스로 범위 그리기', fullRegion: '모니터 전체',
      regionCustom: '직접 지정한 범위: 왼쪽 {x}, 위 {y}부터 {w}×{h}px', regionFull: '모니터 전체 (작업 표시줄 제외, {w}×{h}px)',
      soundSec: '🔊 소리', sound: '소리 켜기', soundDesc: '울 때·밥 먹을 때·쓰다듬을 때 소리를 내요',
      catSound: '고양이 소리', dogSound: '강아지 소리', volume: '소리 크기', listen: '▶ 듣기',
      soundFileHint: '<b>소리 폴더</b>에 넣은 녹음 파일(<b>cat1~cat5</b>, <b>dog1~dog5</b> · wav/mp3)만 사용해요. 파일을 바꾸면 바로 반영돼요. 🎲 랜덤은 매번 다른 소리로 울어요.',
      soundRandom: '랜덤 (매번 다르게)', noFile: '파일 없음',
      openSounds: '📂 소리 폴더 열기', openImages: '🖼️ 그림 폴더 열기', myFile: '🎵 내 파일',
      etcSec: '⚙️ 기타', names: '이름표 보이기', namesDesc: '동물 아래에 이름을 표시해요',
      hide: '잠깐 숨기기', hideDesc: '발표·화면 공유할 때 켜두세요', autoStart: '컴퓨터 켤 때 자동 실행',
      language: '언어 / Language',
      footer: '창을 닫아도 동물들은 계속 놀아요 · 트레이 아이콘에서 다시 열기', quit: '앱 종료',
      impTitle: '🖼️ 내 그림으로 동물 추가',
      impGuide: '한 줄에 한 종류씩, 여러 동작이 나란히 그려진 그림(스프라이트 시트)을 넣어주세요. 배경은 한 가지 색이어야 해요.<br>그림을 넣으면 자동으로 잘라서 동작을 맞춰줘요. 틀린 건 각 그림 아래에서 바꾸면 돼요. 화살표(→ ←)는 그 그림 속 동물이 바라보는 방향이에요.',
      impDrop: '<b>여기를 눌러 그림 파일 고르기</b><br>또는 파일을 끌어다 놓기 (PNG·JPG)',
      packNamePh: '묶음 이름 (예: 토끼)', voiceOther: '울음: 기타 (♪)', voiceCat: '울음: 야옹', voiceDog: '울음: 멍멍',
      close: '닫기', addBtn: '추가하기', notImage: '그림 파일(PNG·JPG)을 골라주세요.', slicing: '그림을 자르는 중이에요...',
      cantOpen: '그림을 열 수 없어요.', noAnimals: '그림에서 동물을 찾지 못했어요. 배경이 한 가지 색인 그림인지 확인해 주세요.',
      found: '{rows}줄, 그림 {n}개를 찾았어요. 동작이 맞는지 확인하고 [추가하기]를 눌러주세요.',
      rowName: '{n}번', breedPh: '종류 이름', walkPreview: '걷기 미리보기', noWalk: '걷기 없음', unused: '안 씀',
      faceTip: '그림 속 동물이 바라보는 방향 (눌러서 바꾸기)', faceR: '→ 오른쪽', faceL: '← 왼쪽', faceF: '• 정면',
      pickRow: '추가할 줄을 하나 이상 체크해 주세요.', needBase: "'{name}' 줄에 앉기·서 있기·걷기 중 하나는 꼭 골라주세요.",
      saving: '저장하는 중...', myAnimal: '내 동물',
      roles: { walk: '걷기', sit: '앉기', stand: '서 있기', loaf: '엎드리기', sleep: '잠자기', jump: '점프·달리기', play: '놀기', stretch: '기지개', eat: '밥먹기', cheer: '만세·기쁨', talk: '울기·짖기', back: '뒤돌기' },
      // 오버레이
      play: '🧶 놀아주기', feed: '🍚 밥주기', ball: '⚽ 공놀이',
      selTitle: '🐾 동물들이 놀 범위를 드래그해서 그려주세요', selHint: 'Esc 취소 · 놓으면 바로 저장돼요',
      selSmall: '범위가 너무 작아요! 동물이 들어갈 만큼 크게 그려주세요', selFull: '모니터 전체로', selCancel: '취소'
    },
    en: {
      appName: 'NyangMeongStroll', settingsTitle: 'NyangMeongStroll Settings',
      headerHelp: 'Hover a pet to play or feed · Click to pet · Drag to move',
      myPets: '🏠 My pets', adopt: '🐾 Adopt a pet', adoptHint: 'Click to adopt (up to 8)',
      petCount: '{n} / {max} pets', noPets: 'Nobody here yet. Adopt someone below!',
      namePh: 'Name', sendHome: 'Send home', lastPet: 'This is your last pet. Send it home?',
      full: 'You can have up to {max} pets at once.', bring: 'Adopt {name}',
      tagBuiltin: '🔒 Built-in', tagMine: 'My images', delPack: '🗑 Delete images',
      delPackConfirm: "Delete the '{name}' images?\nPets using them will leave the screen too.",
      addPack: '➕ Add animals from my own image',
      sizeSec: '📏 Size & personality', size: 'Pet size', activity: 'Activity', actSlow: 'Lazy', actMid: 'Normal', actFast: 'Lively',
      realSize: 'Actual size on screen', shrunk: 'Shown at {p}% of actual size',
      regionSec: '🗺️ Roaming area', monitor: 'Monitor', drawRegion: '✏️ Draw area with mouse', fullRegion: 'Whole monitor',
      regionCustom: 'Custom area: from left {x}, top {y}, {w}×{h}px', regionFull: 'Whole monitor (excluding taskbar, {w}×{h}px)',
      soundSec: '🔊 Sound', sound: 'Sound on', soundDesc: 'Pets make sounds when they call, eat or get petted',
      catSound: 'Cat voice', dogSound: 'Dog voice', volume: 'Volume', listen: '▶ Play',
      soundFileHint: 'Only recordings in the <b>sounds folder</b> are used (<b>cat1–cat5</b>, <b>dog1–dog5</b> · wav/mp3). Changes apply right away. 🎲 Random picks a different one each time.',
      soundRandom: 'Random (different each time)', noFile: 'no file',
      openSounds: '📂 Open sounds folder', openImages: '🖼️ Open images folder', myFile: '🎵 My file',
      etcSec: '⚙️ Other', names: 'Show name tags', namesDesc: 'Show names under the pets',
      hide: 'Hide for a while', hideDesc: 'Handy for presentations or screen sharing', autoStart: 'Start when computer starts',
      language: '언어 / Language',
      footer: 'Pets keep playing after you close this window · Reopen from the tray icon', quit: 'Quit app',
      impTitle: '🖼️ Add animals from my image',
      impGuide: 'Use a sprite sheet: one animal per row, several poses side by side, on a single-color background.<br>The image is cut up and poses are guessed automatically. Fix any wrong ones under each picture. The arrow (→ ←) is the direction the animal in that picture faces.',
      impDrop: '<b>Click here to choose an image</b><br>or drag a file here (PNG·JPG)',
      packNamePh: 'Set name (e.g. Rabbits)', voiceOther: 'Voice: other (♪)', voiceCat: 'Voice: meow', voiceDog: 'Voice: woof',
      close: 'Close', addBtn: 'Add', notImage: 'Please choose an image file (PNG·JPG).', slicing: 'Cutting up the image...',
      cantOpen: "Couldn't open the image.", noAnimals: "Couldn't find any animals. Make sure the background is a single color.",
      found: 'Found {rows} rows and {n} pictures. Check the poses, then press [Add].',
      rowName: 'No.{n}', breedPh: 'Breed name', walkPreview: 'Walk preview', noWalk: 'No walk', unused: 'Unused',
      faceTip: 'Direction the animal faces in this picture (click to change)', faceR: '→ Right', faceL: '← Left', faceF: '• Front',
      pickRow: 'Check at least one row to add.', needBase: "Row '{name}' needs at least one of sit, stand or walk.",
      saving: 'Saving...', myAnimal: 'My animals',
      roles: { walk: 'Walk', sit: 'Sit', stand: 'Stand', loaf: 'Lie down', sleep: 'Sleep', jump: 'Jump/run', play: 'Play', stretch: 'Stretch', eat: 'Eat', cheer: 'Cheer', talk: 'Meow/bark', back: 'Turn away' },
      play: '🧶 Play', feed: '🍚 Feed', ball: '⚽ Ball',
      selTitle: '🐾 Drag to draw where your pets can roam', selHint: 'Esc to cancel · Saved when you let go',
      selSmall: 'Too small! Draw an area big enough for a pet', selFull: 'Whole monitor', selCancel: 'Cancel'
    }
  };

  // 기본 동물 종류 영어 이름
  const BREED_EN = {
    tabby: 'Tabby', himalayan: 'Himalayan', calico: 'Calico', mainecoon: 'Maine Coon', persian: 'Persian', british: 'British Shorthair',
    devonrex: 'Devon Rex', abyssinian: 'Abyssinian', fold: 'Scottish Fold', sphynx: 'Sphynx',
    'dog-maltese': 'Maltese', 'dog-poodle': 'Poodle', 'dog-pomeranian': 'Pomeranian', 'dog-bichon': 'Bichon', 'dog-corgi': 'Corgi',
    'dog-golden': 'Golden Retriever', 'dog-shihtzu': 'Shih Tzu', 'dog-chihuahua': 'Chihuahua', 'dog-jindo': 'Jindo', 'dog-lab': 'Lab Puppy'
  };
  const PACK_EN = { cats: 'Cats', dogs: 'Dogs' };

  let lang = 'ko';
  function t(key, vars) {
    let s = (D[lang] && D[lang][key]) ?? D.ko[key] ?? key;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return s;
  }
  function breedLabel(key, b) { return lang === 'en' && BREED_EN[key] ? BREED_EN[key] : b.label; }
  function packName(p) { return lang === 'en' && PACK_EN[p.id] ? PACK_EN[p.id] : p.name; }

  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    (root || document).querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.documentElement.lang = lang;
  }

  global.I18N = {
    get lang() { return lang; },
    set(l) { lang = l === 'en' ? 'en' : 'ko'; },
    t, apply, breedLabel, packName
  };
})(window);

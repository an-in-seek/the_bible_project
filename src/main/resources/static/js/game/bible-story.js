const STORAGE_KEY = 'elseeker.bibleStory.passover.v2';
const STATE_VERSION = 2;

const PROVENANCE_LABELS = {
  scripture: ['성경 기록', 'story-badge-scripture'],
  direct: ['성경의 직접 연결', 'story-badge-direct'],
  canonical: ['정경적 연결', 'story-badge-canonical'],
  background: ['역사적 배경', 'story-badge-background'],
  creative: ['게임적 창작', 'story-badge-creative']
};

const FRAGMENTS = {
  blood: {title: '어린양의 피', summary: '문기둥과 문 위쪽에 바른 구원의 표시'},
  promise: {title: '지켜진 약속', summary: '약속하신 그대로 지나간 밤의 기억'},
  path: {title: '열린 길', summary: '사람의 힘이 아니라 하나님의 말씀으로 열린 길'},
  bread: {title: '날마다의 양식', summary: '날마다 하늘에서 내려온 하루치 먹을거리'}
};

const TESTIMONIES = [
  {
    id: 'bread',
    text: '내가 바로 생명의 빵입니다. 나에게 오는 사람은 결코 배고프지 않을 것입니다.',
    ref: '요한복음 6:35',
    href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=6&verseNumber=35'
  },
  {
    id: 'blood',
    text: '보세요. 세상의 죄를 짊어지고 가시는 하나님의 어린양이십니다.',
    ref: '요한복음 1:29',
    href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=1&verseNumber=29'
  },
  {
    id: 'path',
    text: '우리 조상들은 모두 구름의 보호를 받으며 바다 한가운데를 지나갔고, 그 구름과 바다에서 모세에게 속하는 세례를 받았습니다.',
    ref: '고린도전서 10:1–2',
    href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=10&verseNumber=1'
  },
  {
    id: 'promise',
    text: '이 잔은 너희를 위해 흘리는 내 피로 세우는 새 언약이다.',
    ref: '누가복음 22:20',
    href: '/web/bible/verse?translationId=1&bookOrder=42&chapterNumber=22&verseNumber=20'
  }
];

const CHARACTER_PORTRAITS = {
  '기록자': '/images/game/bible-story-character-recorder.jpg',
  '아버지': '/images/game/bible-story-character-father.jpg',
  '미리암': '/images/game/bible-story-character-young-miriam.jpg',
  '말씀': '/images/game/bible-story-character-god.jpg',
  '백성': '/images/game/bible-story-character-people.jpg',
  '모세': '/images/game/bible-story-character-moses.jpg',
  '바로': '/images/game/bible-story-character-pharaoh.jpg',
  '천사': '/images/game/bible-story-character-angel.jpg'
};

const scenes = [
  {
    id: 'door',
    title: '문 앞에서',
    verb: '바르다',
    era: '이집트 고센 · 유월절 전날 밤',
    reference: '출애굽기 12장',
    theme: 'door',
    records: [
      {
        title: '유월절 어린양',
        provenance: 'scripture',
        body: '이스라엘의 각 가정이 유월절을 위해 흠 없는 어린양을 준비한 이야기입니다.',
        ref: '출애굽기 12장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12'
      },
      {
        title: '문에 바른 표시',
        provenance: 'scripture',
        body: '양의 피를 양쪽 문기둥과 문 위쪽에 바르면 그 집은 심판이 그냥 지나간다고 약속하셨습니다.',
        ref: '출애굽기 12:7, 13',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=7'
      },
      {
        title: '떠날 준비를 하는 식탁',
        provenance: 'scripture',
        body: '누룩 없는 빵과 쓴 나물을 서둘러 먹는 식사는, 곧 떠나야 한다는 뜻이었습니다.',
        ref: '출애굽기 12:8–11',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=8'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '이집트 온 땅에 아홉 번의 재앙이 지나갔다. 그런데도 바로는 끝내 고집을 꺾지 않았다.', ref: '출애굽기 7–10장'},
          {text: '이제 마지막 열 번째 재앙만 남았다. 이집트의 모든 맏이가 죽는 밤이었다.', ref: '출애굽기 11:4–5'},
          {who: '기록자', text: '나는 기록자다. 심판이 예고된 이 밤, 하나님이 자기 백성에게 미리 열어 두신 살 길을 기록하러 왔다.'},
          {text: '그 길은 흠 없는 어린양 한 마리였다. 고센 땅의 한 가정이 나를 맞아 주었다.', ref: '출애굽기 12:3–5'},
          {who: '아버지', text: '어린양은 잡아 두었어요. 이제 하나님이 말씀하신 대로 문에 피를 발라야 해요.'}
        ]
      },
      {
        type: 'door',
        prompt: '그릇에 담긴 피에 우슬초를 적셔서 양쪽 문기둥과 문 위쪽, 세 곳에 발라 주세요.',
        ref: '출애굽기 12:7, 22',
        doneLine: {who: '말씀', text: '내가 그 피를 보면 너희를 그냥 지나가겠다. 재앙이 너희를 해치지 못할 것이다.', ref: '출애굽기 12:13'}
      },
      {
        type: 'say',
        lines: [
          {who: '아버지', text: '이제 식탁 차례예요. 하나님이 정해 주신 것만 상에 올려 주세요.'}
        ]
      },
      {
        type: 'table',
        prompt: '유월절 규정에 맞는 세 가지를 골라 상에 올려 주세요.',
        ref: '출애굽기 12:8–11',
        items: [
          {
            label: '불에 구운 어린양',
            ok: true,
            image: '/images/game/bible-story-passover-lamb.jpg'
          },
          {label: '누룩을 넣어 부풀린 빵', ok: false, note: '누룩을 넣지 않은 빵과 함께 먹으라고 하셨어요. (출 12:8)'},
          {
            label: '누룩 없는 빵',
            ok: true,
            image: '/images/game/bible-story-unleavened-bread.jpg'
          },
          {label: '아침까지 남겨 둘 몫', ok: false, note: '아침까지 남겨 두지 말라고 하셨어요. (출 12:10)'},
          {
            label: '쓴 나물',
            ok: true,
            image: '/images/game/bible-story-bitter-herbs.jpg'
          },
          {label: '느긋한 잔치 차림', ok: false, note: '허리띠를 매고 서둘러 먹으라고 하셨어요. (출 12:11)'}
        ],
        doneLine: {who: '기록자', text: '식탁은 잔치가 아니라 떠날 준비였다. 이 밤의 모든 것이 하나님의 말씀을 향해 있었다.'}
      },
      {
        type: 'fragment',
        id: 'blood',
        journal: '한 가족이 어린양의 피를 문에 발랐다. 이 표시는 훗날 어떤 의미로 다시 읽히게 될까.'
      }
    ]
  },
  {
    id: 'night',
    title: '그 밤',
    verb: '지키다',
    era: '이집트 고센 · 유월절 밤',
    reference: '출애굽기 12:29–42',
    theme: 'night',
    records: [
      {
        title: '뜬눈으로 지킨 밤',
        provenance: 'scripture',
        body: '유월절 밤은 이스라엘이 대대로 기억하며 지킬 밤으로 기록되어 있습니다.',
        ref: '출애굽기 12:42',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=42'
      },
      {
        title: '이집트를 떠나다',
        provenance: 'scripture',
        body: '이스라엘 백성이 이집트를 떠나 광야를 향해 출발한 이야기입니다.',
        ref: '출애굽기 12:31–42',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=31'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '문이 닫혔다. 어린 미리암이 등불 옆에서 나를 올려다봤다.'},
          {who: '미리암', text: '기록자님, 밖에서 무슨 소리가 나는 것 같아요! 문을 열어 보면 안 될까요?'}
        ]
      },
      {
        type: 'choice',
        id: 'fear',
        prompt: '두려워하는 아이에게 뭐라고 답할까요?',
        options: [
          {
            value: 'promise',
            label: '주신 말씀을 다시 들려준다',
            reply: {who: '기록자', text: '“내가 그 피를 보면 너희를 그냥 지나가겠다.” 나는 약속을 그대로 다시 읽어 주었다.'}
          },
          {
            value: 'beside',
            label: '아무 말 없이 곁에 앉는다',
            reply: {text: '나는 등불 옆에 아이와 나란히 앉았다. 약속은 이미 문 위에 발려 있었다.'}
          }
        ]
      },
      {
        type: 'say',
        lines: [
          {who: '아버지', text: '기록자님, 오늘 밤을 뭐라고 기록하실 건가요?'}
        ]
      },
      {
        type: 'choice',
        id: 'record',
        prompt: '일지의 첫 줄을 골라 주세요.',
        options: [
          {
            value: 'obedience',
            label: '두려움 속에서도 지킨 순종의 밤',
            reply: {who: '아버지', text: '맞아요. 우리는 떨면서도 말씀대로 했지요.'}
          },
          {
            value: 'faithfulness',
            label: '약속하신 분이 지키시는 밤',
            reply: {who: '아버지', text: '맞아요. 이 문을 지키는 건 결국 우리가 아니지요.'}
          }
        ]
      },
      {
        type: 'vigil',
        prompt: '누르고 있는 동안 밤이 깊어 가요. 손을 떼지 말고 밤을 지새워 주세요.',
        stages: [
          '한밤중 — 이집트 온 땅에 큰 울음소리가 터졌다.',
          '그러나 이 집의 문 안은 조용했다.'
        ],
        doneLine: {phase: 'mourning', text: '이집트 전체가 울음바다가 되었다. 아직 밤이 깊은 시간, 바로가 사람을 보내 모세와 아론을 불렀다.', ref: '출애굽기 12:30–31'}
      },
      {
        type: 'say',
        lines: [
          {
            phase: 'release',
            who: '바로',
            word: true,
            text: '너희와 이스라엘 백성은 당장 일어나 내 백성에게서 떠나라. 너희 말대로 가서 여호와를 섬겨라.',
            ref: '출애굽기 12:31'
          },
          {text: '백성은 서둘러 일어나 이집트를 떠났다. 430년 만에 맞은 새벽이었다.', ref: '출애굽기 12:40–41'},
          {
            phase: 'cloud',
            text: '낮에는 구름기둥이 백성 앞에 서서 광야 길을 안내했다.',
            ref: '출애굽기 13:21–22'
          },
          {
            phase: 'fire',
            text: '밤에는 불기둥이 길을 밝혀 주었다. 광야 길은 그 기둥을 따라 이어졌다.',
            ref: '출애굽기 13:21–22'
          }
        ]
      },
      {
        type: 'fragment',
        id: 'promise',
        journal: '밤은 약속하신 그대로 지나갔다. 문을 지킨 것은 빗장이 아니라 하나님의 약속이었다.'
      }
    ]
  },
  {
    id: 'sea',
    title: '바다 앞에서',
    verb: '건너다',
    era: '홍해 · 추격의 아침',
    reference: '출애굽기 14장',
    theme: 'sea',
    records: [
      {
        title: '홍해를 건넌 백성',
        provenance: 'scripture',
        body: '앞을 가로막은 바다가 갈라지고, 이스라엘이 마른 땅을 밟고 건너 이집트 군대의 추격에서 벗어난 이야기입니다.',
        ref: '출애굽기 14장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=14'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {phase: 'shore', text: '구름기둥은 백성을 홍해 앞 바닷가로 데려갔다. 그곳에 진을 치라고 하신 말씀 그대로였다.', ref: '출애굽기 14:1–2'},
          {phase: 'army', text: '그 무렵 이집트에서는 바로와 신하들의 마음이 바뀌었다.', ref: '출애굽기 14:5'},
          {
            who: '바로',
            word: true,
            text: '우리가 대체 무슨 짓을 한 거냐! 이스라엘을 놓아주어 종살이에서 풀어 주다니!',
            ref: '출애굽기 14:5'
          },
          {text: '바로는 정예 전차 600대와 이집트의 모든 전차를 이끌고 추격에 나섰다.', ref: '출애굽기 14:7'},
          {text: '앞은 바다, 뒤는 이집트의 전차. 길이 완전히 끊겼다.'},
          {who: '백성', text: '이집트에 묻힐 무덤이 없어서 우리를 이 광야까지 끌고 나온 겁니까!', ref: '출애굽기 14:11'}
        ]
      },
      {
        type: 'seaChoice',
        id: 'sea',
        prompt: '기록자인 나도 막힌 바다 앞에 섰다. 무엇을 할까요?',
        options: [
          {value: 'back', label: '돌아갈 길을 찾는다', reply: '뒤를 돌아봤다. 전차가 일으킨 흙먼지가 이미 지평선을 덮고 있었다. 돌아갈 길은 없었다.'},
          {value: 'fight', label: '싸울 준비를 한다', reply: '지팡이와 막대기뿐인 행렬이 전차와 맞설 수는 없었다.'},
          {value: 'cry', label: '부르짖는다', reply: '백성이 울부짖는 소리가 바닷가를 가득 채웠다. 사람이 할 수 있는 일은 거기까지였다.'}
        ],
        wordLine: {who: '모세', word: true, text: '두려워하지 마세요. 가만히 서서, 여호와께서 오늘 여러분을 위해 하시는 일을 보세요.', ref: '출애굽기 14:13'},
        openLine: {text: '구름기둥이 뒤로 옮겨 가 이집트 군대와 이스라엘 사이를 가로막았다. 모세가 바다 위로 손을 내밀자 강한 동풍이 밤새 불었고, 바다가 갈라져 물이 양쪽에 벽처럼 섰다.', ref: '출애굽기 14:19–22'}
      },
      {
        type: 'seaCross',
        prompt: '전차가 뒤쫓아 옵니다. 버튼을 빠르게 연타해서 물벽 사이 마른 땅을 달려 건너 주세요!',
        steps: [
          '물벽 사이로 첫걸음을 내디뎠다.',
          '아이들과 노인들, 양 떼까지 마른 땅을 밟았다.',
          '마지막 사람이 바다를 건넜다.'
        ],
        doneLine: {text: '뒤쫓던 전차들 위로 물이 다시 덮쳤다. 바로의 군대는 한 명도 남지 않았다.', ref: '출애굽기 14:27–28'}
      },
      {
        type: 'say',
        lines: [
          {who: '기록자', text: '우리는 아무 길도 만들지 않았다. 그저 열린 길을 걸었을 뿐이다.'}
        ]
      },
      {
        type: 'fragment',
        id: 'path',
        journal: '바다 앞에서 사람이 고를 수 있는 길은 전부 막혀 있었다. 그 길을 연 것은 하나님의 말씀이었다.'
      }
    ]
  },
  {
    id: 'desert',
    title: '광야의 아침',
    verb: '줍다',
    era: '신 광야 · 만나의 날들',
    reference: '출애굽기 16장',
    theme: 'desert',
    records: [
      {
        title: '광야의 만나',
        provenance: 'scripture',
        body: '먹을 것이 없는 광야에서 날마다 만나가 주어지고, 쌓아 둔 것은 썩어 버린 이야기입니다.',
        ref: '출애굽기 16장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=16'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '바다를 건넌 노래는 오래가지 않았다. 백성은 기둥을 따라 수르 광야로 들어갔다.', ref: '출애굽기 15:22'},
          {text: '이집트를 떠난 지 한 달째, 신 광야에 이르러 먹을 것이 떨어지자 온 백성의 불평이 터져 나왔다.', ref: '출애굽기 16:1–2'},
          {who: '백성', text: '차라리 이집트에서 고기 솥 앞에 앉아 있을 때가 나았어요. 우리를 다 굶겨 죽일 셈인가요?', ref: '출애굽기 16:3'},
          {who: '말씀', text: '내가 너희를 위해 하늘에서 양식을 비처럼 내려 주겠다. 백성은 날마다 나가서 그날 먹을 만큼만 거두어라.', ref: '출애굽기 16:4'}
        ]
      },
      {
        type: 'manna',
        prompt: '한 사람에 한 오멜씩, 식구에게 필요한 만큼만 거둬 주세요.',
        doneLine: {who: '기록자', text: '나는 알게 됐다. 이 양식은 쌓아 두는 재산이 아니라, 날마다 새로 의지해야 하는 선물이었다.'}
      },
      {
        type: 'fragment',
        id: 'bread',
        journal: '만나는 하루치만 거둘 수 있었다. 쌓아 두는 법이 아니라 믿고 맡기는 법을 배우는 양식이었다.'
      }
    ]
  },
  {
    id: 'link',
    title: '잇다',
    verb: '잇다',
    era: '오랜 세월 후 · 신약의 증언',
    reference: '요한복음 · 누가복음 · 고린도전서',
    theme: 'link',
    records: [
      {
        title: '세례 요한의 증언',
        provenance: 'direct',
        body: '요한복음은 세례 요한이 예수님을 “하나님의 어린양”으로 증언했다고 기록합니다.',
        ref: '요한복음 1:29',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=1&verseNumber=29'
      },
      {
        title: '마지막 유월절 식탁',
        provenance: 'direct',
        body: '예수님이 유월절 식탁에서 빵과 잔을 나누시며 새 언약을 말씀하셨습니다.',
        ref: '누가복음 22:7–20',
        href: '/web/bible/verse?translationId=1&bookOrder=42&chapterNumber=22&verseNumber=7'
      },
      {
        title: '생명의 빵',
        provenance: 'direct',
        body: '예수님은 광야의 만나를 이어받아, 자신이 하늘에서 내려온 참된 빵이라고 말씀하셨습니다.',
        ref: '요한복음 6:32–35',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=6&verseNumber=32'
      },
      {
        title: '바다를 지난 백성과 그리스도',
        provenance: 'direct',
        body: '바울은 홍해를 건넌 일과 광야에서 받은 양식을 그리스도와 곧바로 연결합니다.',
        ref: '고린도전서 10:1–4',
        href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=10&verseNumber=1'
      },
      {
        title: '우리의 유월절 양',
        provenance: 'direct',
        body: '바울은 그리스도를 우리의 유월절 양이라고 곧바로 말합니다.',
        ref: '고린도전서 5:7',
        href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=5&verseNumber=7'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '만나는 40년 동안 그치지 않았고, 백성은 마침내 약속의 땅에 들어갔다.', ref: '출애굽기 16:35'},
          {text: '그 뒤로도 이스라엘은 해마다 유월절을 지켰다. 어린양을 잡고, 문에 바른 피와 지켜 주신 그 밤을 기억했다.'},
          {
            phase: 'jordan',
            text: '그렇게 1,500년이 흘렀다. 어느 날 요단강가에서 세례 요한이 한 사람을 가리키며 외쳤다.'
          },
          {
            phase: 'john',
            who: '세례 요한',
            word: true,
            text: '보세요. 세상의 죄를 짊어지고 가시는 하나님의 어린양이십니다.',
            ref: '요한복음 1:29'
          },
          {
            phase: 'jesus',
            who: '기록자',
            text: '어린양이라니. 나는 낡은 두루마리에서 조각 네 개를 꺼냈다. 이 연결만큼은 내 손으로 직접 확인해야 한다.'
          }
        ]
      },
      {
        type: 'match',
        prompt: '조각을 누르고, 그 약속이 이루어지는 신약의 증언을 찾아 이어 주세요.',
        doneLine: {who: '기록자', text: '네 개의 선이 한 이름 위에서 만났다. 조각들이 그분을 만들어 낸 게 아니다. 처음부터 그분이 계셨고, 조각들은 줄곧 그분을 가리키고 있었다.'}
      },
      {
        type: 'say',
        lines: [
          {
            phase: 'jesus',
            text: '그리고 어린양이라 불리신 예수님은 유월절 저녁에 제자들과 마지막 식탁에 앉아 빵과 잔을 나누셨다.',
            ref: '누가복음 22:14–20'
          }
        ]
      }
    ]
  },
  {
    id: 'dawn',
    title: '어둠 뒤의 새벽',
    verb: '목격하다',
    era: '예루살렘 · 십자가와 빈 무덤',
    reference: '요한복음 19–20장 · 누가복음 24장',
    theme: 'dawn',
    records: [
      {
        title: '십자가',
        provenance: 'scripture',
        body: '복음서는 예수님이 십자가에서 죽으신 일을 기록합니다. 이 장면은 플레이어가 잘하든 못하든 바뀌지 않습니다.',
        ref: '요한복음 19장',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=19'
      },
      {
        title: '빈 무덤과 부활',
        provenance: 'scripture',
        body: '복음서는 예수님이 다시 살아나신 일과, 빈 무덤을 직접 확인한 사람들의 이야기를 기록합니다.',
        ref: '요한복음 20장',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=20'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {phase: 'cross', text: '다음 날, 유월절을 맞은 예루살렘. 예수님은 성문 밖에서 십자가에 달리셨다.', ref: '요한복음 19:17–18'},
          {phase: 'cross', who: '기록자', text: '이번에는 준비할 것도, 건널 바다도 없었다. 나는 그저 보았고, 기록했다.'},
          {phase: 'dark', text: '낮 열두 시부터 어둠이 온 땅을 덮었고, 세 시간 동안 이어졌다.', ref: '누가복음 23:44–45'},
          {phase: 'tomb', text: '사흘째 되던 날 이른 새벽, 여자들이 무덤을 찾아갔다. 무덤은 비어 있었다.', ref: '누가복음 24:1–3'},
          {phase: 'risen', who: '천사', word: true, text: '어째서 살아 계신 분을 죽은 사람들 사이에서 찾고 있습니까? 그분은 여기 계시지 않습니다. 다시 살아나셨습니다.', ref: '누가복음 24:5–6'}
        ]
      },
      {type: 'finale'}
    ]
  }
];

const elements = {};
let state = createInitialState();
let session = {beat: 0, line: 0};

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  cacheElements();
  setupListeners();

  const savedState = loadState();
  if (savedState) {
    state = savedState;
  }

  updateResumeButton();
  updateFragmentCount(false);
  renderSheet();
}

function cacheElements() {
  [
    'storyIntro', 'storyGame', 'storyEnding', 'storyStartButton', 'storyResumeButton',
    'storyExitButton', 'storyDots', 'storyHudScene', 'storySheetButton', 'storyFragmentCount',
    'storyBackdrop', 'storySceneEra', 'storySceneRef', 'storyPlayArea', 'storyDialogue',
    'storySheet', 'storySheetClose', 'storyTabJournal', 'storyTabArchive',
    'storyJournalPanel', 'storyArchivePanel', 'storyJournalList', 'storyJournalEmpty',
    'storyArchiveRecords', 'storyResetButton', 'storyEndingTitle', 'storyEpilogue',
    'storyEndingSheetButton', 'storyRestartButton', 'storyLiveRegion'
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function setupListeners() {
  elements.storyStartButton.addEventListener('click', startNewStory);
  elements.storyResumeButton.addEventListener('click', resumeStory);
  elements.storyExitButton.addEventListener('click', exitToIntro);
  elements.storySheetButton.addEventListener('click', openSheet);
  elements.storyEndingSheetButton.addEventListener('click', openSheet);
  elements.storySheetClose.addEventListener('click', closeSheet);
  elements.storySheet.addEventListener('click', (event) => {
    if (event.target === elements.storySheet) {
      closeSheet();
    }
  });
  elements.storyTabJournal.addEventListener('click', () => selectSheetTab('journal'));
  elements.storyTabArchive.addEventListener('click', () => selectSheetTab('archive'));
  elements.storyResetButton.addEventListener('click', confirmRestart);
  elements.storyRestartButton.addEventListener('click', confirmRestart);
}

// ---------------------------------------------------------------- state

function createInitialState() {
  return {
    version: STATE_VERSION,
    sceneIndex: 0,
    fragments: [],
    choices: {},
    journal: [],
    unlockedScenes: [],
    mannaGreed: false,
    isComplete: false
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!isValidState(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isValidState(candidate) {
  return candidate
      && candidate.version === STATE_VERSION
      && Number.isInteger(candidate.sceneIndex)
      && candidate.sceneIndex >= 0
      && candidate.sceneIndex < scenes.length
      && Array.isArray(candidate.fragments)
      && Array.isArray(candidate.journal)
      && Array.isArray(candidate.unlockedScenes)
      && candidate.choices
      && typeof candidate.choices === 'object'
      && typeof candidate.mannaGreed === 'boolean'
      && typeof candidate.isComplete === 'boolean';
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장소가 차단되어도 현재 세션의 플레이는 계속 진행합니다.
  }
  updateResumeButton();
}

function hasSavedProgress() {
  return state.isComplete || state.sceneIndex > 0 || state.journal.length > 0;
}

function updateResumeButton() {
  const hasProgress = hasSavedProgress();
  elements.storyResumeButton.classList.toggle('d-none', !hasProgress);
  elements.storyResumeButton.textContent = state.isComplete
      ? '완성된 기록을 봅니다'
      : `이어서 기록합니다 — ${scenes[state.sceneIndex].title}`;
}

function pushJournal(id, sceneTitle, text) {
  const existingIndex = state.journal.findIndex((entry) => entry.id === id);
  const entry = {id, sceneTitle, text};
  if (existingIndex >= 0) {
    state.journal[existingIndex] = entry;
  } else {
    state.journal.push(entry);
  }
}

// ---------------------------------------------------------------- flow

function startNewStory() {
  if (hasSavedProgress() && !window.confirm('기존 진행 기록을 지우고 새로 시작할까요?')) {
    return;
  }
  state = createInitialState();
  saveState();
  showGame();
  announce('새 기록을 시작합니다. 첫 번째 장면, 문 앞에서.');
}

function resumeStory() {
  if (state.isComplete) {
    showEnding();
    return;
  }
  showGame();
  announce(`${scenes[state.sceneIndex].title} 장면부터 이어서 기록합니다.`);
}

function showGame() {
  elements.storyIntro.classList.add('d-none');
  elements.storyEnding.classList.add('d-none');
  elements.storyGame.classList.remove('d-none');
  document.body.classList.add('is-story-playing');
  enterScene(state.sceneIndex);
}

function exitToIntro() {
  elements.storyGame.classList.add('d-none');
  elements.storyEnding.classList.add('d-none');
  elements.storyIntro.classList.remove('d-none');
  document.body.classList.remove('is-story-playing');
  updateResumeButton();
  window.scrollTo({top: 0, behavior: 'auto'});
  announce('처음 화면으로 나왔습니다. 진행은 장면 단위로 저장돼요.');
}

function enterScene(index) {
  state.sceneIndex = index;
  session = {beat: 0, line: 0};

  const scene = scenes[index];
  elements.storyBackdrop.dataset.theme = scene.theme;
  delete elements.storyBackdrop.dataset.phase;
  delete elements.storyBackdrop.dataset.sea;
  elements.storyBackdrop.style.removeProperty('--vigil');
  elements.storySceneEra.textContent = scene.era;
  elements.storySceneRef.textContent = scene.reference;
  elements.storyHudScene.textContent = `장면 ${index + 1} / ${scenes.length} · ${scene.title}`;
  renderDots();
  renderBeat();
}

function nextBeat() {
  const scene = scenes[state.sceneIndex];
  session.beat += 1;
  session.line = 0;
  if (session.beat >= scene.beats.length) {
    completeScene();
    return;
  }
  renderBeat();
}

function completeScene() {
  const scene = scenes[state.sceneIndex];
  if (!state.unlockedScenes.includes(scene.id)) {
    state.unlockedScenes.push(scene.id);
  }

  if (state.sceneIndex === scenes.length - 1) {
    state.isComplete = true;
    saveState();
    renderSheet();
    showEnding();
    return;
  }

  state.sceneIndex += 1;
  saveState();
  renderSheet();
  enterScene(state.sceneIndex);
  announce(`다음 장면, ${scenes[state.sceneIndex].title}.`);
}

function renderDots() {
  elements.storyDots.innerHTML = scenes.map((scene, index) => {
    const status = index < state.sceneIndex || state.isComplete
        ? ' is-done'
        : index === state.sceneIndex ? ' is-current' : '';
    return `<li class="story-dot${status}"></li>`;
  }).join('');
}

// ---------------------------------------------------------------- beat rendering

function renderBeat() {
  const scene = scenes[state.sceneIndex];
  const beat = scene.beats[session.beat];
  elements.storyPlayArea.innerHTML = '';
  elements.storyPlayArea.className = 'story-play-area';

  switch (beat.type) {
    case 'say':
      renderSayBeat(beat);
      break;
    case 'choice':
      renderChoiceBeat(scene, beat);
      break;
    case 'door':
      renderDoorBeat(beat);
      break;
    case 'table':
      renderTableBeat(beat);
      break;
    case 'vigil':
      renderVigilBeat(beat);
      break;
    case 'seaChoice':
      renderSeaChoiceBeat(scene, beat);
      break;
    case 'seaCross':
      renderSeaCrossBeat(beat);
      break;
    case 'manna':
      renderMannaBeat(scene, beat);
      break;
    case 'match':
      renderMatchBeat(beat);
      break;
    case 'fragment':
      renderFragmentBeat(scene, beat);
      break;
    case 'finale':
      renderFinaleBeat();
      break;
  }
}

function lineMarkup(line) {
  const speaker = line.who ? `<span class="story-line-speaker">${line.who}</span>` : '';
  const ref = line.ref ? `<span class="story-line-ref">${line.ref}</span>` : '';
  return `${speaker}<span class="story-line-text">${line.text}</span>${ref}`;
}

function renderLine(line, onAdvance, hint = '탭하여 계속') {
  if (line.phase) {
    elements.storyBackdrop.dataset.phase = line.phase;
  }
  elements.storyDialogue.innerHTML = '';

  // 성경 인용 표시(word)와 화자 초상화는 별개다. 모세·세례 요한·천사의 말도 성경 본문이지만
  // 하나님이 직접 하신 말씀이 아니므로 하나님 초상화가 붙어서는 안 된다.
  const isWord = line.word === true || line.who === '말씀';
  const portrait = line.who ? CHARACTER_PORTRAITS[line.who] : null;
  if (portrait) {
    const figure = document.createElement('div');
    figure.className = `story-portrait${isWord ? ' story-portrait-word' : ''}`;
    figure.setAttribute('aria-hidden', 'true');
    figure.innerHTML = `<img src="${portrait}" alt="" width="132" height="132">`;
    elements.storyDialogue.appendChild(figure);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `story-line story-line-tappable${isWord ? ' story-line-word' : ''}`;
  button.innerHTML = `${lineMarkup(line)}<span class="story-line-hint" aria-hidden="true">${hint} ▸</span>`;
  button.addEventListener('click', onAdvance);
  elements.storyDialogue.appendChild(button);
  button.focus({preventScroll: true});
}

function renderPrompt(text, ref) {
  elements.storyDialogue.innerHTML = `
        <div class="story-line story-line-prompt">
            <span class="story-line-text">${text}</span>
            ${ref ? `<span class="story-line-ref">${ref}</span>` : ''}
        </div>
    `;
}

function renderSayBeat(beat) {
  const showCurrent = () => {
    renderLine(beat.lines[session.line], () => {
      session.line += 1;
      if (session.line >= beat.lines.length) {
        nextBeat();
      } else {
        showCurrent();
      }
    });
  };
  showCurrent();
}

function renderChoiceBeat(scene, beat) {
  elements.storyDialogue.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'story-line story-line-choice';
  wrap.innerHTML = `<span class="story-line-text">${beat.prompt}</span><div class="story-choice-options" role="group" aria-label="${beat.prompt}"></div>`;
  const optionsWrap = wrap.querySelector('.story-choice-options');

  beat.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-choice-button';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      state.choices[beat.id] = option.value;
      pushJournal(`choice:${beat.id}`, `${scene.title} · 기록자의 선택`, option.label);
      saveState();
      renderSheet();
      renderLine(option.reply, nextBeat);
      announce('기록자의 선택이 일지에 남았습니다. 사건의 결말은 바뀌지 않습니다.');
    });
    optionsWrap.appendChild(button);
  });

  elements.storyDialogue.appendChild(wrap);
  optionsWrap.querySelector('button')?.focus({preventScroll: true});
}

// ---------------------------------------------------------------- scene 1: door + table

function renderDoorBeat(beat) {
  renderPrompt(beat.prompt, beat.ref);
  elements.storyPlayArea.classList.add('is-door');
  elements.storyPlayArea.innerHTML = `
        <div class="story-door" aria-label="양쪽 문기둥과 문 위쪽">
            <button type="button" class="story-door-spot story-door-spot-lintel" data-spot="lintel" aria-label="문 위쪽에 피를 바른다"></button>
            <button type="button" class="story-door-spot story-door-spot-left" data-spot="left" aria-label="왼쪽 문기둥에 피를 바른다"></button>
            <button type="button" class="story-door-spot story-door-spot-right" data-spot="right" aria-label="오른쪽 문기둥에 피를 바른다"></button>
            <div class="story-door-leaf" aria-hidden="true"></div>
        </div>
        <p class="story-door-hint">남은 곳 <strong id="doorRemaining">3</strong></p>
    `;

  let remaining = 3;
  const remainingLabel = elements.storyPlayArea.querySelector('#doorRemaining');
  elements.storyPlayArea.querySelectorAll('.story-door-spot').forEach((spot) => {
    spot.addEventListener('click', () => {
      if (spot.classList.contains('is-marked')) {
        return;
      }
      spot.classList.add('is-marked');
      spot.disabled = true;
      remaining -= 1;
      remainingLabel.textContent = String(remaining);
      announce(remaining > 0 ? `피를 발랐습니다. 남은 곳 ${remaining}.` : '세 곳 모두 피를 발랐습니다.');
      if (remaining === 0) {
        elements.storyPlayArea.querySelector('.story-door').classList.add('is-sealed');
        renderLine(beat.doneLine, nextBeat);
      }
    });
  });
}

function renderTableBeat(beat) {
  renderPrompt(beat.prompt, beat.ref);
  elements.storyPlayArea.classList.add('is-table');

  const grid = document.createElement('div');
  grid.className = 'story-table-grid';
  const note = document.createElement('p');
  note.className = 'story-table-note';
  note.setAttribute('aria-live', 'polite');

  let pickedCount = 0;
  const totalOk = beat.items.filter((item) => item.ok).length;

  beat.items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-table-item';
    const label = document.createElement('span');
    label.className = 'story-table-item-label';
    label.textContent = item.label;
    button.appendChild(label);
    button.addEventListener('click', () => {
      if (button.classList.contains('is-picked')) {
        return;
      }
      if (item.ok) {
        if (item.image) {
          const image = document.createElement('img');
          image.className = 'story-table-item-image';
          image.src = item.image;
          image.alt = '';
          image.width = 320;
          image.height = 180;
          button.prepend(image);
          button.classList.add('has-image');
        }
        button.classList.add('is-picked');
        button.disabled = true;
        pickedCount += 1;
        note.textContent = `상에 올렸습니다. (${pickedCount} / ${totalOk})`;
        if (pickedCount === totalOk) {
          renderLine(beat.doneLine, nextBeat);
          announce('식탁이 말씀대로 준비되었습니다.');
        }
      } else {
        button.classList.add('is-wrong', 'is-rejected');
        button.disabled = true;
        note.textContent = item.note;
        announce(item.note);
      }
    });
    grid.appendChild(button);
  });

  elements.storyPlayArea.append(grid, note);
}

// ---------------------------------------------------------------- scene 2: vigil

function renderVigilBeat(beat) {
  renderPrompt(beat.prompt);
  elements.storyPlayArea.classList.add('is-vigil');
  elements.storyPlayArea.innerHTML = `
        <div class="story-vigil">
            <div class="story-vigil-ring" id="vigilRing" aria-hidden="true">
                <button type="button" class="story-vigil-hold" id="vigilHold">밤을<br>지새운다</button>
            </div>
            <p class="story-vigil-caption" id="vigilCaption" aria-live="polite">문 안에서 보내는 밤은 길어요. 손을 떼지 마세요.</p>
        </div>
    `;

  const ring = elements.storyPlayArea.querySelector('#vigilRing');
  const hold = elements.storyPlayArea.querySelector('#vigilHold');
  const caption = elements.storyPlayArea.querySelector('#vigilCaption');
  const duration = prefersReducedMotion() ? 1400 : 3600;
  let progress = 0;
  let holding = false;
  let lastTick = 0;
  let rafId = 0;
  let finished = false;
  let stageIndex = -1;

  const tick = (now) => {
    if (!holding || finished) {
      return;
    }
    progress = Math.min(1, progress + (now - lastTick) / duration);
    lastTick = now;
    ring.style.setProperty('--p', String(progress));
    elements.storyBackdrop.style.setProperty('--vigil', String(progress));

    const nextStage = Math.min(beat.stages.length - 1, Math.floor(progress * (beat.stages.length + 1)) - 1);
    if (nextStage > stageIndex && nextStage >= 0) {
      stageIndex = nextStage;
      if (stageIndex === 0) {
        elements.storyBackdrop.dataset.phase = 'plague';
      }
      caption.textContent = beat.stages[stageIndex];
    }

    if (progress >= 1) {
      finished = true;
      holding = false;
      elements.storyBackdrop.dataset.phase = 'daybreak';
      caption.textContent = '';
      announce('밤이 지나고 새벽이 왔습니다.');
      renderLine(beat.doneLine, nextBeat);
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (holding || finished) {
      return;
    }
    holding = true;
    lastTick = performance.now();
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => {
    holding = false;
    cancelAnimationFrame(rafId);
    if (!finished && progress > 0) {
      caption.textContent = '아직 밤이에요. 다시 누르고 기다려 주세요.';
    }
  };

  hold.addEventListener('pointerdown', (event) => {
    hold.setPointerCapture(event.pointerId);
    start();
  });
  hold.addEventListener('pointerup', stop);
  hold.addEventListener('pointercancel', stop);
  hold.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      start();
    }
  });
  hold.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      stop();
    }
  });
  hold.focus({preventScroll: true});
}

// ---------------------------------------------------------------- scene 3: sea

function renderSeaChoiceBeat(scene, beat) {
  elements.storyDialogue.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'story-line story-line-choice';
  wrap.innerHTML = `<span class="story-line-text">${beat.prompt}</span><div class="story-choice-options" role="group" aria-label="${beat.prompt}"></div>`;
  const optionsWrap = wrap.querySelector('.story-choice-options');

  beat.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-choice-button';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      state.choices[beat.id] = option.value;
      pushJournal(`choice:${beat.id}`, `${scene.title} · 기록자의 선택`, option.label);
      saveState();
      renderSheet();
      renderLine({text: option.reply}, () => {
        renderLine(beat.wordLine, () => {
          elements.storyBackdrop.dataset.sea = 'open';
          announce('바다가 갈라져 물이 양쪽에 벽처럼 섰습니다.');
          renderLine(beat.openLine, nextBeat);
        });
      });
    });
    optionsWrap.appendChild(button);
  });

  elements.storyDialogue.appendChild(wrap);
  optionsWrap.querySelector('button')?.focus({preventScroll: true});
}

function renderSeaCrossBeat(beat) {
  renderPrompt(beat.prompt);
  elements.storyBackdrop.dataset.sea = 'open';
  elements.storyPlayArea.classList.add('is-sea');
  elements.storyPlayArea.innerHTML = `
        <div class="story-sea-corridor" aria-hidden="true">
            <div class="story-sea-pillar"></div>
            <div class="story-sea-army" id="seaArmy">
                <span></span><span></span><span></span><span></span>
            </div>
            <div class="story-sea-procession" id="seaProcession">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
        </div>
        <p class="story-sea-caption" id="seaCaption" aria-live="polite">뒤에서 전차 소리가 울린다. 서둘러 건너야 한다!</p>
        <button type="button" class="story-btn story-btn-primary story-sea-run" id="seaRunButton">
            달린다!
            <small>빠르게 연타할수록 빨리 달려요</small>
        </button>
    `;

  const procession = elements.storyPlayArea.querySelector('#seaProcession');
  const army = elements.storyPlayArea.querySelector('#seaArmy');
  const caption = elements.storyPlayArea.querySelector('#seaCaption');
  const runButton = elements.storyPlayArea.querySelector('#seaRunButton');

  const TAP_GAIN = 3.5; // 한 번 탭에 나아가는 거리
  const GAP_START = 30; // 전차와의 시작 간격
  const GAP_MIN = 6; // 전차는 여기까지만 좁혀 온다 — 결말은 바뀌지 않는다
  const GAP_MAX = 40;
  const TAP_GAP_PUSH = 1.1; // 탭 한 번이 전차를 떼어 놓는 정도
  const CHASE_DECAY = 0.9; // 틱마다 전차가 좁혀 오는 정도

  let progress = 0;
  let gap = GAP_START;
  let stage = -1;
  let warned = false;
  let finished = false;

  const render = () => {
    procession.style.setProperty('--run', String(progress / 100));
    army.style.setProperty('--run', String(Math.max(0, progress - gap) / 100));
    army.classList.toggle('is-near', gap <= 12);
  };

  const updateCaption = () => {
    const next = progress >= 100 ? 2 : progress >= 50 ? 1 : progress > 0 ? 0 : -1;
    if (next > stage) {
      stage = next;
      caption.textContent = beat.steps[stage];
      announce(beat.steps[stage]);
    }
  };

  const chase = window.setInterval(() => {
    if (finished || !procession.isConnected || elements.storyGame.classList.contains('d-none')) {
      window.clearInterval(chase);
      return;
    }
    gap = Math.max(GAP_MIN, gap - CHASE_DECAY);
    render();
    if (gap <= GAP_MIN + 1 && !warned) {
      warned = true;
      caption.textContent = '전차 소리가 등 뒤까지 따라붙었다. 더 빨리!';
    }
  }, 260);

  const finish = () => {
    finished = true;
    window.clearInterval(chase);
    runButton.disabled = true;
    elements.storyBackdrop.dataset.sea = 'closed';
    army.classList.add('is-swept');
    renderLine(beat.doneLine, nextBeat);
  };

  runButton.addEventListener('click', () => {
    if (finished) {
      return;
    }
    progress = Math.min(100, progress + TAP_GAIN);
    gap = Math.min(GAP_MAX, gap + TAP_GAP_PUSH);
    if (warned && gap > GAP_MIN + 4) {
      warned = false;
    }
    render();
    updateCaption();
    if (progress >= 100) {
      finish();
    }
  });
  runButton.focus({preventScroll: true});
}

// ---------------------------------------------------------------- scene 4: manna

const MANNA_ROUNDS = [
  {
    label: '첫째 날 아침',
    need: 4,
    hint: '한 오멜은 네 움큼이에요.',
    overNote: '하루에 필요한 양보다 많아요. 남겨 둔 만나는 썩어요. (출 16:19–20)'
  },
  {
    label: '둘째 날 아침',
    need: 4,
    hint: '어제 거둔 양식은 어제로 끝났어요.',
    overNote: '하루에 필요한 양보다 많아요. 남겨 둔 만나는 썩어요. (출 16:19–20)'
  },
  {
    label: '여섯째 날 아침',
    need: 8,
    hint: '내일은 안식일이에요. 오늘은 두 배로 거둬 주세요. (출 16:22–23)',
    overNote: '이틀 치보다 많아요. 안식일 몫까지 두 배만 거둬 주세요. (출 16:22–23)'
  }
];

const MANNA_SPOTS = [
  [12, 30], [26, 62], [38, 24], [50, 70], [61, 38], [72, 66],
  [83, 28], [18, 78], [45, 44], [67, 16], [88, 58], [30, 12]
];

function renderMannaBeat(scene, beat) {
  let round = 0;
  const runRound = () => {
    const config = MANNA_ROUNDS[round];
    renderPrompt(`${config.label} — ${beat.prompt}`, config.hint);
    elements.storyPlayArea.className = 'story-play-area is-manna';
    elements.storyPlayArea.innerHTML = `
            <div class="story-manna-field" id="mannaField" aria-label="만나가 내린 들"></div>
            <div class="story-manna-bar">
                <div class="story-manna-gauge" aria-hidden="true"><span id="mannaGaugeFill"></span><i id="mannaGaugeNeed"></i></div>
                <p class="story-manna-count" id="mannaCount" aria-live="polite">0 움큼 / 필요 ${config.need} 움큼</p>
                <div class="story-manna-actions">
                    <button type="button" class="story-btn story-btn-ghost d-none" id="mannaPutBackButton">한 움큼 내려놓는다</button>
                    <button type="button" class="story-btn story-btn-primary" id="mannaDoneButton" disabled>거두기를 마친다</button>
                </div>
            </div>
        `;

    const field = elements.storyPlayArea.querySelector('#mannaField');
    const fill = elements.storyPlayArea.querySelector('#mannaGaugeFill');
    const needMark = elements.storyPlayArea.querySelector('#mannaGaugeNeed');
    const count = elements.storyPlayArea.querySelector('#mannaCount');
    const doneButton = elements.storyPlayArea.querySelector('#mannaDoneButton');
    const putBackButton = elements.storyPlayArea.querySelector('#mannaPutBackButton');
    const max = MANNA_SPOTS.length;
    needMark.style.left = `${(config.need / max) * 100}%`;

    let collected = 0;
    let settled = false;
    const pickedStack = [];

    const updateBar = () => {
      const over = collected > config.need;
      fill.style.width = `${(collected / max) * 100}%`;
      fill.classList.toggle('is-over', over);
      count.classList.toggle('is-over', over);
      count.textContent = over
          ? `${collected} 움큼 — ${config.overNote}`
          : `${collected} 움큼 / 필요 ${config.need} 움큼`;
      putBackButton.classList.toggle('d-none', !over);
      doneButton.disabled = collected !== config.need;
    };

    MANNA_SPOTS.forEach(([x, y]) => {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'story-manna-piece';
      piece.style.left = `${x}%`;
      piece.style.top = `${y}%`;
      piece.setAttribute('aria-label', '만나를 줍는다');
      piece.addEventListener('click', () => {
        if (settled || piece.classList.contains('is-picked')) {
          return;
        }
        piece.classList.add('is-picked');
        piece.disabled = true;
        pickedStack.push(piece);
        collected += 1;
        updateBar();
        if (collected > config.need) {
          announce(`${config.overNote} 한 움큼 내려놓아야 거두기를 마칠 수 있어요.`);
        }
      });
      field.appendChild(piece);
    });

    putBackButton.addEventListener('click', () => {
      const piece = settled ? null : pickedStack.pop();
      if (!piece) {
        return;
      }
      piece.classList.remove('is-picked');
      piece.disabled = false;
      collected -= 1;
      updateBar();
      announce('만나 한 움큼을 들에 내려놓았어요.');
    });

    doneButton.addEventListener('click', () => {
      if (settled) {
        return;
      }
      settled = true;

      // 거두기를 마치면 조작 UI를 걷어내고 자막으로 시선을 넘긴다
      elements.storyPlayArea.querySelector('.story-manna-actions').remove();
      field.classList.add('is-settled');
      field.querySelectorAll('.story-manna-piece').forEach((piece) => {
        piece.disabled = true;
      });

      const lastRound = round === MANNA_ROUNDS.length - 1;
      const morning = lastRound
          ? '안식일 아침 — 들에는 만나가 없었다. 여섯째 날에 두 배로 거둔 양식은 상하지 않았고, 백성은 그 양식으로 하루를 쉬었다. (출 16:24–26)'
          : '이튿날 아침 — 들에 다시 만나가 내렸다. 어제 받은 몫은 어제로 충분했다.';
      announce(morning);

      renderLine({text: morning}, () => {
        round += 1;
        if (round >= MANNA_ROUNDS.length) {
          pushJournal('manna', scene.title, '나는 하루치만 거두는 법을 배웠다. 필요한 양식은 날마다 새로 주어졌다.');
          saveState();
          renderSheet();
          renderLine(beat.doneLine, nextBeat);
        } else {
          runRound();
        }
      });
    });
  };
  runRound();
}

// ---------------------------------------------------------------- scene 5: match

function renderMatchBeat(beat) {
  renderPrompt(beat.prompt);
  elements.storyPlayArea.classList.add('is-match');
  elements.storyPlayArea.innerHTML = `
        <div class="story-match-toolbar">
            <div class="story-match-progress-copy">
                <span>증언 연결</span>
                <strong id="matchProgressCount">0 / ${TESTIMONIES.length}</strong>
            </div>
            <div class="story-match-progress" id="matchProgress" role="progressbar"
                 aria-label="증언 연결 진행률" aria-valuemin="0"
                 aria-valuemax="${TESTIMONIES.length}" aria-valuenow="0">
                <span id="matchProgressFill"></span>
            </div>
            <p class="story-match-note" id="matchNote" aria-live="polite">
                조각 카드를 누르면 이어질 신약의 증언을 고르는 창이 열립니다.
            </p>
        </div>
        <ol class="story-match-linked-list d-none" id="matchLinkedList" aria-label="이어진 증언"></ol>
        <section class="story-match-board" id="matchBoard" aria-labelledby="matchFragmentTitle">
            <div class="story-match-column-head">
                <strong id="matchFragmentTitle">약속의 조각</strong>
                <small>지나온 장면에서 모은 기록 — 카드를 눌러 증언과 이어 주세요</small>
            </div>
            <div class="story-match-list story-match-fragments" id="matchFragments"
                 role="group" aria-labelledby="matchFragmentTitle"></div>
        </section>
        <dialog class="story-match-dialog" id="matchDialog" aria-labelledby="matchDialogTitle">
            <div class="story-match-dialog-header">
                <span class="story-fragment-gem" aria-hidden="true"></span>
                <div class="story-match-dialog-heading">
                    <strong id="matchDialogTitle"></strong>
                    <small id="matchDialogSummary"></small>
                </div>
                <button type="button" class="story-match-dialog-close" id="matchDialogClose"
                        aria-label="닫기">×</button>
            </div>
            <p class="story-match-dialog-guide" id="matchDialogGuide" aria-live="polite"></p>
            <div class="story-match-dialog-options" id="matchDialogOptions"
                 role="group" aria-label="신약의 증언 선택"></div>
        </dialog>
    `;

  const board = elements.storyPlayArea.querySelector('#matchBoard');
  const linkedList = elements.storyPlayArea.querySelector('#matchLinkedList');
  const fragmentsCol = elements.storyPlayArea.querySelector('#matchFragments');
  const note = elements.storyPlayArea.querySelector('#matchNote');
  const progress = elements.storyPlayArea.querySelector('#matchProgress');
  const progressFill = elements.storyPlayArea.querySelector('#matchProgressFill');
  const progressCount = elements.storyPlayArea.querySelector('#matchProgressCount');
  const dialog = elements.storyPlayArea.querySelector('#matchDialog');
  const dialogTitle = elements.storyPlayArea.querySelector('#matchDialogTitle');
  const dialogSummary = elements.storyPlayArea.querySelector('#matchDialogSummary');
  const dialogGuide = elements.storyPlayArea.querySelector('#matchDialogGuide');
  const dialogOptions = elements.storyPlayArea.querySelector('#matchDialogOptions');
  const dialogClose = elements.storyPlayArea.querySelector('#matchDialogClose');

  const matchedIds = new Set();

  const closeDialog = () => {
    if (dialog.hasAttribute('open')) {
      dialog.close();
    }
  };

  dialogClose.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  const updateProgress = () => {
    progressCount.textContent = `${matchedIds.size} / ${TESTIMONIES.length}`;
    progress.setAttribute('aria-valuenow', String(matchedIds.size));
    progressFill.style.width = `${(matchedIds.size / TESTIMONIES.length) * 100}%`;
  };

  const completePair = (fragmentButton, testimony) => {
    const fragment = FRAGMENTS[testimony.id];
    closeDialog();
    fragmentButton.remove();

    const pairItem = document.createElement('li');
    pairItem.className = 'story-match-pair';
    pairItem.dataset.pair = String(matchedIds.size);
    pairItem.innerHTML = `
            <span class="story-match-pair-fragment">
                <span class="story-fragment-gem" aria-hidden="true"></span>${fragment.title}
            </span>
            <span class="story-match-pair-join" aria-hidden="true">↔</span>
            <span class="story-match-pair-testimony">
                <span class="story-match-quote">“${testimony.text}”</span>
                <small class="story-match-ref">${testimony.ref}</small>
            </span>
        `;
    linkedList.appendChild(pairItem);
    linkedList.classList.remove('d-none');

    updateProgress();
    note.innerHTML = `<strong>연결 완료</strong> ${fragment.title} ↔ ${testimony.ref}`;
    announce(`${fragment.title} — ${testimony.ref} 연결. ${matchedIds.size} / ${TESTIMONIES.length}`);

    if (matchedIds.size === TESTIMONIES.length) {
      finishMatch(beat, board, note);
    } else {
      const nextCard = board.querySelector('.story-match-fragment');
      if (nextCard) {
        nextCard.focus();
      }
    }
  };

  const openDialog = (fragmentButton, id) => {
    const fragment = FRAGMENTS[id];
    dialogTitle.textContent = fragment.title;
    dialogSummary.textContent = fragment.summary;
    dialogGuide.innerHTML = `‘${fragment.title}’ — 이 조각과 이어지는 신약의 증언을 골라 주세요.`;
    dialogOptions.innerHTML = '';

    TESTIMONIES.filter((testimony) => !matchedIds.has(testimony.id)).forEach((testimony) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'story-match-card story-match-testimony';
      option.dataset.matchId = testimony.id;
      option.innerHTML = `
            <span class="story-match-quote">“${testimony.text}”</span>
            <small class="story-match-ref">${testimony.ref}</small>
        `;
      option.addEventListener('click', () => {
        dialogOptions.querySelectorAll('.is-wrong').forEach((card) => card.classList.remove('is-wrong'));
        if (testimony.id === id) {
          matchedIds.add(id);
          completePair(fragmentButton, testimony);
        } else {
          option.classList.add('is-wrong');
          option.addEventListener('animationend', () => option.classList.remove('is-wrong'), {once: true});
          dialogGuide.innerHTML = '<strong>다시 확인</strong> 이 증언은 다른 조각을 가리켜요. 조각의 뜻과 견주어 다시 골라 보세요.';
          announce('짝이 아니에요. 다른 증언을 골라 보세요.');
        }
      });
      dialogOptions.appendChild(option);
    });

    dialog.showModal();
  };

  Object.entries(FRAGMENTS).forEach(([id, fragment]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-match-card story-match-fragment';
    button.dataset.matchId = id;
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = `
            <span class="story-fragment-gem" aria-hidden="true"></span>
            <span class="story-match-card-copy">
                <strong>${fragment.title}</strong>
                <small>${fragment.summary}</small>
            </span>
        `;
    button.addEventListener('click', () => openDialog(button, id));
    fragmentsCol.appendChild(button);
  });
}

function finishMatch(beat, board, note) {
  note.innerHTML = `<strong>${TESTIMONIES.length} / ${TESTIMONIES.length} 연결 완료</strong> 네 개의 조각이 모두 신약의 증언과 이어졌습니다.`;
  const capstone = document.createElement('div');
  capstone.className = 'story-match-capstone';
  capstone.innerHTML = `
        <span class="story-badge story-badge-direct">성경의 직접 연결</span>
        <blockquote>“우리의 유월절 양이신 그리스도께서 이미 희생되셨습니다”</blockquote>
        <small>고린도전서 5:7</small>
    `;
  board.replaceWith(capstone);
  announce('모든 조각이 이어졌습니다. 우리의 유월절 양이신 그리스도께서 이미 희생되셨습니다. 고린도전서 5장 7절.');
  renderLine(beat.doneLine, nextBeat);
}

// ---------------------------------------------------------------- fragments & finale

function renderFragmentBeat(scene, beat) {
  const fragment = FRAGMENTS[beat.id];
  renderPrompt('약속의 조각을 발견했습니다.');
  elements.storyPlayArea.classList.add('is-fragment');
  elements.storyPlayArea.innerHTML = `
        <div class="story-fragment-reveal">
            <span class="story-fragment-gem story-fragment-gem-large" aria-hidden="true"></span>
            <p class="story-fragment-kicker">약속의 조각</p>
            <h2>${fragment.title}</h2>
            <p class="story-fragment-summary">${fragment.summary}</p>
            <button type="button" class="story-btn story-btn-primary" id="fragmentTakeButton">기록에 담는다</button>
        </div>
    `;

  elements.storyPlayArea.querySelector('#fragmentTakeButton').addEventListener('click', () => {
    if (!state.fragments.includes(beat.id)) {
      state.fragments.push(beat.id);
    }
    pushJournal(`fragment:${beat.id}`, scene.title, beat.journal);
    saveState();
    renderSheet();
    updateFragmentCount(true);
    const firstHint = state.fragments.length === 1
        ? ' 화면 위 조각 버튼에서 일지와 기록을 언제든 볼 수 있어요.'
        : '';
    announce(`약속의 조각, ${fragment.title}을 기록에 담았습니다.${firstHint}`);
    nextBeat();
  }, {once: true});
  elements.storyPlayArea.querySelector('#fragmentTakeButton').focus({preventScroll: true});
}

function updateFragmentCount(pulse) {
  elements.storyFragmentCount.textContent = String(state.fragments.length);
  if (pulse) {
    elements.storySheetButton.classList.remove('is-pulsing');
    requestAnimationFrame(() => elements.storySheetButton.classList.add('is-pulsing'));
  }
}

function renderFinaleBeat() {
  renderPrompt('네 개의 조각이 한 빛을 향해 모입니다.');
  elements.storyPlayArea.classList.add('is-finale');
  elements.storyPlayArea.innerHTML = `
        <div class="story-finale" aria-hidden="true">
            <div class="story-finale-beam"></div>
            ${Object.keys(FRAGMENTS).map((id, index) =>
      `<span class="story-fragment-gem story-finale-gem story-finale-gem-${index + 1}"></span>`).join('')}
        </div>
        <button type="button" class="story-btn story-btn-primary story-finale-button" id="finaleButton">
            기록을 완성합니다
        </button>
    `;
  const finaleButton = elements.storyPlayArea.querySelector('#finaleButton');
  finaleButton.addEventListener('click', completeScene, {once: true});
  finaleButton.focus({preventScroll: true});
}

// ---------------------------------------------------------------- ending

function showEnding() {
  elements.storyIntro.classList.add('d-none');
  elements.storyGame.classList.add('d-none');
  elements.storyEnding.classList.remove('d-none');
  document.body.classList.remove('is-story-playing');
  elements.storyEpilogue.textContent = buildEpilogue();
  renderSheet();
  window.scrollTo({top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
  requestAnimationFrame(() => elements.storyEndingTitle.focus?.());
  announce('기록이 완성되었습니다. 유월절의 기록이 신약의 증언 안에서 새롭게 읽힙니다.');
}

function buildEpilogue() {
  const parts = [];
  parts.push(state.choices.record === 'faithfulness'
      ? '나는 그 밤을, 약속하신 분이 지켜 주신 밤이라고 적었다.'
      : '나는 그 밤을, 두려움 속에서도 말씀대로 따른 밤이라고 적었다.');

  const seaPart = {
    back: '바다 앞에서 나는 돌아갈 길을 찾았지만,',
    fight: '바다 앞에서 나는 싸울 준비를 했지만,',
    cry: '바다 앞에서 나는 부르짖는 것밖에 할 수 없었지만,'
  }[state.choices.sea] || '바다 앞에서 나는 아무것도 할 수 없었지만,';
  parts.push(`${seaPart} 그 길을 연 것은 하나님의 말씀이었다.`);

  parts.push(state.mannaGreed
      ? '광야에서 나는 움켜쥔 것이 썩는 걸 봤고, 필요한 양식은 날마다 새로 주어진다는 걸 배웠다.'
      : '광야에서 나는 하루치만 거두면서, 필요한 양식은 날마다 새로 주어진다는 걸 배웠다.');

  parts.push('그리고 빈 무덤의 새벽에 이르러서야, 첫 페이지의 어린양이 누구를 가리키고 있었는지 알게 됐다.');
  return parts.join(' ');
}

// ---------------------------------------------------------------- sheet (journal + archive)

function openSheet() {
  renderSheet();
  if (!elements.storySheet.open) {
    elements.storySheet.showModal();
  }
}

function closeSheet() {
  if (elements.storySheet.open) {
    elements.storySheet.close();
  }
}

function selectSheetTab(tab) {
  const journalActive = tab === 'journal';
  elements.storyTabJournal.classList.toggle('is-active', journalActive);
  elements.storyTabJournal.setAttribute('aria-selected', String(journalActive));
  elements.storyTabArchive.classList.toggle('is-active', !journalActive);
  elements.storyTabArchive.setAttribute('aria-selected', String(!journalActive));
  elements.storyJournalPanel.classList.toggle('d-none', !journalActive);
  elements.storyArchivePanel.classList.toggle('d-none', journalActive);
}

function renderSheet() {
  elements.storyJournalList.innerHTML = state.journal.map((entry) => `
        <article class="story-journal-entry">
            <strong>${entry.sceneTitle}</strong>
            ${entry.text}
        </article>
    `).join('');
  elements.storyJournalEmpty.classList.toggle('d-none', state.journal.length > 0);

  const unlockedRecords = scenes
  .filter((scene) => state.unlockedScenes.includes(scene.id))
  .flatMap((scene) => scene.records);

  if (unlockedRecords.length === 0) {
    elements.storyArchiveRecords.innerHTML = `
            <p class="story-journal-empty">장면을 마치면 관련 성경 기록이 여기에 열려요.</p>
        `;
    return;
  }

  elements.storyArchiveRecords.innerHTML = unlockedRecords.map((record) => `
        <article class="story-record-card">
            <div>
                <strong>${record.title}</strong>
                <span class="story-badge ${PROVENANCE_LABELS[record.provenance][1]}">
                    ${PROVENANCE_LABELS[record.provenance][0]}
                </span>
            </div>
            <p>${record.body}</p>
            <a href="${record.href}">${record.ref} 읽기</a>
        </article>
    `).join('');
}

// ---------------------------------------------------------------- misc

function confirmRestart() {
  if (!window.confirm('현재 기록을 지우고 처음부터 다시 시작할까요?')) {
    return;
  }
  closeSheet();
  state = createInitialState();
  saveState();
  updateFragmentCount(false);
  renderSheet();
  showGame();
  window.scrollTo({top: 0, behavior: 'auto'});
  announce('모든 진행 기록을 지우고 처음부터 다시 시작합니다.');
}

function announce(message) {
  elements.storyLiveRegion.textContent = '';
  requestAnimationFrame(() => {
    elements.storyLiveRegion.textContent = message;
  });
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
  blood: {title: '어린양의 피', summary: '문설주와 인방에 발린 구원의 표지'},
  promise: {title: '지켜진 약속', summary: '말씀대로 지나간 밤의 기억'},
  path: {title: '열린 길', summary: '사람의 힘이 아니라 말씀으로 열린 길'},
  bread: {title: '날마다의 양식', summary: '하루하루 하늘에서 주어진 공급'}
};

const TESTIMONIES = [
  {
    id: 'bread',
    text: '나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요',
    ref: '요한복음 6:35',
    href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=6&verseNumber=35'
  },
  {
    id: 'blood',
    text: '보라 세상 죄를 지고 가는 하나님의 어린 양이로다',
    ref: '요한복음 1:29',
    href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=1&verseNumber=29'
  },
  {
    id: 'path',
    text: '우리 조상들이 다 구름 아래에 있고 바다 가운데로 지나며 모세에게 속하여 다 구름과 바다에서 세례를 받고',
    ref: '고린도전서 10:1–2',
    href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=10&verseNumber=1'
  },
  {
    id: 'promise',
    text: '이 잔은 내 피로 세우는 새 언약이니 곧 너희를 위하여 붓는 것이라',
    ref: '누가복음 22:20',
    href: '/web/bible/verse?translationId=1&bookOrder=42&chapterNumber=22&verseNumber=20'
  }
];

const CHARACTER_PORTRAITS = {
  '기록자': '/images/game/bible-story-character-recorder.jpg',
  '아버지': '/images/game/bible-story-character-father.jpg',
  '미리암': '/images/game/bible-story-character-young-miriam.jpg',
  '말씀': '/images/game/bible-story-character-god.jpg',
  '백성': '/images/game/bible-story-character-people.jpg'
};

const scenes = [
  {
    id: 'door',
    title: '문 앞에서',
    verb: '바르다',
    era: '애굽 고센 · 유월절 전야',
    reference: '출애굽기 12장',
    theme: 'door',
    records: [
      {
        title: '유월절 어린양',
        provenance: 'scripture',
        body: '이스라엘 각 가정이 유월절을 위해 흠 없는 어린양을 준비한 사건 기록입니다.',
        ref: '출애굽기 12장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12'
      },
      {
        title: '문설주의 표지',
        provenance: 'scripture',
        body: '피가 좌우 문설주와 인방에 발라지고, 그 집은 심판을 넘어가도록 약속받았습니다.',
        ref: '출애굽기 12:7, 13',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=7'
      },
      {
        title: '떠날 준비의 식탁',
        provenance: 'scripture',
        body: '무교병과 쓴 나물, 급히 먹는 식사는 임박한 출발을 보여 줍니다.',
        ref: '출애굽기 12:8–11',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=8'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '애굽 온 땅에 아홉 번의 재앙이 지나갔다. 그러나 바로의 마음은 여전히 완악했다.', ref: '출애굽기 7–10장'},
          {text: '그리고 마지막 열 번째 재앙이 예고되었다. 애굽의 모든 처음 난 것이 죽는 밤이었다.', ref: '출애굽기 11:4–5'},
          {who: '기록자', text: '나는 기록자다. 심판이 예고된 이 밤, 하나님께서 자기 백성에게 먼저 열어 두신 살 길을 기록하러 왔다.'},
          {text: '그 길은 흠 없는 어린양 한 마리였다. 고센 땅의 한 가정이 기록자를 맞았다.', ref: '출애굽기 12:3–5'},
          {who: '아버지', text: '어린양은 잡아 두었어요. 이제 말씀하신 대로 문에 피를 발라야 해요.'}
        ]
      },
      {
        type: 'door',
        prompt: '그릇의 피에 우슬초를 적셔서 좌우 문설주와 인방, 세 곳에 발라 주세요.',
        ref: '출애굽기 12:7, 22',
        doneLine: {who: '말씀', text: '내가 피를 볼 때에 너희를 넘어가리니 재앙이 너희에게 내려 멸하지 아니하리라.', ref: '출애굽기 12:13'}
      },
      {
        type: 'say',
        lines: [
          {who: '아버지', text: '이제 식탁 차례예요. 규례에 맞는 것만 상에 올려 주세요.'}
        ]
      },
      {
        type: 'table',
        prompt: '유월절 규례에 맞는 세 가지를 골라 상에 올려 주세요.',
        ref: '출애굽기 12:8–11',
        items: [
          {
            label: '불에 구운 어린양',
            ok: true,
            image: '/images/game/bible-story-passover-lamb.jpg'
          },
          {label: '누룩을 넣어 부풀린 빵', ok: false, note: '누룩을 넣지 않은 떡과 함께 먹으라고 하셨어요. (출 12:8)'},
          {
            label: '무교병',
            ok: true,
            image: '/images/game/bible-story-unleavened-bread.jpg'
          },
          {label: '아침까지 남겨 둘 몫', ok: false, note: '아침까지 남겨 두지 말라고 하셨어요. (출 12:10)'},
          {
            label: '쓴 나물',
            ok: true,
            image: '/images/game/bible-story-bitter-herbs.jpg'
          },
          {label: '느긋한 잔치 차림', ok: false, note: '허리에 띠를 띠고 급히 먹으라고 하셨어요. (출 12:11)'}
        ],
        doneLine: {who: '기록자', text: '식탁은 잔치가 아니라 떠날 준비였다. 이 밤의 모든 것이 말씀을 향해 있었다.'}
      },
      {
        type: 'fragment',
        id: 'blood',
        journal: '한 가족은 어린양의 피를 문에 발랐다. 이 표지는 훗날 어떤 의미로 다시 읽히게 될까.'
      }
    ]
  },
  {
    id: 'night',
    title: '그 밤',
    verb: '지키다',
    era: '애굽 고센 · 유월절 밤',
    reference: '출애굽기 12:29–42',
    theme: 'night',
    records: [
      {
        title: '지켜 기다린 밤',
        provenance: 'scripture',
        body: '유월절 밤은 이스라엘이 대대로 지켜 기억할 밤으로 기록됩니다.',
        ref: '출애굽기 12:42',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=42'
      },
      {
        title: '애굽을 떠나다',
        provenance: 'scripture',
        body: '이스라엘 자손이 애굽에서 나와 광야를 향해 출발한 사건 기록입니다.',
        ref: '출애굽기 12:31–42',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=12&verseNumber=31'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '문이 닫혔다. 어린 미리암이 등불 곁에서 기록자를 올려다본다.'},
          {who: '미리암', text: '기록자님, 바깥에서 소리가 나는 것 같아요!. 문을 열어 보면 안 될까요?'}
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
            reply: {who: '기록자', text: '“내가 피를 볼 때에 너희를 넘어가리라.” 나는 약속을 그대로 다시 읽어 주었다.'}
          },
          {
            value: 'beside',
            label: '아무 말 없이 곁에 앉는다',
            reply: {text: '기록자는 등불 곁에 아이와 나란히 앉았다. 약속은 이미 문 위에 있었다.'}
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
          '한밤중 — 애굽 온 땅에 큰 부르짖음이 일었다.',
          '그러나 이 집의 문 안은 고요했다.'
        ],
        doneLine: {text: '아직 밤이 깊을 때, 바로가 모세와 아론을 불러 외쳤다. “일어나 내 백성 가운데에서 떠나라.”', ref: '출애굽기 12:30–31'}
      },
      {
        type: 'say',
        lines: [
          {text: '백성은 급히 일어나 애굽을 떠났다. 사백삼십 년 만의 새벽이었다.', ref: '출애굽기 12:40–41'},
          {
            phase: 'cloud',
            text: '낮에는 구름 기둥이 백성 앞에서 광야의 길을 인도했다.',
            ref: '출애굽기 13:21–22'
          },
          {
            phase: 'fire',
            text: '밤에는 불 기둥이 길을 비추었다. 광야 길은 그 기둥을 따라 이어졌다.',
            ref: '출애굽기 13:21–22'
          }
        ]
      },
      {
        type: 'fragment',
        id: 'promise',
        journal: '밤은 말씀대로 지나갔다. 문을 지킨 것은 빗장이 아니라 약속이었다.'
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
        body: '막힌 바다가 갈라지고, 이스라엘이 마른 땅을 밟아 애굽의 추격에서 벗어난 사건 기록입니다.',
        ref: '출애굽기 14장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=14'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '구름 기둥은 백성을 홍해 앞 바닷가로 이끌었다. 그곳에 진을 치라는 말씀대로였다.', ref: '출애굽기 14:1–2'},
          {text: '그 무렵 애굽에서는 바로가 다시 마음을 바꾸었다. 병거 육백 대가 추격을 시작했다.', ref: '출애굽기 14:5–7'},
          {text: '앞은 바다, 뒤는 애굽의 병거. 길이 끊겼다.'},
          {who: '백성', text: '애굽에 묻힐 곳이 없어서 우리를 이 광야까지 끌고 온 겁니까!', ref: '출애굽기 14:11'}
        ]
      },
      {
        type: 'seaChoice',
        id: 'sea',
        prompt: '기록자도 막힌 바다 앞에 섰다. 무엇을 할까요?',
        options: [
          {value: 'back', label: '돌아갈 길을 찾는다', reply: '뒤를 보았다. 병거의 흙먼지가 이미 지평선을 덮고 있었다. 돌아갈 길은 없다.'},
          {value: 'fight', label: '싸울 준비를 한다', reply: '지팡이와 막대기뿐인 행렬이 병거와 싸울 수는 없었다.'},
          {value: 'cry', label: '부르짖는다', reply: '백성의 부르짖음이 바닷가에 가득했다. 사람이 할 수 있는 일은 거기까지였다.'}
        ],
        wordLine: {who: '말씀', text: '너희는 두려워하지 말고 가만히 서서 여호와께서 오늘 너희를 위하여 행하시는 구원을 보라.', ref: '출애굽기 14:13'},
        openLine: {text: '구름 기둥이 뒤로 옮겨 애굽 군대와 이스라엘 사이를 가로막았다. 모세가 바다 위로 손을 내밀자 큰 동풍이 밤새도록 불어 바다가 갈라지고, 물이 좌우에 벽이 되었다.', ref: '출애굽기 14:19–22'}
      },
      {
        type: 'seaCross',
        prompt: '물 벽 사이로 열린 마른 땅을 밟고 건너 주세요.',
        steps: [
          '물 벽 사이로 첫걸음을 내디뎠다.',
          '아이들과 노인들, 양 떼까지 마른 땅을 밟았다.',
          '마지막 사람이 바다를 건넜다.'
        ],
        doneLine: {text: '추격하던 병거들 위로 물이 다시 합쳐졌다. 바로의 군대는 하나도 남지 않았다.', ref: '출애굽기 14:27–28'}
      },
      {
        type: 'say',
        lines: [
          {who: '기록자', text: '우리는 아무 길도 만들지 않았다. 다만 열린 길을 걸었을 뿐이다.'}
        ]
      },
      {
        type: 'fragment',
        id: 'path',
        journal: '바다 앞에서 사람의 선택은 전부 막혀 있었다. 길은 말씀이 열었다.'
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
        body: '먹을 것이 없는 광야에서 날마다 만나가 주어지고, 저장한 것은 썩은 사건 기록입니다.',
        ref: '출애굽기 16장',
        href: '/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=16'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '바다를 건넌 노래는 오래가지 않았다. 백성은 기둥을 따라 수르 광야로 들어갔다.', ref: '출애굽기 15:22'},
          {text: '애굽에서 나온 지 한 달째, 신 광야에 이르러 양식이 떨어지자 온 회중의 원망이 가득했다.', ref: '출애굽기 16:1–2'},
          {who: '백성', text: '차라리 애굽에서 고기 가마 곁에 앉아 있을 때가 나았어요. 우리를 다 굶겨 죽일 작정인가요?', ref: '출애굽기 16:3'},
          {who: '말씀', text: '보라 내가 너희를 위하여 하늘에서 양식을 비 같이 내리리니 백성이 나가서 일용할 것을 날마다 거둘 것이라.', ref: '출애굽기 16:4'}
        ]
      },
      {
        type: 'manna',
        prompt: '한 사람에 한 오멜씩, 식구에게 필요한 만큼만 거둬 주세요.',
        doneLine: {who: '기록자', text: '나는 배웠다. 이 양식은 쌓아 두는 재산이 아니라, 날마다 다시 의지하는 공급이었다.'}
      },
      {
        type: 'fragment',
        id: 'bread',
        journal: '만나는 하루치만 거둘 수 있었다. 공급은 저장이 아니라 신뢰를 가르쳤다.'
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
        body: '예수님께서 유월절 식탁에서 떡과 잔을 나누시며 새 언약을 말씀하셨습니다.',
        ref: '누가복음 22:7–20',
        href: '/web/bible/verse?translationId=1&bookOrder=42&chapterNumber=22&verseNumber=7'
      },
      {
        title: '생명의 떡',
        provenance: 'direct',
        body: '예수님은 광야의 만나를 이어받아 자신을 하늘에서 내려온 참된 떡으로 말씀하셨습니다.',
        ref: '요한복음 6:32–35',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=6&verseNumber=32'
      },
      {
        title: '바다를 지난 백성과 그리스도',
        provenance: 'direct',
        body: '바울은 홍해를 건넌 사건과 광야의 공급을 그리스도와 직접 연결합니다.',
        ref: '고린도전서 10:1–4',
        href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=10&verseNumber=1'
      },
      {
        title: '우리의 유월절 양',
        provenance: 'direct',
        body: '바울은 그리스도를 우리의 유월절 양으로 직접 연결합니다.',
        ref: '고린도전서 5:7',
        href: '/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=5&verseNumber=7'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {text: '만나는 사십 년 동안 그치지 않았고, 백성은 마침내 약속의 땅에 들어갔다.', ref: '출애굽기 16:35'},
          {text: '그 후로도 이스라엘은 해마다 유월절을 지켰다. 어린양을 잡고, 문에 발린 피와 지켜진 그 밤을 기억했다.'},
          {
            phase: 'jordan',
            text: '그렇게 천오백 년이 흘렀다. 어느 날 요단강 가에서, 세례 요한이 한 사람을 가리키며 외쳤다.'
          },
          {
            phase: 'john',
            who: '말씀',
            text: '보라 세상 죄를 지고 가는 하나님의 어린 양이로다',
            ref: '요한복음 1:29'
          },
          {
            phase: 'jesus',
            who: '기록자',
            text: '어린 양이라니. 나는 낡은 두루마리에서 네 개의 조각을 꺼냈다. 이 연결은 내 손으로 확인해야 한다.'
          }
        ]
      },
      {
        type: 'match',
        prompt: '조각을 누르고, 그 약속이 이루어지는 신약의 증언을 찾아 이어 주세요.',
        doneLine: {who: '기록자', text: '네 개의 선이 한 이름 위에서 만났다. 조각들이 그분을 만든 것이 아니다. 처음부터 그분이 계셨고, 조각들이 그분을 가리키고 있었다.'}
      },
      {
        type: 'say',
        lines: [
          {
            phase: 'jesus',
            text: '그리고 그 어린 양이라 불리신 예수께서는 유월절 저녁, 제자들과 마지막 식탁에 앉아 떡과 잔을 나누셨다.',
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
        body: '복음서는 예수님의 십자가 죽음을 기록합니다. 이 장면은 플레이어의 성공이나 실패로 바뀌지 않습니다.',
        ref: '요한복음 19장',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=19'
      },
      {
        title: '빈 무덤과 부활',
        provenance: 'scripture',
        body: '복음서는 예수님의 부활과 빈 무덤을 확인한 증인들의 소식을 기록합니다.',
        ref: '요한복음 20장',
        href: '/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=20'
      }
    ],
    beats: [
      {
        type: 'say',
        lines: [
          {phase: 'cross', text: '다음 날, 유월절의 예루살렘. 예수께서는 성문 밖 십자가에 달리셨다.', ref: '요한복음 19:17–18'},
          {phase: 'cross', who: '기록자', text: '이번에는 확인할 준비물도, 건널 바다도 없었다. 나는 다만 보았고, 기록했다.'},
          {phase: 'dark', text: '낮 열두 시부터 어둠이 온 땅을 덮어 세 시간 동안 계속되었다.', ref: '누가복음 23:44–45'},
          {phase: 'tomb', text: '사흘째 되던 날 이른 새벽, 여자들이 무덤에 갔다. 무덤은 비어 있었다.', ref: '누가복음 24:1–3'},
          {phase: 'risen', who: '말씀', text: '어찌하여 살아 있는 자를 죽은 자 가운데서 찾느냐 여기 계시지 않고 살아나셨느니라.', ref: '누가복음 24:5–6'}
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
  const body = `<span class="story-line-body">${speaker}<span class="story-line-text">${line.text}</span>${ref}</span>`;
  const portrait = line.who ? CHARACTER_PORTRAITS[line.who] : null;
  if (!portrait) {
    return body;
  }
  return `
        <span class="story-line-with-portrait">
            <img class="story-line-portrait" src="${portrait}" alt="" width="48" height="48">
            ${body}
        </span>
    `;
}

function renderLine(line, onAdvance, hint = '탭하여 계속') {
  if (line.phase) {
    elements.storyBackdrop.dataset.phase = line.phase;
  }
  elements.storyDialogue.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `story-line story-line-tappable${line.who === '말씀' ? ' story-line-word' : ''}`;
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
        <div class="story-door" aria-label="문설주와 인방">
            <button type="button" class="story-door-spot story-door-spot-lintel" data-spot="lintel" aria-label="인방에 피를 바른다"></button>
            <button type="button" class="story-door-spot story-door-spot-left" data-spot="left" aria-label="왼쪽 문설주에 피를 바른다"></button>
            <button type="button" class="story-door-spot story-door-spot-right" data-spot="right" aria-label="오른쪽 문설주에 피를 바른다"></button>
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
          announce('식탁이 규례대로 준비되었습니다.');
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
            <p class="story-vigil-caption" id="vigilCaption" aria-live="polite">문 안의 밤은 길어요. 손을 떼지 마세요.</p>
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
          announce('바다가 갈라져 물이 좌우에 벽이 되었습니다.');
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
            <div class="story-sea-procession" id="seaProcession">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
        </div>
        <p class="story-sea-caption" id="seaCaption" aria-live="polite">물 벽 사이의 마른 땅이 열려 있다.</p>
        <button type="button" class="story-btn story-btn-primary story-sea-step" id="seaStepButton">
            구름 기둥을 따라 나아간다
        </button>
    `;

  const procession = elements.storyPlayArea.querySelector('#seaProcession');
  const caption = elements.storyPlayArea.querySelector('#seaCaption');
  const stepButton = elements.storyPlayArea.querySelector('#seaStepButton');
  let step = 0;

  stepButton.addEventListener('click', () => {
    step += 1;
    procession.style.setProperty('--step', String(step));
    caption.textContent = beat.steps[step - 1];
    announce(beat.steps[step - 1]);
    if (step >= beat.steps.length) {
      stepButton.disabled = true;
      elements.storyBackdrop.dataset.sea = 'closed';
      renderLine(beat.doneLine, nextBeat);
    }
  });
  stepButton.focus({preventScroll: true});
}

// ---------------------------------------------------------------- scene 4: manna

const MANNA_ROUNDS = [
  {label: '첫째 날 아침', need: 4, hint: '한 오멜은 네 움큼이에요.'},
  {label: '둘째 날 아침', need: 4, hint: '어제의 양식은 어제로 끝났어요.'},
  {label: '여섯째 날 아침', need: 8, hint: '내일은 안식일이에요. 오늘은 두 배를 거둬 주세요. (출 16:22–23)'}
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
                <button type="button" class="story-btn story-btn-primary" id="mannaDoneButton" disabled>거두기를 마친다</button>
            </div>
        `;

    const field = elements.storyPlayArea.querySelector('#mannaField');
    const fill = elements.storyPlayArea.querySelector('#mannaGaugeFill');
    const needMark = elements.storyPlayArea.querySelector('#mannaGaugeNeed');
    const count = elements.storyPlayArea.querySelector('#mannaCount');
    const doneButton = elements.storyPlayArea.querySelector('#mannaDoneButton');
    const max = MANNA_SPOTS.length;
    needMark.style.left = `${(config.need / max) * 100}%`;

    let collected = 0;
    MANNA_SPOTS.forEach(([x, y]) => {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'story-manna-piece';
      piece.style.left = `${x}%`;
      piece.style.top = `${y}%`;
      piece.setAttribute('aria-label', '만나를 줍는다');
      piece.addEventListener('click', () => {
        if (piece.classList.contains('is-picked')) {
          return;
        }
        piece.classList.add('is-picked');
        piece.disabled = true;
        collected += 1;
        fill.style.width = `${(collected / max) * 100}%`;
        fill.classList.toggle('is-over', collected > config.need);
        count.textContent = `${collected} 움큼 / 필요 ${config.need} 움큼`;
        doneButton.disabled = collected < config.need;
      });
      field.appendChild(piece);
    });

    doneButton.addEventListener('click', () => {
      const over = collected > config.need;
      const lastRound = round === MANNA_ROUNDS.length - 1;

      if (over && !lastRound) {
        state.mannaGreed = true;
      }

      let morning;
      if (lastRound) {
        morning = over
            ? '안식일 아침 — 들에는 만나가 없었다. 두 배로 거둔 양식은 이번에는 상하지 않았다. (출 16:24)'
            : '안식일 아침 — 들에는 만나가 없었다. 여섯째 날 거둔 양식으로 백성은 쉬었다. (출 16:25–26)';
      } else {
        morning = over
            ? '이튿날 아침 — 남겨 둔 만나에 벌레가 생기고 냄새가 났다. (출 16:20)'
            : '이튿날 아침 — 들에 다시 만나가 내렸다. 어제의 공급은 어제로 충분했다.';
      }

      elements.storyPlayArea.querySelector('.story-manna-field').classList.toggle('is-rotten', over && !lastRound);
      announce(morning);

      renderLine({text: morning}, () => {
        round += 1;
        if (round >= MANNA_ROUNDS.length) {
          pushJournal('manna', scene.title, state.mannaGreed
              ? '나는 이틀치를 움켜쥐었다가 썩는 것을 보았다. 공급은 날마다 새로 주어졌다.'
              : '나는 하루치만 거두는 법을 배웠다. 공급은 날마다 새로 주어졌다.');
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
          dialogGuide.innerHTML = '<strong>다시 확인</strong> 이 증언은 다른 조각을 가리켜요. 조각의 의미와 비교해 다시 골라 보세요.';
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
        <blockquote>“우리의 유월절 양 곧 그리스도께서 희생되셨느니라”</blockquote>
        <small>고린도전서 5:7</small>
    `;
  board.replaceWith(capstone);
  announce('모든 조각이 이어졌습니다. 우리의 유월절 양 곧 그리스도께서 희생되셨느니라. 고린도전서 5장 7절.');
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
  announce('기록이 완성되었습니다. 유월절의 기록이 신약의 증언 안에서 다시 읽힙니다.');
}

function buildEpilogue() {
  const parts = [];
  parts.push(state.choices.record === 'faithfulness'
      ? '나는 그 밤을 약속하신 분이 지키신 밤으로 적었다.'
      : '나는 그 밤을 두려움 속에서도 지킨 순종의 밤으로 적었다.');

  const seaPart = {
    back: '바다 앞에서 나는 돌아갈 길을 찾았지만,',
    fight: '바다 앞에서 나는 싸울 준비를 했지만,',
    cry: '바다 앞에서 나는 부르짖는 것밖에 할 수 없었지만,'
  }[state.choices.sea] || '바다 앞에서 나는 아무것도 할 수 없었지만,';
  parts.push(`${seaPart} 길은 말씀이 열었다.`);

  parts.push(state.mannaGreed
      ? '광야에서 나는 움켜쥔 것이 썩는 것을 보았고, 공급이 날마다 새로 주어짐을 배웠다.'
      : '광야에서 나는 하루치만 거두며, 공급이 날마다 새로 주어짐을 배웠다.');

  parts.push('그리고 빈 무덤의 새벽에 이르러, 첫 페이지의 어린양이 누구를 가리키고 있었는지 알았다.');
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
            <p class="story-journal-empty">장면을 마치면 성경 기록이 이곳에 해금됩니다.</p>
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

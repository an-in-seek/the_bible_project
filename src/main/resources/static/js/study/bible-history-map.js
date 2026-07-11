/**
 * 성경 역사 지도 (클라이언트 전용 MVP)
 * 설계 문서: docs/study/bible-history-map.md
 *
 * - 시간 막대(연속 연도) → 검수된 역사 스냅샷으로 해석(§7.3)
 * - 모든 데이터는 확실성 등급(§13.3)을 가지며, 추정·논쟁 항목은 화면에서 구분한다(§4.2)
 * - 좌표는 WGS 84 [경도, 위도] 순서(§14.1), 연도는 BC n년 = -n, 0년 없음(§14.3)
 * - 성경 딥링크는 기존 bible 모듈 키(translationId/bookOrder)를 사용(§15.8)
 * - 본 데이터는 초기 시드(검수 전 DRAFT)이며, 통용되는 고고학 위치 비정을 따른다
 */

const BIBLE_TRANSLATION_ID = 1; // KRV (66권 전문 보유 번역본)

function bibleVerseUrl(bookOrder, chapterNumber) {
    return `/web/bible/verse?translationId=${BIBLE_TRANSLATION_ID}`
        + `&bookOrder=${bookOrder}&chapterNumber=${chapterNumber}`
        + `&from=bible-history-map`;
}

const CERTAINTY = {
    CONFIRMED: {label: "", badge: false},
    PROBABLE: {label: "유력한 위치", badge: true},
    APPROXIMATE: {label: "대략적인 범위", badge: true},
    DISPUTED: {label: "여러 견해 존재", badge: true}
};

/* ---------- 시대 (§8) ---------- */
const PERIODS = [
    {id: "patriarch", name: "족장 시대", from: -2000, to: -1600, mvp: true,
        desc: "아브라함, 이삭, 야곱의 이주와 가나안 정착 — 연대는 대략적인 범위입니다."},
    {id: "exodus", name: "출애굽·정착", from: -1600, to: -1200, mvp: true,
        desc: "애굽 탈출과 광야 여정, 가나안 정착 — 연대와 경로에 복수 견해가 있습니다."},
    {id: "judges", name: "사사 시대", from: -1200, to: -1020, mvp: true,
        desc: "이스라엘 지파 연맹과 사사들의 시대 — 블레셋, 모압, 암몬과의 갈등기입니다."},
    {id: "united", name: "통일 왕국", from: -1020, to: -930, mvp: true,
        desc: "사울, 다윗, 솔로몬의 통일 왕국 시대입니다."},
    {id: "divided", name: "분열 왕국", from: -930, to: -586, mvp: true,
        desc: "북이스라엘(–722 사마리아 함락)과 남유다(–587/586 예루살렘 함락)의 분열 시대입니다."},
    {id: "exile", name: "바벨론 포로기", from: -597, to: -538, mvp: true,
        desc: "BC 597년 1차 포로 이주로 시작되어 539/538년 페르시아의 귀환 허용까지 이어집니다."},
    {id: "persia", name: "페르시아 시대", from: -538, to: -333, mvp: true,
        desc: "고레스 칙령 이후 귀환과 예루살렘 성전·성벽 재건의 시대입니다."},
    {id: "hellenistic", name: "헬레니즘 시대", from: -332, to: -63, mvp: true,
        desc: "알렉산더 제국과 후계 왕조(프톨레마이오스·셀레우코스)의 지배기입니다."},
    {id: "roman", name: "로마·신약 시대", from: -63, to: 30, mvp: true,
        desc: "로마의 유대 지배와 예수님의 탄생·공생애 시대입니다."},
    {id: "apostolic", name: "사도 시대", from: 30, to: 100, mvp: true,
        desc: "오순절 이후 사도들의 활동과 복음의 지중해 확산 시대입니다."}
];

/* ---------- 역사 스냅샷 (§7.3, §15.2) ---------- */
const SNAPSHOTS = [
    {id: "s-patriarch", periodId: "patriarch", baseYear: -1800, certainty: "DISPUTED",
        label: "족장 시대의 고대 근동 배경 (전통적 BC 1800년경)"},
    {id: "s-exodus", periodId: "exodus", baseYear: -1300, certainty: "DISPUTED",
        label: "출애굽·광야 여정 (연대 견해 상이)"},
    {id: "s-settlement", periodId: "exodus", baseYear: -1230, certainty: "DISPUTED",
        label: "가나안 정착 초기 (BC 1230년경, 연대 견해 상이)"},
    {id: "s-judges", periodId: "judges", baseYear: -1100, certainty: "DISPUTED",
        label: "사사 시대의 남부 레반트 배경 (BC 1100년경)"},
    {id: "s-united", periodId: "united", baseYear: -970, certainty: "APPROXIMATE",
        label: "통일 왕국 전성기 (BC 970년경)"},
    {id: "s-divided-early", periodId: "divided", baseYear: -930, certainty: "APPROXIMATE",
        label: "왕국 분열 직후 (BC 930년경)"},
    {id: "s-divided-late", periodId: "divided", baseYear: -722, certainty: "APPROXIMATE",
        label: "북이스라엘 멸망·앗수르 전성 (BC 722년 이후)"},
    {id: "s-exile", periodId: "exile", baseYear: -586, certainty: "APPROXIMATE",
        label: "신바벨론 제국 (BC 586년경)"},
    {id: "s-persia-cyrus", periodId: "persia", baseYear: -535, from: -538, to: -526,
        certainty: "APPROXIMATE", label: "고레스 이후 초기 페르시아 제국 (BC 538~526년)"},
    {id: "s-persia-imperial", periodId: "persia", baseYear: -500, from: -525, to: -405,
        certainty: "APPROXIMATE", label: "애굽을 포함한 페르시아 제국 전성기 (BC 525~405년)"},
    {id: "s-persia-egypt-independent", periodId: "persia", baseYear: -390, from: -404, to: -344,
        certainty: "APPROXIMATE", label: "애굽 독립기의 페르시아 제국 (BC 390년경)"},
    {id: "s-persia-late", periodId: "persia", baseYear: -340, from: -343, to: -333,
        certainty: "APPROXIMATE", label: "애굽 재정복 이후 후기 페르시아 제국 (BC 340년경)"},
    {id: "s-hellenistic-ptolemaic", periodId: "hellenistic", baseYear: -280, certainty: "APPROXIMATE",
        label: "프톨레마이오스·셀레우코스 왕조 초기 (BC 280년경)"},
    {id: "s-hellenistic-seleucid", periodId: "hellenistic", baseYear: -190, certainty: "APPROXIMATE",
        label: "셀레우코스의 유대 지배 (BC 190년경)"},
    {id: "s-hellenistic-hasmonean", periodId: "hellenistic", baseYear: -100, certainty: "APPROXIMATE",
        label: "하스몬 왕국과 후기 헬레니즘 세계 (BC 100년경)"},
    {id: "s-rome-nt", periodId: "roman", baseYear: 30, certainty: "APPROXIMATE",
        label: "로마 제국과 유대 (AD 30년경)"},
    {id: "s-apostolic", periodId: "apostolic", baseYear: 60, certainty: "APPROXIMATE",
        label: "사도 시대의 지중해 세계 (AD 60년경)"}
];

/* ---------- 장소 (§15.3) — 좌표: [경도, 위도] ---------- */
/* importance: 1 항상 표시 · 2 광역 이상 · 3 지역 이상 (§10.1) */
const PLACES = [
    {id: "jerusalem", name: "예루살렘", en: "Jerusalem", modern: "이스라엘 예루살렘", type: "도시",
        lngLat: [35.23, 31.78], from: -2000, to: 100, importance: 1, certainty: "CONFIRMED",
        desc: "다윗이 수도로 삼은 이후 성전이 세워진 이스라엘 신앙의 중심 도시입니다.",
        refs: [{label: "사무엘하 5장", bookOrder: 10, chapter: 5}, {label: "열왕기상 8장", bookOrder: 11, chapter: 8}]},
    {id: "bethlehem", name: "베들레헴", en: "Bethlehem", modern: "팔레스타인 베들레헴", type: "마을",
        lngLat: [35.20, 31.70], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "다윗의 고향이자 예수님이 탄생하신 유다의 작은 성읍입니다.",
        refs: [{label: "룻기 1장", bookOrder: 8, chapter: 1}, {label: "마태복음 2장", bookOrder: 40, chapter: 2}]},
    {id: "hebron", name: "헤브론", en: "Hebron", modern: "팔레스타인 헤브론", type: "도시",
        lngLat: [35.10, 31.53], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "아브라함이 거주하고 다윗이 처음 왕이 된 유다 산지의 도시입니다.",
        refs: [{label: "창세기 23장", bookOrder: 1, chapter: 23}, {label: "사무엘하 2장", bookOrder: 10, chapter: 2}]},
    {id: "beersheba", name: "브엘세바", en: "Beersheba", modern: "이스라엘 베에르셰바", type: "도시",
        lngLat: [34.79, 31.24], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "'단에서 브엘세바까지'로 표현되는 이스라엘 남쪽 경계의 성읍입니다.",
        refs: [{label: "창세기 21장", bookOrder: 1, chapter: 21}]},
    {id: "jericho", name: "여리고", en: "Jericho", modern: "팔레스타인 예리코", type: "도시",
        lngLat: [35.44, 31.87], from: -2000, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "가나안 정복의 첫 성이자 세계에서 가장 오래된 도시 중 하나입니다.",
        refs: [{label: "여호수아 6장", bookOrder: 6, chapter: 6}, {label: "누가복음 19장", bookOrder: 42, chapter: 19}]},
    {id: "samaria", name: "사마리아", en: "Samaria", modern: "팔레스타인 세바스티야 인근", type: "도시",
        lngLat: [35.19, 32.28], from: -880, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "오므리가 세운 북이스라엘의 수도로, BC 722년경 앗수르에 함락되었습니다.",
        refs: [{label: "열왕기상 16장", bookOrder: 11, chapter: 16}, {label: "열왕기하 17장", bookOrder: 12, chapter: 17}]},
    {id: "shechem", name: "세겜", en: "Shechem", modern: "팔레스타인 나블루스 인근", type: "도시",
        lngLat: [35.28, 32.21], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "아브라함이 처음 단을 쌓고, 여로보암이 북왕국의 첫 수도로 삼은 곳입니다.",
        refs: [{label: "창세기 12장", bookOrder: 1, chapter: 12}, {label: "열왕기상 12장", bookOrder: 11, chapter: 12}]},
    {id: "shiloh", name: "실로", en: "Shiloh", modern: "키르벳 세일룬", type: "마을",
        lngLat: [35.29, 32.05], from: -1400, to: -1000, importance: 3, certainty: "CONFIRMED",
        desc: "사사 시대에 성막과 언약궤가 있던 예배의 중심지입니다.",
        refs: [{label: "여호수아 18장", bookOrder: 6, chapter: 18}, {label: "사무엘상 1장", bookOrder: 9, chapter: 1}]},
    {id: "dan", name: "단", en: "Dan", modern: "이스라엘 텔 단", type: "도시",
        lngLat: [35.65, 33.25], from: -1200, to: -722, importance: 3, certainty: "CONFIRMED",
        desc: "이스라엘 최북단 성읍으로, 여로보암이 금송아지 산당을 세운 곳입니다.",
        refs: [{label: "열왕기상 12장", bookOrder: 11, chapter: 12}]},
    {id: "bethel", name: "벧엘", en: "Bethel", modern: "베이틴(유력)", type: "마을",
        lngLat: [35.24, 31.93], from: -2000, to: -586, importance: 3, certainty: "PROBABLE",
        desc: "야곱이 하늘 사닥다리 꿈을 꾼 곳이며, 북왕국의 남쪽 산당이 있던 곳입니다.",
        refs: [{label: "창세기 28장", bookOrder: 1, chapter: 28}, {label: "열왕기상 12장", bookOrder: 11, chapter: 12}]},
    {id: "nazareth", name: "나사렛", en: "Nazareth", modern: "이스라엘 나사렛", type: "마을",
        lngLat: [35.30, 32.70], from: -63, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "예수님이 자라나신 갈릴리의 마을입니다.",
        refs: [{label: "누가복음 4장", bookOrder: 42, chapter: 4}]},
    {id: "capernaum", name: "가버나움", en: "Capernaum", modern: "이스라엘 텔 훔", type: "마을",
        lngLat: [35.575, 32.881], from: -63, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "갈릴리 호숫가에서 예수님의 갈릴리 사역의 거점이 된 마을입니다.",
        refs: [{label: "마가복음 2장", bookOrder: 41, chapter: 2}]},
    {id: "caesarea-maritima", name: "가이사랴", en: "Caesarea Maritima", modern: "이스라엘 카이사레아", type: "항구",
        lngLat: [34.89, 32.50], from: -63, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "헤롯이 건설한 지중해 항구 도시로, 로마 총독의 주재지였습니다.",
        refs: [{label: "사도행전 10장", bookOrder: 44, chapter: 10}, {label: "사도행전 25장", bookOrder: 44, chapter: 25}]},
    {id: "caesarea-philippi", name: "가이사랴 빌립보", en: "Caesarea Philippi", modern: "골란 고원 바니아스", type: "도시",
        lngLat: [35.69, 33.25], from: -63, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "헤르몬산 기슭의 도시로, 베드로가 신앙을 고백한 곳입니다.",
        refs: [{label: "마태복음 16장", bookOrder: 40, chapter: 16}]},
    {id: "joppa", name: "욥바", en: "Joppa", modern: "이스라엘 텔아비브 야파", type: "항구",
        lngLat: [34.75, 32.05], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "요나가 배를 탄 항구이며, 베드로가 환상을 본 곳입니다.",
        refs: [{label: "요나 1장", bookOrder: 32, chapter: 1}, {label: "사도행전 10장", bookOrder: 44, chapter: 10}]},
    {id: "damascus", name: "다메섹", en: "Damascus", modern: "시리아 다마스쿠스", type: "도시",
        lngLat: [36.31, 33.51], from: -2000, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "아람의 수도였고, 사울(바울)이 회심한 길의 목적지였습니다.",
        refs: [{label: "열왕기상 20장", bookOrder: 11, chapter: 20}, {label: "사도행전 9장", bookOrder: 44, chapter: 9}]},
    {id: "tyre", name: "두로", en: "Tyre", modern: "레바논 티레", type: "항구",
        lngLat: [35.20, 33.27], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "성전 건축 자재를 보낸 페니키아의 해상 무역 도시입니다.",
        refs: [{label: "열왕기상 5장", bookOrder: 11, chapter: 5}, {label: "에스겔 26장", bookOrder: 26, chapter: 26}]},
    {id: "sidon", name: "시돈", en: "Sidon", modern: "레바논 사이다", type: "항구",
        lngLat: [35.37, 33.56], from: -2000, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "두로와 짝을 이루는 페니키아 항구 도시입니다.",
        refs: [{label: "마태복음 15장", bookOrder: 40, chapter: 15}]},
    {id: "nineveh", name: "니느웨", en: "Nineveh", modern: "이라크 모술 인근", type: "도시",
        lngLat: [43.15, 36.36], from: -2000, to: -612, importance: 1, certainty: "CONFIRMED",
        desc: "앗수르 제국의 수도로, 요나가 회개를 선포한 큰 성읍입니다.",
        refs: [{label: "요나 3장", bookOrder: 32, chapter: 3}, {label: "나훔 1장", bookOrder: 34, chapter: 1}]},
    {id: "babylon", name: "바벨론", en: "Babylon", modern: "이라크 힐라 인근", type: "도시",
        lngLat: [44.42, 32.54], from: -2000, to: -100, importance: 1, certainty: "CONFIRMED",
        desc: "신바벨론 제국의 수도였으며, 페르시아 시대에도 왕실과 행정의 주요 중심지였습니다.",
        refs: [{label: "열왕기하 25장", bookOrder: 12, chapter: 25}, {label: "다니엘 1장", bookOrder: 27, chapter: 1}]},
    {id: "ur", name: "우르", en: "Ur", modern: "이라크 텔 엘무카이야르(남부설)", type: "도시",
        lngLat: [46.10, 30.96], from: -2100, to: -500, importance: 2, certainty: "PROBABLE",
        desc: "아브라함이 떠난 갈대아 우르 — 남부 메소포타미아설이 유력하나 북부설도 있습니다.",
        refs: [{label: "창세기 11장", bookOrder: 1, chapter: 11}]},
    {id: "haran", name: "하란", en: "Haran", modern: "터키 하란", type: "도시",
        lngLat: [39.03, 36.86], from: -2100, to: -500, importance: 2, certainty: "CONFIRMED",
        desc: "아브라함 가족이 가나안으로 가기 전 머문 북메소포타미아의 도시입니다.",
        refs: [{label: "창세기 12장", bookOrder: 1, chapter: 12}]},
    {id: "susa", name: "수산", en: "Susa", modern: "이란 슈시", type: "도시",
        lngLat: [48.25, 32.19], from: -600, to: -300, importance: 2, certainty: "CONFIRMED",
        desc: "페르시아의 겨울 수도로, 에스더와 느헤미야 이야기의 무대입니다.",
        refs: [{label: "에스더 1장", bookOrder: 17, chapter: 1}, {label: "느헤미야 1장", bookOrder: 16, chapter: 1}]},
    {id: "ecbatana", name: "악메다(엑바타나)", en: "Ecbatana", modern: "이란 하마단", type: "도시",
        lngLat: [48.52, 34.80], from: -700, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "메대와 페르시아의 왕도 가운데 하나로, 에스라서에서는 고레스의 성전 재건 칙령 문서가 발견된 곳입니다.",
        refs: [{label: "에스라 6장", bookOrder: 15, chapter: 6}]},
    {id: "memphis", name: "멤피스(놉)", en: "Memphis", modern: "이집트 미트 라히나", type: "도시",
        lngLat: [31.25, 29.85], from: -2100, to: -300, importance: 2, certainty: "CONFIRMED",
        desc: "고대 애굽의 중심 도시로, 선지서에 '놉'으로 등장합니다.",
        refs: [{label: "예레미야 46장", bookOrder: 24, chapter: 46}]},
    {id: "rameses", name: "라암셋", en: "Rameses", modern: "이집트 콴티르(유력)", type: "도시",
        lngLat: [31.83, 30.80], from: -1400, to: -1100, importance: 2, certainty: "PROBABLE",
        desc: "이스라엘 백성이 건축 노역을 한 국고성이자 출애굽의 출발지입니다.",
        refs: [{label: "출애굽기 1장", bookOrder: 2, chapter: 1}, {label: "출애굽기 12장", bookOrder: 2, chapter: 12}]},
    {id: "sinai", name: "시내산(전통)", en: "Mount Sinai", modern: "이집트 예벨 무사(전통)", type: "산",
        lngLat: [33.97, 28.54], from: -1600, to: -1200, importance: 1, certainty: "DISPUTED",
        desc: "율법을 받은 산 — 전통적으로 시나이 반도 남부 예벨 무사로 보나 복수 견해가 있습니다.",
        refs: [{label: "출애굽기 19장", bookOrder: 2, chapter: 19}]},
    {id: "kadesh", name: "가데스 바네아", en: "Kadesh Barnea", modern: "아인 엘쿠데이라트(유력)", type: "광야",
        lngLat: [34.42, 30.65], from: -1600, to: -1200, importance: 3, certainty: "PROBABLE",
        desc: "광야 시대에 이스라엘이 오래 머문 진영지로, 정탐꾼을 보낸 곳입니다.",
        refs: [{label: "민수기 13장", bookOrder: 4, chapter: 13}]},
    {id: "succoth-egypt", name: "숙곳", en: "Succoth", modern: "이집트 텔 엘마스쿠타(유력)", type: "마을",
        lngLat: [32.10, 30.55], from: -1600, to: -1100, importance: 3, certainty: "PROBABLE",
        desc: "라암셋을 떠난 이스라엘 백성이 처음 진을 친 출애굽 여정의 첫 기착지입니다.",
        refs: [{label: "출애굽기 12장", bookOrder: 2, chapter: 12}]},
    {id: "rephidim", name: "르비딤", en: "Rephidim", modern: "위치 미상 (시나이 반도)", type: "광야",
        lngLat: [33.85, 28.72], from: -1600, to: -1200, importance: 3, certainty: "DISPUTED",
        desc: "반석에서 물이 나오고 아말렉과 싸운 곳으로, 정확한 위치는 특정하기 어렵습니다.",
        refs: [{label: "출애굽기 17장", bookOrder: 2, chapter: 17}]},
    {id: "nebo", name: "느보산", en: "Mount Nebo", modern: "요르단 예벨 네보", type: "산",
        lngLat: [35.73, 31.77], from: -1600, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "모세가 약속의 땅을 바라보고 생을 마친 모압 평지의 산으로, 전통적 비정이 널리 받아들여집니다.",
        refs: [{label: "신명기 34장", bookOrder: 5, chapter: 34}]},
    {id: "gilgal", name: "길갈", en: "Gilgal", modern: "여리고 동편(유력)", type: "마을",
        lngLat: [35.50, 31.87], from: -1400, to: -1000, importance: 3, certainty: "PROBABLE",
        desc: "요단을 건넌 이스라엘의 첫 진영지이자 가나안 정복 전쟁의 근거지입니다.",
        refs: [{label: "여호수아 4장", bookOrder: 6, chapter: 4}]},
    {id: "ai", name: "아이", en: "Ai", modern: "에트텔(통설이나 논쟁)", type: "도시",
        lngLat: [35.26, 31.92], from: -2000, to: -1200, importance: 3, certainty: "DISPUTED",
        desc: "여리고 다음으로 정복한 성읍으로, 위치 비정을 두고 학계 논쟁이 있습니다.",
        refs: [{label: "여호수아 8장", bookOrder: 6, chapter: 8}]},
    {id: "hazor", name: "하솔", en: "Hazor", modern: "이스라엘 텔 하솔", type: "도시",
        lngLat: [35.57, 33.02], from: -2000, to: -732, importance: 3, certainty: "CONFIRMED",
        desc: "북부 가나안 최대의 성읍으로, 여호수아가 '그 모든 나라의 머리'라 불린 이 성을 불살랐습니다.",
        refs: [{label: "여호수아 11장", bookOrder: 6, chapter: 11}, {label: "사사기 4장", bookOrder: 7, chapter: 4}]},
    {id: "antioch-syria", name: "안디옥(수리아)", en: "Antioch", modern: "터키 안타키아", type: "도시",
        lngLat: [36.16, 36.20], from: -300, to: 100, importance: 1, certainty: "CONFIRMED",
        desc: "제자들이 처음 '그리스도인'이라 불린 곳이자 바울 선교의 파송 교회입니다.",
        refs: [{label: "사도행전 11장", bookOrder: 44, chapter: 11}, {label: "사도행전 13장", bookOrder: 44, chapter: 13}]},
    {id: "tarsus", name: "다소", en: "Tarsus", modern: "터키 타르수스", type: "도시",
        lngLat: [34.90, 36.92], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "사도 바울의 고향인 길리기아의 도시입니다.",
        refs: [{label: "사도행전 9장", bookOrder: 44, chapter: 9}]},
    {id: "salamis", name: "살라미", en: "Salamis", modern: "키프로스 파마구스타 인근", type: "항구",
        lngLat: [33.90, 35.18], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "1차 전도여행에서 처음 복음을 전한 구브로 동편 항구입니다.",
        refs: [{label: "사도행전 13장", bookOrder: 44, chapter: 13}]},
    {id: "paphos", name: "바보", en: "Paphos", modern: "키프로스 파포스", type: "항구",
        lngLat: [32.41, 34.75], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "총독 서기오 바울이 믿은 구브로 서편의 항구입니다.",
        refs: [{label: "사도행전 13장", bookOrder: 44, chapter: 13}]},
    {id: "pisidian-antioch", name: "비시디아 안디옥", en: "Pisidian Antioch", modern: "터키 얄바치 인근", type: "도시",
        lngLat: [31.19, 38.31], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "바울이 회당에서 첫 선교 설교를 전한 갈라디아 지방의 도시입니다.",
        refs: [{label: "사도행전 13장", bookOrder: 44, chapter: 13}]},
    {id: "iconium", name: "이고니온", en: "Iconium", modern: "터키 코니아", type: "도시",
        lngLat: [32.49, 37.87], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "1차 전도여행의 주요 사역지 중 하나입니다.",
        refs: [{label: "사도행전 14장", bookOrder: 44, chapter: 14}]},
    {id: "lystra", name: "루스드라", en: "Lystra", modern: "터키 하툰사라이 인근(유력)", type: "도시",
        lngLat: [32.45, 37.58], from: -300, to: 100, importance: 3, certainty: "PROBABLE",
        desc: "바울이 돌에 맞은 곳이자 디모데의 고향입니다.",
        refs: [{label: "사도행전 14장", bookOrder: 44, chapter: 14}, {label: "사도행전 16장", bookOrder: 44, chapter: 16}]},
    {id: "troas", name: "드로아", en: "Troas", modern: "터키 달야크 인근", type: "항구",
        lngLat: [26.16, 39.96], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "바울이 '마게도냐로 건너오라'는 환상을 본 에게해 항구입니다.",
        refs: [{label: "사도행전 16장", bookOrder: 44, chapter: 16}]},
    {id: "philippi", name: "빌립보", en: "Philippi", modern: "그리스 필리피", type: "도시",
        lngLat: [24.29, 41.01], from: -300, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "유럽에서 처음 복음이 전해진 마게도냐의 로마 식민 도시입니다.",
        refs: [{label: "사도행전 16장", bookOrder: 44, chapter: 16}, {label: "빌립보서 1장", bookOrder: 50, chapter: 1}]},
    {id: "thessalonica", name: "데살로니가", en: "Thessalonica", modern: "그리스 테살로니키", type: "도시",
        lngLat: [22.94, 40.64], from: -300, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "마게도냐의 중심 항구 도시로, 데살로니가서의 수신 교회가 있던 곳입니다.",
        refs: [{label: "사도행전 17장", bookOrder: 44, chapter: 17}, {label: "데살로니가전서 1장", bookOrder: 52, chapter: 1}]},
    {id: "berea", name: "베뢰아", en: "Berea", modern: "그리스 베리아", type: "도시",
        lngLat: [22.20, 40.52], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "말씀을 간절한 마음으로 상고한 사람들의 도시입니다.",
        refs: [{label: "사도행전 17장", bookOrder: 44, chapter: 17}]},
    {id: "athens", name: "아덴", en: "Athens", modern: "그리스 아테네", type: "도시",
        lngLat: [23.73, 37.98], from: -800, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "바울이 아레오바고에서 '알지 못하는 신'을 전한 그리스 문화의 중심지입니다.",
        refs: [{label: "사도행전 17장", bookOrder: 44, chapter: 17}]},
    {id: "corinth", name: "고린도", en: "Corinth", modern: "그리스 코린토스", type: "도시",
        lngLat: [22.88, 37.91], from: -800, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "바울이 1년 6개월 머문 무역 도시로, 고린도서의 수신 교회가 있던 곳입니다.",
        refs: [{label: "사도행전 18장", bookOrder: 44, chapter: 18}, {label: "고린도전서 1장", bookOrder: 46, chapter: 1}]},
    {id: "ephesus", name: "에베소", en: "Ephesus", modern: "터키 셀추크 인근", type: "도시",
        lngLat: [27.34, 37.94], from: -800, to: 100, importance: 1, certainty: "CONFIRMED",
        desc: "바울이 3년 가까이 사역한 아시아의 중심 도시입니다.",
        refs: [{label: "사도행전 19장", bookOrder: 44, chapter: 19}, {label: "에베소서 1장", bookOrder: 49, chapter: 1}]},
    {id: "miletus", name: "밀레도", en: "Miletus", modern: "터키 발라트 인근", type: "항구",
        lngLat: [27.28, 37.53], from: -800, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "바울이 에베소 장로들과 고별 설교를 나눈 항구입니다.",
        refs: [{label: "사도행전 20장", bookOrder: 44, chapter: 20}]},
    {id: "malta", name: "멜리데", en: "Malta", modern: "몰타", type: "섬",
        lngLat: [14.40, 35.90], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "로마로 호송되던 바울 일행이 파선 후 상륙한 섬입니다.",
        refs: [{label: "사도행전 28장", bookOrder: 44, chapter: 28}]},
    {id: "puteoli", name: "보디올", en: "Puteoli", modern: "이탈리아 포추올리", type: "항구",
        lngLat: [14.12, 40.82], from: -300, to: 100, importance: 3, certainty: "CONFIRMED",
        desc: "바울이 이탈리아에 상륙한 나폴리만의 항구입니다.",
        refs: [{label: "사도행전 28장", bookOrder: 44, chapter: 28}]},
    {id: "rome", name: "로마", en: "Rome", modern: "이탈리아 로마", type: "도시",
        lngLat: [12.49, 41.89], from: -750, to: 100, importance: 1, certainty: "CONFIRMED",
        desc: "제국의 수도이자 바울이 갇힌 채로 복음을 전한 최종 목적지입니다.",
        refs: [{label: "사도행전 28장", bookOrder: 44, chapter: 28}, {label: "로마서 1장", bookOrder: 45, chapter: 1}]},
    {id: "alexandria", name: "알렉산드리아", en: "Alexandria", modern: "이집트 알렉산드리아", type: "항구",
        lngLat: [29.92, 31.20], from: -332, to: 100, importance: 2, certainty: "CONFIRMED",
        desc: "칠십인역이 번역된 헬레니즘 학문의 중심 도시이며, 아볼로의 고향입니다.",
        refs: [{label: "사도행전 18장", bookOrder: 44, chapter: 18}]},
    {id: "persepolis", name: "페르세폴리스", en: "Persepolis", modern: "이란 시라즈 인근", type: "도시",
        lngLat: [52.89, 29.93], from: -520, to: -330, importance: 2, certainty: "CONFIRMED",
        desc: "다리오 1세가 세운 페르시아 제국의 의례 수도입니다.",
        refs: []}
];

/* ---------- 국가·제국 (스냅샷별 대략적 세력권, §10.3) ---------- */
/* 원형 반투명 면 = 대략적인 세력권. 정밀한 국경이 아니다. */
const POLITIES = {
    "s-patriarch": [
        {name: "애굽 (중왕국 말기)", center: [31.2, 28.8], radiusKm: 430, color: "#d97706"},
        {name: "가나안 도시국가들", center: [35.2, 32.0], radiusKm: 170, color: "#059669"},
        {name: "마리와 아모리계 왕국들", center: [40.6, 35.1], radiusKm: 300, color: "#8b5cf6"},
        {name: "고바빌로니아 왕국", center: [44.4, 32.7], radiusKm: 300, color: "#2563eb"},
        {name: "엘람", center: [48.2, 32.2], radiusKm: 320, color: "#dc2626"}
    ],
    "s-exodus": [
        {name: "애굽 (신왕국)", center: [31.5, 29.8], radiusKm: 420, color: "#d97706"},
        {name: "가나안 성읍들", center: [35.2, 32.0], radiusKm: 150, color: "#059669"},
        {name: "미디안", center: [35.5, 29.0], radiusKm: 160, color: "#8b5cf6"},
        {name: "헷 제국", center: [35.0, 37.2], radiusKm: 420, color: "#2563eb"},
        {name: "에돔·세일", center: [35.5, 30.45], radiusKm: 105, color: "#a16207"},
        {name: "모압", center: [35.75, 31.35], radiusKm: 80, color: "#db2777"},
        {name: "암몬", center: [35.9, 31.95], radiusKm: 65, color: "#0d9488"}
    ],
    "s-settlement": [
        {name: "이스라엘 지파 (가나안 진입기)", center: [35.3, 31.95], radiusKm: 95, color: "#2563eb"},
        {name: "잔존 가나안 성읍들", center: [35.0, 32.6], radiusKm: 100, color: "#059669"},
        {name: "애굽 (신왕국 영향권)", center: [31.3, 29.3], radiusKm: 400, color: "#d97706"},
        {name: "에돔·세일", center: [35.5, 30.45], radiusKm: 105, color: "#a16207"},
        {name: "모압", center: [35.75, 31.35], radiusKm: 80, color: "#db2777"},
        {name: "암몬", center: [35.9, 31.95], radiusKm: 65, color: "#8b5cf6"}
    ],
    "s-judges": [
        {name: "이스라엘 산지 정착 집단", center: [35.25, 32.0], radiusKm: 105, color: "#2563eb"},
        {name: "블레셋 해안 도시들", center: [34.62, 31.65], radiusKm: 75, color: "#dc2626"},
        {name: "잔존 가나안 도시국가들", center: [35.05, 32.65], radiusKm: 95, color: "#059669"},
        {name: "암몬 고원 집단", center: [35.9, 31.95], radiusKm: 65, color: "#8b5cf6"},
        {name: "모압 고원 집단", center: [35.75, 31.35], radiusKm: 80, color: "#d97706"},
        {name: "에돔·세일 집단", center: [35.5, 30.45], radiusKm: 105, color: "#a16207"},
        {name: "애굽 (신왕국 말기)", center: [31.2, 28.8], radiusKm: 390, color: "#78716c"}
    ],
    "s-united": [
        {name: "통일 이스라엘", center: [35.3, 31.9], radiusKm: 180, color: "#2563eb"},
        {name: "애굽", center: [31.3, 29.9], radiusKm: 350, color: "#d97706"},
        {name: "아람 (다메섹)", center: [36.4, 33.6], radiusKm: 130, color: "#8b5cf6"},
        {name: "블레셋", center: [34.55, 31.75], radiusKm: 55, color: "#dc2626"},
        {name: "앗수르", center: [43.3, 36.0], radiusKm: 260, color: "#78716c"}
    ],
    "s-divided-early": [
        {name: "북이스라엘", center: [35.3, 32.5], radiusKm: 110, color: "#059669"},
        {name: "남유다", center: [35.1, 31.55], radiusKm: 80, color: "#2563eb"},
        {name: "아람 (다메섹)", center: [36.4, 33.6], radiusKm: 140, color: "#8b5cf6"},
        {name: "애굽", center: [31.3, 29.9], radiusKm: 350, color: "#d97706"},
        {name: "앗수르", center: [43.3, 36.0], radiusKm: 300, color: "#78716c"}
    ],
    "s-divided-late": [
        {name: "앗수르 제국", center: [41.5, 35.8], radiusKm: 750, color: "#78716c"},
        {name: "남유다", center: [35.1, 31.55], radiusKm: 80, color: "#2563eb"},
        {name: "애굽", center: [31.3, 29.9], radiusKm: 320, color: "#d97706"}
    ],
    "s-exile": [
        {name: "신바벨론 제국", center: [41.5, 33.8], radiusKm: 850, color: "#dc2626"},
        {name: "메대", center: [47.5, 35.5], radiusKm: 420, color: "#8b5cf6"},
        {name: "애굽", center: [31.3, 29.9], radiusKm: 320, color: "#d97706"}
    ],
    "s-persia-cyrus": [
        {name: "페르시아 제국 (서아시아)", center: [45.0, 34.0], radiusKm: 1250, color: "#7c3aed"},
        {name: "페르시아령 소아시아", center: [31.5, 39.0], radiusKm: 550, color: "#8b5cf6"},
        {name: "애굽 제26왕조 (독립)", center: [31.0, 28.5], radiusKm: 430, color: "#d97706"},
        {name: "예후드", center: [35.2, 31.75], radiusKm: 55, color: "#2563eb"},
        {name: "사마리아 속주", center: [35.2, 32.35], radiusKm: 60, color: "#059669"},
        {name: "페니키아 도시권", center: [35.3, 33.75], radiusKm: 100, color: "#0d9488"}
    ],
    "s-persia-imperial": [
        {name: "아케메네스 페르시아 제국", center: [45.0, 33.0], radiusKm: 1700, color: "#7c3aed"},
        {name: "예후드", center: [35.2, 31.75], radiusKm: 55, color: "#2563eb"},
        {name: "사마리아 속주", center: [35.2, 32.35], radiusKm: 60, color: "#059669"},
        {name: "페니키아 도시권", center: [35.3, 33.75], radiusKm: 100, color: "#0d9488"}
    ],
    "s-persia-egypt-independent": [
        {name: "페르시아 제국 (서아시아)", center: [47.0, 34.0], radiusKm: 1350, color: "#7c3aed"},
        {name: "페르시아령 소아시아", center: [31.5, 39.0], radiusKm: 550, color: "#8b5cf6"},
        {name: "애굽 후기 왕조 (독립)", center: [31.0, 28.5], radiusKm: 500, color: "#d97706"},
        {name: "예후드", center: [35.2, 31.75], radiusKm: 55, color: "#2563eb"},
        {name: "사마리아 속주", center: [35.2, 32.35], radiusKm: 60, color: "#059669"},
        {name: "페니키아 도시권", center: [35.3, 33.75], radiusKm: 100, color: "#0d9488"}
    ],
    "s-persia-late": [
        {name: "후기 아케메네스 페르시아 제국", center: [45.0, 33.0], radiusKm: 1650, color: "#7c3aed"},
        {name: "예후드", center: [35.2, 31.75], radiusKm: 55, color: "#2563eb"},
        {name: "사마리아 속주", center: [35.2, 32.35], radiusKm: 60, color: "#059669"},
        {name: "페니키아 도시권", center: [35.3, 33.75], radiusKm: 100, color: "#0d9488"}
    ],
    "s-hellenistic-ptolemaic": [
        {name: "프톨레마이오스 왕국", center: [31.0, 28.5], radiusKm: 820, color: "#d97706"},
        {name: "셀레우코스 왕국", center: [43.0, 34.5], radiusKm: 1450, color: "#7c3aed"},
        {name: "안티고노스 왕국", center: [22.5, 40.2], radiusKm: 480, color: "#2563eb"}
    ],
    "s-hellenistic-seleucid": [
        {name: "셀레우코스 제국", center: [40.5, 34.0], radiusKm: 1100, color: "#7c3aed"},
        {name: "프톨레마이오스 왕국", center: [31.0, 28.5], radiusKm: 650, color: "#d97706"},
        {name: "안티고노스 왕국", center: [22.5, 40.2], radiusKm: 480, color: "#2563eb"},
        {name: "페르가몬 왕국", center: [27.2, 39.1], radiusKm: 280, color: "#059669"},
        {name: "파르티아", center: [54.0, 36.0], radiusKm: 480, color: "#78716c"}
    ],
    "s-hellenistic-hasmonean": [
        {name: "하스몬 왕국", center: [35.2, 31.8], radiusKm: 120, color: "#2563eb"},
        {name: "셀레우코스 왕국 잔존 세력", center: [36.5, 34.5], radiusKm: 330, color: "#7c3aed"},
        {name: "프톨레마이오스 왕국", center: [31.0, 28.5], radiusKm: 600, color: "#d97706"},
        {name: "나바테아 왕국", center: [35.5, 30.0], radiusKm: 250, color: "#059669"},
        {name: "파르티아 제국", center: [50.0, 34.0], radiusKm: 900, color: "#78716c"}
    ],
    "s-rome-nt": [
        {name: "로마 제국", center: [18.0, 38.5], radiusKm: 2100, color: "#dc2626"},
        {name: "유대 (로마 지배)", center: [35.2, 31.8], radiusKm: 90, color: "#2563eb"},
        {name: "파르티아", center: [50.0, 34.0], radiusKm: 900, color: "#78716c"}
    ],
    "s-apostolic": [
        {name: "로마 제국", center: [18.0, 38.5], radiusKm: 2100, color: "#dc2626"},
        {name: "파르티아", center: [50.0, 34.0], radiusKm: 900, color: "#78716c"}
    ]
};

/* ---------- 사건 (§15.7) ---------- */
const EVENTS = [
    {id: "ev-exodus", title: "출애굽 (애굽 탈출)", year: -1300, placeId: "rameses", certainty: "DISPUTED",
        desc: "이스라엘 백성이 애굽에서 나왔습니다. 연대는 열왕기상 6:1을 근거로 한 15세기설(BC 1446년경)과 라암셋 건축을 근거로 한 13세기설(BC 1270년경)로 나뉩니다.",
        refs: [{label: "출애굽기 12장", bookOrder: 2, chapter: 12}, {label: "출애굽기 14장", bookOrder: 2, chapter: 14}]},
    {id: "ev-sinai-covenant", title: "시내산 언약과 십계명", year: -1299, placeId: "sinai", certainty: "DISPUTED",
        desc: "출애굽한 이스라엘이 시내산에서 율법을 받고 하나님과 언약을 맺었습니다. 연대와 시내산 위치 모두 복수 견해가 있습니다.",
        refs: [{label: "출애굽기 19장", bookOrder: 2, chapter: 19}, {label: "출애굽기 20장", bookOrder: 2, chapter: 20}]},
    {id: "ev-jordan-jericho", title: "요단 도하와 여리고 함락", year: -1240, placeId: "jericho", certainty: "DISPUTED",
        desc: "여호수아의 인도로 요단강을 건너 여리고를 무너뜨리며 가나안 정복이 시작되었습니다. 연대는 출애굽 연대 견해에 따라 BC 1406년경 또는 1230년경으로 봅니다.",
        refs: [{label: "여호수아 3장", bookOrder: 6, chapter: 3}, {label: "여호수아 6장", bookOrder: 6, chapter: 6}]},
    {id: "ev-shechem-covenant", title: "세겜 언약 갱신", year: -1220, placeId: "shechem", certainty: "DISPUTED",
        desc: "여호수아가 말년에 이스라엘을 세겜에 모아 '오직 나와 내 집은 여호와를 섬기겠노라'며 언약을 갱신했습니다.",
        refs: [{label: "여호수아 24장", bookOrder: 6, chapter: 24}]},
    {id: "ev-division", title: "왕국 분열", year: -931, placeId: "shechem", certainty: "APPROXIMATE",
        desc: "르호보암 때 나라가 북이스라엘과 남유다로 나뉘었습니다.",
        refs: [{label: "열왕기상 12장", bookOrder: 11, chapter: 12}]},
    {id: "ev-samaria-fall", title: "사마리아 함락", year: -722, placeId: "samaria", certainty: "CONFIRMED",
        desc: "앗수르가 사마리아를 함락시키고 북이스라엘 백성을 사로잡아 갔습니다.",
        refs: [{label: "열왕기하 17장", bookOrder: 12, chapter: 17}]},
    {id: "ev-first-deport", title: "1차 바벨론 포로 이주", year: -597, placeId: "jerusalem", certainty: "CONFIRMED",
        desc: "여호야긴 왕과 지도층이 바벨론으로 사로잡혀 갔습니다.",
        refs: [{label: "열왕기하 24장", bookOrder: 12, chapter: 24}]},
    {id: "ev-jerusalem-fall", title: "예루살렘 함락과 성전 파괴", year: -586, placeId: "jerusalem", certainty: "CONFIRMED",
        desc: "느부갓네살이 예루살렘과 성전을 무너뜨리고 남유다가 멸망했습니다.",
        refs: [{label: "열왕기하 25장", bookOrder: 12, chapter: 25}]},
    {id: "ev-cyrus-edict", title: "고레스 칙령과 1차 귀환", year: -538, placeId: "babylon", certainty: "PROBABLE",
        desc: "에스라서는 고레스가 유다 포로의 귀환과 성전 재건을 허용했다고 전합니다. 페르시아의 귀환 정책은 확인되지만 칙령의 구체적 문구는 성경 기록을 따릅니다.",
        refs: [{label: "에스라 1장", bookOrder: 15, chapter: 1}]},
    {id: "ev-temple-work-resumed", title: "성전 재건 재개", year: -520, placeId: "jerusalem", certainty: "APPROXIMATE",
        desc: "다리오 1세 때 학개와 스가랴의 권면으로 중단되었던 성전 재건이 다시 시작되었습니다.",
        refs: [{label: "에스라 5장", bookOrder: 15, chapter: 5}, {label: "학개 1장", bookOrder: 37, chapter: 1}]},
    {id: "ev-temple-rebuilt", title: "성전 재건 완료", year: -516, placeId: "jerusalem", certainty: "CONFIRMED",
        desc: "스룹바벨의 지휘로 두 번째 성전이 완공되었습니다.",
        refs: [{label: "에스라 6장", bookOrder: 15, chapter: 6}]},
    {id: "ev-esther", title: "에스더 이야기의 배경", year: -480, placeId: "susa", certainty: "DISPUTED",
        desc: "에스더서는 아하수에로 왕의 수산 궁정을 배경으로 합니다. 일반적으로 크세르크세스 1세 시대와 연결하지만 역사적 세부에는 논쟁이 있습니다.",
        refs: [{label: "에스더 1장", bookOrder: 17, chapter: 1}, {label: "에스더 8장", bookOrder: 17, chapter: 8}]},
    {id: "ev-ezra-return", title: "에스라의 귀환과 율법 교육", year: -458, placeId: "jerusalem", certainty: "DISPUTED",
        desc: "전통 연대에 따르면 에스라는 아닥사스다 1세 제7년인 BC 458년경 예루살렘에 왔습니다. BC 398년경으로 보는 대안 연대도 있습니다.",
        refs: [{label: "에스라 7장", bookOrder: 15, chapter: 7}, {label: "에스라 8장", bookOrder: 15, chapter: 8}]},
    {id: "ev-nehemiah-wall", title: "느헤미야의 귀환과 성벽 재건", year: -445, placeId: "jerusalem", certainty: "APPROXIMATE",
        desc: "느헤미야가 아닥사스다 1세 제20년경 예루살렘에 와서 무너진 성벽을 재건했습니다.",
        refs: [{label: "느헤미야 2장", bookOrder: 16, chapter: 2}, {label: "느헤미야 6장", bookOrder: 16, chapter: 6}]},
    {id: "ev-nativity", title: "예수님의 탄생", year: -4, placeId: "bethlehem", certainty: "APPROXIMATE",
        desc: "예수님이 베들레헴에서 나셨습니다. 연대는 BC 6~4년경으로 봅니다.",
        refs: [{label: "마태복음 2장", bookOrder: 40, chapter: 2}, {label: "누가복음 2장", bookOrder: 42, chapter: 2}]},
    {id: "ev-cross", title: "십자가와 부활", year: 30, placeId: "jerusalem", certainty: "DISPUTED",
        desc: "예수님이 십자가에 달려 죽으시고 사흘 만에 부활하셨습니다. 연대는 AD 30년 또는 33년으로 봅니다.",
        refs: [{label: "마태복음 27장", bookOrder: 40, chapter: 27}, {label: "마태복음 28장", bookOrder: 40, chapter: 28}]},
    {id: "ev-pentecost", title: "오순절 성령 강림", year: 30, placeId: "jerusalem", certainty: "APPROXIMATE",
        desc: "오순절에 성령이 임하여 예루살렘 교회가 시작되었습니다.",
        refs: [{label: "사도행전 2장", bookOrder: 44, chapter: 2}]},
    {id: "ev-jerusalem-council", title: "예루살렘 공회", year: 49, placeId: "jerusalem", certainty: "APPROXIMATE",
        desc: "이방인 신자에게 율법을 지우지 않기로 결정한 초대교회의 회의입니다.",
        refs: [{label: "사도행전 15장", bookOrder: 44, chapter: 15}]},
    {id: "ev-paul-rome", title: "바울의 로마 도착", year: 60, placeId: "rome", certainty: "APPROXIMATE",
        desc: "바울이 죄수의 몸으로 로마에 도착하여 복음을 전했습니다.",
        refs: [{label: "사도행전 28장", bookOrder: 44, chapter: 28}]}
];

/* ---------- 이동 경로 (§15.9) — 같은 routeGroupId = 같은 경로의 복수 견해 ---------- */
const ROUTES = [
    {id: "route-exodus-south", routeGroupId: "exodus", viewpoint: "남부 경로 (전통)", name: "출애굽 경로",
        jumpYear: -1300, certainty: "DISPUTED", color: "#059669",
        desc: "라암셋과 숙곳에서 홍해를 건너 시내 반도 남부의 시내산(전통)을 거쳐 가데스 바네아로 오르고, 요단 동편 모압 평지(느보산)를 지나 여리고 맞은편에 이르는 전통적 견해입니다. 세부 경유지는 단순화된 근사입니다.",
        coords: [[31.83, 30.80], [32.10, 30.55], [32.90, 29.55], [33.20, 28.90], [33.85, 28.72], [33.97, 28.54], [34.20, 29.60], [34.42, 30.65], [35.10, 30.95], [35.63, 31.45], [35.73, 31.77], [35.44, 31.87]],
        refs: [{label: "출애굽기 12장", bookOrder: 2, chapter: 12}, {label: "민수기 33장", bookOrder: 4, chapter: 33}]},
    {id: "route-exodus-north", routeGroupId: "exodus", viewpoint: "북부 경로설", name: "출애굽 경로",
        jumpYear: -1300, certainty: "DISPUTED", color: "#059669",
        desc: "시내 반도 북부를 지나는 견해로, 시내산 위치도 북부 또는 미디안 쪽으로 봅니다. 세부 경유지는 단순화된 근사입니다.",
        coords: [[31.83, 30.80], [32.60, 30.75], [33.40, 30.85], [34.00, 30.60], [34.42, 30.65], [35.10, 30.95], [35.63, 31.45], [35.73, 31.77], [35.44, 31.87]],
        refs: [{label: "출애굽기 13장", bookOrder: 2, chapter: 13}]},
    {id: "route-exile", routeGroupId: "exile-route", viewpoint: "", name: "바벨론 포로 이동",
        jumpYear: -586, certainty: "APPROXIMATE", color: "#dc2626",
        desc: "사막을 가로지르지 않고 비옥한 초승달 지대를 따라 북상한 뒤 유프라테스를 따라 내려간 것으로 봅니다.",
        coords: [[35.23, 31.78], [36.31, 33.51], [37.15, 34.80], [38.28, 36.10], [39.03, 36.86], [40.90, 35.90], [42.10, 34.80], [43.30, 33.80], [44.42, 32.54]],
        refs: [{label: "열왕기하 25장", bookOrder: 12, chapter: 25}, {label: "예레미야 39장", bookOrder: 24, chapter: 39}]},
    {id: "route-return", routeGroupId: "zerubbabel-return", viewpoint: "", name: "1차 포로 귀환",
        jumpYear: -538, certainty: "APPROXIMATE", color: "#0d9488",
        desc: "세스바살과 스룹바벨로 대표되는 초기 귀환 공동체가 비옥한 초승달 지대의 육로를 따라 예루살렘으로 돌아온 경로를 근사했습니다.",
        coords: [[44.42, 32.54], [43.30, 33.80], [42.10, 34.80], [40.90, 35.90], [39.03, 36.86], [38.28, 36.10], [37.15, 34.80], [36.31, 33.51], [35.23, 31.78]],
        refs: [{label: "에스라 1장", bookOrder: 15, chapter: 1}, {label: "에스라 2장", bookOrder: 15, chapter: 2}]},
    {id: "route-ezra-return", routeGroupId: "ezra-return", viewpoint: "", name: "에스라의 귀환",
        jumpYear: -458, certainty: "DISPUTED", color: "#2563eb",
        desc: "전통 연대에 따른 에스라 일행의 바벨론-예루살렘 귀환로입니다. 실제 경유지는 전해지지 않아 비옥한 초승달 지대의 통상 육로로 근사했습니다.",
        coords: [[44.42, 32.54], [43.30, 33.80], [42.10, 34.80], [40.90, 35.90], [39.03, 36.86], [38.28, 36.10], [37.15, 34.80], [36.31, 33.51], [35.23, 31.78]],
        refs: [{label: "에스라 7장", bookOrder: 15, chapter: 7}, {label: "에스라 8장", bookOrder: 15, chapter: 8}]},
    {id: "route-nehemiah-return", routeGroupId: "nehemiah-return", viewpoint: "", name: "느헤미야의 수산-예루살렘 여정",
        jumpYear: -445, certainty: "APPROXIMATE", color: "#d97706",
        desc: "수산에서 출발한 느헤미야가 페르시아 왕의 허가를 받아 예루살렘으로 향한 여정을 주요 육로에 따라 근사했습니다.",
        coords: [[48.25, 32.19], [44.42, 32.54], [43.30, 33.80], [42.10, 34.80], [40.90, 35.90], [39.03, 36.86], [38.28, 36.10], [37.15, 34.80], [36.31, 33.51], [35.23, 31.78]],
        refs: [{label: "느헤미야 1장", bookOrder: 16, chapter: 1}, {label: "느헤미야 2장", bookOrder: 16, chapter: 2}]},
    {id: "route-paul-1", routeGroupId: "paul-1", viewpoint: "", name: "바울 1차 전도여행",
        jumpYear: 47, certainty: "APPROXIMATE", color: "#2563eb",
        desc: "안디옥에서 구브로를 거쳐 갈라디아 남부의 도시들을 순회한 여정입니다(행 13-14장). 항로는 단순화된 근사입니다.",
        coords: [[36.16, 36.20], [35.60, 35.90], [33.90, 35.18], [32.41, 34.75], [30.85, 36.60], [30.85, 36.96], [31.19, 38.31], [32.49, 37.87], [32.45, 37.58], [33.25, 37.35], [32.45, 37.58], [32.49, 37.87], [31.19, 38.31], [30.85, 36.96], [30.72, 36.60], [33.00, 36.10], [36.16, 36.20]],
        refs: [{label: "사도행전 13장", bookOrder: 44, chapter: 13}, {label: "사도행전 14장", bookOrder: 44, chapter: 14}]},
    {id: "route-paul-2", routeGroupId: "paul-2", viewpoint: "", name: "바울 2차 전도여행",
        jumpYear: 50, certainty: "APPROXIMATE", color: "#7c3aed",
        desc: "육로로 갈라디아를 지나 드로아에서 마게도냐로 건너가 빌립보·데살로니가·아덴·고린도에 이른 여정입니다(행 15:36-18:22).",
        coords: [[36.16, 36.20], [34.90, 36.92], [33.25, 37.35], [32.45, 37.58], [32.49, 37.87], [30.50, 38.60], [28.50, 39.40], [26.16, 39.96], [25.40, 40.60], [24.29, 41.01], [22.94, 40.64], [22.20, 40.52], [23.73, 37.98], [22.88, 37.91], [27.34, 37.94], [34.89, 32.50], [35.23, 31.78]],
        refs: [{label: "사도행전 16장", bookOrder: 44, chapter: 16}, {label: "사도행전 17장", bookOrder: 44, chapter: 17}, {label: "사도행전 18장", bookOrder: 44, chapter: 18}]},
    {id: "route-paul-3", routeGroupId: "paul-3", viewpoint: "", name: "바울 3차 전도여행",
        jumpYear: 54, certainty: "APPROXIMATE", color: "#db2777",
        desc: "에베소에서 오래 사역한 뒤 마게도냐와 고린도를 다시 방문하고 밀레도를 거쳐 예루살렘으로 향한 여정입니다(행 18:23-21:17).",
        coords: [[36.16, 36.20], [34.90, 36.92], [32.49, 37.87], [30.50, 38.60], [27.34, 37.94], [26.16, 39.96], [24.29, 41.01], [22.94, 40.64], [22.88, 37.91], [24.29, 41.01], [26.16, 39.96], [27.28, 37.53], [28.50, 36.40], [35.20, 33.27], [34.89, 32.50], [35.23, 31.78]],
        refs: [{label: "사도행전 19장", bookOrder: 44, chapter: 19}, {label: "사도행전 20장", bookOrder: 44, chapter: 20}]},
    {id: "route-paul-rome", routeGroupId: "paul-rome", viewpoint: "", name: "바울의 로마 이송",
        jumpYear: 59, certainty: "APPROXIMATE", color: "#d97706",
        desc: "가이사랴에서 배로 출발해 크레타 인근에서 파선하여 멜리데에 상륙한 뒤 로마에 도착한 여정입니다(행 27-28장).",
        coords: [[34.89, 32.50], [35.37, 33.56], [30.29, 36.24], [25.15, 35.00], [24.08, 34.80], [14.40, 35.90], [15.28, 37.07], [14.12, 40.82], [12.49, 41.89]],
        refs: [{label: "사도행전 27장", bookOrder: 44, chapter: 27}, {label: "사도행전 28장", bookOrder: 44, chapter: 28}]}
];

/* ---------- 지도 색상 (라이트/다크 두 벌, §7.6) ---------- */
const MAP_COLORS = {
    light: {sea: "#e7eef5", land: "#f7f2e8", landLine: "#d8cdb9"},
    dark: {sea: "#101720", land: "#242b34", landLine: "#3c4653"}
};

const LAYER_DEFS = [
    {key: "polity", label: "역사 정치 (국가·제국)", default: true},
    {key: "place", label: "성경 장소", default: true},
    {key: "event", label: "사건", default: false},
    {key: "route", label: "이동 경로", default: false}
];

/* ================= 앱 ================= */

class BibleHistoryMap {
    constructor() {
        this.state = {
            year: -950,
            snapshot: null,
            layers: new Set(LAYER_DEFS.filter(l => l.default).map(l => l.key)),
            selection: null,          // {type, id}
            activeRouteId: null,
            viewpointByGroup: {}      // routeGroupId -> routeId
        };
        this.markers = [];            // {marker, el, kind, data}
        this.toastTimer = null;
        this.urlTimer = null;
        this.lastRenderSig = null;
        this.mapReady = false;
        this.isMobile = window.matchMedia("(max-width: 991.98px)");
    }

    init() {
        this.cacheElements();
        this.initNav();
        this.readUrl();
        this.buildTimebar();
        this.buildLayerControls();
        this.buildLegend();
        this.bindEvents();
        this.initMap();
        this.applyYear(this.state.year, {silent: true});
    }

    cacheElements() {
        this.el = {
            map: document.getElementById("bhmMap"),
            eraButtons: document.getElementById("bhmEraButtons"),
            slider: document.getElementById("bhmYearSlider"),
            yearLabel: document.getElementById("bhmYearLabel"),
            prevEra: document.getElementById("bhmPrevEra"),
            nextEra: document.getElementById("bhmNextEra"),
            layerToggles: document.getElementById("bhmLayerToggles"),
            routeChips: document.getElementById("bhmRouteChips"),
            legend: document.getElementById("bhmLegend"),
            search: document.getElementById("bhmSearch"),
            searchResults: document.getElementById("bhmSearchResults"),
            snapshotNotice: document.getElementById("bhmSnapshotNotice"),
            toast: document.getElementById("bhmToast"),
            emptyState: document.getElementById("bhmEmptyState"),
            emptyText: document.getElementById("bhmEmptyText"),
            emptyJump: document.getElementById("bhmEmptyJump"),
            panel: document.getElementById("bhmPanel"),
            panelBody: document.getElementById("bhmPanelBody"),
            panelClose: document.getElementById("bhmPanelClose"),
            panelGrip: document.getElementById("bhmPanelGrip"),
            eraDesc: document.getElementById("bhmEraDesc"),
            dataStatus: document.getElementById("bhmDataStatus"),
            listOpen: document.getElementById("bhmListOpen"),
            listOpenMobile: document.getElementById("bhmListOpenMobile"),
            layerCard: document.getElementById("bhmLayerCard"),
            listView: document.getElementById("bhmListView"),
            listTitle: document.getElementById("bhmListTitle"),
            listBody: document.getElementById("bhmListBody"),
            listClose: document.getElementById("bhmListClose")
        };
        this.el.dataStatus.textContent = "초기 시드 데이터 · 검수 전 · 기본 지도: Natural Earth";
        // 모바일: 컨트롤이 지도를 가리지 않도록 레이어 카드는 접힌 상태로 시작 (§7.1)
        if (this.isMobile.matches) this.el.layerCard.removeAttribute("open");
    }

    initNav() {
        const backButton = document.getElementById("topNavBackButton");
        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 역사 지도";
            pageTitleLabel.classList.remove("d-none");
        }
        if (backButton) {
            backButton.classList.remove("d-none");
            backButton.addEventListener("click", () => {
                window.location.href = "/web/study";
            });
        }
    }

    /* ---------- URL 동기화 (§7.4) ---------- */
    readUrl() {
        const p = new URLSearchParams(window.location.search);
        const year = parseInt(p.get("year"), 10);
        if (!Number.isNaN(year) && year !== 0) this.state.year = Math.max(-2000, Math.min(100, year));
        const layers = p.get("layers");
        if (layers) this.state.layers = new Set(layers.split(",").filter(k => LAYER_DEFS.some(d => d.key === k)));
        const route = p.get("route");
        if (route && ROUTES.some(r => r.id === route)) {
            this.state.activeRouteId = route;
            this.state.layers.add("route");
        }
        const sel = p.get("sel");
        if (sel && sel.includes(":")) {
            const [type, id] = sel.split(":");
            this.state.selection = {type, id};
        }
    }

    writeUrl() {
        // 슬라이더 드래그 중 replaceState 과다 호출 방지 (브라우저 rate limit)
        clearTimeout(this.urlTimer);
        this.urlTimer = setTimeout(() => {
            const p = new URLSearchParams();
            p.set("year", String(this.state.year));
            p.set("layers", [...this.state.layers].join(","));
            if (this.state.activeRouteId) p.set("route", this.state.activeRouteId);
            if (this.state.selection) p.set("sel", `${this.state.selection.type}:${this.state.selection.id}`);
            history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
        }, 200);
    }

    /* ---------- 시간 막대 ---------- */
    buildTimebar() {
        PERIODS.forEach(period => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "bhm-era-btn" + (period.mvp ? "" : " is-empty");
            btn.textContent = period.name;
            btn.dataset.periodId = period.id;
            btn.addEventListener("click", () => {
                const snap = SNAPSHOTS.find(s => s.periodId === period.id);
                this.applyYear(snap ? snap.baseYear : Math.round((period.from + period.to) / 2));
            });
            this.el.eraButtons.appendChild(btn);
        });
    }

    formatYear(year) {
        return year < 0 ? `BC ${-year}년` : `AD ${year}년`;
    }

    periodsAt(year) {
        return PERIODS.filter(p => year >= p.from && year <= p.to);
    }

    resolveSnapshot(year) {
        const periods = this.periodsAt(year);
        const candidates = SNAPSHOTS.filter(s => periods.some(p => p.id === s.periodId));
        if (!candidates.length) return null;
        const bounded = candidates.filter(s =>
            Number.isFinite(s.from) && Number.isFinite(s.to) && year >= s.from && year <= s.to);
        const pool = bounded.length ? bounded : candidates;
        return pool.reduce((best, s) =>
            Math.abs(s.baseYear - year) < Math.abs(best.baseYear - year) ? s : best);
    }

    nearestSnapshot(year) {
        return SNAPSHOTS.reduce((best, s) =>
            Math.abs(s.baseYear - year) < Math.abs(best.baseYear - year) ? s : best);
    }

    applyYear(year, opts = {}) {
        // 0년은 존재하지 않는다 (§14.3) — 진행 방향에 따라 AD 1년 / BC 1년으로 보정
        if (year === 0) year = this.state.year < 0 ? 1 : -1;
        this.state.year = year;
        this.el.slider.value = String(year);

        const periods = this.periodsAt(year);
        const names = periods.map(p => p.name).join(" / ") || "성경 시대 밖";
        this.el.yearLabel.textContent = `${this.formatYear(year)} · ${names}`;

        this.el.eraButtons.querySelectorAll(".bhm-era-btn").forEach(btn => {
            btn.classList.toggle("is-active", periods.some(p => p.id === btn.dataset.periodId));
        });
        const activeBtn = this.el.eraButtons.querySelector(".bhm-era-btn.is-active");
        if (activeBtn && activeBtn.scrollIntoView) {
            activeBtn.scrollIntoView({inline: "nearest", block: "nearest"});
        }

        this.el.eraDesc.textContent = periods.map(p => p.desc).join(" ");

        const prevSnapshot = this.state.snapshot;
        const snap = this.resolveSnapshot(year);
        this.state.snapshot = snap;

        if (snap) {
            this.el.emptyState.hidden = true;
            this.el.snapshotNotice.textContent =
                `현재 지도는 ${this.formatYear(snap.baseYear)}경의 역사 자료를 기준으로 표시하고 있습니다`
                + (year !== snap.baseYear ? ` (선택: ${this.formatYear(year)})` : "");
            if (!opts.silent && (!prevSnapshot || prevSnapshot.id !== snap.id)) {
                this.showToast(snap.label);
            }
        } else {
            const nearest = this.nearestSnapshot(year);
            this.el.snapshotNotice.textContent = "이 시대의 지도 데이터는 아직 준비 중입니다";
            this.el.emptyText.textContent =
                `${names} 시대의 국가 경계 데이터는 아직 준비 중입니다. 가장 가까운 스냅샷으로 이동해 보세요.`;
            this.el.emptyJump.textContent = `${nearest.label}로 이동`;
            this.el.emptyJump.onclick = () => this.applyYear(nearest.baseYear);
            this.el.emptyState.hidden = false;
        }

        this.renderMapData();
        this.writeUrl();
    }

    showToast(text) {
        this.el.toast.textContent = text;
        this.el.toast.hidden = false;
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.el.toast.hidden = true;
        }, 2200);
    }

    stepEra(direction) {
        const ordered = [...SNAPSHOTS].sort((a, b) => a.baseYear - b.baseYear);
        const next = direction > 0
            ? ordered.find(s => s.baseYear > this.state.year)
            : [...ordered].reverse().find(s => s.baseYear < this.state.year);
        if (next) this.applyYear(next.baseYear);
    }

    /* ---------- 레이어 컨트롤 ---------- */
    buildLayerControls() {
        LAYER_DEFS.forEach(def => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = this.state.layers.has(def.key);
            input.addEventListener("change", () => {
                if (input.checked) this.state.layers.add(def.key);
                else this.state.layers.delete(def.key);
                if (def.key === "route" && !input.checked) this.setActiveRoute(null);
                this.renderMapData();
                this.writeUrl();
            });
            label.append(input, document.createTextNode(def.label));
            label.dataset.layerKey = def.key;
            this.el.layerToggles.appendChild(label);
        });

        const seenGroups = new Set();
        ROUTES.forEach(route => {
            if (seenGroups.has(route.routeGroupId)) return;
            seenGroups.add(route.routeGroupId);
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "bhm-chip-btn";
            chip.textContent = route.name;
            chip.dataset.routeGroupId = route.routeGroupId;
            chip.addEventListener("click", () => {
                const current = this.getActiveRoute();
                if (current && current.routeGroupId === route.routeGroupId) {
                    this.setActiveRoute(null);
                    return;
                }
                const preferred = this.state.viewpointByGroup[route.routeGroupId];
                const target = ROUTES.find(r => r.id === preferred) || route;
                this.selectEntity("route", target.id);
            });
            this.el.routeChips.appendChild(chip);
        });
    }

    getActiveRoute() {
        return ROUTES.find(r => r.id === this.state.activeRouteId) || null;
    }

    setActiveRoute(routeId) {
        this.state.activeRouteId = routeId;
        this.el.routeChips.querySelectorAll(".bhm-chip-btn").forEach(chip => {
            const active = routeId
                ? ROUTES.some(r => r.id === routeId && r.routeGroupId === chip.dataset.routeGroupId)
                : false;
            chip.classList.toggle("is-active", active);
        });
        if (routeId) this.state.layers.add("route");
        this.syncLayerInputs();
        this.renderMapData();
        this.writeUrl();
    }

    syncLayerInputs() {
        this.el.layerToggles.querySelectorAll("label").forEach(label => {
            const input = label.querySelector("input");
            input.checked = this.state.layers.has(label.dataset.layerKey);
        });
    }

    buildLegend() {
        this.el.legend.innerHTML = `
            <div class="bhm-legend-row"><span class="bhm-legend-swatch bhm-legend-swatch--polity"></span>대략적인 세력권 (반투명·점선)</div>
            <div class="bhm-legend-row"><span class="bhm-marker-dot" style="flex-shrink:0"></span>성경 장소</div>
            <div class="bhm-legend-row"><span class="bhm-marker-dot" style="flex-shrink:0;background:#d97706;border-radius:3px"></span>사건</div>
            <div class="bhm-legend-row"><span class="bhm-legend-swatch bhm-legend-swatch--route"></span>이동 경로 (근사)</div>
            <div class="bhm-legend-row"><span class="bhm-legend-swatch bhm-legend-swatch--route-disputed"></span>여러 견해가 있는 경로 (점선)</div>
            <div class="bhm-legend-row">배지: 유력한 위치 · 대략적인 범위 · 여러 견해 존재</div>
        `;
    }

    /* ---------- 지도 ---------- */
    currentMapColors() {
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        return dark ? MAP_COLORS.dark : MAP_COLORS.light;
    }

    initMap() {
        if (typeof maplibregl === "undefined") {
            this.el.snapshotNotice.textContent = "지도 라이브러리를 불러오지 못했습니다. 새로고침해 주세요.";
            return;
        }
        const colors = this.currentMapColors();
        this.map = new maplibregl.Map({
            container: this.el.map,
            center: [32, 33.5],
            zoom: 4.1,
            minZoom: 2.5,
            maxZoom: 8,
            attributionControl: {compact: true, customAttribution: "기본 지도: Natural Earth (Public Domain)"},
            style: {
                version: 8,
                sources: {
                    land: {type: "geojson", data: "/data/bible-history/ne_110m_land.geojson"}
                },
                layers: [
                    {id: "bg", type: "background", paint: {"background-color": colors.sea}},
                    {id: "land-fill", type: "fill", source: "land", paint: {"fill-color": colors.land}},
                    {id: "land-line", type: "line", source: "land", paint: {"line-color": colors.landLine, "line-width": 1}}
                ]
            }
        });
        this.map.addControl(new maplibregl.NavigationControl({showCompass: false}));
        this.map.on("load", () => {
            this.map.addSource("polities", {type: "geojson", data: this.emptyFC()});
            this.map.addLayer({
                id: "polity-fill", type: "fill", source: "polities",
                paint: {"fill-color": ["get", "color"], "fill-opacity": 0.14}
            });
            this.map.addLayer({
                id: "polity-line", type: "line", source: "polities",
                paint: {"line-color": ["get", "color"], "line-width": 1.4, "line-dasharray": [2, 2], "line-opacity": 0.7}
            });
            this.map.addSource("routes", {type: "geojson", data: this.emptyFC()});
            this.map.addLayer({
                id: "route-line-disputed", type: "line", source: "routes",
                filter: ["==", ["get", "disputed"], true],
                paint: {"line-color": ["get", "color"], "line-width": 2.6, "line-dasharray": [1.6, 1.6]}
            });
            this.map.addLayer({
                id: "route-line", type: "line", source: "routes",
                filter: ["==", ["get", "disputed"], false],
                paint: {"line-color": ["get", "color"], "line-width": 2.6}
            });
            this.mapReady = true;
            this.renderMapData();
            this.restoreSelection();
        });
        this.map.on("zoom", () => this.updateMarkerVisibility());
        // 지도 빈 영역 선택으로 패널 닫기 (§7.4). 마커 클릭은 stopPropagation으로 여기 도달하지 않음
        this.map.on("click", () => {
            if (!this.el.panel.hidden) this.closePanel();
        });

        new MutationObserver(() => {
            const c = this.currentMapColors();
            if (!this.map.isStyleLoaded()) return;
            this.map.setPaintProperty("bg", "background-color", c.sea);
            this.map.setPaintProperty("land-fill", "fill-color", c.land);
            this.map.setPaintProperty("land-line", "line-color", c.landLine);
        }).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});
    }

    emptyFC() {
        return {type: "FeatureCollection", features: []};
    }

    /** 반투명 세력권 원 → Polygon 근사 (§10.3 대략적인 세력권) */
    circlePolygon(center, radiusKm, segments = 64) {
        const [lng, lat] = center;
        const coords = [];
        const dLat = radiusKm / 110.574;
        const dLng = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
        }
        return {type: "Polygon", coordinates: [coords]};
    }

    visiblePlaces() {
        return PLACES.filter(p => this.state.year >= p.from && this.state.year <= p.to);
    }

    visibleEvents() {
        const periods = this.periodsAt(this.state.year);
        return EVENTS.filter(e => periods.some(p => e.year >= p.from && e.year <= p.to));
    }

    renderMapData() {
        if (!this.mapReady) return;

        // 슬라이더 드래그 중 표시 내용이 같으면 마커·소스 재구성 생략 (성능)
        const sig = [
            this.state.snapshot ? this.state.snapshot.id : "",
            [...this.state.layers].sort().join("+"),
            this.state.activeRouteId || "",
            this.visiblePlaces().map(p => p.id).join(","),
            this.visibleEvents().map(e => e.id).join(",")
        ].join("|");
        if (sig === this.lastRenderSig) return;
        this.lastRenderSig = sig;

        const snap = this.state.snapshot;
        const polities = (this.state.layers.has("polity") && snap && POLITIES[snap.id]) || [];
        this.map.getSource("polities").setData({
            type: "FeatureCollection",
            features: polities.map(pol => ({
                type: "Feature",
                properties: {color: pol.color, name: pol.name},
                geometry: this.circlePolygon(pol.center, pol.radiusKm)
            }))
        });

        const activeRoute = this.state.layers.has("route") ? this.getActiveRoute() : null;
        this.map.getSource("routes").setData({
            type: "FeatureCollection",
            features: activeRoute ? [{
                type: "Feature",
                properties: {color: activeRoute.color, disputed: activeRoute.certainty === "DISPUTED"},
                geometry: {type: "LineString", coordinates: activeRoute.coords}
            }] : []
        });

        this.rebuildMarkers(polities);
        this.el.snapshotNotice.hidden = false;
    }

    rebuildMarkers(polities) {
        this.markers.forEach(m => m.marker.remove());
        this.markers = [];

        if (this.state.layers.has("place")) {
            this.visiblePlaces().forEach(place => {
                this.addMarker("place", place, place.lngLat, place.name, place.importance,
                    place.certainty === "DISPUTED" ? "bhm-marker--disputed" : "");
            });
        }
        if (this.state.layers.has("event")) {
            this.visibleEvents().forEach(event => {
                const place = PLACES.find(p => p.id === event.placeId);
                if (!place) return;
                this.addMarker("event", event, place.lngLat, event.title, 2, "bhm-marker--event");
            });
        }
        polities.forEach(pol => {
            this.addMarker("polity", pol, pol.center, pol.name, 1, "bhm-marker--polity", false);
        });
        this.updateMarkerVisibility();
        this.updateSelectedMarker();
    }

    addMarker(kind, data, lngLat, label, importance, extraClass, clickable = true) {
        const el = document.createElement("div");
        el.className = `bhm-marker ${extraClass}`.trim();
        el.innerHTML = kind === "polity"
            ? `<span class="bhm-marker-label">${label}</span>`
            : `<span class="bhm-marker-dot" aria-hidden="true"></span><span class="bhm-marker-label">${label}</span>`;
        if (clickable) {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectEntity(kind, data.id);
            });
        }
        const marker = new maplibregl.Marker({element: el, anchor: kind === "polity" ? "center" : "left"})
            .setLngLat(lngLat)
            .addTo(this.map);
        this.markers.push({marker, el, kind, data, importance});
    }

    updateMarkerVisibility() {
        if (!this.map) return;
        const zoom = this.map.getZoom();
        this.markers.forEach(({el, importance, kind}) => {
            const visible = kind === "polity" || importance === 1
                || (importance === 2 && zoom >= 4.2)
                || (importance === 3 && zoom >= 5.2);
            el.style.display = visible ? "" : "none";
        });
    }

    updateSelectedMarker() {
        const sel = this.state.selection;
        this.markers.forEach(({el, kind, data}) => {
            el.classList.toggle("is-selected", !!sel && sel.type === kind && data.id === sel.id);
        });
    }

    /* ---------- 선택과 상세 패널 (§7.4) ---------- */
    findEntity(type, id) {
        if (type === "place") return PLACES.find(p => p.id === id);
        if (type === "event") return EVENTS.find(e => e.id === id);
        if (type === "route") return ROUTES.find(r => r.id === id);
        return null;
    }

    selectEntity(type, id) {
        const entity = this.findEntity(type, id);
        if (!entity) return;

        if (type === "route") {
            this.state.viewpointByGroup[entity.routeGroupId] = entity.id;
            if (this.state.year < (entity.jumpYear - 40) || this.state.year > (entity.jumpYear + 40)) {
                this.applyYear(entity.jumpYear, {silent: true});
            }
            this.setActiveRoute(entity.id);
            this.fitRoute(entity);
        } else {
            const jumpYear = type === "event" ? entity.year
                : (this.state.year >= entity.from && this.state.year <= entity.to) ? this.state.year
                    : Math.round((entity.from + entity.to) / 2);
            if (jumpYear !== this.state.year) this.applyYear(jumpYear, {silent: true});
            const lngLat = type === "event"
                ? (PLACES.find(p => p.id === entity.placeId) || {}).lngLat
                : entity.lngLat;
            if (lngLat && this.map) {
                this.map.flyTo({center: lngLat, zoom: Math.max(this.map.getZoom(), 5.4), duration: 700});
            }
        }

        this.state.selection = {type, id};
        this.renderPanel(type, entity);
        this.updateSelectedMarker();
        this.writeUrl();
    }

    fitRoute(route) {
        if (!this.map) return;
        const lngs = route.coords.map(c => c[0]);
        const lats = route.coords.map(c => c[1]);
        // 모바일은 하단 바텀 시트가 경로를 가리지 않도록 아래쪽 여백을 크게 둔다
        const padding = this.isMobile.matches
            ? {top: 60, left: 40, right: 40, bottom: Math.round(this.el.map.clientHeight * 0.48)}
            : 70;
        this.map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            {padding, duration: 700}
        );
    }

    certaintyBadges(certainty) {
        const info = CERTAINTY[certainty];
        return info && info.badge ? `<span class="bhm-badge bhm-badge--warn">${info.label}</span>` : "";
    }

    refListHtml(refs) {
        if (!refs || !refs.length) return "";
        const items = refs.map(r =>
            `<li><a href="${bibleVerseUrl(r.bookOrder, r.chapter)}">${r.label}</a></li>`).join("");
        return `<p class="bhm-panel-section-title">관련 성경 본문</p><ul class="bhm-ref-list">${items}</ul>`;
    }

    sourceHtml() {
        return `<p class="bhm-panel-source">데이터 상태: 초기 시드(내부 검수 전) · 위치 비정: 통용되는 고고학 자료 기준 ·
            연대 표기: BC n년 = -n (0년 없음)</p>`;
    }

    renderPanel(type, entity) {
        let html = "";
        if (type === "place") {
            html = `
                <p class="bhm-panel-kicker">성경 장소</p>
                <h2 class="bhm-panel-title">${entity.name}</h2>
                <p class="bhm-panel-sub">${entity.en} · 현대 위치: ${entity.modern}</p>
                <span class="bhm-badge bhm-badge--type">${entity.type}</span>
                ${this.certaintyBadges(entity.certainty)}
                <p class="bhm-panel-desc">${entity.desc}</p>
                ${this.refListHtml(entity.refs)}
                ${this.sourceHtml()}
            `;
        } else if (type === "event") {
            const place = PLACES.find(p => p.id === entity.placeId);
            html = `
                <p class="bhm-panel-kicker">사건 · ${this.formatYear(entity.year)}</p>
                <h2 class="bhm-panel-title">${entity.title}</h2>
                <p class="bhm-panel-sub">장소: ${place ? place.name : "-"}</p>
                ${this.certaintyBadges(entity.certainty)}
                <p class="bhm-panel-desc">${entity.desc}</p>
                ${this.refListHtml(entity.refs)}
                ${this.sourceHtml()}
            `;
        } else if (type === "route") {
            const siblings = ROUTES.filter(r => r.routeGroupId === entity.routeGroupId);
            const viewpointHtml = siblings.length > 1 ? `
                <p class="bhm-panel-section-title">경로에 여러 견해가 있습니다 — 견해 전환</p>
                <div class="bhm-viewpoint-switch">
                    ${siblings.map(r => `<button type="button" class="bhm-chip-btn${r.id === entity.id ? " is-active" : ""}"
                        data-route-id="${r.id}">${r.viewpoint}</button>`).join("")}
                </div>` : "";
            html = `
                <p class="bhm-panel-kicker">이동 경로</p>
                <h2 class="bhm-panel-title">${entity.name}${entity.viewpoint ? ` — ${entity.viewpoint}` : ""}</h2>
                ${this.certaintyBadges(entity.certainty)}
                <p class="bhm-panel-desc">${entity.desc}</p>
                ${viewpointHtml}
                ${this.refListHtml(entity.refs)}
                ${this.sourceHtml()}
            `;
        }
        this.el.panelBody.innerHTML = html;
        this.el.panelBody.querySelectorAll("[data-route-id]").forEach(btn => {
            btn.addEventListener("click", () => this.selectEntity("route", btn.dataset.routeId));
        });
        this.el.panel.hidden = false;
        this.el.panel.classList.remove("is-expanded");
    }

    closePanel() {
        this.el.panel.hidden = true;
        this.state.selection = null;
        this.updateSelectedMarker();
        this.writeUrl();
    }

    restoreSelection() {
        if (this.state.selection) {
            this.selectEntity(this.state.selection.type, this.state.selection.id);
        } else if (this.state.activeRouteId) {
            this.setActiveRoute(this.state.activeRouteId);
        }
    }

    /* ---------- 검색 (§12) ---------- */
    searchIndex() {
        const entries = [];
        PLACES.forEach(p => entries.push({
            type: "place", id: p.id, label: p.name,
            meta: `${p.type} · ${p.modern}`, text: `${p.name} ${p.en} ${p.modern}`
        }));
        EVENTS.forEach(e => entries.push({
            type: "event", id: e.id, label: e.title,
            meta: `사건 · ${this.formatYear(e.year)}`, text: e.title
        }));
        ROUTES.forEach(r => entries.push({
            type: "route", id: r.id, label: r.viewpoint ? `${r.name} (${r.viewpoint})` : r.name,
            meta: `이동 경로 · ${this.formatYear(r.jumpYear)}경`, text: `${r.name} ${r.viewpoint}`
        }));
        return entries;
    }

    runSearch(keyword) {
        const q = keyword.trim().toLowerCase();
        this.el.searchResults.innerHTML = "";
        if (q.length < 1) {
            this.el.searchResults.hidden = true;
            return;
        }
        const hits = this.searchIndex().filter(e => e.text.toLowerCase().includes(q)).slice(0, 12);
        if (!hits.length) {
            this.el.searchResults.innerHTML = `<li><button type="button" disabled>검색 결과가 없습니다</button></li>`;
        } else {
            hits.forEach(hit => {
                const li = document.createElement("li");
                const btn = document.createElement("button");
                btn.type = "button";
                btn.innerHTML = `${hit.label}<span class="bhm-search-result-meta">${hit.meta}</span>`;
                btn.addEventListener("click", () => {
                    this.el.searchResults.hidden = true;
                    this.el.search.value = "";
                    this.selectEntity(hit.type, hit.id);
                });
                li.appendChild(btn);
                this.el.searchResults.appendChild(li);
            });
        }
        this.el.searchResults.hidden = false;
    }

    /* ---------- 텍스트 목록 보기 (§7.6, §19.2) ---------- */
    openListView() {
        const places = this.visiblePlaces();
        const events = this.visibleEvents();
        const snap = this.state.snapshot;
        const polities = (snap && POLITIES[snap.id]) || [];
        const certaintyText = c => CERTAINTY[c] && CERTAINTY[c].label ? CERTAINTY[c].label : "확인됨";
        this.el.listTitle.textContent = `${this.formatYear(this.state.year)} — 현재 화면의 정보`;
        this.el.listBody.innerHTML = `
            <p class="bhm-panel-sub">${snap ? snap.label : "적용 중인 역사 스냅샷 없음"}</p>
            <p class="bhm-panel-section-title">국가·제국 (대략적인 세력권)</p>
            <table><thead><tr><th>이름</th></tr></thead>
            <tbody>${polities.map(p => `<tr><td>${p.name}</td></tr>`).join("") || "<tr><td>-</td></tr>"}</tbody></table>
            <p class="bhm-panel-section-title">장소 (${places.length})</p>
            <table><thead><tr><th>이름</th><th>유형</th><th>현대 위치</th><th>확실성</th></tr></thead>
            <tbody>${places.map(p =>
                `<tr><td>${p.name}</td><td>${p.type}</td><td>${p.modern}</td><td>${certaintyText(p.certainty)}</td></tr>`).join("")}</tbody></table>
            <p class="bhm-panel-section-title">사건 (${events.length})</p>
            <table><thead><tr><th>사건</th><th>연대</th><th>확실성</th></tr></thead>
            <tbody>${events.map(e =>
                `<tr><td>${e.title}</td><td>${this.formatYear(e.year)}</td><td>${certaintyText(e.certainty)}</td></tr>`).join("") || "<tr><td colspan=3>-</td></tr>"}</tbody></table>
        `;
        this.el.listBody.scrollTop = 0;
        this.el.listView.hidden = false;
    }

    /* ---------- 이벤트 바인딩 ---------- */
    bindEvents() {
        this.el.slider.addEventListener("input", () => {
            this.applyYear(parseInt(this.el.slider.value, 10) || -950);
        });
        this.el.prevEra.addEventListener("click", () => this.stepEra(-1));
        this.el.nextEra.addEventListener("click", () => this.stepEra(1));
        this.el.panelClose.addEventListener("click", () => this.closePanel());
        this.el.panelGrip.addEventListener("click", () => {
            this.el.panel.classList.toggle("is-expanded");
        });
        this.el.search.addEventListener("input", () => this.runSearch(this.el.search.value));
        this.el.search.addEventListener("focus", () => this.runSearch(this.el.search.value));
        document.addEventListener("click", (e) => {
            if (!this.el.searchResults.hidden && !e.target.closest(".bhm-search-card")) {
                this.el.searchResults.hidden = true;
            }
        });
        this.el.listOpen.addEventListener("click", () => this.openListView());
        this.el.listOpenMobile.addEventListener("click", () => this.openListView());
        this.el.listClose.addEventListener("click", () => {
            this.el.listView.hidden = true;
        });
        this.el.listView.addEventListener("click", (e) => {
            if (e.target === this.el.listView) this.el.listView.hidden = true;
        });
        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            if (!this.el.listView.hidden) this.el.listView.hidden = true;
            else if (!this.el.panel.hidden) this.closePanel();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new BibleHistoryMap().init();
});

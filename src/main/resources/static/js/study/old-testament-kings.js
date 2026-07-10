/**
 * 구약 성경의 왕들 연대표
 * 통일왕국(사울·다윗·솔로몬) → 남북 분열(북이스라엘 / 남유다)의 왕권 흐름을
 * 왕국별 병렬 타임라인으로 제공한다.
 *
 * - 연도는 대략적인 BCE 기준(Thiele 연대 근사)이며 섭정(co-regency)으로 재위가 겹칠 수 있다.
 * - 성경 본문 딥링크는 /web/bible/verse (구절 뷰) 를 사용한다. (/web/bible/chapter 는 장 선택 목록)
 * - bookOrder: 사무엘상=9, 사무엘하=10, 열왕기상=11, 열왕기하=12, 역대상=13, 역대하=14
 */

import {setupDialogScrollLock} from "/js/common-util.js?v=2.3";

const KINGDOMS = {
    united: {label: "통일왕국", short: "통일"},
    israel: {label: "북이스라엘", short: "북"},
    judah: {label: "남유다", short: "남"}
};

const EVALUATIONS = {
    faithful: {label: "선한 왕", tone: "good"},
    evil: {label: "악한 왕", tone: "bad"},
    mixed: {label: "혼합 평가", tone: "mixed"},
    usurper: {label: "왕위 찬탈", tone: "usurp"},
    disputed: {label: "해석 주의", tone: "disputed"}
};

const BIBLE_TRANSLATION_ID = 1; // KRV (66권 전문 보유 번역본)

/** 성경 본문(구절 뷰) 딥링크 생성 */
function bibleVerseUrl(ref) {
    return `/web/bible/verse?translationId=${BIBLE_TRANSLATION_ID}`
        + `&bookOrder=${ref.bookOrder}&chapterNumber=${ref.chapterNumber}`
        + `&from=old-testament-kings`;
}

const OLD_TESTAMENT_KINGS = [
    // ─────────────── 통일왕국 ───────────────
    {
        id: "saul", name: "사울", englishName: "Saul",
        kingdom: "united", dynasty: "사울 왕조",
        reignStartBce: 1050, reignEndBce: 1010, reignLabel: "대략 BCE 1050-1010",
        predecessorId: "", successorId: "david",
        evaluation: "mixed",
        summary: "이스라엘의 첫 왕. 준수한 출발과 달리 불순종으로 하나님께 버림받았습니다.",
        keyEvents: [
            "사무엘의 기름 부음으로 이스라엘의 첫 왕이 됨",
            "아말렉·제사 사건에서 불순종하여 왕위를 잃을 것을 선고받음",
            "길보아 전투에서 아들들과 함께 전사"
        ],
        references: [
            {label: "사무엘상 10장", bookOrder: 9, chapterNumber: 10},
            {label: "사무엘상 15장", bookOrder: 9, chapterNumber: 15},
            {label: "사무엘상 31장", bookOrder: 9, chapterNumber: 31}
        ],
        contemporaryIds: [],
        tags: ["첫 왕", "불순종", "길보아"]
    },
    {
        id: "david", name: "다윗", englishName: "David",
        kingdom: "united", dynasty: "다윗 왕조",
        reignStartBce: 1010, reignEndBce: 970, reignLabel: "대략 BCE 1010-970",
        predecessorId: "saul", successorId: "solomon",
        evaluation: "faithful",
        summary: "예루살렘을 수도로 삼고 이스라엘 왕국의 기틀을 세운 '하나님 마음에 합한' 왕입니다.",
        keyEvents: [
            "골리앗을 이긴 후 사울 왕가와 긴 갈등을 겪음",
            "예루살렘을 정복해 수도로 삼고 언약궤를 옮김",
            "밧세바 사건 이후 가정과 왕국에 큰 갈등이 일어남"
        ],
        references: [
            {label: "사무엘상 16장", bookOrder: 9, chapterNumber: 16},
            {label: "사무엘하 5장", bookOrder: 10, chapterNumber: 5},
            {label: "사무엘하 7장", bookOrder: 10, chapterNumber: 7}
        ],
        contemporaryIds: [],
        tags: ["예루살렘", "다윗 언약", "시편"]
    },
    {
        id: "solomon", name: "솔로몬", englishName: "Solomon",
        kingdom: "united", dynasty: "다윗 왕조",
        reignStartBce: 970, reignEndBce: 931, reignLabel: "대략 BCE 970-931",
        predecessorId: "david", successorId: "rehoboam",
        evaluation: "mixed",
        summary: "지혜와 성전 건축으로 전성기를 이루었으나 말년의 우상숭배로 분열의 씨앗을 남겼습니다.",
        keyEvents: [
            "일천 번제 후 하나님께 지혜를 구함",
            "예루살렘 성전을 건축하고 봉헌함",
            "이방 아내들로 인해 말년에 우상숭배에 빠짐"
        ],
        references: [
            {label: "열왕기상 3장", bookOrder: 11, chapterNumber: 3},
            {label: "열왕기상 6장", bookOrder: 11, chapterNumber: 6},
            {label: "열왕기상 11장", bookOrder: 11, chapterNumber: 11}
        ],
        contemporaryIds: [],
        tags: ["성전 건축", "지혜", "말년 우상숭배"]
    },

    // ─────────────── 북이스라엘 ───────────────
    {
        id: "jeroboam1", name: "여로보암 1세", englishName: "Jeroboam I",
        kingdom: "israel", dynasty: "여로보암 왕조", isDynastyChange: true,
        reignStartBce: 931, reignEndBce: 910, reignLabel: "대략 BCE 931-910",
        predecessorId: "solomon", successorId: "nadab",
        evaluation: "evil",
        summary: "북왕국의 초대 왕. 벧엘과 단에 금송아지를 세워 '여로보암의 죄'의 원형을 만들었습니다.",
        keyEvents: [
            "솔로몬 사후 열 지파를 이끌고 북왕국을 세움",
            "벧엘과 단에 금송아지 제단을 세워 예배를 왜곡함"
        ],
        references: [
            {label: "열왕기상 12장", bookOrder: 11, chapterNumber: 12},
            {label: "열왕기상 13장", bookOrder: 11, chapterNumber: 13}
        ],
        contemporaryIds: ["rehoboam", "abijah", "asa"],
        tags: ["북왕국 시작", "금송아지"]
    },
    {
        id: "nadab", name: "나답", englishName: "Nadab",
        kingdom: "israel", dynasty: "여로보암 왕조",
        reignStartBce: 910, reignEndBce: 909, reignLabel: "대략 BCE 910-909",
        predecessorId: "jeroboam1", successorId: "baasha",
        evaluation: "evil",
        summary: "여로보암의 아들. 2년 만에 바아사에게 암살되며 왕조가 끊겼습니다.",
        keyEvents: [
            "아버지의 길을 따라 악을 행함",
            "블레셋과의 전쟁 중 바아사에게 살해됨"
        ],
        references: [
            {label: "열왕기상 15장", bookOrder: 11, chapterNumber: 15}
        ],
        contemporaryIds: ["asa"],
        tags: ["여로보암 왕조", "암살"]
    },
    {
        id: "baasha", name: "바아사", englishName: "Baasha",
        kingdom: "israel", dynasty: "바아사 왕조", isDynastyChange: true,
        reignStartBce: 909, reignEndBce: 886, reignLabel: "대략 BCE 909-886",
        predecessorId: "nadab", successorId: "elah",
        evaluation: "usurper",
        summary: "나답을 죽이고 여로보암 가문을 진멸한 뒤 왕이 되었으나 같은 악을 반복했습니다.",
        keyEvents: [
            "나답을 죽이고 여로보암의 온 집을 진멸함",
            "남유다 아사와 대치하며 라마를 요새화함"
        ],
        references: [
            {label: "열왕기상 15장", bookOrder: 11, chapterNumber: 15},
            {label: "열왕기상 16장", bookOrder: 11, chapterNumber: 16}
        ],
        contemporaryIds: ["asa"],
        tags: ["왕조 교체", "라마"]
    },
    {
        id: "elah", name: "엘라", englishName: "Elah",
        kingdom: "israel", dynasty: "바아사 왕조",
        reignStartBce: 886, reignEndBce: 885, reignLabel: "대략 BCE 886-885",
        predecessorId: "baasha", successorId: "zimri",
        evaluation: "evil",
        summary: "바아사의 아들. 술 취한 중에 신하 시므리에게 암살되었습니다.",
        keyEvents: [
            "군대 지휘관 시므리의 반역으로 살해됨"
        ],
        references: [
            {label: "열왕기상 16장", bookOrder: 11, chapterNumber: 16}
        ],
        contemporaryIds: ["asa"],
        tags: ["바아사 왕조", "암살"]
    },
    {
        id: "zimri", name: "시므리", englishName: "Zimri",
        kingdom: "israel", dynasty: "시므리", isDynastyChange: true,
        reignStartBce: 885, reignEndBce: 885, reignLabel: "대략 BCE 885 (7일)",
        predecessorId: "elah", successorId: "omri",
        evaluation: "usurper",
        summary: "7일 통치. 오므리가 진격해 오자 왕궁에 불을 지르고 스스로 죽었습니다.",
        keyEvents: [
            "엘라와 바아사 가문을 진멸함",
            "오므리의 포위 앞에서 왕궁을 불태우고 자결"
        ],
        references: [
            {label: "열왕기상 16장", bookOrder: 11, chapterNumber: 16}
        ],
        contemporaryIds: ["asa"],
        tags: ["7일 통치", "왕조 교체"]
    },
    {
        id: "omri", name: "오므리", englishName: "Omri",
        kingdom: "israel", dynasty: "오므리 왕조", isDynastyChange: true,
        reignStartBce: 885, reignEndBce: 874, reignLabel: "대략 BCE 885-874",
        predecessorId: "zimri", successorId: "ahab",
        evaluation: "evil",
        summary: "사마리아를 건설해 새 수도로 삼은 유력한 왕이나 이전보다 더 악을 행했습니다.",
        keyEvents: [
            "디브니와의 내전에서 이겨 왕권을 확립함",
            "사마리아를 건설해 북왕국의 수도로 삼음"
        ],
        references: [
            {label: "열왕기상 16장", bookOrder: 11, chapterNumber: 16}
        ],
        contemporaryIds: ["asa"],
        tags: ["사마리아 건설", "오므리 왕조"]
    },
    {
        id: "ahab", name: "아합", englishName: "Ahab",
        kingdom: "israel", dynasty: "오므리 왕조",
        reignStartBce: 874, reignEndBce: 853, reignLabel: "대략 BCE 874-853",
        predecessorId: "omri", successorId: "ahaziah-israel",
        evaluation: "evil",
        summary: "이세벨과 결혼해 바알 숭배를 국교화했고, 선지자 엘리야와 정면으로 대립했습니다.",
        keyEvents: [
            "시돈 공주 이세벨과 결혼해 바알 신전을 세움",
            "갈멜산에서 엘리야와 바알 선지자가 대결함",
            "나봇의 포도원 사건으로 심판을 선고받음"
        ],
        references: [
            {label: "열왕기상 17장", bookOrder: 11, chapterNumber: 17},
            {label: "열왕기상 18장", bookOrder: 11, chapterNumber: 18},
            {label: "열왕기상 21장", bookOrder: 11, chapterNumber: 21}
        ],
        contemporaryIds: ["asa", "jehoshaphat"],
        tags: ["바알 숭배", "이세벨", "엘리야"]
    },
    {
        id: "ahaziah-israel", name: "아하시야", englishName: "Ahaziah (Israel)",
        kingdom: "israel", dynasty: "오므리 왕조",
        reignStartBce: 853, reignEndBce: 852, reignLabel: "대략 BCE 853-852",
        predecessorId: "ahab", successorId: "joram-israel",
        evaluation: "evil",
        summary: "아합의 아들. 난간에서 떨어져 병든 중에 바알세붑에게 물어 엘리야의 책망을 받았습니다.",
        keyEvents: [
            "부모의 바알 숭배를 그대로 이어감",
            "병중에 에그론 신 바알세붑에게 물어 심판을 받음"
        ],
        references: [
            {label: "열왕기상 22장", bookOrder: 11, chapterNumber: 22},
            {label: "열왕기하 1장", bookOrder: 12, chapterNumber: 1}
        ],
        contemporaryIds: ["jehoshaphat"],
        tags: ["오므리 왕조", "바알세붑"]
    },
    {
        id: "joram-israel", name: "여호람(요람)", englishName: "Joram (Israel)",
        kingdom: "israel", dynasty: "오므리 왕조",
        reignStartBce: 852, reignEndBce: 841, reignLabel: "대략 BCE 852-841",
        predecessorId: "ahaziah-israel", successorId: "jehu",
        evaluation: "evil",
        summary: "오므리 왕가의 마지막 왕. 엘리사 시대에 통치했고 예후의 혁명으로 왕조가 끝났습니다.",
        keyEvents: [
            "엘리사가 활동하던 시대에 아람과 전쟁을 벌임",
            "이스르엘에서 예후에게 살해되며 오므리 왕조가 종료됨"
        ],
        references: [
            {label: "열왕기하 3장", bookOrder: 12, chapterNumber: 3},
            {label: "열왕기하 9장", bookOrder: 12, chapterNumber: 9}
        ],
        contemporaryIds: ["jehoshaphat", "jehoram-judah", "ahaziah-judah"],
        tags: ["오므리 왕조 종료", "엘리사"]
    },
    {
        id: "jehu", name: "예후", englishName: "Jehu",
        kingdom: "israel", dynasty: "예후 왕조", isDynastyChange: true,
        reignStartBce: 841, reignEndBce: 814, reignLabel: "대략 BCE 841-814",
        predecessorId: "joram-israel", successorId: "jehoahaz-israel",
        evaluation: "usurper",
        summary: "아합 왕가와 바알 숭배를 진멸했으나 여로보암의 금송아지 죄는 버리지 않았습니다.",
        keyEvents: [
            "엘리사의 기름 부음을 받아 혁명을 일으킴",
            "여호람·이세벨·아합의 온 집과 바알 선지자를 진멸함",
            "그러나 벧엘과 단의 금송아지는 그대로 둠"
        ],
        references: [
            {label: "열왕기하 9장", bookOrder: 12, chapterNumber: 9},
            {label: "열왕기하 10장", bookOrder: 12, chapterNumber: 10}
        ],
        contemporaryIds: ["ahaziah-judah", "athaliah", "joash-judah"],
        tags: ["왕조 교체", "바알 진멸", "금송아지 유지"]
    },
    {
        id: "jehoahaz-israel", name: "여호아하스", englishName: "Jehoahaz (Israel)",
        kingdom: "israel", dynasty: "예후 왕조",
        reignStartBce: 814, reignEndBce: 798, reignLabel: "대략 BCE 814-798",
        predecessorId: "jehu", successorId: "jehoash-israel",
        evaluation: "evil",
        summary: "예후의 아들. 아람의 압박 아래 나라가 쇠약해졌으나 하나님께 간구하자 구원자를 얻었습니다.",
        keyEvents: [
            "아람 하사엘·벤하닷의 압제로 군대가 크게 약화됨",
            "여호와께 간구하매 구원자를 보내주심"
        ],
        references: [
            {label: "열왕기하 13장", bookOrder: 12, chapterNumber: 13}
        ],
        contemporaryIds: ["joash-judah"],
        tags: ["예후 왕조", "아람 압박"]
    },
    {
        id: "jehoash-israel", name: "요아스", englishName: "Jehoash (Israel)",
        kingdom: "israel", dynasty: "예후 왕조",
        reignStartBce: 798, reignEndBce: 782, reignLabel: "대략 BCE 798-782",
        predecessorId: "jehoahaz-israel", successorId: "jeroboam2",
        evaluation: "evil",
        summary: "임종하는 엘리사를 찾아가 눈물을 흘렸고, 아람에게서 성읍들을 되찾았습니다.",
        keyEvents: [
            "죽어가는 엘리사에게 화살의 예언을 받음",
            "남유다 아마샤와 싸워 예루살렘 성벽을 헐고 성전 보물을 취함"
        ],
        references: [
            {label: "열왕기하 13장", bookOrder: 12, chapterNumber: 13},
            {label: "열왕기하 14장", bookOrder: 12, chapterNumber: 14}
        ],
        contemporaryIds: ["joash-judah", "amaziah"],
        tags: ["예후 왕조", "엘리사 임종"]
    },
    {
        id: "jeroboam2", name: "여로보암 2세", englishName: "Jeroboam II",
        kingdom: "israel", dynasty: "예후 왕조",
        reignStartBce: 793, reignEndBce: 753, reignLabel: "대략 BCE 793-753 (섭정 포함)",
        predecessorId: "jehoash-israel", successorId: "zechariah-israel",
        evaluation: "evil",
        summary: "북왕국 최대의 영토와 번영을 이룬 왕. 이 시기에 아모스·호세아가 사회의 부패를 경고했습니다.",
        keyEvents: [
            "요나의 예언대로 북왕국의 옛 영토를 회복함",
            "정치·경제적 번영 이면에서 빈부 격차와 부패가 심해짐",
            "선지자 아모스·호세아가 심판을 예고함"
        ],
        references: [
            {label: "열왕기하 14장", bookOrder: 12, chapterNumber: 14},
            {label: "아모스 7장", bookOrder: 30, chapterNumber: 7}
        ],
        contemporaryIds: ["amaziah", "uzziah"],
        tags: ["정치적 번영", "아모스", "호세아"]
    },
    {
        id: "zechariah-israel", name: "스가랴", englishName: "Zechariah (Israel)",
        kingdom: "israel", dynasty: "예후 왕조",
        reignStartBce: 753, reignEndBce: 752, reignLabel: "대략 BCE 753-752 (6개월)",
        predecessorId: "jeroboam2", successorId: "shallum",
        evaluation: "evil",
        summary: "예후 왕조의 마지막 왕. 6개월 만에 살룸에게 공개적으로 살해되었습니다.",
        keyEvents: [
            "살룸의 반역으로 백성 앞에서 살해됨",
            "예후에게 주신 '4대까지' 약속이 성취되며 왕조가 끝남"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15}
        ],
        contemporaryIds: ["uzziah"],
        tags: ["예후 왕조 종료", "암살"]
    },
    {
        id: "shallum", name: "살룸", englishName: "Shallum",
        kingdom: "israel", dynasty: "살룸", isDynastyChange: true,
        reignStartBce: 752, reignEndBce: 752, reignLabel: "대략 BCE 752 (1개월)",
        predecessorId: "zechariah-israel", successorId: "menahem",
        evaluation: "usurper",
        summary: "한 달 통치. 므나헴에게 살해되며 북왕국의 극심한 정치 혼란을 보여줍니다.",
        keyEvents: [
            "스가랴를 죽이고 왕이 됨",
            "한 달 만에 므나헴에게 살해됨"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15}
        ],
        contemporaryIds: ["uzziah"],
        tags: ["1개월 통치", "왕조 교체"]
    },
    {
        id: "menahem", name: "므나헴", englishName: "Menahem",
        kingdom: "israel", dynasty: "므나헴 왕조", isDynastyChange: true,
        reignStartBce: 752, reignEndBce: 742, reignLabel: "대략 BCE 752-742",
        predecessorId: "shallum", successorId: "pekahiah",
        evaluation: "evil",
        summary: "앗수르 왕에게 은 천 달란트를 조공으로 바쳐 왕위를 지킨 잔혹한 왕입니다.",
        keyEvents: [
            "살룸을 죽이고 왕이 되어 반대 성읍을 잔혹하게 진압함",
            "앗수르 왕 불(디글랏빌레셀)에게 조공을 바침"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15}
        ],
        contemporaryIds: ["uzziah", "jotham"],
        tags: ["앗수르 조공", "므나헴 왕조"]
    },
    {
        id: "pekahiah", name: "브가히야", englishName: "Pekahiah",
        kingdom: "israel", dynasty: "므나헴 왕조",
        reignStartBce: 742, reignEndBce: 740, reignLabel: "대략 BCE 742-740",
        predecessorId: "menahem", successorId: "pekah",
        evaluation: "evil",
        summary: "므나헴의 아들. 군대 장관 베가에게 왕궁에서 암살되었습니다.",
        keyEvents: [
            "장관 베가와 길르앗 사람들의 반역으로 살해됨"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15}
        ],
        contemporaryIds: ["uzziah", "jotham"],
        tags: ["므나헴 왕조", "암살"]
    },
    {
        id: "pekah", name: "베가", englishName: "Pekah",
        kingdom: "israel", dynasty: "베가", isDynastyChange: true,
        reignStartBce: 740, reignEndBce: 732, reignLabel: "대략 BCE 740-732",
        predecessorId: "pekahiah", successorId: "hoshea",
        evaluation: "usurper",
        summary: "아람과 동맹해 남유다를 공격했고(아람-이스라엘 전쟁), 앗수르에 북부 영토를 빼앗겼습니다.",
        keyEvents: [
            "아람 르신과 동맹해 남유다 아하스를 공격함",
            "앗수르 디글랏빌레셀에게 갈릴리·길르앗 주민이 사로잡힘",
            "호세아의 반역으로 살해됨"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15},
            {label: "이사야 7장", bookOrder: 23, chapterNumber: 7}
        ],
        contemporaryIds: ["jotham", "ahaz"],
        tags: ["아람-이스라엘 동맹", "1차 유배"]
    },
    {
        id: "hoshea", name: "호세아", englishName: "Hoshea",
        kingdom: "israel", dynasty: "호세아", isDynastyChange: true,
        reignStartBce: 732, reignEndBce: 722, reignLabel: "대략 BCE 732-722",
        predecessorId: "pekah", successorId: "",
        evaluation: "evil",
        endEvent: "북이스라엘 멸망",
        summary: "북왕국의 마지막 왕. 앗수르에 반역했다가 사마리아가 함락되며 북이스라엘이 멸망했습니다.",
        keyEvents: [
            "앗수르에 조공하다 애굽과 손잡고 반역함",
            "3년 포위 끝에 사마리아가 함락되고 백성이 앗수르로 끌려감(BCE 722)"
        ],
        references: [
            {label: "열왕기하 17장", bookOrder: 12, chapterNumber: 17}
        ],
        contemporaryIds: ["ahaz"],
        tags: ["사마리아 함락", "북왕국 멸망"]
    },

    // ─────────────── 남유다 ───────────────
    {
        id: "rehoboam", name: "르호보암", englishName: "Rehoboam",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 931, reignEndBce: 913, reignLabel: "대략 BCE 931-913",
        predecessorId: "solomon", successorId: "abijah",
        evaluation: "evil",
        summary: "솔로몬의 아들. 강경책으로 열 지파를 잃어 왕국이 남북으로 분열되었습니다.",
        keyEvents: [
            "원로의 조언을 거절하고 백성에게 강경하게 응답함",
            "여로보암이 이끄는 열 지파가 떨어져 나가 왕국이 분열됨",
            "애굽 시삭의 침공으로 성전과 왕궁 보물을 빼앗김"
        ],
        references: [
            {label: "열왕기상 12장", bookOrder: 11, chapterNumber: 12},
            {label: "역대하 10장", bookOrder: 14, chapterNumber: 10}
        ],
        contemporaryIds: ["jeroboam1"],
        tags: ["왕국 분열", "시삭 침공"]
    },
    {
        id: "abijah", name: "아비얌", englishName: "Abijah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 913, reignEndBce: 911, reignLabel: "대략 BCE 913-911",
        predecessorId: "rehoboam", successorId: "asa",
        evaluation: "evil",
        summary: "아버지의 죄를 이었으나, 다윗을 위하여 하나님이 예루살렘의 등불을 남기셨습니다.",
        keyEvents: [
            "여로보암과의 전쟁에서 하나님을 의지해 크게 승리함",
            "다윗 언약으로 인해 왕조가 이어짐"
        ],
        references: [
            {label: "열왕기상 15장", bookOrder: 11, chapterNumber: 15},
            {label: "역대하 13장", bookOrder: 14, chapterNumber: 13}
        ],
        contemporaryIds: ["jeroboam1"],
        tags: ["다윗 왕조 지속"]
    },
    {
        id: "asa", name: "아사", englishName: "Asa",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 911, reignEndBce: 870, reignLabel: "대략 BCE 911-870",
        predecessorId: "abijah", successorId: "jehoshaphat",
        evaluation: "faithful",
        summary: "우상을 제거한 개혁 군주이나, 말년에는 하나님 대신 아람과 의사를 의지했습니다.",
        keyEvents: [
            "우상과 남색을 제거하고 예배를 개혁함",
            "구스 세라의 대군을 하나님을 의지해 물리침",
            "말년에 아람을 의지하고 발병 때도 의사만 찾음"
        ],
        references: [
            {label: "열왕기상 15장", bookOrder: 11, chapterNumber: 15},
            {label: "역대하 14장", bookOrder: 14, chapterNumber: 14},
            {label: "역대하 16장", bookOrder: 14, chapterNumber: 16}
        ],
        contemporaryIds: ["jeroboam1", "nadab", "baasha", "elah", "zimri", "omri", "ahab"],
        tags: ["개혁", "말년의 실패"]
    },
    {
        id: "jehoshaphat", name: "여호사밧", englishName: "Jehoshaphat",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 870, reignEndBce: 848, reignLabel: "대략 BCE 870-848",
        predecessorId: "asa", successorId: "jehoram-judah",
        evaluation: "faithful",
        summary: "율법 교육과 사법 개혁을 이룬 경건한 왕이나, 아합 왕가와의 정략 동맹은 화근이 되었습니다.",
        keyEvents: [
            "레위인을 보내 온 유다에 율법을 가르치게 함",
            "적군 앞에서 찬양하며 나아가 승리를 얻음",
            "아합 가문과 혼인 동맹을 맺어 훗날 화를 부름"
        ],
        references: [
            {label: "열왕기상 22장", bookOrder: 11, chapterNumber: 22},
            {label: "역대하 17장", bookOrder: 14, chapterNumber: 17},
            {label: "역대하 20장", bookOrder: 14, chapterNumber: 20}
        ],
        contemporaryIds: ["ahab", "ahaziah-israel", "joram-israel"],
        tags: ["신앙 개혁", "아합 동맹"]
    },
    {
        id: "jehoram-judah", name: "여호람", englishName: "Jehoram (Judah)",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 848, reignEndBce: 841, reignLabel: "대략 BCE 848-841",
        predecessorId: "jehoshaphat", successorId: "ahaziah-judah",
        evaluation: "evil",
        summary: "아합의 딸 아달랴와 결혼해 형제들을 죽이고 우상을 끌어들인 악한 왕입니다.",
        keyEvents: [
            "왕위에 오르자 형제들을 모두 죽임",
            "아합의 딸 아달랴와 결혼해 바알 숭배를 들여옴",
            "엘리야의 편지대로 불치병으로 죽음"
        ],
        references: [
            {label: "열왕기하 8장", bookOrder: 12, chapterNumber: 8},
            {label: "역대하 21장", bookOrder: 14, chapterNumber: 21}
        ],
        contemporaryIds: ["joram-israel"],
        tags: ["아합 가문 영향", "우상숭배"]
    },
    {
        id: "ahaziah-judah", name: "아하시야", englishName: "Ahaziah (Judah)",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 841, reignEndBce: 841, reignLabel: "대략 BCE 841 (1년)",
        predecessorId: "jehoram-judah", successorId: "athaliah",
        evaluation: "evil",
        summary: "아달랴의 아들. 외삼촌 요람과 함께 있다가 예후의 혁명 때 죽임을 당했습니다.",
        keyEvents: [
            "어머니 아달랴의 꾐으로 아합의 길을 행함",
            "북왕국 여호람을 문병하러 갔다가 예후에게 죽음"
        ],
        references: [
            {label: "열왕기하 8장", bookOrder: 12, chapterNumber: 8},
            {label: "열왕기하 9장", bookOrder: 12, chapterNumber: 9}
        ],
        contemporaryIds: ["joram-israel", "jehu"],
        tags: ["예후 혁명", "아합 가문 영향"]
    },
    {
        id: "athaliah", name: "아달랴", englishName: "Athaliah",
        kingdom: "judah", dynasty: "오므리 가문 (비다윗)", isDynastyChange: true,
        reignStartBce: 841, reignEndBce: 835, reignLabel: "대략 BCE 841-835",
        predecessorId: "ahaziah-judah", successorId: "joash-judah",
        evaluation: "usurper",
        disputed: true,
        summary: "아합의 딸이자 유일한 여왕. 왕손을 몰살하고 왕위를 찬탈했으나 요아스의 즉위로 처형됩니다.",
        keyEvents: [
            "아들이 죽자 다윗 왕가의 모든 왕손을 죽이고 왕위를 빼앗음",
            "요아스가 제사장 여호야다에 의해 숨겨져 살아남음",
            "요아스가 왕으로 세워질 때 처형됨"
        ],
        references: [
            {label: "열왕기하 11장", bookOrder: 12, chapterNumber: 11},
            {label: "역대하 22장", bookOrder: 14, chapterNumber: 22}
        ],
        contemporaryIds: ["jehu"],
        tags: ["왕위 찬탈", "여왕", "다윗 혈통 위기"]
    },
    {
        id: "joash-judah", name: "요아스", englishName: "Joash (Judah)",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 835, reignEndBce: 796, reignLabel: "대략 BCE 835-796",
        predecessorId: "athaliah", successorId: "amaziah",
        evaluation: "mixed",
        summary: "제사장 여호야다 아래서 성전을 수리한 선한 왕이나, 그가 죽자 우상숭배로 돌아섰습니다.",
        keyEvents: [
            "일곱 살에 여호야다의 옹립으로 왕이 됨",
            "성전을 수리하고 예배를 회복함",
            "여호야다 사후 타락해 그의 아들 스가랴를 죽임"
        ],
        references: [
            {label: "열왕기하 12장", bookOrder: 12, chapterNumber: 12},
            {label: "역대하 24장", bookOrder: 14, chapterNumber: 24}
        ],
        contemporaryIds: ["jehu", "jehoahaz-israel", "jehoash-israel"],
        tags: ["성전 수리", "말년 변질"]
    },
    {
        id: "amaziah", name: "아마샤", englishName: "Amaziah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 796, reignEndBce: 767, reignLabel: "대략 BCE 796-767",
        predecessorId: "joash-judah", successorId: "uzziah",
        evaluation: "mixed",
        summary: "에돔을 이겼으나 그 우상을 가져와 섬겼고, 교만하여 북왕국에 도전했다가 참패했습니다.",
        keyEvents: [
            "에돔을 정복하고도 그 신상을 가져와 절함",
            "북왕국 요아스에게 도전했다가 예루살렘 성벽이 헐림",
            "반역으로 라기스에서 살해됨"
        ],
        references: [
            {label: "열왕기하 14장", bookOrder: 12, chapterNumber: 14},
            {label: "역대하 25장", bookOrder: 14, chapterNumber: 25}
        ],
        contemporaryIds: ["jehoash-israel", "jeroboam2"],
        tags: ["에돔 승리", "교만"]
    },
    {
        id: "uzziah", name: "웃시야(아사랴)", englishName: "Uzziah / Azariah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 792, reignEndBce: 740, reignLabel: "대략 BCE 792-740 (섭정 포함)",
        predecessorId: "amaziah", successorId: "jotham",
        evaluation: "mixed",
        summary: "부국강병을 이룬 위대한 왕이나, 교만하여 제사장의 직무를 침범했다가 나병에 걸렸습니다.",
        keyEvents: [
            "군사·농업·건축을 발전시켜 나라를 강성하게 함",
            "교만하여 성전에서 분향하려다 나병에 걸림",
            "그가 죽던 해에 이사야가 성전 환상 가운데 소명을 받음"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15},
            {label: "역대하 26장", bookOrder: 14, chapterNumber: 26},
            {label: "이사야 6장", bookOrder: 23, chapterNumber: 6}
        ],
        contemporaryIds: ["jeroboam2", "zechariah-israel", "shallum", "menahem", "pekahiah"],
        tags: ["강성한 통치", "교만", "나병"]
    },
    {
        id: "jotham", name: "요담", englishName: "Jotham",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 750, reignEndBce: 732, reignLabel: "대략 BCE 750-732 (섭정 포함)",
        predecessorId: "uzziah", successorId: "ahaz",
        evaluation: "faithful",
        summary: "여호와 보시기에 정직히 행하며 나라를 안정되게 다스린 왕입니다.",
        keyEvents: [
            "나병에 걸린 아버지를 대신해 섭정하며 정직히 통치함",
            "성전 윗문을 건축하고 성벽을 보강함"
        ],
        references: [
            {label: "열왕기하 15장", bookOrder: 12, chapterNumber: 15},
            {label: "역대하 27장", bookOrder: 14, chapterNumber: 27}
        ],
        contemporaryIds: ["menahem", "pekahiah", "pekah"],
        tags: ["안정된 통치"]
    },
    {
        id: "ahaz", name: "아하스", englishName: "Ahaz",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 735, reignEndBce: 715, reignLabel: "대략 BCE 735-715",
        predecessorId: "jotham", successorId: "hezekiah",
        evaluation: "evil",
        summary: "아람-이스라엘의 위협 앞에서 하나님 대신 앗수르를 의지하고, 아들을 불사른 악한 왕입니다.",
        keyEvents: [
            "아람·북이스라엘 연합군의 침공을 받음(이사야의 임마누엘 예언)",
            "하나님을 의지하지 않고 앗수르에 도움을 청함",
            "이방 제단을 들이고 자녀를 불에 태워 바침"
        ],
        references: [
            {label: "열왕기하 16장", bookOrder: 12, chapterNumber: 16},
            {label: "이사야 7장", bookOrder: 23, chapterNumber: 7},
            {label: "역대하 28장", bookOrder: 14, chapterNumber: 28}
        ],
        contemporaryIds: ["pekah", "hoshea"],
        tags: ["앗수르 의존", "우상숭배", "임마누엘 예언"]
    },
    {
        id: "hezekiah", name: "히스기야", englishName: "Hezekiah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 715, reignEndBce: 686, reignLabel: "대략 BCE 715-686",
        predecessorId: "ahaz", successorId: "manasseh",
        evaluation: "faithful",
        summary: "대대적인 종교 개혁을 이루고, 앗수르 산헤립의 침공에서 하나님의 구원을 경험한 왕입니다.",
        keyEvents: [
            "산당을 헐고 성전을 정결케 하며 유월절을 회복함",
            "앗수르 산헤립의 포위 때 기도하매 천사가 대군을 침",
            "병들었을 때 기도로 생명이 15년 연장됨"
        ],
        references: [
            {label: "열왕기하 18장", bookOrder: 12, chapterNumber: 18},
            {label: "열왕기하 19장", bookOrder: 12, chapterNumber: 19},
            {label: "역대하 29장", bookOrder: 14, chapterNumber: 29}
        ],
        contemporaryIds: [],
        tags: ["종교 개혁", "산헤립 위기", "히스기야 터널"]
    },
    {
        id: "manasseh", name: "므낫세", englishName: "Manasseh",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 697, reignEndBce: 642, reignLabel: "대략 BCE 697-642 (섭정 포함)",
        predecessorId: "hezekiah", successorId: "amon",
        evaluation: "evil",
        summary: "가장 오래, 가장 악하게 통치했으나 포로로 끌려간 뒤 회개한 왕입니다.",
        keyEvents: [
            "산당을 재건하고 성전에 우상을 두며 자녀를 불사름",
            "앗수르에 사로잡혀 바벨론으로 끌려감",
            "겸비하여 회개하매 하나님이 그를 돌이키심"
        ],
        references: [
            {label: "열왕기하 21장", bookOrder: 12, chapterNumber: 21},
            {label: "역대하 33장", bookOrder: 14, chapterNumber: 33}
        ],
        contemporaryIds: [],
        tags: ["악한 통치", "말년의 회개"]
    },
    {
        id: "amon", name: "아몬", englishName: "Amon",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 642, reignEndBce: 640, reignLabel: "대략 BCE 642-640",
        predecessorId: "manasseh", successorId: "josiah",
        evaluation: "evil",
        summary: "아버지의 우상을 섬긴 짧은 악한 통치. 신하들의 모반으로 살해되었습니다.",
        keyEvents: [
            "므낫세의 우상을 섬기며 회개하지 않음",
            "신하들의 모반으로 왕궁에서 살해됨"
        ],
        references: [
            {label: "열왕기하 21장", bookOrder: 12, chapterNumber: 21},
            {label: "역대하 33장", bookOrder: 14, chapterNumber: 33}
        ],
        contemporaryIds: [],
        tags: ["짧은 악한 통치", "암살"]
    },
    {
        id: "josiah", name: "요시야", englishName: "Josiah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 640, reignEndBce: 609, reignLabel: "대략 BCE 640-609",
        predecessorId: "amon", successorId: "jehoahaz-judah",
        evaluation: "faithful",
        summary: "성전에서 발견된 율법책으로 마지막 대개혁을 이끈, 남유다의 가장 선한 왕입니다.",
        keyEvents: [
            "성전 수리 중 발견된 율법책을 듣고 옷을 찢으며 회개함",
            "우상과 산당을 철저히 제거하고 유월절을 크게 지킴",
            "므깃도에서 애굽 느고와 싸우다 전사함"
        ],
        references: [
            {label: "열왕기하 22장", bookOrder: 12, chapterNumber: 22},
            {label: "열왕기하 23장", bookOrder: 12, chapterNumber: 23},
            {label: "역대하 34장", bookOrder: 14, chapterNumber: 34}
        ],
        contemporaryIds: [],
        tags: ["율법책 발견", "종교 개혁"]
    },
    {
        id: "jehoahaz-judah", name: "여호아하스", englishName: "Jehoahaz (Judah)",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 609, reignEndBce: 609, reignLabel: "대략 BCE 609 (3개월)",
        predecessorId: "josiah", successorId: "jehoiakim",
        evaluation: "evil",
        summary: "요시야의 아들. 석 달 만에 애굽 느고에게 폐위되어 애굽에서 죽었습니다.",
        keyEvents: [
            "백성이 세웠으나 애굽 바로 느고에게 폐위됨",
            "애굽으로 끌려가 그곳에서 죽음"
        ],
        references: [
            {label: "열왕기하 23장", bookOrder: 12, chapterNumber: 23}
        ],
        contemporaryIds: [],
        tags: ["애굽에 폐위", "3개월 통치"]
    },
    {
        id: "jehoiakim", name: "여호야김", englishName: "Jehoiakim",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 609, reignEndBce: 598, reignLabel: "대략 BCE 609-598",
        predecessorId: "jehoahaz-judah", successorId: "jehoiachin",
        evaluation: "evil",
        summary: "애굽이 세운 왕. 예레미야의 두루마리를 불태웠고, 바벨론의 1차 침공을 자초했습니다.",
        keyEvents: [
            "애굽 느고가 세운 왕으로 무거운 세금을 매김",
            "예레미야가 받아쓴 하나님의 말씀 두루마리를 잘라 불태움",
            "바벨론에 반역했다가 1차 침공(다니엘 등 포로)을 겪음"
        ],
        references: [
            {label: "열왕기하 24장", bookOrder: 12, chapterNumber: 24},
            {label: "예레미야 36장", bookOrder: 24, chapterNumber: 36}
        ],
        contemporaryIds: [],
        tags: ["바벨론 압박", "두루마리 소각"]
    },
    {
        id: "jehoiachin", name: "여호야긴", englishName: "Jehoiachin",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 598, reignEndBce: 597, reignLabel: "대략 BCE 598-597 (3개월)",
        predecessorId: "jehoiakim", successorId: "zedekiah",
        evaluation: "evil",
        endEvent: "2차 바벨론 포로",
        summary: "석 달 만에 바벨론에 항복해 끌려간 왕. 훗날 포로지에서 옥에서 풀려나 존대받았습니다.",
        keyEvents: [
            "바벨론 느부갓네살에게 항복해 왕족·기술자와 함께 끌려감(2차 포로)",
            "성전과 왕궁의 보물이 바벨론으로 옮겨짐",
            "포로 37년째에 옥에서 풀려나 왕의 상에서 먹음"
        ],
        references: [
            {label: "열왕기하 24장", bookOrder: 12, chapterNumber: 24},
            {label: "열왕기하 25장", bookOrder: 12, chapterNumber: 25}
        ],
        contemporaryIds: [],
        tags: ["바벨론 포로", "3개월 통치"]
    },
    {
        id: "zedekiah", name: "시드기야", englishName: "Zedekiah",
        kingdom: "judah", dynasty: "다윗 왕조",
        reignStartBce: 597, reignEndBce: 586, reignLabel: "대략 BCE 597-586",
        predecessorId: "jehoiachin", successorId: "",
        evaluation: "evil",
        endEvent: "남유다 멸망",
        summary: "남유다의 마지막 왕. 바벨론에 반역했다가 예루살렘과 성전이 불타며 나라가 멸망했습니다.",
        keyEvents: [
            "바벨론이 세운 왕이나 예레미야의 경고를 무시하고 반역함",
            "예루살렘이 함락되고 성전이 불탐(BCE 586)",
            "두 눈이 뽑힌 채 바벨론으로 끌려감"
        ],
        references: [
            {label: "열왕기하 25장", bookOrder: 12, chapterNumber: 25},
            {label: "예레미야 39장", bookOrder: 24, chapterNumber: 39}
        ],
        contemporaryIds: [],
        tags: ["예루살렘 함락", "남유다 멸망", "바벨론 포로"]
    }
];

class OldTestamentKingsTimeline {
    constructor() {
        this.kings = OLD_TESTAMENT_KINGS;
        this.kingById = new Map(this.kings.map((k) => [k.id, k]));
        this.state = {
            kingdom: "all",
            evaluations: new Set(),
            keyword: "",
            selectedKingId: null
        };
        this.highlightTimer = null;
    }

    init() {
        this.cacheElements();
        setupDialogScrollLock(this.detailDialog);
        this.renderTimeline();
        this.bindEvents();
    }

    cacheElements() {
        this.root = document.querySelector(".old-testament-kings-main");
        this.kingdomBar = document.getElementById("otkKingdomFilter");
        this.evalBar = document.getElementById("otkEvalFilter");
        this.searchInput = document.getElementById("otkSearch");
        this.searchClear = document.getElementById("otkSearchClear");
        this.emptyEl = document.getElementById("otkEmpty");
        this.detailDialog = document.getElementById("otkDetailDialog");
        this.detailEl = document.getElementById("otkDetail");
        this.vtimeline = document.getElementById("otkVTimeline");
        this.unitedTrack = document.getElementById("otkUnitedTrack");
        this.dividedTrack = document.getElementById("otkDividedTrack");
        this.eraSplit = document.getElementById("otkEraSplit");
        this.mobileTabs = document.getElementById("otkMobileTabs");
    }

    // ---------- 렌더 ----------

    /**
     * 위 → 아래 연대기 타임라인.
     * 상단: 통일왕국(사울→다윗→솔로몬) 중앙 정렬.
     * 하단: 북이스라엘(좌)·남유다(우)를 즉위 연도(reignStartBce) 순으로 병합해
     *       중앙 스파인 양옆에 배치 → 동시대 왕이 세로로 가까이 정렬된다.
     */
    renderTimeline() {
        this.unitedTrack.innerHTML = "";
        this.dividedTrack.innerHTML = "";

        // 통일왕국 (연대순)
        this.kings
            .filter((k) => k.kingdom === "united")
            .sort((a, b) => b.reignStartBce - a.reignStartBce)
            .forEach((king) => this.unitedTrack.appendChild(this.createRow(king)));

        // 분열왕국: 같은 즉위 연도는 하나의 row에 좌/우로 함께 배치한다.
        const divided = this.kings
            .filter((k) => k.kingdom !== "united")
            .sort((a, b) =>
                b.reignStartBce - a.reignStartBce ||
                (a.kingdom === "israel" ? -1 : 1)
            );
        const lastIsrael = divided.filter((k) => k.kingdom === "israel").at(-1);

        this.groupKingsByStartYear(divided).forEach((group) => {
            this.dividedTrack.appendChild(this.createRow(group));
            if (lastIsrael && group.some((king) => king.id === lastIsrael.id)) {
                this.dividedTrack.appendChild(
                    this.createEra("북이스라엘 멸망", "앗수르 · BCE 722", "israel-fall")
                );
            }
        });
        this.dividedTrack.appendChild(
            this.createEra("남유다 멸망", "바벨론 · BCE 586", "judah-fall")
        );
    }

    groupKingsByStartYear(kings) {
        const groups = [];
        let currentYear = null;
        let currentGroup = null;

        kings.forEach((king) => {
            if (king.reignStartBce !== currentYear) {
                currentYear = king.reignStartBce;
                currentGroup = [];
                groups.push(currentGroup);
            }
            currentGroup.push(king);
        });

        return groups.map((group) =>
            group.sort((a, b) =>
                (a.kingdom === "israel" ? -1 : 1) -
                (b.kingdom === "israel" ? -1 : 1)
            )
        );
    }

    createRow(rowKings) {
        const kings = Array.isArray(rowKings) ? rowKings : [rowKings];
        const firstKing = kings[0];
        const paired = kings.length > 1;

        const li = document.createElement("li");
        li.className = paired ? "otk-row otk-row-paired" : `otk-row otk-row-${firstKing.kingdom}`;
        li.dataset.kingIds = kings.map((king) => king.id).join(",");
        li.dataset.year = String(firstKing.reignStartBce);
        if (!paired) {
            li.dataset.kingId = firstKing.id;
            li.dataset.kingdom = firstKing.kingdom;
        }

        const node = document.createElement("div");
        node.className = "otk-row-node";
        node.innerHTML =
            `<span class="otk-row-dot ${paired ? "otk-row-dot-split" : `otk-kingdom-${firstKing.kingdom}`}" aria-hidden="true"></span>` +
            `<span class="otk-row-year">BCE ${firstKing.reignStartBce}</span>`;

        li.appendChild(node);
        kings.forEach((king) => {
            const cardWrap = document.createElement("div");
            cardWrap.className = `otk-row-card otk-row-card-${king.kingdom}`;
            cardWrap.dataset.kingId = king.id;
            cardWrap.appendChild(this.createCard(king));
            li.appendChild(cardWrap);
        });
        return li;
    }

    createEra(title, year, kind) {
        const li = document.createElement("li");
        li.className = "otk-era";
        li.dataset.era = kind;
        li.innerHTML =
            `<span class="otk-era-title">${title}</span>` +
            `<span class="otk-era-year">${year}</span>`;
        return li;
    }

    createCard(king) {
        const evalMeta = EVALUATIONS[king.evaluation] || EVALUATIONS.disputed;
        const kingdomMeta = KINGDOMS[king.kingdom];

        const card = document.createElement("article");
        card.className = "otk-king-card";
        card.dataset.kingId = king.id;
        card.dataset.kingdom = king.kingdom;
        card.dataset.evaluation = king.evaluation;

        const dynastyTag = king.isDynastyChange
            ? `<span class="otk-tag otk-tag-dynasty">왕조 교체</span>`
            : "";
        const endTag = king.endEvent
            ? `<span class="otk-tag otk-tag-end">${king.endEvent}</span>`
            : "";

        card.innerHTML = `
            <div class="otk-king-card-head">
                <span class="otk-kingdom-badge otk-kingdom-${king.kingdom}">${kingdomMeta.short}</span>
                <span class="otk-reign-range">${king.reignLabel}</span>
            </div>
            <div class="otk-king-card-titlerow">
                <h3 class="otk-king-name">${king.name}</h3>
                <span class="otk-eval-badge otk-eval-${evalMeta.tone}">${evalMeta.label}</span>
            </div>
            <p class="otk-king-summary">${king.summary}</p>
            <div class="otk-king-meta">
                <span class="otk-king-dynasty">${king.dynasty}</span>
                ${dynastyTag}
                ${endTag}
            </div>
            <button type="button" class="otk-detail-button"
                    aria-haspopup="dialog" aria-expanded="false" aria-controls="otkDetailDialog">
                자세히 보기
            </button>
        `;
        return card;
    }

    renderDetail(king) {
        const evalMeta = EVALUATIONS[king.evaluation] || EVALUATIONS.disputed;
        const kingdomMeta = KINGDOMS[king.kingdom];
        const predecessor = this.kingById.get(king.predecessorId);
        const successor = this.kingById.get(king.successorId);

        const events = king.keyEvents.map((e) => `<li>${e}</li>`).join("");
        const refs = king.references
            .map((r) => `<a class="otk-ref-link" href="${bibleVerseUrl(r)}">${r.label}</a>`)
            .join("");
        const tags = king.tags.map((t) => `<span class="otk-detail-tag">#${t}</span>`).join("");

        const contemporaries = (king.contemporaryIds || [])
            .map((id) => this.kingById.get(id))
            .filter(Boolean);
        const contemporaryHtml = contemporaries.length
            ? contemporaries
                .map(
                    (c) =>
                        `<button type="button" class="otk-contemporary-link" data-target-id="${c.id}">
                            <span class="otk-kingdom-badge otk-kingdom-${c.kingdom}">${KINGDOMS[c.kingdom].short}</span>
                            ${c.name}
                        </button>`
                )
                .join("")
            : `<p class="otk-detail-muted">기록상 뚜렷한 동시대 반대 왕국 왕이 없습니다.</p>`;

        const relationLine = [
            predecessor ? `이전: ${predecessor.name}` : "이전: —",
            successor ? `다음: ${successor.name}` : "다음: —"
        ].join(" · ");

        const disputedNote = king.disputed
            ? `<p class="otk-detail-note">※ 아달랴는 다윗 혈통이 아닌 왕위 찬탈자로, 정통 왕 계보에서는 논외로 보기도 합니다.</p>`
            : "";

        this.detailEl.innerHTML = `
            <div class="otk-detail-card">
                <button type="button" class="otk-detail-close" aria-label="상세 닫기">×</button>
                <div class="otk-detail-head">
                    <span class="otk-kingdom-badge otk-kingdom-${king.kingdom}">${kingdomMeta.label}</span>
                    <span class="otk-eval-badge otk-eval-${evalMeta.tone}">${evalMeta.label}</span>
                </div>
                <h2 id="otkDetailTitle" class="otk-detail-name">${king.name}
                    <span class="otk-detail-en">${king.englishName}</span>
                </h2>
                <p class="otk-detail-reign">${king.reignLabel} · ${king.dynasty}</p>
                <p class="otk-detail-relation">${relationLine}</p>
                ${disputedNote}

                <section class="otk-detail-section">
                    <h3 class="otk-detail-subtitle">핵심 사건</h3>
                    <ul class="otk-detail-events">${events}</ul>
                </section>

                <section class="otk-detail-section">
                    <h3 class="otk-detail-subtitle">성경 평가</h3>
                    <p class="otk-detail-summary">${king.summary}</p>
                </section>

                <section class="otk-detail-section">
                    <h3 class="otk-detail-subtitle">관련 본문</h3>
                    <div class="otk-detail-refs">${refs}</div>
                </section>

                <section class="otk-detail-section">
                    <h3 class="otk-detail-subtitle">동시대 왕</h3>
                    <div class="otk-detail-contemporaries">${contemporaryHtml}</div>
                </section>

                <div class="otk-detail-tags">${tags}</div>
            </div>
        `;
        this.detailEl.classList.add("is-open");
    }

    // ---------- 필터 ----------

    applyFilters() {
        const keyword = this.state.keyword.trim();
        const visible = {united: 0, israel: 0, judah: 0};

        this.kings.forEach((king) => {
            const card = this.cardEl(king.id);
            if (!card) return;
            const ok = this.matchesFilters(king, keyword);
            card.closest(".otk-row-card")?.classList.toggle("is-hidden", !ok);
            if (ok) visible[king.kingdom] += 1;
        });

        this.root.querySelectorAll(".otk-row").forEach((row) => {
            const visibleCard = row.querySelector(".otk-row-card:not(.is-hidden)");
            row.classList.toggle("is-hidden", !visibleCard);
        });

        // 단일 왕국 선택 시 스파인을 좌측 단일 열로 접는다.
        this.vtimeline.classList.toggle("is-single", this.state.kingdom !== "all");

        // 통일왕국 트랙 노출 여부
        const showUnited = (this.state.kingdom === "all" || this.state.kingdom === "united") && visible.united > 0;
        this.unitedTrack.classList.toggle("is-hidden", !showUnited);

        // 시대 마커 노출 여부
        const showSplit = this.state.kingdom !== "united" && (visible.israel + visible.judah) > 0;
        this.eraSplit.classList.toggle("is-hidden", !showSplit);
        this.toggleEra("israel-fall", this.state.kingdom !== "judah" && visible.israel > 0);
        this.toggleEra("judah-fall", this.state.kingdom !== "israel" && visible.judah > 0);

        const total = visible.united + visible.israel + visible.judah;
        this.emptyEl.classList.toggle("d-none", total > 0);
    }

    toggleEra(kind, show) {
        const el = this.dividedTrack.querySelector(`.otk-era[data-era="${kind}"]`);
        if (el) el.classList.toggle("is-hidden", !show);
    }

    matchesFilters(king, keyword) {
        if (this.state.kingdom !== "all" && king.kingdom !== this.state.kingdom) return false;

        if (this.state.evaluations.size > 0) {
            // 평가 필터는 evaluation 값과 disputed 보조 플래그를 함께 본다.
            // (예: 아달랴는 usurper 이면서 disputed:true → 두 필터 모두에서 잡힘)
            const evalTags = new Set([king.evaluation]);
            if (king.disputed) evalTags.add("disputed");
            const matched = [...this.state.evaluations].some((e) => evalTags.has(e));
            if (!matched) return false;
        }

        if (keyword) {
            const haystack = [
                king.name,
                king.englishName,
                king.dynasty,
                king.summary,
                ...king.keyEvents,
                ...king.tags
            ]
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(keyword.toLowerCase())) return false;
        }
        return true;
    }

    // ---------- 이벤트 ----------

    bindEvents() {
        // 왕국 segmented control (aria-pressed)
        this.kingdomBar.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-kingdom]");
            if (!btn) return;
            this.state.kingdom = btn.dataset.kingdom;
            this.syncKingdomButtons();
            this.applyFilters();
        });

        // 모바일 왕국 탭 (kingdomBar와 동일 상태 공유)
        if (this.mobileTabs) {
            this.mobileTabs.addEventListener("click", (e) => {
                const btn = e.target.closest("button[data-kingdom]");
                if (!btn) return;
                this.state.kingdom = btn.dataset.kingdom;
                this.syncKingdomButtons();
                this.applyFilters();
            });
        }

        // 평가 체크박스
        this.evalBar.addEventListener("change", (e) => {
            const input = e.target.closest("input[data-evaluation]");
            if (!input) return;
            if (input.checked) this.state.evaluations.add(input.dataset.evaluation);
            else this.state.evaluations.delete(input.dataset.evaluation);
            this.applyFilters();
        });

        // 검색
        this.searchInput.addEventListener("input", () => {
            this.state.keyword = this.searchInput.value;
            this.searchClear.classList.toggle("d-none", this.searchInput.value.length === 0);
            this.applyFilters();
        });
        this.searchClear.addEventListener("click", () => {
            this.searchInput.value = "";
            this.state.keyword = "";
            this.searchClear.classList.add("d-none");
            this.applyFilters();
            this.searchInput.focus();
        });

        // 카드 선택 / 상세 다이얼로그 열기
        this.root.addEventListener("click", (e) => {
            const detailBtn = e.target.closest(".otk-detail-button");
            if (detailBtn) {
                const card = detailBtn.closest(".otk-king-card");
                this.toggleDetail(card.dataset.kingId, detailBtn);
                return;
            }
        });

        this.detailDialog.addEventListener("click", (e) => {
            if (e.target === this.detailDialog) {
                this.closeDetail();
                return;
            }
            const closeBtn = e.target.closest(".otk-detail-close");
            if (closeBtn) {
                this.closeDetail();
                return;
            }
            const contemporaryBtn = e.target.closest(".otk-contemporary-link");
            if (contemporaryBtn) {
                this.goToKing(contemporaryBtn.dataset.targetId);
            }
        });

        this.detailDialog.addEventListener("cancel", (e) => {
            e.preventDefault();
            this.closeDetail();
        });
    }

    syncKingdomButtons() {
        const sync = (bar) => {
            if (!bar) return;
            bar.querySelectorAll("button[data-kingdom]").forEach((btn) => {
                const active = btn.dataset.kingdom === this.state.kingdom;
                btn.setAttribute("aria-pressed", String(active));
                btn.classList.toggle("is-active", active);
            });
        };
        sync(this.kingdomBar);
        sync(this.mobileTabs);
    }

    toggleDetail(kingId, button) {
        if (this.state.selectedKingId === kingId) {
            this.closeDetail();
            return;
        }
        const king = this.kingById.get(kingId);
        if (!king) return;

        this.clearSelection();
        this.state.selectedKingId = kingId;
        this.lastTrigger = button || null; // 상세 닫을 때 포커스 복귀용

        const card = this.cardEl(kingId);
        if (card) card.classList.add("is-selected");
        if (button) button.setAttribute("aria-expanded", "true");

        this.markContemporaries(king);
        this.renderDetail(king);

        if (this.detailDialog && !this.detailDialog.open) {
            this.detailDialog.showModal();
        }
    }

    closeDetail() {
        this.clearSelection();
        this.state.selectedKingId = null;
        this.detailEl.classList.remove("is-open");
        this.detailEl.innerHTML = "";
        if (this.detailDialog && this.detailDialog.open) {
            this.detailDialog.close();
        }
        // 키보드 사용자 포커스가 body 로 유실되지 않도록 트리거로 되돌린다.
        if (this.lastTrigger && document.contains(this.lastTrigger)) {
            this.lastTrigger.focus();
        }
        this.lastTrigger = null;
    }

    clearSelection() {
        this.root.querySelectorAll(".otk-king-card.is-selected, .otk-king-card.is-contemporary")
            .forEach((c) => c.classList.remove("is-selected", "is-contemporary"));
        this.root.querySelectorAll('.otk-detail-button[aria-expanded="true"]')
            .forEach((b) => b.setAttribute("aria-expanded", "false"));
    }

    markContemporaries(king) {
        (king.contemporaryIds || []).forEach((id) => {
            const card = this.cardEl(id);
            if (card) card.classList.add("is-contemporary");
        });
    }

    goToKing(kingId) {
        const card = this.cardEl(kingId);
        const row = this.rowEl(kingId);
        if (!card || !row) return;

        // 대상 왕이 다른 왕국 필터에 가려져 있으면 전체로 되돌린다.
        if (row.classList.contains("is-hidden")) {
            this.state.kingdom = "all";
            this.syncKingdomButtons();
            this.applyFilters();
        }

        const detailBtn = card.querySelector(".otk-detail-button");
        this.toggleDetail(kingId, detailBtn);

        this.scrollTo(card, "center");
        card.classList.add("is-flash");
        if (this.highlightTimer) clearTimeout(this.highlightTimer);
        this.highlightTimer = setTimeout(() => card.classList.remove("is-flash"), 1500);
    }

    // ---------- 헬퍼 ----------

    /** prefers-reduced-motion 존중 스크롤 */
    scrollTo(el, block) {
        const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
        const reduce = mq ? mq.matches : false;
        el.scrollIntoView({behavior: reduce ? "auto" : "smooth", block});
    }

    cardEl(kingId) {
        return this.root.querySelector(`.otk-king-card[data-king-id="${kingId}"]`);
    }

    rowEl(kingId) {
        return this.cardEl(kingId)?.closest(".otk-row") || null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new OldTestamentKingsTimeline().init();
});

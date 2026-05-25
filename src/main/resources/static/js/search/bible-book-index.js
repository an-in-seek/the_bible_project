/**
 * 성경 책 정적 인덱스 (KRV 기준 + KJV 영문 이름)
 *
 * docs/common/unified-search.md §5-3 참조.
 *
 * - 기준 번역본: KRV(translationId=1) 의 name/abbreviation 고정
 * - nameEn: KJV 의 영문 풀네임 (영문 입력 매칭용)
 * - chapters: 각 책의 총 장 수 (장 번호 sanity 검사용)
 * - 66권은 신학적 고정값으로 수동 추출
 */

export const BIBLE_BOOKS = Object.freeze([
    // 구약 39권
    { bookKey: "GEN",                 bookOrder: 1,  name: "창세기",         abbr: "창",   nameEn: "Genesis",         chapters: 50, testament: "OLD" },
    { bookKey: "EXO",                 bookOrder: 2,  name: "출애굽기",       abbr: "출",   nameEn: "Exodus",          chapters: 40, testament: "OLD" },
    { bookKey: "LEV",                 bookOrder: 3,  name: "레위기",         abbr: "레",   nameEn: "Leviticus",       chapters: 27, testament: "OLD" },
    { bookKey: "NUM",                 bookOrder: 4,  name: "민수기",         abbr: "민",   nameEn: "Numbers",         chapters: 36, testament: "OLD" },
    { bookKey: "DEU",                 bookOrder: 5,  name: "신명기",         abbr: "신",   nameEn: "Deuteronomy",     chapters: 34, testament: "OLD" },
    { bookKey: "JOS",                 bookOrder: 6,  name: "여호수아",       abbr: "수",   nameEn: "Joshua",          chapters: 24, testament: "OLD" },
    { bookKey: "JDG",                 bookOrder: 7,  name: "사사기",         abbr: "삿",   nameEn: "Judges",          chapters: 21, testament: "OLD" },
    { bookKey: "RUT",                 bookOrder: 8,  name: "룻기",           abbr: "룻",   nameEn: "Ruth",            chapters: 4,  testament: "OLD" },
    { bookKey: "FIRST_SAMUEL",        bookOrder: 9,  name: "사무엘상",       abbr: "삼상", nameEn: "1 Samuel",        chapters: 31, testament: "OLD" },
    { bookKey: "SECOND_SAMUEL",       bookOrder: 10, name: "사무엘하",       abbr: "삼하", nameEn: "2 Samuel",        chapters: 24, testament: "OLD" },
    { bookKey: "FIRST_KINGS",         bookOrder: 11, name: "열왕기상",       abbr: "왕상", nameEn: "1 Kings",         chapters: 22, testament: "OLD" },
    { bookKey: "SECOND_KINGS",        bookOrder: 12, name: "열왕기하",       abbr: "왕하", nameEn: "2 Kings",         chapters: 25, testament: "OLD" },
    { bookKey: "FIRST_CHRONICLES",    bookOrder: 13, name: "역대상",         abbr: "대상", nameEn: "1 Chronicles",    chapters: 29, testament: "OLD" },
    { bookKey: "SECOND_CHRONICLES",   bookOrder: 14, name: "역대하",         abbr: "대하", nameEn: "2 Chronicles",    chapters: 36, testament: "OLD" },
    { bookKey: "EZR",                 bookOrder: 15, name: "에스라",         abbr: "스",   nameEn: "Ezra",            chapters: 10, testament: "OLD" },
    { bookKey: "NEH",                 bookOrder: 16, name: "느헤미야",       abbr: "느",   nameEn: "Nehemiah",        chapters: 13, testament: "OLD" },
    { bookKey: "EST",                 bookOrder: 17, name: "에스더",         abbr: "에",   nameEn: "Esther",          chapters: 10, testament: "OLD" },
    { bookKey: "JOB",                 bookOrder: 18, name: "욥기",           abbr: "욥",   nameEn: "Job",             chapters: 42, testament: "OLD" },
    { bookKey: "PSA",                 bookOrder: 19, name: "시편",           abbr: "시",   nameEn: "Psalms",          chapters: 150,testament: "OLD" },
    { bookKey: "PRO",                 bookOrder: 20, name: "잠언",           abbr: "잠",   nameEn: "Proverbs",        chapters: 31, testament: "OLD" },
    { bookKey: "ECC",                 bookOrder: 21, name: "전도서",         abbr: "전",   nameEn: "Ecclesiastes",    chapters: 12, testament: "OLD" },
    { bookKey: "SNG",                 bookOrder: 22, name: "아가",           abbr: "아",   nameEn: "Song of Solomon", chapters: 8,  testament: "OLD" },
    { bookKey: "ISA",                 bookOrder: 23, name: "이사야",         abbr: "사",   nameEn: "Isaiah",          chapters: 66, testament: "OLD" },
    { bookKey: "JER",                 bookOrder: 24, name: "예레미야",       abbr: "렘",   nameEn: "Jeremiah",        chapters: 52, testament: "OLD" },
    { bookKey: "LAM",                 bookOrder: 25, name: "예레미야 애가",  abbr: "애",   nameEn: "Lamentations",    chapters: 5,  testament: "OLD" },
    { bookKey: "EZK",                 bookOrder: 26, name: "에스겔",         abbr: "겔",   nameEn: "Ezekiel",         chapters: 48, testament: "OLD" },
    { bookKey: "DAN",                 bookOrder: 27, name: "다니엘",         abbr: "단",   nameEn: "Daniel",          chapters: 12, testament: "OLD" },
    { bookKey: "HOS",                 bookOrder: 28, name: "호세아",         abbr: "호",   nameEn: "Hosea",           chapters: 14, testament: "OLD" },
    { bookKey: "JOL",                 bookOrder: 29, name: "요엘",           abbr: "욜",   nameEn: "Joel",            chapters: 3,  testament: "OLD" },
    { bookKey: "AMO",                 bookOrder: 30, name: "아모스",         abbr: "암",   nameEn: "Amos",            chapters: 9,  testament: "OLD" },
    { bookKey: "OBA",                 bookOrder: 31, name: "오바댜",         abbr: "옵",   nameEn: "Obadiah",         chapters: 1,  testament: "OLD" },
    { bookKey: "JON",                 bookOrder: 32, name: "요나",           abbr: "욘",   nameEn: "Jonah",           chapters: 4,  testament: "OLD" },
    { bookKey: "MIC",                 bookOrder: 33, name: "미가",           abbr: "미",   nameEn: "Micah",           chapters: 7,  testament: "OLD" },
    { bookKey: "NAM",                 bookOrder: 34, name: "나훔",           abbr: "나",   nameEn: "Nahum",           chapters: 3,  testament: "OLD" },
    { bookKey: "HAB",                 bookOrder: 35, name: "하박국",         abbr: "합",   nameEn: "Habakkuk",        chapters: 3,  testament: "OLD" },
    { bookKey: "ZEP",                 bookOrder: 36, name: "스바냐",         abbr: "습",   nameEn: "Zephaniah",       chapters: 3,  testament: "OLD" },
    { bookKey: "HAG",                 bookOrder: 37, name: "학개",           abbr: "학",   nameEn: "Haggai",          chapters: 2,  testament: "OLD" },
    { bookKey: "ZEC",                 bookOrder: 38, name: "스가랴",         abbr: "슥",   nameEn: "Zechariah",       chapters: 14, testament: "OLD" },
    { bookKey: "MAL",                 bookOrder: 39, name: "말라기",         abbr: "말",   nameEn: "Malachi",         chapters: 4,  testament: "OLD" },

    // 신약 27권
    { bookKey: "MAT",                 bookOrder: 40, name: "마태복음",       abbr: "마",   nameEn: "Matthew",         chapters: 28, testament: "NEW" },
    { bookKey: "MRK",                 bookOrder: 41, name: "마가복음",       abbr: "막",   nameEn: "Mark",            chapters: 16, testament: "NEW" },
    { bookKey: "LUK",                 bookOrder: 42, name: "누가복음",       abbr: "눅",   nameEn: "Luke",            chapters: 24, testament: "NEW" },
    { bookKey: "JHN",                 bookOrder: 43, name: "요한복음",       abbr: "요",   nameEn: "John",            chapters: 21, testament: "NEW" },
    { bookKey: "ACT",                 bookOrder: 44, name: "사도행전",       abbr: "행",   nameEn: "Acts",            chapters: 28, testament: "NEW" },
    { bookKey: "ROM",                 bookOrder: 45, name: "로마서",         abbr: "롬",   nameEn: "Romans",          chapters: 16, testament: "NEW" },
    { bookKey: "FIRST_CORINTHIANS",   bookOrder: 46, name: "고린도전서",     abbr: "고전", nameEn: "1 Corinthians",   chapters: 16, testament: "NEW" },
    { bookKey: "SECOND_CORINTHIANS",  bookOrder: 47, name: "고린도후서",     abbr: "고후", nameEn: "2 Corinthians",   chapters: 13, testament: "NEW" },
    { bookKey: "GAL",                 bookOrder: 48, name: "갈라디아서",     abbr: "갈",   nameEn: "Galatians",       chapters: 6,  testament: "NEW" },
    { bookKey: "EPH",                 bookOrder: 49, name: "에베소서",       abbr: "엡",   nameEn: "Ephesians",       chapters: 6,  testament: "NEW" },
    { bookKey: "PHP",                 bookOrder: 50, name: "빌립보서",       abbr: "빌",   nameEn: "Philippians",     chapters: 4,  testament: "NEW" },
    { bookKey: "COL",                 bookOrder: 51, name: "골로새서",       abbr: "골",   nameEn: "Colossians",      chapters: 4,  testament: "NEW" },
    { bookKey: "FIRST_THESSALONIANS", bookOrder: 52, name: "데살로니가전서", abbr: "살전", nameEn: "1 Thessalonians", chapters: 5,  testament: "NEW" },
    { bookKey: "SECOND_THESSALONIANS",bookOrder: 53, name: "데살로니가후서", abbr: "살후", nameEn: "2 Thessalonians", chapters: 3,  testament: "NEW" },
    { bookKey: "FIRST_TIMOTHY",       bookOrder: 54, name: "디모데전서",     abbr: "딤전", nameEn: "1 Timothy",       chapters: 6,  testament: "NEW" },
    { bookKey: "SECOND_TIMOTHY",      bookOrder: 55, name: "디모데후서",     abbr: "딤후", nameEn: "2 Timothy",       chapters: 4,  testament: "NEW" },
    { bookKey: "TIT",                 bookOrder: 56, name: "디도서",         abbr: "딛",   nameEn: "Titus",           chapters: 3,  testament: "NEW" },
    { bookKey: "PHM",                 bookOrder: 57, name: "빌레몬서",       abbr: "몬",   nameEn: "Philemon",        chapters: 1,  testament: "NEW" },
    { bookKey: "HEB",                 bookOrder: 58, name: "히브리서",       abbr: "히",   nameEn: "Hebrews",         chapters: 13, testament: "NEW" },
    { bookKey: "JAS",                 bookOrder: 59, name: "야고보서",       abbr: "약",   nameEn: "James",           chapters: 5,  testament: "NEW" },
    { bookKey: "FIRST_PETER",         bookOrder: 60, name: "베드로전서",     abbr: "벧전", nameEn: "1 Peter",         chapters: 5,  testament: "NEW" },
    { bookKey: "SECOND_PETER",        bookOrder: 61, name: "베드로후서",     abbr: "벧후", nameEn: "2 Peter",         chapters: 3,  testament: "NEW" },
    { bookKey: "FIRST_JOHN",          bookOrder: 62, name: "요한일서",       abbr: "요일", nameEn: "1 John",          chapters: 5,  testament: "NEW" },
    { bookKey: "SECOND_JOHN",         bookOrder: 63, name: "요한이서",       abbr: "요이", nameEn: "2 John",          chapters: 1,  testament: "NEW" },
    { bookKey: "THIRD_JOHN",          bookOrder: 64, name: "요한삼서",       abbr: "요삼", nameEn: "3 John",          chapters: 1,  testament: "NEW" },
    { bookKey: "JUD",                 bookOrder: 65, name: "유다서",         abbr: "유",   nameEn: "Jude",            chapters: 1,  testament: "NEW" },
    { bookKey: "REV",                 bookOrder: 66, name: "요한계시록",     abbr: "계",   nameEn: "Revelation",      chapters: 22, testament: "NEW" },
]);

/**
 * BOOK_TOKENS — Bible Reference Parser 용 longest-first 토큰 배열.
 * 각 책의 name/abbr/nameEn 을 토큰으로 풀어 길이 내림차순 정렬.
 * tokenLower 는 비교용(대소문자 무시 매칭), token/book 은 라벨·URL 용 원본.
 */
export const BOOK_TOKENS = Object.freeze(
    BIBLE_BOOKS.flatMap(b => [
        { token: b.name,   tokenLower: b.name.toLowerCase(),   book: b },
        { token: b.abbr,   tokenLower: b.abbr.toLowerCase(),   book: b },
        { token: b.nameEn, tokenLower: b.nameEn.toLowerCase(), book: b },
    ]).sort((a, b) => b.token.length - a.token.length)
);

/**
 * 책 prefix 매칭. 가장 긴 일치 토큰을 반환.
 *
 * @param {string} inputLower — 이미 소문자화·NFC 정규화된 입력
 * @returns {{ book: object, matchedLength: number } | null}
 */
export function matchBookPrefix(inputLower) {
    for (const t of BOOK_TOKENS) {
        if (inputLower.startsWith(t.tokenLower)) {
            return { book: t.book, matchedLength: t.tokenLower.length };
        }
    }
    return null;
}

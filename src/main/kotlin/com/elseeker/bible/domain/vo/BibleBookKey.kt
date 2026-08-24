package com.elseeker.bible.domain.vo

enum class BibleBookKey(val code: String, val displayName: String) {

    GEN("GEN", "창세기"),
    EXO("EXO", "출애굽기"),
    LEV("LEV", "레위기"),
    NUM("NUM", "민수기"),
    DEU("DEU", "신명기"),
    JOS("JOS", "여호수아"),
    JDG("JDG", "사사기"),
    RUT("RUT", "룻기"),

    FIRST_SAMUEL("1SA", "사무엘상"),
    SECOND_SAMUEL("2SA", "사무엘하"),

    FIRST_KINGS("1KI", "열왕기상"),
    SECOND_KINGS("2KI", "열왕기하"),

    FIRST_CHRONICLES("1CH", "역대상"),
    SECOND_CHRONICLES("2CH", "역대하"),

    EZR("EZR", "에스라"),
    NEH("NEH", "느헤미야"),
    EST("EST", "에스더"),
    JOB("JOB", "욥기"),
    PSA("PSA", "시편"),
    PRO("PRO", "잠언"),
    ECC("ECC", "전도서"),
    SNG("SNG", "아가"),

    ISA("ISA", "이사야"),
    JER("JER", "예레미야"),
    LAM("LAM", "예레미야애가"),
    EZK("EZK", "에스겔"),
    DAN("DAN", "다니엘"),
    HOS("HOS", "호세아"),
    JOL("JOL", "요엘"),
    AMO("AMO", "아모스"),
    OBA("OBA", "오바댜"),
    JON("JON", "요나"),
    MIC("MIC", "미가"),
    NAM("NAM", "나훔"),
    HAB("HAB", "하박국"),
    ZEP("ZEP", "스바냐"),
    HAG("HAG", "학개"),
    ZEC("ZEC", "스가랴"),
    MAL("MAL", "말라기"),

    MAT("MAT", "마태복음"),
    MRK("MRK", "마가복음"),
    LUK("LUK", "누가복음"),
    JHN("JHN", "요한복음"),
    ACT("ACT", "사도행전"),
    ROM("ROM", "로마서"),

    FIRST_CORINTHIANS("1CO", "고린도전서"),
    SECOND_CORINTHIANS("2CO", "고린도후서"),

    GAL("GAL", "갈라디아서"),
    EPH("EPH", "에베소서"),
    PHP("PHP", "빌립보서"),
    COL("COL", "골로새서"),

    FIRST_THESSALONIANS("1TH", "데살로니가전서"),
    SECOND_THESSALONIANS("2TH", "데살로니가후서"),

    FIRST_TIMOTHY("1TI", "디모데전서"),
    SECOND_TIMOTHY("2TI", "디모데후서"),

    TIT("TIT", "디도서"),
    PHM("PHM", "빌레몬서"),
    HEB("HEB", "히브리서"),
    JAS("JAS", "야고보서"),

    FIRST_PETER("1PE", "베드로전서"),
    SECOND_PETER("2PE", "베드로후서"),

    FIRST_JOHN("1JN", "요한일서"),
    SECOND_JOHN("2JN", "요한이서"),
    THIRD_JOHN("3JN", "요한삼서"),

    JUD("JUD", "유다서"),
    REV("REV", "요한계시록");

    companion object {
        private val CODE_MAP = entries.associateBy { it.code }

        fun fromCode(code: String): BibleBookKey =
            CODE_MAP[code] ?: throw IllegalArgumentException("Unknown BibleBookKey code: $code")
    }
}

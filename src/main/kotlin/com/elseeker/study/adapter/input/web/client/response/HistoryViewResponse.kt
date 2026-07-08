package com.elseeker.study.adapter.input.web.client.response

enum class Testament {
    OLD, BETWEEN, NEW
}

data class EraSummary(
    val slug: String,
    val label: String,
    val period: String,
    val figures: List<String>,
    val testament: Testament
)

data class BookLink(
    val label: String,
    val url: String?
)

data class BookGroup(
    val groupName: String,
    val books: List<BookLink>
)

data class HistoryEventSummary(
    val id: String,
    val eraSlug: String,
    val title: String,
    val timeline: String,
    val description: String,
    val scriptureRange: String
)

data class HistoryEventDetail(
    val id: String,
    val eraSlug: String,
    val eraLabel: String,
    val title: String,
    val timeline: String,
    val summary: String,
    val background: String,
    val references: List<HistoryReference>
)

data class HistoryReference(
    val label: String,
    val url: String?
)

data class EraTimelineBlock(
    val era: EraSummary,
    val dividerLabel: String?,
    val eventHighlights: List<HistoryEventSummary>,
    val bookGroups: List<BookGroup>
)

object HistoryDummyData {
    // 연대는 보수적(전통적) 연대 기준. 출애굽 B.C. 1446(왕상 6:1의 480년 계산)을 축으로 함.
    val eras: List<EraSummary> = listOf(
        EraSummary(
            "patriarchs", "창조와 족장 시대", "창조 ~ B.C. 1876",
            listOf("아담", "노아", "아브라함", "야곱", "요셉"),
            Testament.OLD
        ),
        EraSummary(
            "exodus", "출애굽과 광야", "B.C. 1876~1406",
            listOf("모세", "아론", "미리암"),
            Testament.OLD
        ),
        EraSummary(
            "conquest", "가나안 정복", "B.C. 1406~1375",
            listOf("여호수아", "갈렙"),
            Testament.OLD
        ),
        EraSummary(
            "judges", "사사 시대", "B.C. 1375~1050",
            listOf("드보라", "기드온", "삼손", "사무엘"),
            Testament.OLD
        ),
        EraSummary(
            "united-kingdom", "통일 왕국 시대", "B.C. 1050~930",
            listOf("사울", "다윗", "솔로몬"),
            Testament.OLD
        ),
        EraSummary(
            "divided-kingdom", "분열 왕국 시대", "B.C. 930~586",
            listOf("엘리야", "엘리사", "이사야", "히스기야", "요시야"),
            Testament.OLD
        ),
        EraSummary(
            "exile", "바벨론 포로", "B.C. 586~538",
            listOf("다니엘", "에스겔", "예레미야"),
            Testament.OLD
        ),
        EraSummary(
            "return", "귀환과 재건", "B.C. 538~400",
            listOf("스룹바벨", "에스라", "느헤미야", "에스더"),
            Testament.OLD
        ),
        EraSummary(
            "intertestamental", "신구약 중간사", "B.C. 400~4",
            listOf("알렉산더", "유다 마카베오"),
            Testament.BETWEEN
        ),
        EraSummary(
            "jesus", "예수 시대", "B.C. 4~A.D. 30",
            listOf("예수", "세례 요한", "열두 제자"),
            Testament.NEW
        ),
        EraSummary(
            "early-church", "초대 교회", "A.D. 30~100",
            listOf("베드로", "바울", "스데반", "요한"),
            Testament.NEW
        )
    )

    val bookCategories: List<String> = listOf(
        "율법서",
        "역사서",
        "시가서",
        "예언서",
        "복음서",
        "바울 서신",
        "공동 서신",
        "배경"
    )

    private val eraLabelBySlug = eras.associate { it.slug to it.label }

    private const val KRV_TRANSLATION_ID = 1

    private fun chapterUrl(bookOrder: Int): String =
        "/web/bible/chapter?translationId=$KRV_TRANSLATION_ID&bookOrder=$bookOrder&from=history"

    private fun verseUrl(bookOrder: Int, chapterNumber: Int): String =
        "/web/bible/verse?translationId=$KRV_TRANSLATION_ID&bookOrder=$bookOrder&chapterNumber=$chapterNumber&from=history"

    private fun bookLink(label: String, bookOrder: Int) = BookLink(label, chapterUrl(bookOrder))

    private fun backgroundLink(label: String) = BookLink(label, null)

    private val eraBookGroups: Map<String, List<BookGroup>> = mapOf(
        "patriarchs" to listOf(
            BookGroup("율법서", listOf(bookLink("창세기", 1))),
            BookGroup("시가서", listOf(bookLink("욥기", 18)))
        ),
        "exodus" to listOf(
            BookGroup(
                "율법서",
                listOf(
                    bookLink("출애굽기", 2),
                    bookLink("레위기", 3),
                    bookLink("민수기", 4),
                    bookLink("신명기", 5)
                )
            )
        ),
        "conquest" to listOf(
            BookGroup("역사서", listOf(bookLink("여호수아", 6)))
        ),
        "judges" to listOf(
            BookGroup("역사서", listOf(bookLink("사사기", 7), bookLink("룻기", 8)))
        ),
        "united-kingdom" to listOf(
            BookGroup(
                "역사서",
                listOf(
                    bookLink("사무엘상", 9),
                    bookLink("사무엘하", 10),
                    bookLink("열왕기상", 11),
                    bookLink("역대상", 13)
                )
            ),
            BookGroup(
                "시가서",
                listOf(
                    bookLink("시편", 19),
                    bookLink("잠언", 20),
                    bookLink("전도서", 21),
                    bookLink("아가", 22)
                )
            )
        ),
        "divided-kingdom" to listOf(
            BookGroup(
                "역사서",
                listOf(bookLink("열왕기하", 12), bookLink("역대하", 14))
            ),
            BookGroup(
                "예언서",
                listOf(
                    bookLink("이사야", 23),
                    bookLink("예레미야", 24),
                    bookLink("호세아", 28),
                    bookLink("요엘", 29),
                    bookLink("아모스", 30),
                    bookLink("오바댜", 31),
                    bookLink("요나", 32),
                    bookLink("미가", 33),
                    bookLink("나훔", 34),
                    bookLink("하박국", 35),
                    bookLink("스바냐", 36)
                )
            )
        ),
        "exile" to listOf(
            BookGroup(
                "예언서",
                listOf(
                    bookLink("예레미야애가", 25),
                    bookLink("에스겔", 26),
                    bookLink("다니엘", 27)
                )
            )
        ),
        "return" to listOf(
            BookGroup(
                "역사서",
                listOf(bookLink("에스라", 15), bookLink("느헤미야", 16), bookLink("에스더", 17))
            ),
            BookGroup(
                "예언서",
                listOf(bookLink("학개", 37), bookLink("스가랴", 38), bookLink("말라기", 39))
            )
        ),
        "intertestamental" to listOf(
            BookGroup("배경", listOf(backgroundLink("헬라 시대"), backgroundLink("로마 시대")))
        ),
        "jesus" to listOf(
            BookGroup(
                "복음서",
                listOf(
                    bookLink("마태복음", 40),
                    bookLink("마가복음", 41),
                    bookLink("누가복음", 42),
                    bookLink("요한복음", 43)
                )
            )
        ),
        "early-church" to listOf(
            BookGroup("역사서", listOf(bookLink("사도행전", 44))),
            BookGroup(
                "바울 서신",
                listOf(
                    bookLink("로마서", 45),
                    bookLink("고린도전서", 46),
                    bookLink("고린도후서", 47),
                    bookLink("갈라디아서", 48),
                    bookLink("에베소서", 49),
                    bookLink("빌립보서", 50),
                    bookLink("골로새서", 51),
                    bookLink("데살로니가전서", 52),
                    bookLink("데살로니가후서", 53),
                    bookLink("디모데전서", 54),
                    bookLink("디모데후서", 55),
                    bookLink("디도서", 56),
                    bookLink("빌레몬서", 57)
                )
            ),
            BookGroup(
                "공동 서신",
                listOf(
                    bookLink("히브리서", 58),
                    bookLink("야고보서", 59),
                    bookLink("베드로전서", 60),
                    bookLink("베드로후서", 61),
                    bookLink("요한일서", 62),
                    bookLink("요한이서", 63),
                    bookLink("요한삼서", 64),
                    bookLink("유다서", 65)
                )
            ),
            BookGroup("예언서", listOf(bookLink("요한계시록", 66)))
        )
    )

    private data class HistoryEventSeed(
        val id: String,
        val eraSlug: String,
        val title: String,
        val timeline: String,
        val description: String,
        val background: String,
        val scriptureRange: String,
        val referenceBookOrder: Int?,
        val referenceChapter: Int?,
        val highlight: Boolean = true
    )

    private val eventSeeds: List<HistoryEventSeed> = listOf(
        // 창조와 족장 시대
        HistoryEventSeed(
            "event-creation", "patriarchs",
            "창조", "연대 미상",
            "하나님이 말씀으로 천지와 인류를 창조하신 사건.",
            "성경은 하나님이 말씀으로 천지를 창조하시고 사람을 하나님의 형상대로 지으셨다고 선언합니다. " +
                "창조 기사는 이스라엘 신앙의 출발점이자 성경 전체 이야기의 기초가 됩니다.",
            "창 1-2", 1, 1
        ),
        HistoryEventSeed(
            "event-flood", "patriarchs",
            "노아 홍수", "연대 미상",
            "죄악이 가득한 세상을 홍수로 심판하시고 노아 가족을 구원하신 사건.",
            "인류의 타락이 극에 달하자 하나님은 홍수로 세상을 심판하시고, 방주를 통해 노아의 여덟 식구와 생물들을 보존하셨습니다. " +
                "홍수 후 하나님은 무지개 언약으로 다시는 물로 세상을 멸하지 않으실 것을 약속하셨습니다.",
            "창 6-9", 1, 6
        ),
        HistoryEventSeed(
            "event-covenant-abraham", "patriarchs",
            "아브라함 언약", "B.C. 2091년경",
            "아브라함을 부르시고 큰 민족과 복의 근원이 되게 하겠다고 약속하신 언약.",
            "하나님은 갈대아 우르 출신의 아브라함을 가나안 땅으로 부르시고 자손·땅·복의 언약을 주셨습니다. " +
                "이 언약은 이후 이스라엘 민족의 형성과 메시아 약속으로 이어지는 구속사의 뼈대가 됩니다.",
            "창 12, 15, 17", 1, 12
        ),
        HistoryEventSeed(
            "event-joseph", "patriarchs",
            "요셉과 애굽 이주", "B.C. 1876년경",
            "요셉이 애굽의 총리가 되고 야곱의 온 가족이 애굽으로 이주한 사건.",
            "형들에게 팔려 애굽으로 간 요셉은 하나님의 섭리 가운데 총리가 되어 큰 기근에서 가족을 구했습니다. " +
                "야곱 가족의 애굽 이주는 이스라엘이 한 민족으로 성장하는 무대가 되었습니다.",
            "창 37, 39-47", 1, 37
        ),
        // 출애굽과 광야
        HistoryEventSeed(
            "event-exodus", "exodus",
            "출애굽", "B.C. 1446년경",
            "열 가지 재앙과 홍해의 기적으로 이스라엘이 애굽에서 해방된 사건.",
            "430년의 애굽 생활 끝에 하나님은 모세를 세워 열 재앙으로 바로를 굴복시키시고 이스라엘을 이끌어 내셨습니다. " +
                "유월절과 홍해 도하는 구약 구원의 원형으로 성경 전체에서 계속 기억됩니다. " +
                "보수적 연대로는 B.C. 1446년, 후기설은 B.C. 1290~1250년경으로 봅니다.",
            "출 1-15", 2, 1
        ),
        HistoryEventSeed(
            "event-sinai-covenant", "exodus",
            "시내산 언약", "B.C. 1446년경",
            "시내산에서 율법이 주어지고 이스라엘이 하나님의 백성으로 세워진 사건.",
            "출애굽 석 달 후 이스라엘은 시내산에서 십계명과 율법을 받고 하나님과 언약을 맺어 '제사장 나라, 거룩한 백성'으로 부름받았습니다. " +
                "성막 제도가 이때 세워져 하나님이 백성 가운데 거하시는 길이 열렸습니다.",
            "출 19-24", 2, 19
        ),
        HistoryEventSeed(
            "event-wilderness", "exodus",
            "광야 40년", "B.C. 1446~1406",
            "가데스 바네아의 불신앙으로 한 세대가 광야에서 방랑한 40년.",
            "가데스 바네아에서 열 정탐꾼의 보고를 듣고 백성이 가나안 진입을 거부하자, 하나님은 출애굽 1세대가 광야에서 마치기까지 40년을 방랑하게 하셨습니다. " +
                "광야 여정은 만나와 구름 기둥으로 인도하신 하나님의 신실하심을 보여줍니다.",
            "민 13-14", 4, 13
        ),
        // 가나안 정복
        HistoryEventSeed(
            "event-jericho", "conquest",
            "요단 도하와 여리고 함락", "B.C. 1406년경",
            "요단강을 마른 땅으로 건너고 여리고성이 무너진 가나안 정복의 시작.",
            "여호수아의 지도 아래 이스라엘은 요단강을 기적적으로 건너 가나안에 들어갔고, 첫 성 여리고는 언약궤를 앞세운 행진 후 무너졌습니다. " +
                "이 사건은 하나님이 친히 싸우시는 정복 전쟁의 성격을 보여줍니다.",
            "수 1-6", 6, 1
        ),
        HistoryEventSeed(
            "event-land-division", "conquest",
            "가나안 땅 분배", "B.C. 1400년경",
            "정복한 가나안 땅을 열두 지파에게 기업으로 분배한 사건.",
            "남부와 북부 연합군을 격파한 후 여호수아는 제비뽑기로 각 지파에게 땅을 분배했습니다. " +
                "아브라함에게 약속된 땅의 언약이 성취되는 순간이었습니다.",
            "수 13-21", 6, 13
        ),
        // 사사 시대
        HistoryEventSeed(
            "event-deborah", "judges",
            "드보라의 승리", "B.C. 1200년경",
            "여선지자 드보라와 바락이 가나안 왕 야빈의 군대를 물리친 사건.",
            "철병거 900대를 앞세운 가나안 군대의 압제 아래에서 드보라는 바락과 함께 다볼산 전투를 승리로 이끌었습니다. " +
                "사사기는 '타락-압제-부르짖음-구원'의 순환 구조를 반복해서 보여줍니다.",
            "삿 4-5", 7, 4
        ),
        HistoryEventSeed(
            "event-gideon", "judges",
            "기드온의 승리", "B.C. 1170년경",
            "300명의 용사로 미디안 대군을 물리친 사건.",
            "하나님은 기드온의 군대를 3만 2천 명에서 300명으로 줄이셔서 승리가 사람의 힘이 아닌 하나님께 있음을 보이셨습니다. " +
                "횃불과 항아리, 나팔만으로 미디안 진영은 무너졌습니다.",
            "삿 6-7", 7, 6
        ),
        HistoryEventSeed(
            "event-samson", "judges",
            "삼손과 블레셋", "B.C. 1075년경",
            "블레셋의 압제에 맞선 사사 삼손의 활약과 죽음.",
            "나실인으로 태어난 삼손은 큰 힘으로 블레셋에 맞섰으나 들릴라에게 비밀을 누설해 사로잡혔습니다. " +
                "그의 마지막 기도와 죽음은 사사 시대의 영적 혼란을 상징적으로 보여줍니다.",
            "삿 13-16", 7, 13
        ),
        // 통일 왕국 시대
        HistoryEventSeed(
            "event-saul", "united-kingdom",
            "사울 즉위", "B.C. 1050년경",
            "이스라엘의 첫 왕 사울이 세워져 왕정 시대가 시작된 사건.",
            "백성이 '열방과 같은 왕'을 요구하자 하나님은 사무엘을 통해 사울에게 기름 부으셨습니다. " +
                "왕정의 시작은 사사 시대의 혼란을 끝냈지만, 왕의 순종 여부가 나라의 운명을 좌우하게 되었습니다.",
            "삼상 8-10", 9, 8
        ),
        HistoryEventSeed(
            "event-david-kingdom", "united-kingdom",
            "다윗 왕국", "B.C. 1010년경",
            "다윗이 왕이 되어 예루살렘을 수도로 통일 왕국을 세운 사건.",
            "다윗은 헤브론에서 유다의 왕이 된 후 온 이스라엘의 왕이 되어 예루살렘을 정복하고 수도로 삼았습니다. " +
                "하나님은 다윗 언약을 통해 그의 왕위가 영원할 것을 약속하셨고, 이는 메시아 소망의 근거가 되었습니다.",
            "삼하 5-7", 10, 5
        ),
        HistoryEventSeed(
            "event-temple", "united-kingdom",
            "솔로몬 성전 봉헌", "B.C. 959년경",
            "솔로몬이 예루살렘에 첫 성전을 완공하여 봉헌한 사건.",
            "솔로몬은 즉위 4년(B.C. 966년경)에 성전 건축을 시작해 7년 만에 완공했습니다. " +
                "성전 봉헌으로 언약궤가 지성소에 안치되었고, 예루살렘은 이스라엘 예배의 중심이 되었습니다.",
            "왕상 6-8", 11, 6
        ),
        // 분열 왕국 시대
        HistoryEventSeed(
            "event-division", "divided-kingdom",
            "왕국 분열", "B.C. 930년경",
            "솔로몬 사후 나라가 북이스라엘과 남유다로 갈라진 사건.",
            "르호보암이 무거운 멍에를 가볍게 해 달라는 백성의 요구를 거절하자 열 지파가 여로보암을 따라 북이스라엘을 세웠습니다. " +
                "여로보암은 벧엘과 단에 금송아지를 세워 북왕국을 우상숭배의 길로 이끌었습니다.",
            "왕상 12", 11, 12
        ),
        HistoryEventSeed(
            "event-elijah", "divided-kingdom",
            "엘리야의 갈멜산 대결", "B.C. 860년경",
            "엘리야가 바알 선지자 450명과 대결하여 여호와가 참 하나님이심을 증명한 사건.",
            "아합과 이세벨 치하에서 바알 숭배가 극에 달했을 때, 엘리야는 갈멜산에서 불로 응답하시는 여호와를 온 백성 앞에 증명했습니다. " +
                "이 사건은 분열 왕국 시대 선지자 사역의 대표적인 장면입니다.",
            "왕상 18", 11, 18
        ),
        HistoryEventSeed(
            "event-fall-israel", "divided-kingdom",
            "북이스라엘 멸망", "B.C. 722년",
            "앗수르에 의해 사마리아가 함락되고 북이스라엘이 멸망한 사건.",
            "계속된 우상숭배와 언약 배반 끝에 북이스라엘은 앗수르 왕 살만에셀 5세와 사르곤 2세에 의해 멸망했습니다. " +
                "백성들은 앗수르 각지로 흩어졌고, 사마리아에는 이방 민족이 섞여 정착하게 되었습니다.",
            "왕하 17", 12, 17
        ),
        HistoryEventSeed(
            "event-hezekiah", "divided-kingdom",
            "히스기야와 산헤립 침공", "B.C. 701년",
            "앗수르 산헤립의 침공에서 하나님이 예루살렘을 지키신 사건.",
            "히스기야는 성전 예배를 회복한 개혁 군주였습니다. 앗수르 대군이 예루살렘을 포위했을 때 그는 성전에서 기도했고, " +
                "하나님의 사자가 앗수르 군대를 치심으로 예루살렘이 보존되었습니다.",
            "왕하 18-19", 12, 18
        ),
        // 바벨론 포로
        HistoryEventSeed(
            "event-exile-start", "exile",
            "바벨론 포로 시작", "B.C. 605년",
            "느부갓네살의 1차 침공으로 다니엘 등이 바벨론에 끌려간 사건.",
            "갈그미스 전투에서 애굽을 꺾은 바벨론은 유다를 속국으로 삼고 다니엘을 포함한 왕족과 귀족 자제들을 끌고 갔습니다. " +
                "이후 B.C. 597년 여호야긴 왕과 에스겔 등이 끌려간 2차 포로가 이어졌습니다.",
            "단 1, 왕하 24", 27, 1
        ),
        HistoryEventSeed(
            "event-temple-destruction", "exile",
            "예루살렘 함락과 성전 파괴", "B.C. 586년",
            "바벨론에 의해 예루살렘이 함락되고 솔로몬 성전이 불탄 사건.",
            "시드기야의 반역 후 느부갓네살은 예루살렘을 함락시키고 성전을 불태웠으며 대다수 백성을 포로로 끌고 갔습니다. " +
                "예레미야의 경고가 성취된 이 사건으로 유다 왕국의 역사가 막을 내렸습니다.",
            "왕하 25, 애 1", 12, 25
        ),
        HistoryEventSeed(
            "event-daniel-lions", "exile",
            "다니엘의 사자굴", "B.C. 539년경",
            "왕의 금령에도 기도를 멈추지 않은 다니엘이 사자굴에서 건짐받은 사건.",
            "바벨론이 메대·바사에 넘어간 직후, 다니엘은 왕의 금령에도 하루 세 번 예루살렘을 향해 기도하다 사자굴에 던져졌으나 하나님이 그를 지키셨습니다. " +
                "포로기에도 신앙을 지킨 남은 자들의 모범입니다.",
            "단 6", 27, 6
        ),
        // 귀환과 재건
        HistoryEventSeed(
            "event-return", "return",
            "스룹바벨 1차 귀환", "B.C. 538년",
            "고레스 칙령으로 스룹바벨과 약 5만 명이 예루살렘으로 돌아온 사건.",
            "바벨론을 정복한 바사 왕 고레스는 칙령을 내려 유다 포로들의 귀환과 성전 재건을 허락했습니다. " +
                "이는 예레미야가 예언한 70년 만의 회복이었습니다.",
            "스 1-3", 15, 1
        ),
        HistoryEventSeed(
            "event-second-temple", "return",
            "성전 재건 완공", "B.C. 516년",
            "학개와 스가랴의 격려로 스룹바벨 성전이 완공된 사건.",
            "대적들의 방해로 성전 공사가 오랫동안 중단되었으나, 학개와 스가랴 선지자의 독려로 재개되어 다리오 왕 6년에 완공되었습니다. " +
                "이렇게 제2성전 시대가 시작되었습니다.",
            "스 5-6, 학 1-2", 15, 5
        ),
        HistoryEventSeed(
            "event-esther", "return",
            "에스더와 부림절", "B.C. 473년경",
            "하만의 음모에서 유다 민족이 구원받고 부림절이 제정된 사건.",
            "바사 왕 아하수에로 시대에 왕후가 된 에스더는 죽음을 무릅쓰고 왕 앞에 나아가 민족을 구했습니다. " +
                "'죽으면 죽으리이다'라는 결단은 하나님의 숨은 섭리를 보여주며, 이를 기념해 부림절이 제정되었습니다.",
            "에 3-9", 17, 3,
            highlight = false
        ),
        HistoryEventSeed(
            "event-ezra", "return",
            "에스라의 귀환과 개혁", "B.C. 458년",
            "학사 에스라가 2차 귀환을 이끌고 율법 중심의 개혁을 일으킨 사건.",
            "에스라는 아닥사스다 왕 7년에 귀환하여 율법 연구와 교육에 힘썼고 공동체의 신앙을 개혁했습니다. " +
                "말씀 중심의 공동체 회복은 이후 유대교 회당 전통의 뿌리가 되었습니다.",
            "스 7-10", 15, 7
        ),
        HistoryEventSeed(
            "event-nehemiah", "return",
            "느헤미야 성벽 재건", "B.C. 445년",
            "느헤미야의 지도로 예루살렘 성벽이 52일 만에 재건된 사건.",
            "바사 왕의 술 관원이었던 느헤미야는 아닥사스다 왕 20년에 총독으로 부임해 무너진 성벽을 52일 만에 재건했습니다. " +
                "에스라와 함께 율법 낭독과 언약 갱신으로 공동체를 재정비했습니다.",
            "느 1-6", 16, 1
        ),
        // 신구약 중간사
        HistoryEventSeed(
            "event-alexander", "intertestamental",
            "알렉산더의 정복", "B.C. 333년",
            "알렉산더 대왕이 바사를 무너뜨리고 헬라 시대를 연 사건.",
            "잇수스 전투 이후 알렉산더는 팔레스타인을 포함한 근동 전역을 정복했고, 헬라어와 헬라 문화가 지중해 세계의 공통 기반이 되었습니다. " +
                "후에 헬라어 구약 성경(70인역)이 번역되어 복음 전파의 토대가 되었습니다.",
            "역사 배경", null, null
        ),
        HistoryEventSeed(
            "event-maccabees", "intertestamental",
            "마카비 혁명", "B.C. 167~164년",
            "안티오쿠스 4세의 성전 모독에 맞서 유대 독립을 회복한 사건.",
            "셀류커스 왕 안티오쿠스 4세는 성전에 이방 제단을 세우고 유대교를 탄압했습니다. " +
                "제사장 맛다디아와 아들 유다 마카베오가 봉기하여 B.C. 164년 성전을 정결하게 했고, 이를 기념한 것이 수전절(하누카)입니다.",
            "역사 배경(단 11 참조)", 27, 11
        ),
        HistoryEventSeed(
            "event-roman-rule", "intertestamental",
            "로마의 지배 시작", "B.C. 63년",
            "폼페이우스가 예루살렘을 점령하여 로마 지배가 시작된 사건.",
            "하스몬 왕조의 내분을 틈타 로마 장군 폼페이우스가 예루살렘을 점령했습니다. " +
                "이후 로마가 세운 헤롯 대왕이 유대를 다스렸으며, 예수님 탄생 당시의 정치 지형이 이렇게 형성되었습니다.",
            "역사 배경", null, null
        ),
        // 예수 시대
        HistoryEventSeed(
            "event-nativity", "jesus",
            "예수 탄생", "B.C. 5~4년경",
            "약속된 메시아 예수께서 베들레헴에서 나신 사건.",
            "가이사 아구스도의 호적 명령 가운데 예수님은 다윗의 동네 베들레헴에서 나셨습니다. " +
                "헤롯 대왕 말년의 일로, 이사야와 미가의 예언이 성취된 순간이었습니다.",
            "마 1-2, 눅 1-2", 40, 1
        ),
        HistoryEventSeed(
            "event-ministry", "jesus",
            "공생애 시작", "A.D. 26~27년경",
            "세례와 광야 시험 후 예수께서 하나님 나라 복음을 선포하기 시작하신 사건.",
            "예수님은 세례 요한에게 세례를 받으시고 광야 시험을 이기신 후 '하나님 나라가 가까이 왔다'고 선포하셨습니다. " +
                "갈릴리를 중심으로 가르침과 치유, 제자 부르심의 사역이 약 3년간 이어졌습니다. " +
                "공생애 시작 연대는 '디베료 황제 15년'(눅 3:1)의 계산 방식에 따라 A.D. 26~29년 사이로 봅니다.",
            "마 3-4, 눅 3-4", 40, 3
        ),
        HistoryEventSeed(
            "event-resurrection", "jesus",
            "십자가와 부활", "A.D. 30년경",
            "예수님의 십자가 죽음과 사흘 만의 부활로 구원이 완성된 사건.",
            "유월절에 예수님은 십자가에 달려 죽으시고 사흘 만에 부활하셨습니다. " +
                "이는 성경 전체가 가리키는 구속사의 정점으로, 부활하신 주님은 40일간 여러 증인들에게 나타나셨습니다. " +
                "처형 연대는 A.D. 30년설과 33년설이 병존합니다.",
            "마 26-28, 요 19-20", 40, 26
        ),
        // 초대 교회
        HistoryEventSeed(
            "event-pentecost", "early-church",
            "오순절 성령 강림", "A.D. 30년경",
            "성령이 임하여 예루살렘에서 교회가 탄생한 사건.",
            "부활·승천 후 오순절에 성령이 예루살렘의 한 다락방에 모인 제자들에게 임했고, 베드로의 설교로 하루에 3천 명이 세례를 받았습니다. " +
                "요엘의 예언이 성취되며 교회 시대가 열렸습니다.",
            "행 2", 44, 2
        ),
        HistoryEventSeed(
            "event-paul-conversion", "early-church",
            "바울의 회심", "A.D. 33~35년경",
            "교회를 핍박하던 사울이 다메섹에서 부활하신 예수를 만나 회심한 사건.",
            "스데반의 순교에 가담했던 사울은 다메섹 도상에서 부활하신 주님을 만나 이방인의 사도로 부름받았습니다. " +
                "그의 회심은 복음이 이방 세계로 확장되는 전환점이 되었습니다.",
            "행 9", 44, 9
        ),
        HistoryEventSeed(
            "event-jerusalem-council", "early-church",
            "예루살렘 공회", "A.D. 49~50년경",
            "이방인 신자에게 율법의 멍에를 지우지 않기로 결정한 최초의 교회 회의.",
            "이방인도 할례 없이 믿음으로 구원받는가를 두고 예루살렘에서 사도와 장로들이 모였습니다. " +
                "공회는 은혜로 구원받음을 확인했고, 이 결정으로 복음의 보편성이 공식화되었습니다.",
            "행 15", 44, 15
        ),
        HistoryEventSeed(
            "event-paul-mission", "early-church",
            "바울의 선교 여행", "A.D. 46~57년",
            "세 차례 선교 여행으로 복음이 소아시아와 유럽으로 확장된 사건.",
            "바울은 1차(A.D. 46~48), 2차(49~52), 3차(53~57) 선교 여행을 통해 갈라디아, 마게도냐, 아가야, 아시아 지역에 교회를 세웠고 여러 서신을 기록했습니다. " +
                "복음은 이렇게 로마 제국 전역으로 퍼져 갔습니다.",
            "행 13-21", 44, 13
        )
    )

    val eventSummaries: List<HistoryEventSummary> = eventSeeds.map { seed ->
        HistoryEventSummary(
            id = seed.id,
            eraSlug = seed.eraSlug,
            title = seed.title,
            timeline = seed.timeline,
            description = seed.description,
            scriptureRange = seed.scriptureRange
        )
    }

    val eventDetails: List<HistoryEventDetail> = eventSeeds.map { seed ->
        HistoryEventDetail(
            id = seed.id,
            eraSlug = seed.eraSlug,
            eraLabel = eraLabelBySlug[seed.eraSlug] ?: "알 수 없는 시대",
            title = seed.title,
            timeline = seed.timeline,
            summary = seed.description,
            background = seed.background,
            references = listOf(
                if (seed.referenceBookOrder != null && seed.referenceChapter != null) {
                    HistoryReference(seed.scriptureRange, verseUrl(seed.referenceBookOrder, seed.referenceChapter))
                } else {
                    HistoryReference(seed.scriptureRange, null)
                }
            )
        )
    }

    private fun dividerLabelOf(index: Int, era: EraSummary): String? {
        val isFirstOfTestament = index == 0 || eras[index - 1].testament != era.testament
        if (!isFirstOfTestament) {
            return null
        }
        return when (era.testament) {
            Testament.OLD -> "구약 시대"
            Testament.BETWEEN -> "신구약 중간사"
            Testament.NEW -> "신약 시대"
        }
    }

    private val eventSummaryById = eventSummaries.associateBy { it.id }

    val timelineBlocks: List<EraTimelineBlock> = eras.mapIndexed { index, era ->
        EraTimelineBlock(
            era = era,
            dividerLabel = dividerLabelOf(index, era),
            eventHighlights = eventSeeds
                .filter { it.eraSlug == era.slug && it.highlight }
                .take(4)
                .mapNotNull { eventSummaryById[it.id] },
            bookGroups = eraBookGroups[era.slug].orEmpty()
        )
    }

    fun findEra(slug: String?): EraSummary? {
        if (slug.isNullOrBlank()) {
            return null
        }
        return eras.firstOrNull { it.slug == slug }
    }

    fun eventsForEra(slug: String?): List<HistoryEventSummary> {
        if (slug.isNullOrBlank()) {
            return emptyList()
        }
        return eventSummaries.filter { it.eraSlug == slug }
    }

    fun findEventDetail(id: String?): HistoryEventDetail? {
        if (id.isNullOrBlank()) {
            return null
        }
        return eventDetails.firstOrNull { it.id == id }
    }
}

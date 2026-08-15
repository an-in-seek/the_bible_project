-- Bible O/X Quiz Stages (66권)
INSERT INTO ox_quiz_stage (id, stage_number, book_name, created_at, updated_at)
VALUES
-- 구약 (39권)
(1, 1, '창세기', NOW(), NOW()),
(2, 2, '출애굽기', NOW(), NOW()),
(3, 3, '레위기', NOW(), NOW()),
(4, 4, '민수기', NOW(), NOW()),
(5, 5, '신명기', NOW(), NOW()),
(6, 6, '여호수아', NOW(), NOW()),
(7, 7, '사사기', NOW(), NOW()),
(8, 8, '룻기', NOW(), NOW()),
(9, 9, '사무엘상', NOW(), NOW()),
(10, 10, '사무엘하', NOW(), NOW()),
(11, 11, '열왕기상', NOW(), NOW()),
(12, 12, '열왕기하', NOW(), NOW()),
(13, 13, '역대상', NOW(), NOW()),
(14, 14, '역대하', NOW(), NOW()),
(15, 15, '에스라', NOW(), NOW()),
(16, 16, '느헤미야', NOW(), NOW()),
(17, 17, '에스더', NOW(), NOW()),
(18, 18, '욥기', NOW(), NOW()),
(19, 19, '시편', NOW(), NOW()),
(20, 20, '잠언', NOW(), NOW()),
(21, 21, '전도서', NOW(), NOW()),
(22, 22, '아가', NOW(), NOW()),
(23, 23, '이사야', NOW(), NOW()),
(24, 24, '예레미야', NOW(), NOW()),
(25, 25, '예레미야애가', NOW(), NOW()),
(26, 26, '에스겔', NOW(), NOW()),
(27, 27, '다니엘', NOW(), NOW()),
(28, 28, '호세아', NOW(), NOW()),
(29, 29, '요엘', NOW(), NOW()),
(30, 30, '아모스', NOW(), NOW()),
(31, 31, '오바댜', NOW(), NOW()),
(32, 32, '요나', NOW(), NOW()),
(33, 33, '미가', NOW(), NOW()),
(34, 34, '나훔', NOW(), NOW()),
(35, 35, '하박국', NOW(), NOW()),
(36, 36, '스바냐', NOW(), NOW()),
(37, 37, '학개', NOW(), NOW()),
(38, 38, '스가랴', NOW(), NOW()),
(39, 39, '말라기', NOW(), NOW()),
-- 신약 (27권)
(40, 40, '마태복음', NOW(), NOW()),
(41, 41, '마가복음', NOW(), NOW()),
(42, 42, '누가복음', NOW(), NOW()),
(43, 43, '요한복음', NOW(), NOW()),
(44, 44, '사도행전', NOW(), NOW()),
(45, 45, '로마서', NOW(), NOW()),
(46, 46, '고린도전서', NOW(), NOW()),
(47, 47, '고린도후서', NOW(), NOW()),
(48, 48, '갈라디아서', NOW(), NOW()),
(49, 49, '에베소서', NOW(), NOW()),
(50, 50, '빌립보서', NOW(), NOW()),
(51, 51, '골로새서', NOW(), NOW()),
(52, 52, '데살로니가전서', NOW(), NOW()),
(53, 53, '데살로니가후서', NOW(), NOW()),
(54, 54, '디모데전서', NOW(), NOW()),
(55, 55, '디모데후서', NOW(), NOW()),
(56, 56, '디도서', NOW(), NOW()),
(57, 57, '빌레몬서', NOW(), NOW()),
(58, 58, '히브리서', NOW(), NOW()),
(59, 59, '야고보서', NOW(), NOW()),
(60, 60, '베드로전서', NOW(), NOW()),
(61, 61, '베드로후서', NOW(), NOW()),
(62, 62, '요한일서', NOW(), NOW()),
(63, 63, '요한이서', NOW(), NOW()),
(64, 64, '요한삼서', NOW(), NOW()),
(65, 65, '유다서', NOW(), NOW()),
(66, 66, '요한계시록', NOW(), NOW());

-- Stage 1: 창세기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (1, 1, '하나님이 천지를 창조하신 기간은 6일이다.', true, 'EASY', 1, NOW(), NOW()),
       (2, 1, '아담은 에덴동산에서 창조되었다.', true, 'EASY', 2, NOW(), NOW()),
       (3, 1, '가인은 아벨의 형이다.', true, 'EASY', 3, NOW(), NOW()),
       (4, 1, '노아의 방주에는 각 동물이 세 쌍씩 들어갔다.', false, 'NORMAL', 4, NOW(), NOW()),
       (5, 1, '바벨탑 사건 후 인류의 언어가 혼잡해졌다.', true, 'EASY', 5, NOW(), NOW()),
       (6, 1, '아브라함의 원래 이름은 아브람이었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (7, 1, '이삭은 아브라함과 하갈 사이에서 태어났다.', false, 'EASY', 7, NOW(), NOW()),
       (8, 1, '야곱은 에서에게 팥죽 한 그릇에 장자권을 팔았다.', false, 'NORMAL', 8, NOW(), NOW()),
       (9, 1, '요셉은 야곱의 12아들 중 막내였다.', false, 'NORMAL', 9, NOW(), NOW()),
       (10, 1, '요셉은 애굽의 총리가 되었다.', true, 'EASY', 10, NOW(), NOW());

-- Stage 2: 출애굽기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (11, 2, '모세는 바로의 궁에서 자랐다.', true, 'EASY', 1, NOW(), NOW()),
       (12, 2, '모세는 불타는 떨기나무에서 하나님을 만났다.', true, 'EASY', 2, NOW(), NOW()),
       (13, 2, '애굽에 내린 재앙은 총 7가지였다.', false, 'NORMAL', 3, NOW(), NOW()),
       (14, 2, '유월절은 어린양의 피를 문설주에 바르는 것에서 시작되었다.', true, 'EASY', 4, NOW(), NOW()),
       (15, 2, '이스라엘 백성은 홍해를 배로 건넜다.', false, 'EASY', 5, NOW(), NOW()),
       (16, 2, '십계명은 시내산에서 주어졌다.', true, 'EASY', 6, NOW(), NOW()),
       (17, 2, '황금 송아지를 만든 것은 아론이었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (18, 2, '만나는 하늘에서 내린 양식이다.', true, 'EASY', 8, NOW(), NOW()),
       (19, 2, '모세는 반석을 두 번 쳐서 물을 냈다.', true, 'HARD', 9, NOW(), NOW()),
       (20, 2, '성막 건축 지시는 출애굽기에 기록되어 있다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 3: 레위기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (21, 3, '레위기는 제사와 율법에 관한 책이다.', true, 'EASY', 1, NOW(), NOW()),
       (22, 3, '번제는 제물 전체를 불에 태우는 제사이다.', true, 'NORMAL', 2, NOW(), NOW()),
       (23, 3, '속죄일은 매년 두 번 지켰다.', false, 'NORMAL', 3, NOW(), NOW()),
       (24, 3, '레위인은 제사장 직분을 담당했다.', true, 'EASY', 4, NOW(), NOW()),
       (25, 3, '희년은 50년마다 돌아온다.', true, 'NORMAL', 5, NOW(), NOW()),
       (26, 3, '레위기에는 음식 정결법이 포함되어 있다.', true, 'EASY', 6, NOW(), NOW()),
       (27, 3, '피는 생명이므로 먹지 말라고 명령하셨다.', true, 'NORMAL', 7, NOW(), NOW()),
       (28, 3, '화목제는 하나님과 화해하는 제사이다.', true, 'NORMAL', 8, NOW(), NOW()),
       (29, 3, '레위기의 저자는 다윗이다.', false, 'EASY', 9, NOW(), NOW()),
       (30, 3, '나병 환자의 정결 의식이 레위기에 기록되어 있다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 4: 민수기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (31, 4, '민수기는 이스라엘 백성의 인구 조사로 시작한다.', true, 'EASY', 1, NOW(), NOW()),
       (32, 4, '이스라엘 백성은 광야에서 40년을 방황했다.', true, 'EASY', 2, NOW(), NOW()),
       (33, 4, '가나안 땅을 정탐한 정탐꾼은 10명이었다.', false, 'NORMAL', 3, NOW(), NOW()),
       (34, 4, '여호수아와 갈렙만이 가나안 땅에 들어갈 수 있었다.', true, 'EASY', 4, NOW(), NOW()),
       (35, 4, '모세는 반석을 한 번 쳐서 물을 냈다.', false, 'HARD', 5, NOW(), NOW()),
       (36, 4, '불뱀에게 물린 백성은 놋뱀을 바라보면 살았다.', true, 'NORMAL', 6, NOW(), NOW()),
       (37, 4, '발람은 이스라엘을 저주하려 했으나 축복하게 되었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (38, 4, '발람의 나귀가 말을 했다.', true, 'EASY', 8, NOW(), NOW()),
       (39, 4, '고라의 반역으로 땅이 갈라져 반역자들을 삼켰다.', true, 'NORMAL', 9, NOW(), NOW()),
       (40, 4, '아론의 지팡이에서 포도가 열렸다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 5: 신명기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (41, 5, '신명기는 "두 번째 율법"이라는 뜻이다.', true, 'NORMAL', 1, NOW(), NOW()),
       (42, 5, '신명기는 모세의 마지막 설교를 담고 있다.', true, 'EASY', 2, NOW(), NOW()),
       (43, 5, '쉐마(Shema)는 신명기 6장에 기록되어 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (44, 5, '모세는 가나안 땅에 들어갔다.', false, 'EASY', 4, NOW(), NOW()),
       (45, 5, '모세는 느보산에서 가나안 땅을 바라보았다.', true, 'EASY', 5, NOW(), NOW()),
       (46, 5, '십계명이 신명기에도 기록되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (47, 5, '모세는 120세에 죽었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (48, 5, '모세의 무덤 위치는 알려져 있다.', false, 'HARD', 8, NOW(), NOW()),
       (49, 5, '신명기에는 축복과 저주에 관한 내용이 있다.', true, 'EASY', 9, NOW(), NOW()),
       (50, 5, '여호수아가 모세의 후계자로 임명되었다.', true, 'EASY', 10, NOW(), NOW());

-- Stage 6: 여호수아 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (51, 6, '여호수아는 모세의 후계자이다.', true, 'EASY', 1, NOW(), NOW()),
       (52, 6, '이스라엘 백성은 요단강을 배로 건넜다.', false, 'EASY', 2, NOW(), NOW()),
       (53, 6, '여리고 성은 이스라엘 백성이 7일 동안 돌았다.', true, 'EASY', 3, NOW(), NOW()),
       (54, 6, '라합은 정탐꾼들을 숨겨주었다.', true, 'EASY', 4, NOW(), NOW()),
       (55, 6, '아간은 여리고에서 금을 훔쳤다.', true, 'NORMAL', 5, NOW(), NOW()),
       (56, 6, '여호수아는 해와 달을 멈추게 했다.', true, 'NORMAL', 6, NOW(), NOW()),
       (57, 6, '가나안 땅은 12지파에게 분배되었다.', true, 'EASY', 7, NOW(), NOW()),
       (58, 6, '여호수아는 110세에 죽었다.', true, 'HARD', 8, NOW(), NOW()),
       (59, 6, '기브온 사람들은 이스라엘을 속여 화친을 맺었다.', true, 'NORMAL', 9, NOW(), NOW()),
       (60, 6, '여호수아서의 마지막 말씀은 "오직 여호와만 섬기라"이다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 7: 사사기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (61, 7, '사사기는 이스라엘에 왕이 없던 시대를 다룬다.', true, 'EASY', 1, NOW(), NOW()),
       (62, 7, '드보라는 이스라엘의 유일한 여자 사사였다.', true, 'NORMAL', 2, NOW(), NOW()),
       (63, 7, '기드온은 300명의 용사로 미디안을 물리쳤다.', true, 'EASY', 3, NOW(), NOW()),
       (64, 7, '삼손의 힘의 비밀은 그의 머리카락에 있었다.', true, 'EASY', 4, NOW(), NOW()),
       (65, 7, '삼손은 블레셋 사람이었다.', false, 'EASY', 5, NOW(), NOW()),
       (66, 7, '입다는 자기 딸을 제물로 바쳤다.', true, 'HARD', 6, NOW(), NOW()),
       (67, 7, '에훗은 왼손잡이 사사였다.', true, 'NORMAL', 7, NOW(), NOW()),
       (68, 7, '삼손은 당나귀 턱뼈로 1000명을 죽였다.', true, 'NORMAL', 8, NOW(), NOW()),
       (69, 7, '들릴라는 삼손의 아내였다.', false, 'NORMAL', 9, NOW(), NOW()),
       (70, 7, '사사기에는 "각자 자기 소견에 옳은 대로 행하였다"는 표현이 나온다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 8: 룻기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (71, 8, '룻은 모압 여인이었다.', true, 'EASY', 1, NOW(), NOW()),
       (72, 8, '나오미는 룻의 시어머니이다.', true, 'EASY', 2, NOW(), NOW()),
       (73, 8, '룻은 나오미와 함께 베들레헴으로 갔다.', true, 'EASY', 3, NOW(), NOW()),
       (74, 8, '보아스는 룻의 기업 무를 자였다.', true, 'NORMAL', 4, NOW(), NOW()),
       (75, 8, '룻은 보리 추수 때 이삭을 주웠다.', true, 'EASY', 5, NOW(), NOW()),
       (76, 8, '오르바는 나오미와 함께 베들레헴으로 갔다.', false, 'NORMAL', 6, NOW(), NOW()),
       (77, 8, '룻과 보아스 사이에서 오벳이 태어났다.', true, 'NORMAL', 7, NOW(), NOW()),
       (78, 8, '오벳은 다윗의 할아버지이다.', true, 'NORMAL', 8, NOW(), NOW()),
       (79, 8, '룻기는 성경에서 가장 짧은 책이다.', false, 'HARD', 9, NOW(), NOW()),
       (80, 8, '룻은 예수님의 족보에 포함되어 있다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 9: 사무엘상 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (81, 9, '사무엘은 한나의 아들이다.', true, 'EASY', 1, NOW(), NOW()),
       (82, 9, '사무엘은 성전에서 엘리 제사장에게 맡겨졌다.', true, 'EASY', 2, NOW(), NOW()),
       (83, 9, '사울은 이스라엘의 첫 번째 왕이다.', true, 'EASY', 3, NOW(), NOW()),
       (84, 9, '다윗은 골리앗을 칼로 죽였다.', false, 'EASY', 4, NOW(), NOW()),
       (85, 9, '골리앗은 블레셋의 거인 용사였다.', true, 'EASY', 5, NOW(), NOW()),
       (86, 9, '요나단은 사울의 아들이며 다윗의 친구였다.', true, 'NORMAL', 6, NOW(), NOW()),
       (87, 9, '다윗은 사울을 피해 도망 다녔다.', true, 'EASY', 7, NOW(), NOW()),
       (88, 9, '사울은 엔돌의 점쟁이를 찾아갔다.', true, 'HARD', 8, NOW(), NOW()),
       (89, 9, '다윗은 사울을 두 번 죽일 기회가 있었지만 죽이지 않았다.', true, 'NORMAL', 9, NOW(), NOW()),
       (90, 9, '사울과 요나단은 블레셋과의 전투에서 죽었다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 10: 사무엘하 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (91, 10, '다윗은 예루살렘을 정복하여 수도로 삼았다.', true, 'EASY', 1, NOW(), NOW()),
       (92, 10, '다윗은 언약궤를 예루살렘으로 옮겼다.', true, 'EASY', 2, NOW(), NOW()),
       (93, 10, '다윗은 밧세바의 남편 우리아를 전쟁터에서 죽게 했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (94, 10, '나단 선지자가 다윗의 죄를 책망했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (95, 10, '압살롬은 다윗의 아들로 반역을 일으켰다.', true, 'EASY', 5, NOW(), NOW()),
       (96, 10, '압살롬은 머리카락이 나무에 걸려 죽었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (97, 10, '다윗은 인구 조사를 하여 하나님께 벌을 받았다.', true, 'NORMAL', 7, NOW(), NOW()),
       (98, 10, '므비보셋은 요나단의 아들로 다윗의 은혜를 받았다.', true, 'HARD', 8, NOW(), NOW()),
       (99, 10, '다윗은 성전을 건축했다.', false, 'EASY', 9, NOW(), NOW()),
       (100, 10, '다윗은 이스라엘의 두 번째 왕이다.', true, 'EASY', 10, NOW(), NOW());

-- Stage 11: 열왕기상 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (101, 11, '솔로몬은 다윗의 아들이다.', true, 'EASY', 1, NOW(), NOW()),
       (102, 11, '솔로몬은 하나님께 지혜를 구했다.', true, 'EASY', 2, NOW(), NOW()),
       (103, 11, '솔로몬은 예루살렘 성전을 건축했다.', true, 'EASY', 3, NOW(), NOW()),
       (104, 11, '스바 여왕이 솔로몬의 지혜를 시험하러 왔다.', true, 'NORMAL', 4, NOW(), NOW()),
       (105, 11, '솔로몬은 700명의 왕비와 300명의 후궁이 있었다.', true, 'HARD', 5, NOW(), NOW()),
       (106, 11, '솔로몬 이후 이스라엘 왕국은 남북으로 분열되었다.', true, 'EASY', 6, NOW(), NOW()),
       (107, 11, '엘리야는 바알 선지자들과 갈멜산에서 대결했다.', true, 'NORMAL', 7, NOW(), NOW()),
       (108, 11, '엘리야는 까마귀에게 음식을 공급받았다.', true, 'NORMAL', 8, NOW(), NOW()),
       (109, 11, '아합은 북이스라엘의 악한 왕이었다.', true, 'NORMAL', 9, NOW(), NOW()),
       (110, 11, '이세벨은 아합의 아내로 바알 숭배를 퍼뜨렸다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 12: 열왕기하 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (111, 12, '엘리야는 불 수레를 타고 하늘로 올라갔다.', true, 'EASY', 1, NOW(), NOW()),
       (112, 12, '엘리사는 엘리야의 제자이다.', true, 'EASY', 2, NOW(), NOW()),
       (113, 12, '엘리사는 엘리야의 갑절의 영감을 구했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (114, 12, '나아만 장군은 요단강에서 일곱 번 씻어 나병이 나았다.', true, 'EASY', 4, NOW(), NOW()),
       (115, 12, '북이스라엘은 앗수르에 의해 멸망했다.', true, 'NORMAL', 5, NOW(), NOW()),
       (116, 12, '남유다는 바벨론에 의해 멸망했다.', true, 'NORMAL', 6, NOW(), NOW()),
       (117, 12, '히스기야는 유다의 선한 왕이었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (118, 12, '요시야 왕 때 율법책이 발견되었다.', true, 'NORMAL', 8, NOW(), NOW()),
       (119, 12, '예루살렘 성전은 바벨론에 의해 파괴되었다.', true, 'EASY', 9, NOW(), NOW()),
       (120, 12, '엘리사가 죽은 후 그의 뼈에 닿은 시체가 살아났다.', true, 'HARD', 10, NOW(), NOW());

-- Stage 13: 역대상 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (121, 13, '역대상은 아담의 족보로 시작한다.', true, 'NORMAL', 1, NOW(), NOW()),
       (122, 13, '역대상은 주로 다윗 왕의 이야기를 다룬다.', true, 'EASY', 2, NOW(), NOW()),
       (123, 13, '다윗은 성전 건축을 위한 재료를 준비했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (124, 13, '웃사는 언약궤에 손을 대어 죽었다.', true, 'HARD', 4, NOW(), NOW()),
       (125, 13, '역대상에는 레위인의 직무가 상세히 기록되어 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (126, 13, '다윗은 하나님께 성전 건축 허락을 받았다.', false, 'NORMAL', 6, NOW(), NOW()),
       (127, 13, '역대상의 저자는 에스라로 추정된다.', true, 'HARD', 7, NOW(), NOW()),
       (128, 13, '다윗은 인구 조사를 사탄의 충동으로 시행했다.', true, 'HARD', 8, NOW(), NOW()),
       (129, 13, '역대상은 사무엘서와 같은 시대를 다룬다.', true, 'NORMAL', 9, NOW(), NOW()),
       (130, 13, '다윗은 솔로몬에게 성전 건축 설계도를 전해주었다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 14: 역대하 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (131, 14, '솔로몬은 역대하에서 성전을 완공했다.', true, 'EASY', 1, NOW(), NOW()),
       (132, 14, '솔로몬의 성전 봉헌 기도는 역대하에 기록되어 있다.', true, 'NORMAL', 2, NOW(), NOW()),
       (133, 14, '르호보암 때 왕국이 남북으로 분열되었다.', true, 'EASY', 3, NOW(), NOW()),
       (134, 14, '아사 왕은 유다의 선한 왕이었다.', true, 'NORMAL', 4, NOW(), NOW()),
       (135, 14, '여호사밧은 찬양대를 앞세워 전쟁에서 승리했다.', true, 'NORMAL', 5, NOW(), NOW()),
       (136, 14, '웃시야 왕은 교만하여 나병에 걸렸다.', true, 'HARD', 6, NOW(), NOW()),
       (137, 14, '히스기야는 앗수르의 침략을 물리쳤다.', true, 'NORMAL', 7, NOW(), NOW()),
       (138, 14, '므낫세는 유다에서 가장 악한 왕이었다.', true, 'NORMAL', 8, NOW(), NOW()),
       (139, 14, '역대하는 바벨론 포로 귀환 명령으로 끝난다.', true, 'HARD', 9, NOW(), NOW()),
       (140, 14, '역대하는 북이스라엘 왕들의 역사를 주로 다룬다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 15: 에스라 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (141, 15, '에스라는 바벨론 포로 귀환 후의 이야기를 다룬다.', true, 'EASY', 1, NOW(), NOW()),
       (142, 15, '고레스 왕이 유대인의 귀환을 허락했다.', true, 'EASY', 2, NOW(), NOW()),
       (143, 15, '스룹바벨이 첫 번째 귀환을 이끌었다.', true, 'NORMAL', 3, NOW(), NOW()),
       (144, 15, '귀환한 유대인들은 성전을 재건했다.', true, 'EASY', 4, NOW(), NOW()),
       (145, 15, '에스라는 제사장이자 율법학자였다.', true, 'NORMAL', 5, NOW(), NOW()),
       (146, 15, '에스라는 두 번째 귀환을 이끌었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (147, 15, '에스라는 이방 여인과의 결혼 문제를 다루었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (148, 15, '성전 재건은 방해 없이 순조롭게 진행되었다.', false, 'NORMAL', 8, NOW(), NOW()),
       (149, 15, '학개와 스가랴가 성전 재건을 격려했다.', true, 'HARD', 9, NOW(), NOW()),
       (150, 15, '에스라는 모세의 율법을 백성에게 읽어주었다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 16: 느헤미야 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (151, 16, '느헤미야는 페르시아 왕의 술 관원이었다.', true, 'NORMAL', 1, NOW(), NOW()),
       (152, 16, '느헤미야는 예루살렘 성벽을 재건했다.', true, 'EASY', 2, NOW(), NOW()),
       (153, 16, '예루살렘 성벽은 52일 만에 완공되었다.', true, 'NORMAL', 3, NOW(), NOW()),
       (154, 16, '산발랏과 도비야가 성벽 재건을 방해했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (155, 16, '느헤미야는 백성들이 한 손에 무기를 들고 일하게 했다.', true, 'NORMAL', 5, NOW(), NOW()),
       (156, 16, '느헤미야는 유다 총독으로 임명되었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (157, 16, '느헤미야는 가난한 백성들의 빚을 탕감하게 했다.', true, 'NORMAL', 7, NOW(), NOW()),
       (158, 16, '에스라가 수문 앞에서 율법을 읽었다.', true, 'HARD', 8, NOW(), NOW()),
       (159, 16, '느헤미야는 안식일 상거래를 금지했다.', true, 'NORMAL', 9, NOW(), NOW()),
       (160, 16, '느헤미야서에는 하나님이라는 단어가 등장하지 않는다.', false, 'HARD', 10, NOW(), NOW());

-- Stage 17: 에스더 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (161, 17, '에스더는 페르시아의 왕비가 되었다.', true, 'EASY', 1, NOW(), NOW()),
       (162, 17, '에스더는 유대인이었다.', true, 'EASY', 2, NOW(), NOW()),
       (163, 17, '모르드개는 에스더의 삼촌이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (164, 17, '하만은 유대인을 멸망시키려는 음모를 꾸몄다.', true, 'EASY', 4, NOW(), NOW()),
       (165, 17, '에스더는 왕의 부름 없이 왕 앞에 나아갔다.', true, 'NORMAL', 5, NOW(), NOW()),
       (166, 17, '하만은 모르드개를 매달려고 만든 장대에 자신이 매달렸다.', true, 'NORMAL', 6, NOW(), NOW()),
       (167, 17, '부림절은 에스더서의 사건을 기념하는 절기이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (168, 17, '아하수에로 왕은 바벨론의 왕이었다.', false, 'NORMAL', 8, NOW(), NOW()),
       (169, 17, '에스더서에는 하나님이라는 단어가 등장하지 않는다.', true, 'HARD', 9, NOW(), NOW()),
       (170, 17, '와스디 왕비가 폐위된 후 에스더가 왕비가 되었다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 18: 욥기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (171, 18, '욥은 우스 땅에 살았다.', true, 'NORMAL', 1, NOW(), NOW()),
       (172, 18, '하나님은 사탄에게 욥을 시험하도록 허락하셨다.', true, 'EASY', 2, NOW(), NOW()),
       (173, 18, '욥은 자녀 10명을 모두 잃었다.', true, 'NORMAL', 3, NOW(), NOW()),
       (174, 18, '욥의 세 친구는 엘리바스, 빌닷, 소발이다.', true, 'HARD', 4, NOW(), NOW()),
       (175, 18, '욥의 친구들은 욥이 죄를 지었기 때문에 고난을 받는다고 주장했다.', true, 'NORMAL', 5, NOW(), NOW()),
       (176, 18, '욥은 고난 중에 하나님을 저주했다.', false, 'EASY', 6, NOW(), NOW()),
       (177, 18, '엘리후는 욥의 네 번째 친구로 가장 젊었다.', true, 'HARD', 7, NOW(), NOW()),
       (178, 18, '하나님은 폭풍 가운데서 욥에게 말씀하셨다.', true, 'NORMAL', 8, NOW(), NOW()),
       (179, 18, '욥은 회복 후 이전보다 두 배의 재산을 받았다.', true, 'NORMAL', 9, NOW(), NOW()),
       (180, 18, '욥기는 지혜문학에 속한다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 19: 시편 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (181, 19, '시편은 150편으로 구성되어 있다.', true, 'EASY', 1, NOW(), NOW()),
       (182, 19, '시편의 대부분은 다윗이 기록했다.', true, 'EASY', 2, NOW(), NOW()),
       (183, 19, '시편 23편은 "여호와는 나의 목자시니"로 시작한다.', true, 'EASY', 3, NOW(), NOW()),
       (184, 19, '시편은 성경에서 가장 긴 책이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (185, 19, '시편 119편은 성경에서 가장 긴 장이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (186, 19, '시편 117편은 성경에서 가장 짧은 장이다.', true, 'HARD', 6, NOW(), NOW()),
       (187, 19, '시편은 5권으로 나뉘어져 있다.', true, 'HARD', 7, NOW(), NOW()),
       (188, 19, '시편 51편은 다윗이 밧세바 사건 후 회개하며 쓴 시이다.', true, 'NORMAL', 8, NOW(), NOW()),
       (189, 19, '시편에는 메시아 예언이 포함되어 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (190, 19, '시편은 모두 다윗이 기록했다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 20: 잠언 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (191, 20, '잠언의 대부분은 솔로몬이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (192, 20, '잠언은 지혜문학에 속한다.', true, 'EASY', 2, NOW(), NOW()),
       (193, 20, '"여호와를 경외하는 것이 지식의 근본이니라"는 잠언의 말씀이다.', true, 'EASY', 3, NOW(), NOW()),
       (194, 20, '잠언 31장은 현숙한 여인에 대해 기록하고 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (195, 20, '잠언에는 아굴과 르무엘의 말씀도 포함되어 있다.', true, 'HARD', 5, NOW(), NOW()),
       (196, 20, '잠언은 일상생활의 실천적 지혜를 다룬다.', true, 'EASY', 6, NOW(), NOW()),
       (197, 20, '"네 마음을 다하여 여호와를 신뢰하라"는 잠언의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (198, 20, '잠언에서 지혜는 여성으로 의인화되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (199, 20, '잠언은 31장으로 구성되어 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (200, 20, '잠언은 모두 솔로몬이 기록했다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 21: 전도서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (201, 21, '전도서의 저자는 솔로몬으로 추정된다.', true, 'EASY', 1, NOW(), NOW()),
       (202, 21, '"헛되고 헛되며 헛되고 헛되니 모든 것이 헛되도다"는 전도서의 말씀이다.', true, 'EASY', 2, NOW(), NOW()),
       (203, 21, '전도서는 인생의 의미를 탐구하는 책이다.', true, 'EASY', 3, NOW(), NOW()),
       (204, 21, '"해 아래 새 것이 없나니"는 전도서의 말씀이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (205, 21, '전도서는 12장으로 구성되어 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (206, 21, '"범사에 기한이 있고 천하 만사가 다 때가 있나니"는 전도서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (207, 21, '전도서의 결론은 "하나님을 경외하고 그의 명령들을 지키라"이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (208, 21, '전도서는 지혜문학에 속한다.', true, 'EASY', 8, NOW(), NOW()),
       (209, 21, '"청년의 때에 창조주를 기억하라"는 전도서의 말씀이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (210, 21, '전도서는 낙관적인 인생관을 주로 표현한다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 22: 아가 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (211, 22, '아가는 솔로몬의 아가라고도 불린다.', true, 'EASY', 1, NOW(), NOW()),
       (212, 22, '아가는 사랑의 노래를 담은 책이다.', true, 'EASY', 2, NOW(), NOW()),
       (213, 22, '아가는 8장으로 구성되어 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (214, 22, '아가는 신랑과 신부의 대화 형식으로 되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (215, 22, '아가는 하나님과 이스라엘(또는 그리스도와 교회)의 관계를 상징한다고 해석된다.', true, 'NORMAL', 5, NOW(), NOW()),
       (216, 22, '아가는 구약성경의 지혜문학에 속한다.', true, 'NORMAL', 6, NOW(), NOW()),
       (217, 22, '"사랑은 죽음같이 강하고"는 아가의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (218, 22, '아가는 유월절에 읽는 두루마리 중 하나이다.', true, 'HARD', 8, NOW(), NOW()),
       (219, 22, '아가에는 하나님의 이름이 직접 언급된다.', false, 'HARD', 9, NOW(), NOW()),
       (220, 22, '아가는 성경에서 가장 짧은 책이다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 23: 이사야 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (221, 23, '이사야는 대선지서에 속한다.', true, 'EASY', 1, NOW(), NOW()),
       (222, 23, '이사야는 66장으로 구성되어 있다.', true, 'NORMAL', 2, NOW(), NOW()),
       (223, 23, '이사야 53장은 고난받는 종에 대한 예언이다.', true, 'EASY', 3, NOW(), NOW()),
       (224, 23, '"보라 처녀가 잉태하여 아들을 낳을 것이요"는 이사야의 예언이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (225, 23, '이사야는 웃시야 왕이 죽던 해에 소명을 받았다.', true, 'NORMAL', 5, NOW(), NOW()),
       (226, 23, '이사야는 "거룩하다 거룩하다 거룩하다 만군의 여호와여"라는 천사의 찬양을 들었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (227, 23, '"임마누엘"이라는 이름은 이사야서에 처음 등장한다.', true, 'HARD', 7, NOW(), NOW()),
       (228, 23, '이사야 40장부터는 위로의 메시지가 주를 이룬다.', true, 'NORMAL', 8, NOW(), NOW()),
       (229, 23, '이사야는 북이스라엘의 선지자였다.', false, 'NORMAL', 9, NOW(), NOW()),
       (230, 23, '이사야는 메시아에 대한 예언이 가장 많은 선지서이다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 24: 예레미야 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (231, 24, '예레미야는 "눈물의 선지자"로 불린다.', true, 'EASY', 1, NOW(), NOW()),
       (232, 24, '예레미야는 대선지서에 속한다.', true, 'EASY', 2, NOW(), NOW()),
       (233, 24, '예레미야는 요시야 왕 때부터 사역을 시작했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (234, 24, '예레미야는 바룩에게 자신의 예언을 기록하게 했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (235, 24, '예레미야는 결혼하지 말라는 명령을 받았다.', true, 'HARD', 5, NOW(), NOW()),
       (236, 24, '예레미야는 바벨론에 항복하라고 선포했다.', true, 'NORMAL', 6, NOW(), NOW()),
       (237, 24, '예레미야는 옥에 갇히고 구덩이에 던져지는 고난을 당했다.', true, 'NORMAL', 7, NOW(), NOW()),
       (238, 24, '"새 언약"에 대한 예언이 예레미야서에 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (239, 24, '예레미야는 예루살렘 멸망 후 애굽으로 끌려갔다.', true, 'HARD', 9, NOW(), NOW()),
       (240, 24, '예레미야는 북이스라엘의 선지자였다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 25: 예레미야애가 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (241, 25, '예레미야애가는 예루살렘의 멸망을 애도하는 책이다.', true, 'EASY', 1, NOW(), NOW()),
       (242, 25, '예레미야애가의 저자는 예레미야로 추정된다.', true, 'EASY', 2, NOW(), NOW()),
       (243, 25, '예레미야애가는 5장으로 구성되어 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (244, 25, '예레미야애가는 히브리어 알파벳 순서의 애가 형식(아크로스틱)을 따른다.', true, 'HARD', 4, NOW(), NOW()),
       (245, 25, '"여호와의 인자와 긍휼이 무궁하시도다"는 예레미야애가의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (246, 25, '예레미야애가는 바벨론 포로기에 기록되었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (247, 25, '예레미야애가는 유대인들이 아브월 9일에 읽는다.', true, 'HARD', 7, NOW(), NOW()),
       (248, 25, '"주의 인자하심이 아침마다 새로우니"는 예레미야애가의 말씀이다.', true, 'NORMAL', 8, NOW(), NOW()),
       (249, 25, '예레미야애가는 희망의 메시지 없이 끝난다.', false, 'NORMAL', 9, NOW(), NOW()),
       (250, 25, '예레미야애가는 대선지서에 속한다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 26: 에스겔 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (251, 26, '에스겔은 제사장이자 선지자였다.', true, 'EASY', 1, NOW(), NOW()),
       (252, 26, '에스겔은 바벨론 포로기에 활동했다.', true, 'EASY', 2, NOW(), NOW()),
       (253, 26, '에스겔은 그발강 가에서 하나님의 환상을 보았다.', true, 'NORMAL', 3, NOW(), NOW()),
       (254, 26, '에스겔서에는 네 생물의 환상이 기록되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (255, 26, '마른 뼈들이 살아나는 환상은 에스겔서에 있다.', true, 'EASY', 5, NOW(), NOW()),
       (256, 26, '에스겔은 이스라엘의 파수꾼으로 임명되었다.', true, 'NORMAL', 6, NOW(), NOW()),
       (257, 26, '에스겔서에는 새 성전에 대한 환상이 기록되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (258, 26, '에스겔은 아내의 죽음에 대해 애곡하지 말라는 명령을 받았다.', true, 'HARD', 8, NOW(), NOW()),
       (259, 26, '에스겔서의 곡과 마곡 전쟁 예언은 종말론적 전쟁을 다룬다.', true, 'HARD', 9, NOW(), NOW()),
       (260, 26, '에스겔은 예루살렘에서 사역했다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 27: 다니엘 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (261, 27, '다니엘은 바벨론에 포로로 잡혀갔다.', true, 'EASY', 1, NOW(), NOW()),
       (262, 27, '다니엘은 느부갓네살 왕의 꿈을 해석했다.', true, 'EASY', 2, NOW(), NOW()),
       (263, 27, '사드락, 메삭, 아벳느고는 풀무불에서 살아남았다.', true, 'EASY', 3, NOW(), NOW()),
       (264, 27, '다니엘은 사자굴에 던져졌으나 해를 입지 않았다.', true, 'EASY', 4, NOW(), NOW()),
       (265, 27, '벨사살 왕 때 궁전 벽에 손가락이 나타나 글씨를 썼다.', true, 'NORMAL', 5, NOW(), NOW()),
       (266, 27, '"메네 메네 데겔 우바르신"은 다니엘이 해석한 벽의 글씨이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (267, 27, '다니엘서에는 70이레 예언이 기록되어 있다.', true, 'HARD', 7, NOW(), NOW()),
       (268, 27, '다니엘은 하루에 세 번 예루살렘을 향해 기도했다.', true, 'NORMAL', 8, NOW(), NOW()),
       (269, 27, '다니엘서는 소선지서에 속한다.', false, 'NORMAL', 9, NOW(), NOW()),
       (270, 27, '느부갓네살 왕의 금 신상을 세 친구가 절하지 않아 풀무불에 던져졌다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 28: 호세아 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (271, 28, '호세아는 음란한 여인 고멜과 결혼하라는 명령을 받았다.', true, 'NORMAL', 1, NOW(), NOW()),
       (272, 28, '호세아는 북이스라엘에서 활동한 선지자이다.', true, 'NORMAL', 2, NOW(), NOW()),
       (273, 28, '호세아의 자녀 이름에는 하나님의 심판 메시지가 담겨 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (274, 28, '로루하마는 "긍휼히 여김을 받지 못함"이라는 뜻이다.', true, 'HARD', 4, NOW(), NOW()),
       (275, 28, '로암미는 "내 백성"이라는 뜻이다.', false, 'HARD', 5, NOW(), NOW()),
       (276, 28, '호세아서는 이스라엘의 불신앙을 간음에 비유한다.', true, 'NORMAL', 6, NOW(), NOW()),
       (277, 28, '호세아는 여로보암 2세 때 활동했다.', true, 'HARD', 7, NOW(), NOW()),
       (278, 28, '호세아서에는 "내가 긍휼이 없는 자를 긍휼히 여기리라"는 말씀이 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (279, 28, '호세아서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (280, 28, '호세아는 남유다의 선지자였다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 29: 요엘 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (281, 29, '요엘서에는 메뚜기 재앙에 대한 묘사가 있다.', true, 'EASY', 1, NOW(), NOW()),
       (282, 29, '요엘서에는 성령을 부어주시겠다는 예언이 있다.', true, 'NORMAL', 2, NOW(), NOW()),
       (283, 29, '"너희 아들과 딸들은 예언할 것이요"는 요엘서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (284, 29, '베드로는 오순절에 요엘서를 인용했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (285, 29, '요엘서는 "여호와의 날"에 대해 예언한다.', true, 'NORMAL', 5, NOW(), NOW()),
       (286, 29, '요엘서는 회개를 촉구하는 메시지를 담고 있다.', true, 'EASY', 6, NOW(), NOW()),
       (287, 29, '"옷을 찢지 말고 마음을 찢으라"는 요엘서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (288, 29, '요엘서는 3장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (289, 29, '요엘서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (290, 29, '요엘서에는 메뚜기 재앙이 실제로 일어나지 않았다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 30: 아모스 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (291, 30, '아모스는 드고아의 목자였다.', true, 'NORMAL', 1, NOW(), NOW()),
       (292, 30, '아모스는 북이스라엘에 심판을 선포했다.', true, 'EASY', 2, NOW(), NOW()),
       (293, 30, '"공법을 물 같이, 정의를 하수같이 흐르게 하라"는 아모스의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (294, 30, '아모스는 사회 정의를 강조한 선지자이다.', true, 'EASY', 4, NOW(), NOW()),
       (295, 30, '아모스는 전문적인 선지자 학교 출신이었다.', false, 'NORMAL', 5, NOW(), NOW()),
       (296, 30, '아모스서에는 다윗의 무너진 장막을 다시 세우리라는 예언이 있다.', true, 'HARD', 6, NOW(), NOW()),
       (297, 30, '아모스는 여로보암 2세 때 활동했다.', true, 'HARD', 7, NOW(), NOW()),
       (298, 30, '아모스는 가난한 자를 착취하는 것을 책망했다.', true, 'NORMAL', 8, NOW(), NOW()),
       (299, 30, '아모스서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (300, 30, '아모스는 남유다 출신이지만 북이스라엘에서 사역했다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 31: 오바댜 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (301, 31, '오바댜서는 성경에서 가장 짧은 책이다.', true, 'EASY', 1, NOW(), NOW()),
       (302, 31, '오바댜서는 에돔에 대한 심판을 예언한다.', true, 'EASY', 2, NOW(), NOW()),
       (303, 31, '에돔은 에서의 후손이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (304, 31, '오바댜서는 21절로 구성되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (305, 31, '에돔은 이스라엘의 환난을 기뻐하며 방관했다.', true, 'NORMAL', 5, NOW(), NOW()),
       (306, 31, '오바댜서에는 "여호와의 날이 가까웠다"는 선언이 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (307, 31, '에돔의 수도는 셀라(바위)였다.', true, 'HARD', 7, NOW(), NOW()),
       (308, 31, '오바댜서는 소선지서에 속한다.', true, 'EASY', 8, NOW(), NOW()),
       (309, 31, '에돔은 야곱의 형제 나라이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (310, 31, '오바댜서는 에돔의 회복을 예언한다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 32: 요나 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (311, 32, '요나는 니느웨로 가라는 명령을 받았다.', true, 'EASY', 1, NOW(), NOW()),
       (312, 32, '요나는 하나님의 명령을 피해 다시스로 도망쳤다.', true, 'EASY', 2, NOW(), NOW()),
       (313, 32, '요나는 큰 물고기 뱃속에서 3일 3야를 지냈다.', true, 'EASY', 3, NOW(), NOW()),
       (314, 32, '니느웨 사람들은 요나의 설교를 듣고 회개했다.', true, 'EASY', 4, NOW(), NOW()),
       (315, 32, '요나는 니느웨의 회개를 기뻐했다.', false, 'NORMAL', 5, NOW(), NOW()),
       (316, 32, '하나님은 박넝쿨로 요나에게 교훈을 주셨다.', true, 'NORMAL', 6, NOW(), NOW()),
       (317, 32, '니느웨는 앗수르의 수도였다.', true, 'NORMAL', 7, NOW(), NOW()),
       (318, 32, '요나서는 4장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (319, 32, '요나서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (320, 32, '예수님은 요나를 자신의 부활의 표적으로 말씀하셨다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 33: 미가 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (321, 33, '미가서에는 베들레헴에서 메시아가 나리라는 예언이 있다.', true, 'EASY', 1, NOW(), NOW()),
       (322, 33, '미가는 남유다의 선지자였다.', true, 'NORMAL', 2, NOW(), NOW()),
       (323, 33, '"여호와께서 네게 구하시는 것은 오직 정의를 행하며 인자를 사랑하며 겸손히 네 하나님과 함께 행하는 것이니라"는 미가서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (324, 33, '미가는 사회 정의를 강조했다.', true, 'EASY', 4, NOW(), NOW()),
       (325, 33, '미가는 이사야와 동시대 선지자였다.', true, 'NORMAL', 5, NOW(), NOW()),
       (326, 33, '미가서에는 칼을 쳐서 보습을 만들리라는 평화의 비전이 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (327, 33, '미가는 모레셋 출신이다.', true, 'HARD', 7, NOW(), NOW()),
       (328, 33, '미가서는 7장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (329, 33, '미가서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (330, 33, '미가서의 베들레헴 예언은 예수님의 탄생지와 관련된다.', true, 'EASY', 10, NOW(), NOW());

-- Stage 34: 나훔 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (331, 34, '나훔서는 니느웨의 멸망을 예언한다.', true, 'EASY', 1, NOW(), NOW()),
       (332, 34, '나훔은 요나 이후 약 150년 후에 활동했다.', true, 'HARD', 2, NOW(), NOW()),
       (333, 34, '나훔서는 앗수르에 대한 심판을 선포한다.', true, 'NORMAL', 3, NOW(), NOW()),
       (334, 34, '니느웨는 요나의 설교로 회개했지만 후에 다시 악해졌다.', true, 'NORMAL', 4, NOW(), NOW()),
       (335, 34, '나훔은 엘고스 사람이었다.', true, 'HARD', 5, NOW(), NOW()),
       (336, 34, '"여호와는 노하기를 더디 하시나 큰 권능이 있으시다"는 나훔서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (337, 34, '나훔서는 3장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (338, 34, '니느웨는 BC 612년에 멸망했다.', true, 'HARD', 8, NOW(), NOW()),
       (339, 34, '나훔서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (340, 34, '나훔서는 니느웨의 회복을 예언한다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 35: 하박국 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (341, 35, '"오직 의인은 그의 믿음으로 살리라"는 하박국서의 말씀이다.', true, 'EASY', 1, NOW(), NOW()),
       (342, 35, '하박국은 하나님께 질문하고 대답을 기다린 선지자이다.', true, 'NORMAL', 2, NOW(), NOW()),
       (343, 35, '하박국서에서 하나님은 바벨론(갈대아)을 심판의 도구로 사용하신다고 말씀하셨다.', true, 'NORMAL', 3, NOW(), NOW()),
       (344, 35, '하박국은 악인이 번성하는 것에 대해 하나님께 질문했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (345, 35, '하박국서 3장은 하박국의 기도이자 찬양이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (346, 35, '"비록 무화과나무가 무성하지 못하더라도 여호와로 말미암아 즐거워하리라"는 하박국서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (347, 35, '로마서와 갈라디아서에서 하박국서가 인용된다.', true, 'HARD', 7, NOW(), NOW()),
       (348, 35, '하박국서는 3장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (349, 35, '하박국서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (350, 35, '하박국은 바벨론의 심판을 받아들이지 않았다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 36: 스바냐 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (351, 36, '스바냐는 요시야 왕 때 활동했다.', true, 'NORMAL', 1, NOW(), NOW()),
       (352, 36, '스바냐서는 "여호와의 날"에 대한 심판을 예언한다.', true, 'EASY', 2, NOW(), NOW()),
       (353, 36, '스바냐는 히스기야 왕의 후손이다.', true, 'HARD', 3, NOW(), NOW()),
       (354, 36, '스바냐서에는 "남은 자"에 대한 소망의 메시지가 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (355, 36, '"여호와 너의 하나님이 너의 가운데에 계시니 그는 구원을 베푸실 전능자이시라"는 스바냐서의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (356, 36, '스바냐서는 유다와 주변 민족들의 심판을 예언한다.', true, 'NORMAL', 6, NOW(), NOW()),
       (357, 36, '"여호와의 날이 가깝도다"는 스바냐서의 핵심 주제이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (358, 36, '스바냐서는 3장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (359, 36, '스바냐서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (360, 36, '스바냐는 북이스라엘의 선지자였다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 37: 학개 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (361, 37, '학개는 바벨론 포로 귀환 후 성전 재건을 촉구했다.', true, 'EASY', 1, NOW(), NOW()),
       (362, 37, '학개는 스룹바벨과 여호수아 대제사장 시대에 활동했다.', true, 'NORMAL', 2, NOW(), NOW()),
       (363, 37, '학개서에서 백성들은 자기 집만 짓고 하나님의 성전은 황폐한 채로 두었다.', true, 'NORMAL', 3, NOW(), NOW()),
       (364, 37, '"이 전의 나중 영광이 이전 영광보다 크리라"는 학개서의 말씀이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (365, 37, '학개는 스가랴와 동시대 선지자였다.', true, 'NORMAL', 5, NOW(), NOW()),
       (366, 37, '학개서는 성전 재건에 대한 네 개의 메시지를 담고 있다.', true, 'HARD', 6, NOW(), NOW()),
       (367, 37, '학개서는 2장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (368, 37, '학개는 다리오 왕 2년에 예언했다.', true, 'HARD', 8, NOW(), NOW()),
       (369, 37, '학개서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (370, 37, '학개는 성전 재건을 반대했다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 38: 스가랴 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (371, 38, '스가랴서에는 8개의 밤 환상이 기록되어 있다.', true, 'HARD', 1, NOW(), NOW()),
       (372, 38, '스가랴는 성전 재건을 격려한 선지자이다.', true, 'EASY', 2, NOW(), NOW()),
       (373, 38, '스가랴서에는 나귀를 타고 오시는 왕에 대한 예언이 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (374, 38, '"은 30에 팔리리라"는 예언이 스가랴서에 있다.', true, 'HARD', 4, NOW(), NOW()),
       (375, 38, '스가랴는 학개와 동시대 선지자였다.', true, 'NORMAL', 5, NOW(), NOW()),
       (376, 38, '스가랴서에는 메시아에 대한 예언이 많이 포함되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (377, 38, '"만군의 여호와가 말하노라 힘으로 되지 아니하며 능으로 되지 아니하고 오직 나의 영으로 되느니라"는 스가랴서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (378, 38, '스가랴서는 14장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (379, 38, '스가랴서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (380, 38, '스가랴서에는 예루살렘에 대한 종말론적 예언이 없다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 39: 말라기 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (381, 39, '말라기서는 구약성경의 마지막 책이다.', true, 'EASY', 1, NOW(), NOW()),
       (382, 39, '말라기서에는 십일조에 대한 말씀이 있다.', true, 'EASY', 2, NOW(), NOW()),
       (383, 39, '"온전한 십일조를 창고에 들여 나의 집에 양식이 있게 하라"는 말라기서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (384, 39, '말라기서에는 엘리야가 다시 오리라는 예언이 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (385, 39, '말라기는 "나의 사자"라는 뜻이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (386, 39, '말라기서는 하나님과 백성 사이의 대화 형식으로 되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (387, 39, '"해 돋는 곳에서부터 해 지는 곳까지 내 이름이 이방 민족 중에서 크리라"는 말라기서의 말씀이다.', true, 'HARD', 7, NOW(), NOW()),
       (388, 39, '말라기서는 4장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (389, 39, '말라기서는 소선지서에 속한다.', true, 'EASY', 9, NOW(), NOW()),
       (390, 39, '말라기 이후 신약까지 약 400년의 침묵 기간이 있었다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 40: 마태복음 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (391, 40, '예수님은 베들레헴에서 태어나셨다.', true, 'EASY', 1, NOW(), NOW()),
       (392, 40, '동방박사는 12명이었다.', false, 'NORMAL', 2, NOW(), NOW()),
       (393, 40, '예수님은 요단강에서 세례 요한에게 세례를 받으셨다.', true, 'EASY', 3, NOW(), NOW()),
       (394, 40, '산상수훈은 마태복음에 기록되어 있다.', true, 'EASY', 4, NOW(), NOW()),
       (395, 40, '예수님의 열두 제자 중 첫 번째로 부르신 사람은 베드로이다.', false, 'HARD', 5, NOW(), NOW()),
       (396, 40, '오병이어 기적에서 남은 조각은 12바구니였다.', true, 'NORMAL', 6, NOW(), NOW()),
       (397, 40, '예수님을 배반한 제자는 가룟 유다이다.', true, 'EASY', 7, NOW(), NOW()),
       (398, 40, '예수님은 십자가에서 3시간 동안 달려 계셨다.', false, 'HARD', 8, NOW(), NOW()),
       (399, 40, '예수님은 부활 후 40일 동안 지상에 계셨다.', true, 'NORMAL', 9, NOW(), NOW()),
       (400, 40, '대위임령은 마태복음의 마지막 장에 기록되어 있다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 41: 마가복음 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (401, 41, '마가복음은 네 복음서 중 가장 짧다.', true, 'EASY', 1, NOW(), NOW()),
       (402, 41, '마가복음은 예수님의 탄생 이야기로 시작한다.', false, 'NORMAL', 2, NOW(), NOW()),
       (403, 41, '마가복음에는 "즉시"라는 단어가 자주 등장한다.', true, 'NORMAL', 3, NOW(), NOW()),
       (404, 41, '마가복음은 세례 요한의 사역으로 시작한다.', true, 'NORMAL', 4, NOW(), NOW()),
       (405, 41, '마가는 베드로의 통역자로 알려져 있다.', true, 'HARD', 5, NOW(), NOW()),
       (406, 41, '마가복음은 예수님의 행동과 사역을 강조한다.', true, 'NORMAL', 6, NOW(), NOW()),
       (407, 41, '마가복음은 16장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (408, 41, '마가복음은 로마인들을 대상으로 기록되었다고 추정된다.', true, 'HARD', 8, NOW(), NOW()),
       (409, 41, '마가복음에는 산상수훈이 기록되어 있다.', false, 'NORMAL', 9, NOW(), NOW()),
       (410, 41, '마가복음의 저자 마가는 바나바의 조카이다.', true, 'HARD', 10, NOW(), NOW());

-- Stage 42: 누가복음 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (411, 42, '누가복음의 저자 누가는 의사였다.', true, 'EASY', 1, NOW(), NOW()),
       (412, 42, '누가복음은 데오빌로에게 보낸 글이다.', true, 'NORMAL', 2, NOW(), NOW()),
       (413, 42, '누가복음에는 마리아의 찬가(마니피캇)가 기록되어 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (414, 42, '선한 사마리아인 비유는 누가복음에만 기록되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (415, 42, '탕자의 비유는 누가복음에 기록되어 있다.', true, 'EASY', 5, NOW(), NOW()),
       (416, 42, '누가복음에는 예수님 탄생 시 목자들의 이야기가 있다.', true, 'EASY', 6, NOW(), NOW()),
       (417, 42, '누가는 사도행전의 저자이기도 하다.', true, 'NORMAL', 7, NOW(), NOW()),
       (418, 42, '누가복음은 24장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (419, 42, '누가복음은 여성과 소외된 자들에 대한 관심이 많다.', true, 'NORMAL', 9, NOW(), NOW()),
       (420, 42, '누가복음은 네 복음서 중 가장 짧다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 43: 요한복음 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (421, 43, '요한복음은 "태초에 말씀이 계시니라"로 시작한다.', true, 'EASY', 1, NOW(), NOW()),
       (422, 43, '예수님의 첫 번째 이적은 물을 포도주로 바꾸신 것이다.', true, 'EASY', 2, NOW(), NOW()),
       (423, 43, '니고데모는 밤에 예수님을 찾아왔다.', true, 'NORMAL', 3, NOW(), NOW()),
       (424, 43, '예수님은 스스로 "나는 길이요 진리요 생명이라"고 말씀하셨다.', true, 'EASY', 4, NOW(), NOW()),
       (425, 43, '나사로는 죽은 지 이틀 만에 살아났다.', false, 'NORMAL', 5, NOW(), NOW()),
       (426, 43, '요한복음에는 예수님의 "나는 ~이다" 선언이 7개 있다.', true, 'HARD', 6, NOW(), NOW()),
       (427, 43, '최후의 만찬 때 예수님은 제자들의 발을 씻기셨다.', true, 'EASY', 7, NOW(), NOW()),
       (428, 43, '예수님은 도마에게 "믿음 없는 자가 되지 말고 믿는 자가 되라"고 말씀하셨다.', true, 'NORMAL', 8, NOW(), NOW()),
       (429, 43, '요한복음의 저자는 세베대의 아들 요한이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (430, 43, '요한복음 3:16은 성경에서 가장 유명한 구절 중 하나이다.', true, 'EASY', 10, NOW(), NOW());

-- Stage 44: 사도행전 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (431, 44, '사도행전의 저자는 누가이다.', true, 'EASY', 1, NOW(), NOW()),
       (432, 44, '오순절에 성령이 강림하셨다.', true, 'EASY', 2, NOW(), NOW()),
       (433, 44, '오순절에 약 3000명이 회심했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (434, 44, '스데반은 최초의 순교자이다.', true, 'EASY', 4, NOW(), NOW()),
       (435, 44, '바울은 다메섹 도상에서 예수님을 만났다.', true, 'EASY', 5, NOW(), NOW()),
       (436, 44, '바울의 본래 이름은 사울이었다.', true, 'EASY', 6, NOW(), NOW()),
       (437, 44, '바울은 세 번의 선교 여행을 했다.', true, 'NORMAL', 7, NOW(), NOW()),
       (438, 44, '베드로는 고넬료에게 복음을 전하여 이방인 선교의 문을 열었다.', true, 'NORMAL', 8, NOW(), NOW()),
       (439, 44, '사도행전은 28장으로 구성되어 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (440, 44, '사도행전은 바울의 로마 도착으로 끝난다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 45: 로마서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (441, 45, '로마서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (442, 45, '로마서는 이신칭의(믿음으로 의롭게 됨)를 가르친다.', true, 'EASY', 2, NOW(), NOW()),
       (443, 45, '"모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니"는 로마서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (444, 45, '로마서 8장은 성령의 사역에 대해 말씀한다.', true, 'NORMAL', 4, NOW(), NOW()),
       (445, 45, '"너희 몸을 하나님이 기뻐하시는 거룩한 산 제물로 드리라"는 로마서 12장의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (446, 45, '로마서는 16장으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (447, 45, '로마서에는 이스라엘의 구원에 대한 논의가 포함되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (448, 45, '"의인은 믿음으로 말미암아 살리라"는 로마서에 인용되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (449, 45, '바울은 로마서를 로마에서 기록했다.', false, 'HARD', 9, NOW(), NOW()),
       (450, 45, '로마서는 바울 서신 중 가장 체계적인 신학 서신이다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 46: 고린도전서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (451, 46, '고린도전서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (452, 46, '고린도전서 13장은 "사랑장"으로 유명하다.', true, 'EASY', 2, NOW(), NOW()),
       (453, 46, '"사랑은 오래 참고 사랑은 온유하며"는 고린도전서의 말씀이다.', true, 'EASY', 3, NOW(), NOW()),
       (454, 46, '고린도전서는 고린도 교회의 분쟁 문제를 다룬다.', true, 'NORMAL', 4, NOW(), NOW()),
       (455, 46, '고린도전서 15장은 부활에 대해 가르친다.', true, 'NORMAL', 5, NOW(), NOW()),
       (456, 46, '고린도전서에는 성찬에 대한 가르침이 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (457, 46, '고린도전서에는 성령의 은사에 대한 가르침이 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (458, 46, '고린도전서는 16장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (459, 46, '"믿음, 소망, 사랑 이 세 가지는 항상 있을 것인데 그 중의 제일은 사랑이라"는 고린도전서의 말씀이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (460, 46, '고린도는 도덕적으로 타락한 도시로 유명했다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 47: 고린도후서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (461, 47, '고린도후서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (462, 47, '고린도후서에서 바울은 자신의 사도직을 변호한다.', true, 'NORMAL', 2, NOW(), NOW()),
       (463, 47, '"누구든지 그리스도 안에 있으면 새로운 피조물이라"는 고린도후서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (464, 47, '바울은 고린도후서에서 자신이 받은 환난에 대해 언급한다.', true, 'NORMAL', 4, NOW(), NOW()),
       (465, 47, '"내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라"는 고린도후서의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (466, 47, '고린도후서에는 즐거이 헌금하는 것에 대한 가르침이 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (467, 47, '바울은 셋째 하늘까지 이끌려 올라간 경험을 고린도후서에서 언급한다.', true, 'HARD', 7, NOW(), NOW()),
       (468, 47, '고린도후서는 13장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (469, 47, '고린도후서는 바울의 가장 개인적인 서신 중 하나이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (470, 47, '고린도후서는 고린도전서보다 먼저 기록되었다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 48: 갈라디아서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (471, 48, '갈라디아서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (472, 48, '갈라디아서는 이신칭의를 강력히 주장한다.', true, 'EASY', 2, NOW(), NOW()),
       (473, 48, '갈라디아서는 율법주의를 반박한다.', true, 'NORMAL', 3, NOW(), NOW()),
       (474, 48, '"성령의 열매는 사랑과 희락과 화평이요"는 갈라디아서의 말씀이다.', true, 'EASY', 4, NOW(), NOW()),
       (475, 48, '갈라디아서에는 9가지 성령의 열매가 기록되어 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (476, 48, '"그리스도께서 우리를 자유롭게 하려고 자유를 주셨으니"는 갈라디아서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (477, 48, '바울은 갈라디아서에서 베드로를 면책했다고 기록했다.', true, 'HARD', 7, NOW(), NOW()),
       (478, 48, '갈라디아서는 6장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (479, 48, '갈라디아서는 "믿음의 헌장"이라고 불린다.', true, 'HARD', 9, NOW(), NOW()),
       (480, 48, '갈라디아서는 할례를 받아야 구원받는다고 가르친다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 49: 에베소서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (481, 49, '에베소서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (482, 49, '에베소서는 교회론을 중심으로 다룬다.', true, 'NORMAL', 2, NOW(), NOW()),
       (483, 49, '"너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니"는 에베소서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (484, 49, '에베소서에는 "그리스도 안에서"라는 표현이 자주 등장한다.', true, 'NORMAL', 4, NOW(), NOW()),
       (485, 49, '에베소서 6장에는 전신갑주에 대한 말씀이 있다.', true, 'EASY', 5, NOW(), NOW()),
       (486, 49, '전신갑주에는 구원의 투구, 믿음의 방패, 성령의 검 등이 포함된다.', true, 'NORMAL', 6, NOW(), NOW()),
       (487, 49, '에베소서에는 남편과 아내, 부모와 자녀의 관계에 대한 가르침이 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (488, 49, '에베소서는 6장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (489, 49, '바울은 에베소서를 옥중에서 기록했다.', true, 'NORMAL', 9, NOW(), NOW()),
       (490, 49, '에베소서는 에베소 교회의 심각한 문제를 책망하기 위해 기록되었다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 50: 빌립보서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (491, 50, '빌립보서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (492, 50, '빌립보서는 "기쁨의 서신"으로 알려져 있다.', true, 'EASY', 2, NOW(), NOW()),
       (493, 50, '"내가 주 안에서 항상 기뻐하라 다시 말하노니 기뻐하라"는 빌립보서의 말씀이다.', true, 'EASY', 3, NOW(), NOW()),
       (494, 50, '빌립보서 2장에는 그리스도의 겸손(케노시스)에 대한 말씀이 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (495, 50, '"내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라"는 빌립보서의 말씀이다.', true, 'EASY', 5, NOW(), NOW()),
       (496, 50, '바울은 빌립보서를 옥중에서 기록했다.', true, 'NORMAL', 6, NOW(), NOW()),
       (497, 50, '빌립보 교회는 바울의 선교를 물질적으로 후원했다.', true, 'NORMAL', 7, NOW(), NOW()),
       (498, 50, '빌립보서는 4장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (499, 50, '빌립보는 유럽 최초로 복음이 전해진 도시이다.', true, 'HARD', 9, NOW(), NOW()),
       (500, 50, '빌립보서에는 교회의 심각한 분쟁 문제가 기록되어 있다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 51: 골로새서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (501, 51, '골로새서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (502, 51, '골로새서는 그리스도의 신성과 충분성을 강조한다.', true, 'NORMAL', 2, NOW(), NOW()),
       (503, 51, '"그는 보이지 아니하는 하나님의 형상이요 모든 피조물보다 먼저 나신 이시니"는 골로새서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (504, 51, '골로새서는 옥중서신 중 하나이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (505, 51, '골로새서는 거짓 교훈과 이단 사상을 반박한다.', true, 'NORMAL', 5, NOW(), NOW()),
       (506, 51, '"무엇을 하든지 말에나 일에나 다 주 예수의 이름으로 하라"는 골로새서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (507, 51, '골로새서는 4장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (508, 51, '바울은 골로새 교회를 직접 방문하여 세웠다.', false, 'HARD', 8, NOW(), NOW()),
       (509, 51, '골로새서에는 가정의 규범에 대한 가르침이 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (510, 51, '골로새서는 에베소서와 유사한 내용이 많다.', true, 'NORMAL', 10, NOW(), NOW());

-- Stage 52: 데살로니가전서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (511, 52, '데살로니가전서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (512, 52, '데살로니가전서는 바울의 가장 초기 서신 중 하나이다.', true, 'NORMAL', 2, NOW(), NOW()),
       (513, 52, '데살로니가전서는 예수님의 재림에 대해 가르친다.', true, 'EASY', 3, NOW(), NOW()),
       (514, 52, '"항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라"는 데살로니가전서의 말씀이다.', true, 'EASY', 4, NOW(), NOW()),
       (515, 52, '데살로니가전서에는 공중 휴거에 대한 말씀이 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (516, 52, '"주께서 호령과 천사장의 소리와 하나님의 나팔 소리로 친히 하늘로부터 강림하시리니"는 데살로니가전서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (517, 52, '데살로니가전서는 5장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (518, 52, '데살로니가 교회는 핍박 가운데서도 믿음을 지켰다.', true, 'NORMAL', 8, NOW(), NOW()),
       (519, 52, '데살로니가전서에는 성결한 삶에 대한 권면이 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (520, 52, '데살로니가전서는 재림이 이미 지나갔다고 가르친다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 53: 데살로니가후서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (521, 53, '데살로니가후서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (522, 53, '데살로니가후서는 재림의 때에 대한 오해를 바로잡는다.', true, 'NORMAL', 2, NOW(), NOW()),
       (523, 53, '데살로니가후서에는 "불법의 사람"에 대한 예언이 있다.', true, 'NORMAL', 3, NOW(), NOW()),
       (524, 53, '"일하기 싫어하거든 먹지도 말게 하라"는 데살로니가후서의 말씀이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (525, 53, '데살로니가후서는 게으른 자들을 책망한다.', true, 'NORMAL', 5, NOW(), NOW()),
       (526, 53, '데살로니가후서는 3장으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (527, 53, '데살로니가후서에는 핍박받는 성도들에 대한 위로가 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (528, 53, '데살로니가후서는 주의 날이 이미 이르렀다는 거짓 가르침을 반박한다.', true, 'NORMAL', 8, NOW(), NOW()),
       (529, 53, '"형제들아 선을 행하다가 낙심하지 말라"는 데살로니가후서의 말씀이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (530, 53, '데살로니가후서는 데살로니가전서보다 먼저 기록되었다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 54: 디모데전서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (531, 54, '디모데전서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (532, 54, '디모데전서는 목회서신 중 하나이다.', true, 'EASY', 2, NOW(), NOW()),
       (533, 54, '디모데는 바울의 영적 아들이었다.', true, 'EASY', 3, NOW(), NOW()),
       (534, 54, '디모데전서에는 감독(장로)의 자격이 기록되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (535, 54, '디모데전서에는 집사의 자격이 기록되어 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (536, 54, '"경건에 이르도록 네 자신을 연단하라"는 디모데전서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (537, 54, '"돈을 사랑함이 일만 악의 뿌리가 되나니"는 디모데전서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (538, 54, '디모데전서는 6장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (539, 54, '디모데의 어머니 유니게와 외할머니 로이스는 믿음의 사람이었다.', true, 'HARD', 9, NOW(), NOW()),
       (540, 54, '디모데전서는 바울의 마지막 서신이다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 55: 디모데후서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (541, 55, '디모데후서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (542, 55, '디모데후서는 바울의 마지막 서신으로 알려져 있다.', true, 'NORMAL', 2, NOW(), NOW()),
       (543, 55, '"모든 성경은 하나님의 감동으로 된 것으로"는 디모데후서의 말씀이다.', true, 'EASY', 3, NOW(), NOW()),
       (544, 55, '디모데후서에는 성경의 영감에 대한 가르침이 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (545, 55, '"나는 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니"는 디모데후서의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (546, 55, '바울은 디모데후서를 옥중에서 기록했다.', true, 'NORMAL', 6, NOW(), NOW()),
       (547, 55, '"너는 진리의 말씀을 옳게 분별하는 부끄러울 것이 없는 일꾼으로 인정된 자로 자신을 하나님께 드리라"는 디모데후서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (548, 55, '디모데후서는 4장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (549, 55, '바울은 디모데후서에서 자신의 죽음이 가까웠음을 암시한다.', true, 'NORMAL', 9, NOW(), NOW()),
       (550, 55, '디모데후서는 목회서신이 아니다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 56: 디도서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (551, 56, '디도서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (552, 56, '디도서는 목회서신 중 하나이다.', true, 'EASY', 2, NOW(), NOW()),
       (553, 56, '디도는 그레데(크레타) 섬에서 사역했다.', true, 'NORMAL', 3, NOW(), NOW()),
       (554, 56, '디도서에는 장로의 자격이 기록되어 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (555, 56, '디도서는 선한 행실의 중요성을 강조한다.', true, 'NORMAL', 5, NOW(), NOW()),
       (556, 56, '"우리 구주 하나님의 자비가 나타나 모든 사람에게 구원을 주시되"는 디도서의 말씀이다.', true, 'HARD', 6, NOW(), NOW()),
       (557, 56, '디도서는 3장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (558, 56, '디도는 바울의 동역자였다.', true, 'EASY', 8, NOW(), NOW()),
       (559, 56, '디도서에는 이단을 경계하라는 권면이 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (560, 56, '디도서는 디모데전서보다 길다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 57: 빌레몬서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (561, 57, '빌레몬서는 사도 바울이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (562, 57, '빌레몬서는 바울 서신 중 가장 짧다.', true, 'EASY', 2, NOW(), NOW()),
       (563, 57, '오네시모는 빌레몬의 도망친 노예였다.', true, 'NORMAL', 3, NOW(), NOW()),
       (564, 57, '바울은 오네시모를 그리스도인으로 인도했다.', true, 'NORMAL', 4, NOW(), NOW()),
       (565, 57, '바울은 빌레몬에게 오네시모를 형제로 받아주라고 부탁한다.', true, 'NORMAL', 5, NOW(), NOW()),
       (566, 57, '빌레몬서는 1장으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (567, 57, '"오네시모"는 "유익한 자"라는 뜻이다.', true, 'HARD', 7, NOW(), NOW()),
       (568, 57, '바울은 빌레몬서를 옥중에서 기록했다.', true, 'NORMAL', 8, NOW(), NOW()),
       (569, 57, '빌레몬서는 용서와 화해의 메시지를 담고 있다.', true, 'EASY', 9, NOW(), NOW()),
       (570, 57, '빌레몬서는 교회 전체에 보낸 공적 서신이다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 58: 히브리서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (571, 58, '히브리서의 저자는 명확히 알려져 있지 않다.', true, 'NORMAL', 1, NOW(), NOW()),
       (572, 58, '히브리서는 그리스도의 우월성을 강조한다.', true, 'EASY', 2, NOW(), NOW()),
       (573, 58, '히브리서 11장은 "믿음의 장"으로 유명하다.', true, 'EASY', 3, NOW(), NOW()),
       (574, 58, '"믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니"는 히브리서의 말씀이다.', true, 'EASY', 4, NOW(), NOW()),
       (575, 58, '히브리서는 예수님이 구약의 제사장직보다 우월하심을 가르친다.', true, 'NORMAL', 5, NOW(), NOW()),
       (576, 58, '멜기세덱 제사장직이 히브리서에서 언급된다.', true, 'NORMAL', 6, NOW(), NOW()),
       (577, 58, '히브리서는 유대인 그리스도인들에게 기록되었다.', true, 'NORMAL', 7, NOW(), NOW()),
       (578, 58, '히브리서는 13장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (579, 58, '"예수 그리스도는 어제나 오늘이나 영원토록 동일하시니라"는 히브리서의 말씀이다.', true, 'NORMAL', 9, NOW(), NOW()),
       (580, 58, '히브리서의 저자는 확실히 바울이다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 59: 야고보서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (581, 59, '야고보서의 저자는 예수님의 형제 야고보로 추정된다.', true, 'NORMAL', 1, NOW(), NOW()),
       (582, 59, '야고보서는 행함 있는 믿음을 강조한다.', true, 'EASY', 2, NOW(), NOW()),
       (583, 59, '"행함이 없는 믿음은 죽은 것이라"는 야고보서의 말씀이다.', true, 'EASY', 3, NOW(), NOW()),
       (584, 59, '야고보서에는 혀의 능력에 대한 가르침이 있다.', true, 'NORMAL', 4, NOW(), NOW()),
       (585, 59, '"혀는 작은 지체로되 큰 것을 자랑하나니"는 야고보서의 말씀이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (586, 59, '야고보서는 시험과 인내에 대해 가르친다.', true, 'NORMAL', 6, NOW(), NOW()),
       (587, 59, '"너희 중에 누구든지 지혜가 부족하거든 하나님께 구하라"는 야고보서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (588, 59, '야고보서는 5장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (589, 59, '야고보서는 실천적인 기독교 생활을 강조한다.', true, 'EASY', 9, NOW(), NOW()),
       (590, 59, '야고보서는 믿음만 있으면 행함은 필요 없다고 가르친다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 60: 베드로전서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (591, 60, '베드로전서는 사도 베드로가 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (592, 60, '베드로전서는 고난 중의 소망에 대해 가르친다.', true, 'EASY', 2, NOW(), NOW()),
       (593, 60, '베드로전서에서 성도들을 "택하신 족속, 왕 같은 제사장들"이라고 부른다.', true, 'NORMAL', 3, NOW(), NOW()),
       (594, 60, '"너희가 산 돌 같이 신령한 집으로 세워지라"는 베드로전서의 말씀이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (595, 60, '베드로전서는 핍박받는 그리스도인들에게 기록되었다.', true, 'NORMAL', 5, NOW(), NOW()),
       (596, 60, '"근신하라 깨어라 너희 대적 마귀가 우는 사자 같이 두루 다니며"는 베드로전서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (597, 60, '베드로전서에는 권위에 복종하라는 가르침이 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (598, 60, '베드로전서는 5장으로 구성되어 있다.', true, 'NORMAL', 8, NOW(), NOW()),
       (599, 60, '베드로는 바벨론에서 이 서신을 기록했다고 언급한다.', true, 'HARD', 9, NOW(), NOW()),
       (600, 60, '베드로전서는 부유하고 평안한 교회에 기록되었다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 61: 베드로후서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (601, 61, '베드로후서는 사도 베드로가 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (602, 61, '베드로후서는 거짓 교사들을 경계한다.', true, 'EASY', 2, NOW(), NOW()),
       (603, 61, '"주께는 하루가 천 년 같고 천 년이 하루 같다"는 베드로후서의 말씀이다.', true, 'NORMAL', 3, NOW(), NOW()),
       (604, 61, '베드로후서는 주의 재림에 대해 가르친다.', true, 'NORMAL', 4, NOW(), NOW()),
       (605, 61, '베드로후서에는 성경의 영감에 대한 말씀이 있다.', true, 'NORMAL', 5, NOW(), NOW()),
       (606, 61, '"성경의 모든 예언은 사사로이 풀 것이 아니니"는 베드로후서의 말씀이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (607, 61, '베드로후서는 3장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (608, 61, '베드로후서에는 노아의 홍수와 소돔과 고모라의 심판이 언급된다.', true, 'NORMAL', 8, NOW(), NOW()),
       (609, 61, '베드로후서에서 바울의 서신을 "성경"으로 언급한다.', true, 'HARD', 9, NOW(), NOW()),
       (610, 61, '베드로후서는 재림이 지연되는 것을 부정적으로 본다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 62: 요한일서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (611, 62, '요한일서는 사도 요한이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (612, 62, '"하나님은 사랑이시라"는 요한일서의 말씀이다.', true, 'EASY', 2, NOW(), NOW()),
       (613, 62, '요한일서는 사랑에 대해 많이 가르친다.', true, 'EASY', 3, NOW(), NOW()),
       (614, 62, '"하나님은 빛이시라 그에게는 어둠이 조금도 없으시다"는 요한일서의 말씀이다.', true, 'NORMAL', 4, NOW(), NOW()),
       (615, 62, '요한일서는 영을 분별하라고 가르친다.', true, 'NORMAL', 5, NOW(), NOW()),
       (616, 62, '"예수 그리스도께서 육체로 오신 것을 시인하는 영"은 하나님께 속한 것이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (617, 62, '요한일서는 5장으로 구성되어 있다.', true, 'NORMAL', 7, NOW(), NOW()),
       (618, 62, '"우리가 사랑함은 그가 먼저 우리를 사랑하셨음이라"는 요한일서의 말씀이다.', true, 'NORMAL', 8, NOW(), NOW()),
       (619, 62, '요한일서는 구원의 확신에 대해 가르친다.', true, 'NORMAL', 9, NOW(), NOW()),
       (620, 62, '요한일서는 거짓 선지자들을 구별할 필요가 없다고 가르친다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 63: 요한이서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (621, 63, '요한이서는 사도 요한이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (622, 63, '요한이서는 "택하심을 받은 부녀"에게 기록되었다.', true, 'NORMAL', 2, NOW(), NOW()),
       (623, 63, '요한이서는 진리 안에서 행할 것을 권면한다.', true, 'NORMAL', 3, NOW(), NOW()),
       (624, 63, '요한이서는 거짓 교사들을 집에 들이지 말라고 경고한다.', true, 'NORMAL', 4, NOW(), NOW()),
       (625, 63, '요한이서는 신약성경에서 가장 짧은 책 중 하나이다.', true, 'NORMAL', 5, NOW(), NOW()),
       (626, 63, '요한이서는 1장(13절)으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (627, 63, '요한이서에서 저자는 자신을 "장로"라고 칭한다.', true, 'HARD', 7, NOW(), NOW()),
       (628, 63, '요한이서는 사랑과 진리의 균형을 강조한다.', true, 'NORMAL', 8, NOW(), NOW()),
       (629, 63, '"그리스도의 교훈 안에 거하는 자는 아버지와 아들을 모시느니라"는 요한이서의 말씀이다.', true, 'HARD', 9, NOW(), NOW()),
       (630, 63, '요한이서는 모든 사람을 환영하라고 가르친다.', false, 'NORMAL', 10, NOW(), NOW());

-- Stage 64: 요한삼서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (631, 64, '요한삼서는 사도 요한이 기록했다.', true, 'EASY', 1, NOW(), NOW()),
       (632, 64, '요한삼서는 가이오에게 기록되었다.', true, 'NORMAL', 2, NOW(), NOW()),
       (633, 64, '요한삼서에서 디오드레베는 책망을 받는다.', true, 'NORMAL', 3, NOW(), NOW()),
       (634, 64, '디오드레베는 형제들을 영접하지 않고 교회에서 쫓아냈다.', true, 'NORMAL', 4, NOW(), NOW()),
       (635, 64, '요한삼서에서 데메드리오는 칭찬을 받는다.', true, 'NORMAL', 5, NOW(), NOW()),
       (636, 64, '요한삼서는 1장(15절)으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (637, 64, '"선을 행하는 자는 하나님께 속하고 악을 행하는 자는 하나님을 뵈옵지 못하였느니라"는 요한삼서의 말씀이다.', true, 'NORMAL', 7, NOW(), NOW()),
       (638, 64, '요한삼서는 나그네 된 형제들을 대접할 것을 권면한다.', true, 'NORMAL', 8, NOW(), NOW()),
       (639, 64, '요한삼서에서 저자는 자신을 "장로"라고 칭한다.', true, 'HARD', 9, NOW(), NOW()),
       (640, 64, '요한삼서에서 가이오는 책망을 받는다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 65: 유다서 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (641, 65, '유다서의 저자는 예수님의 형제 유다로 추정된다.', true, 'NORMAL', 1, NOW(), NOW()),
       (642, 65, '유다서는 거짓 교사들을 강력히 경계한다.', true, 'EASY', 2, NOW(), NOW()),
       (643, 65, '유다서는 "성도에게 단번에 주신 믿음을 위하여 힘써 싸우라"고 권면한다.', true, 'NORMAL', 3, NOW(), NOW()),
       (644, 65, '유다서에는 천사장 미가엘과 마귀가 모세의 시체에 대해 다투는 이야기가 있다.', true, 'HARD', 4, NOW(), NOW()),
       (645, 65, '유다서에는 에녹의 예언이 인용되어 있다.', true, 'HARD', 5, NOW(), NOW()),
       (646, 65, '유다서는 1장(25절)으로 구성되어 있다.', true, 'NORMAL', 6, NOW(), NOW()),
       (647, 65, '유다서는 소돔과 고모라의 심판을 언급한다.', true, 'NORMAL', 7, NOW(), NOW()),
       (648, 65, '유다서는 베드로후서 2장과 유사한 내용이 많다.', true, 'HARD', 8, NOW(), NOW()),
       (649, 65, '"능히 너희를 보호하사 거침이 없게 하시고 너희로 그의 영광 앞에 흠이 없이 기쁨으로 서게 하실"이라는 송영이 유다서에 있다.', true, 'NORMAL', 9, NOW(), NOW()),
       (650, 65, '유다서는 가룟 유다가 기록했다.', false, 'EASY', 10, NOW(), NOW());

-- Stage 66: 요한계시록 (10문제)
INSERT INTO ox_quiz_question (id, stage_id, question_text, correct_answer, difficulty, order_index, created_at, updated_at)
VALUES (651, 66, '요한계시록은 성경의 마지막 책이다.', true, 'EASY', 1, NOW(), NOW()),
       (652, 66, '요한계시록은 밧모섬에서 기록되었다.', true, 'NORMAL', 2, NOW(), NOW()),
       (653, 66, '요한계시록에는 7개의 교회에 보내는 편지가 있다.', true, 'EASY', 3, NOW(), NOW()),
       (654, 66, '666은 짐승의 수이다.', true, 'EASY', 4, NOW(), NOW()),
       (655, 66, '새 예루살렘에는 성전이 있다.', false, 'HARD', 5, NOW(), NOW()),
       (656, 66, '144,000명은 이스라엘 열두 지파에서 인 맞은 자들이다.', true, 'NORMAL', 6, NOW(), NOW()),
       (657, 66, '생명책에 이름이 없는 자는 불못에 던져진다.', true, 'NORMAL', 7, NOW(), NOW()),
       (658, 66, '요한계시록의 저자는 사도 바울이다.', false, 'EASY', 8, NOW(), NOW()),
       (659, 66, '새 하늘과 새 땅에서는 더 이상 바다가 없다.', true, 'HARD', 9, NOW(), NOW()),
       (660, 66, '요한계시록은 "아멘 주 예수여 오시옵소서"로 끝난다.', true, 'NORMAL', 10, NOW(), NOW());

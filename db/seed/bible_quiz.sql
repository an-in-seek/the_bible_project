-- Auto-generated from bible-quiz.js (grouped for readability)
INSERT INTO quiz_stage (id, stage_number, title)
VALUES (1, 1, '창조와 족장들'),
       (2, 2, '족장 이야기'),
       (3, 3, '출애굽과 광야'),
       (4, 4, '정복과 사사 시대'),
       (5, 5, '통일 왕국'),
       (6, 6, '분열 왕국과 선지자'),
       (7, 7, '포로와 귀환'),
       (8, 8, '예수님의 사역'),
       (9, 9, '십자가와 부활'),
       (10, 10, '바울과 초대교회');

------------------------------- Stage 1 -------------------------------

-- Q1 (정답: 첫째 날 / index 2)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (1, 1, '하나님께서 빛을 만드신 날은 창조 몇째 날일까요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (1, '둘째 날', 0),
       (1, '셋째 날', 1),
       (1, '첫째 날', 2),
       (1, '넷째 날', 3);

-- Q2 (정답: 에덴 동산 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (2, 1, '아담과 하와가 있었던 동산의 이름은 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (2, '올리브 동산', 0),
       (2, '에덴 동산', 1),
       (2, '겟세마네', 2),
       (2, '갈멜 산', 3);

-- Q3 (정답: 고페르나무 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (3, 1, '노아가 방주를 지을 때 사용한 나무는 무엇일까요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (3, '감람나무', 0),
       (3, '백향목', 1),
       (3, '돌베개', 2),
       (3, '고페르나무', 3);

-- Q4 (정답: 언어가 혼잡해졌다 / index 0)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (4, 1, '바벨탑 사건 이후에 생긴 일은 무엇인가요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (4, '언어가 혼잡해졌다', 0),
       (4, '홍해가 갈라졌다', 1),
       (4, '모세가 태어났다', 2),
       (4, '약속의 땅에 들어갔다', 3);

-- Q5 (정답: 갈대아 우르 / index 2)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (5, 1, '하나님께서 아브라함을 부르신 곳은 어디인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (5, '애굽', 0),
       (5, '가나안', 1),
       (5, '갈대아 우르', 2),
       (5, '베들레헴', 3);

-- Q6 (정답: 선악을 알게 하는 나무 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (51, 1, '에덴 동산에서 하나님이 금하신 나무는 무엇인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (51, '생명나무', 0),
       (51, '포도나무', 1),
       (51, '무화과나무', 2),
       (51, '선악을 알게 하는 나무', 3);

-- Q7 (정답: 가인 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (52, 1, '아담의 첫째 아들은 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (52, '아벨', 0),
       (52, '가인', 1),
       (52, '셋', 2),
       (52, '에녹', 3);

-- Q8 (정답: 40일 / index 2)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (53, 1, '노아의 홍수 때 비가 내린 기간은 얼마인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (53, '7일', 0),
       (53, '120일', 1),
       (53, '40일', 2),
       (53, '1년', 3);

-- Q9 (정답: 이삭 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (54, 1, '사라가 낳은 아브라함의 아들은 누구인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (54, '이스마엘', 0),
       (54, '에서', 1),
       (54, '야곱', 2),
       (54, '이삭', 3);

-- Q10 (정답: 롯 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (55, 1, '아브라함과 함께 가나안으로 간 친족은 누구인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (55, '라반', 0),
       (55, '롯', 1),
       (55, '엘리에셀', 2),
       (55, '므낫세', 3);


------------------------------- Stage 2 -------------------------------

-- Q1 (정답: 할례 / index 2)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (6, 2, '하나님께서 아브라함에게 주신 약속의 표는 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (6, '무지개', 0),
       (6, '십계명', 1),
       (6, '할례', 2),
       (6, '만나', 3);

-- Q2 (정답: 리브가 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (7, 2, '이삭의 아내가 된 사람은 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (7, '라헬', 0),
       (7, '리브가', 1),
       (7, '레아', 2),
       (7, '사라', 3);

-- Q3 (정답: 이스라엘 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (8, 2, '야곱의 이름이 바뀐 후의 새 이름은 무엇인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (8, '요셉', 0),
       (8, '여호수아', 1),
       (8, '요나', 2),
       (8, '이스라엘', 3);

-- Q4 (정답: 채색 옷을 입어서 / index 0 유지)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (9, 2, '요셉이 형들에게 미움을 받은 이유 중 하나는 무엇인가요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (9, '채색 옷을 입어서', 0),
       (9, '왕이 되어서', 1),
       (9, '광야에 가서', 2),
       (9, '제사를 드려서', 3);

-- Q5 (정답: 총리 / index 2)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (10, 2, '요셉이 애굽에서 맡았던 높은 직책은 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (10, '제사장', 0),
       (10, '장군', 1),
       (10, '총리', 2),
       (10, '판관', 3);

-- Q6 (정답: 에서 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (56, 2, '야곱의 쌍둥이 형은 누구인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (56, '요셉', 0),
       (56, '르우벤', 1),
       (56, '베냐민', 2),
       (56, '에서', 3);

-- Q7 (정답: 하늘에 닿은 사다리 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (57, 2, '야곱이 꿈에서 본 것은 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (57, '불수레', 0),
       (57, '하늘에 닿은 사다리', 1),
       (57, '큰 물고기', 2),
       (57, '성막', 3);

-- Q8 (정답: 7년 풍년, 7년 흉년 / index 2 유지)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (58, 2, '바로의 꿈은 몇 년 풍년과 몇 년 흉년을 의미했나요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (58, '3년 풍년, 3년 흉년', 0),
       (58, '5년 풍년, 5년 흉년', 1),
       (58, '7년 풍년, 7년 흉년', 2),
       (58, '10년 풍년, 10년 흉년', 3);

-- Q9 (정답: 베냐민 / index 1)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (59, 2, '요셉의 막내 동생은 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (59, '단', 0),
       (59, '베냐민', 1),
       (59, '납달리', 2),
       (59, '잇사갈', 3);

-- Q10 (정답: 레위 / index 3)
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (60, 2, '이스라엘에서 제사장 직분을 맡은 지파는 어디인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (60, '유다', 0),
       (60, '베냐민', 1),
       (60, '갓', 2),
       (60, '레위', 3);


------------------------------- Stage 3 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (11, 3, '모세가 하나님을 만난 곳에서 본 것은 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (11, '무지개', 0),
       (11, '홍해', 1),
       (11, '떨기나무 불꽃', 2),
       (11, '불기둥', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (12, 3, '애굽에 내린 열 가지 재앙 중 첫 번째는 무엇인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (12, '우박', 0),
       (12, '물이 피로 변함', 1),
       (12, '메뚜기', 2),
       (12, '흑암', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (13, 3, '이스라엘 백성이 홍해를 건널 때 어떻게 되었나요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (13, '배를 타고 건넜다', 0),
       (13, '다리가 놓였다', 1),
       (13, '산길로 돌아갔다', 2),
       (13, '바다가 갈라졌다', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (14, 3, '십계명이 주어진 산은 어디인가요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (14, '시내 산', 0),
       (14, '갈멜 산', 1),
       (14, '올리브 산', 2),
       (14, '헤르몬 산', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (15, 3, '광야에서 이스라엘 백성이 주로 먹었던 양식은 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (15, '포도', 0),
       (15, '빵', 1),
       (15, '만나', 2),
       (15, '생선', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (61, 3, '출애굽 첫 유월절에 문설주에 바른 것은 무엇인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (61, '물', 0),
       (61, '기름', 1),
       (61, '포도주', 2),
       (61, '어린양의 피', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (62, 3, '모세의 형으로 제사장이 된 사람은 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (62, '미리암', 0),
       (62, '아론', 1),
       (62, '여호수아', 2),
       (62, '갈렙', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (63, 3, '광야에서 만나와 함께 주어진 고기는 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (63, '비둘기', 0),
       (63, '물고기', 1),
       (63, '메추라기', 2),
       (63, '소', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (64, 3, '금송아지 사건 뒤 모세가 깨뜨린 것은 무엇인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (64, '법궤', 0),
       (64, '성막', 1),
       (64, '제단', 2),
       (64, '돌판', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (65, 3, '이스라엘 백성이 광야에서 물이 없을 때, 모세가 반석을 향해 한 행동은 무엇인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (65, '손뼉을 쳤다', 0),
       (65, '지팡이로 반석을 쳤다', 1),
       (65, '땅을 팠다', 2),
       (65, '기도만 했다', 3);


------------------------------- Stage 4 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (16, 4, '여호수아가 이끈 가나안 정복의 첫 성은 어디인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (16, '아이', 0),
       (16, '기브온', 1),
       (16, '여리고', 2),
       (16, '헤브론', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (17, 4, '여리고 성은 어떤 방식으로 무너졌나요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (17, '이스라엘 백성이 성문을 공격해 무너뜨렸다', 0),
       (17, '하나님의 명령에 따라 이스라엘 백성이 나팔을 불고 함성을 질렀을 때 무너졌다', 1),
       (17, '큰 비와 홍수로 성이 붕괴됐다', 2),
       (17, '지진으로 성벽이 무너졌다', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (18, 4, '사사 시대에 이스라엘을 이끈 여성 지도자는 누구인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (18, '에스더', 0),
       (18, '리브가', 1),
       (18, '라헬', 2),
       (18, '드보라', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (19, 4, '기드온이 전쟁에 함께한 병사의 수는 얼마로 줄었나요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (19, '500명', 0),
       (19, '300명', 1),
       (19, '700명', 2),
       (19, '1000명', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (20, 4, '삼손의 힘이 약해진 이유는 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (20, '무기를 잃어서', 0),
       (20, '갑옷을 벗어서', 1),
       (20, '머리카락이 잘려서', 2),
       (20, '물을 마시지 못해서', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (66, 4, '여리고의 정탐꾼을 숨겨준 인물은 누구인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (66, '드보라', 0),
       (66, '라합', 1),
       (66, '나오미', 2),
       (66, '한나', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (67, 4, '이스라엘 백성이 가나안에 들어가기 전에 건넌 강은 어디인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (67, '나일강', 0),
       (67, '유브라데강', 1),
       (67, '요단강', 2),
       (67, '기손강', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (68, 4, '기드온이 하나님의 뜻을 확인하기 위해 사용한 표징은 무엇인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (68, '무지개', 0),
       (68, '불기둥', 1),
       (68, '지진', 2),
       (68, '양털에 이슬', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (69, 4, '삼손의 수수께끼에 등장하는 동물은 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (69, '곰', 0),
       (69, '양', 1),
       (69, '사자', 2),
       (69, '독수리', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (70, 4, '룻의 시어머니는 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (70, '사라', 0),
       (70, '나오미', 1),
       (70, '리브가', 2),
       (70, '아비가일', 3);


------------------------------- Stage 5 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (21, 5, '이스라엘의 첫 번째 왕은 누구인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (21, '다윗', 0),
       (21, '솔로몬', 1),
       (21, '사울', 2),
       (21, '사무엘', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (22, 5, '다윗이 골리앗을 쓰러뜨릴 때 사용한 무기는 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (22, '창', 0),
       (22, '물매', 1),
       (22, '활', 2),
       (22, '돌칼', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (23, 5, '다윗이 왕이 된 후에 세운 수도는 어디인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (23, '베들레헴', 0),
       (23, '헤브론', 1),
       (23, '사마리아', 2),
       (23, '예루살렘', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (24, 5, '솔로몬이 하나님께 구한 것은 무엇인가요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (24, '지혜', 0),
       (24, '장수', 1),
       (24, '재물', 2),
       (24, '전쟁의 승리', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (25, 5, '솔로몬이 건축한 대표적인 건물은 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (25, '궁전', 0),
       (25, '성벽', 1),
       (25, '성전', 2),
       (25, '회당', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (71, 5, '다윗의 아버지는 누구인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (71, '사울', 0),
       (71, '이새', 1),
       (71, '요나단', 2),
       (71, '아비가일', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (72, 5, '다윗에게 기름을 부어 왕으로 세운 선지자는 누구인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (72, '나단', 0),
       (72, '엘리야', 1),
       (72, '예레미야', 2),
       (72, '사무엘', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (73, 5, '솔로몬의 어머니는 누구인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (73, '미갈', 0),
       (73, '아비가일', 1),
       (73, '밧세바', 2),
       (73, '한나', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (74, 5, '다윗이 언약궤를 예루살렘으로 옮길 때 보인 모습은 무엇인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (74, '왕복장을 입고 엄숙하게 섰다', 0),
       (74, '에봇을 입고 춤을 추었다', 1),
       (74, '조용히 금식했다', 2),
       (74, '백성을 책망했다', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (75, 5, '솔로몬이 일천 번제를 드린 곳은 어디인가요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (75, '기브온', 0),
       (75, '예루살렘', 1),
       (75, '베들레헴', 2),
       (75, '헤브론', 3);


------------------------------- Stage 6 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (26, 6, '솔로몬 이후에 나라가 둘로 나뉘게 된 이유는 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (26, '외적의 침입', 0),
       (26, '대기근', 1),
       (26, '왕의 불순종과 우상숭배', 2),
       (26, '전염병', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (27, 6, '북이스라엘의 첫 왕은 누구인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (27, '르호보암', 0),
       (27, '여로보암', 1),
       (27, '아합', 2),
       (27, '히스기야', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (28, 6, '엘리야가 갈멜 산에서 맞섰던 선지자들은 누구인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (28, '사독 선지자', 0),
       (28, '나단 선지자', 1),
       (28, '엘리사 선지자', 2),
       (28, '바알 선지자', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (29, 6, '엘리사가 받았던 엘리야의 영감은 몇 배였나요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (29, '두 배', 0),
       (29, '한 배', 1),
       (29, '세 배', 2),
       (29, '네 배', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (30, 6, '요나가 전한 회개의 메시지를 들은 도시는 어디인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (30, '베들레헴', 0),
       (30, '가버나움', 1),
       (30, '니느웨', 2),
       (30, '두로', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (76, 6, '엘리야가 하늘로 올라갈 때 등장한 것은 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (76, '배', 0),
       (76, '불수레', 1),
       (76, '낙타', 2),
       (76, '전차', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (77, 6, '엘리사가 나아만에게 몸을 씻으라고 한 강은 어디인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (77, '나일강', 0),
       (77, '기손강', 1),
       (77, '갈릴리 바다', 2),
       (77, '요단강', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (78, 6, '아합 왕의 아내는 누구인가요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (78, '이세벨', 0),
       (78, '아달랴', 1),
       (78, '와스디', 2),
       (78, '드보라', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (79, 6, '임마누엘의 뜻은 무엇인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (79, '구원자', 0),
       (79, '하나님이 우리와 함께 계시다', 1),
       (79, '왕의 길', 2),
       (79, '평화의 왕', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (80, 6, '예레미야가 예언한 바벨론 포로 기간은 몇 년인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (80, '40년', 0),
       (80, '50년', 1),
       (80, '70년', 2),
       (80, '100년', 3);

------------------------------- Stage 7 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (31, 7, '다니엘이 사자 굴에 던져진 이유는 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (31, '전쟁에서 패해서', 0),
       (31, '성전을 훼손해서', 1),
       (31, '하나님께 기도해서', 2),
       (31, '거짓말을 해서', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (32, 7, '에스더가 왕에게 나아가기 전 백성에게 요청한 금식 기간은 얼마인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (32, '1일', 0),
       (32, '3일', 1),
       (32, '7일', 2),
       (32, '10일', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (33, 7, '바벨론 포로 이후 성전 재건을 이끈 지도자는 누구인가요?', 0, 'HARD');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (33, '스룹바벨', 0),
       (33, '다윗', 1),
       (33, '사무엘', 2),
       (33, '요나단', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (34, 7, '느헤미야가 예루살렘에서 재건한 것은 무엇인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (34, '성전', 0),
       (34, '궁전', 1),
       (34, '홍해의 길', 2),
       (34, '예루살렘 성벽', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (35, 7, '이스라엘 백성이 포로로 끌려갔던 제국은 어디인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (35, '로마', 0),
       (35, '바벨론', 1),
       (35, '그리스', 2),
       (35, '애굽', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (81, 7, '다니엘의 세 친구가 던져진 곳은 어디인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (81, '사자 굴', 0),
       (81, '감옥', 1),
       (81, '풀무불', 2),
       (81, '깊은 우물', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (82, 7, '에스더의 히브리 이름은 무엇인가요?', 3, 'HARD');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (82, '사라', 0),
       (82, '마라', 1),
       (82, '리브가', 2),
       (82, '하닷사', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (83, 7, '고레스 왕이 이스라엘 백성에게 허락한 것은 무엇인가요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (83, '성전 재건을 허락했다', 0),
       (83, '십계명을 반포했다', 1),
       (83, '애굽 정복을 선언했다', 2),
       (83, '홍해 건넘을 지시했다', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (84, 7, '느헤미야가 왕에게 요청한 핵심 내용은 무엇이었나요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (84, '왕좌를 달라는 것', 0),
       (84, '예루살렘 성벽 재건을 허락받는 것', 1),
       (84, '금송아지를 만들라는 것', 2),
       (84, '물 공급을 끊는 것', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (85, 7, '에스라의 역할로 가장 알맞은 것은 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (85, '장군', 0),
       (85, '왕', 1),
       (85, '서기관', 2),
       (85, '농부', 3);


------------------------------- Stage 8 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (36, 8, '예수님이 태어나신 도시는 어디인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (36, '나사렛', 0),
       (36, '예루살렘', 1),
       (36, '베들레헴', 2),
       (36, '가버나움', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (37, 8, '예수님께 세례를 준 사람은 누구인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (37, '베드로', 0),
       (37, '바울', 1),
       (37, '야고보', 2),
       (37, '세례 요한', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (38, 8, '예수님이 가르치신 주기도문의 시작 구절은 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (38, '우리 아버지여', 0),
       (38, '하늘에 계신 우리 아버지여', 1),
       (38, '주님, 들으소서', 2),
       (38, '하나님께 영광', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (39, 8, '선한 사마리아인의 비유가 강조하는 핵심 가치는 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (39, '제사 규례', 0),
       (39, '성전 건축', 1),
       (39, '이웃 사랑', 2),
       (39, '금식', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (40, 8, '예수님이 오병이어로 먹이신 사람 수는 약 몇 명인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (40, '천 명', 0),
       (40, '삼천 명', 1),
       (40, '이천 명', 2),
       (40, '오천 명', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (86, 8, '예수님의 열두 제자 수는 몇 명인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (86, '10명', 0),
       (86, '12명', 1),
       (86, '70명', 2),
       (86, '3명', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (87, 8, '가나 혼인 잔치에서 예수님이 물을 무엇으로 바꾸셨나요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (87, '포도주', 0),
       (87, '기름', 1),
       (87, '꿀', 2),
       (87, '우유', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (88, 8, '산상수훈에서 예수님이 복이 있다고 하신 사람은 누구인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (88, '부자', 0),
       (88, '권세 있는 사람', 1),
       (88, '마음이 가난한 사람', 2),
       (88, '율법학자', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (89, 8, '예수님이 물 위를 걸으신 장소는 어디인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (89, '사해', 0),
       (89, '갈릴리 바다', 1),
       (89, '홍해', 2),
       (89, '지중해', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (90, 8, '예수님이 삭개오를 만나신 도시는 어디인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (90, '나사렛', 0),
       (90, '베다니', 1),
       (90, '가버나움', 2),
       (90, '여리고', 3);


------------------------------- Stage 9 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (41, 9, '예수님이 최후의 만찬에서 제자들과 나누신 것은 무엇인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (41, '양고기', 0),
       (41, '물과 소금', 1),
       (41, '떡과 잔', 2),
       (41, '포도와 무화과', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (42, 9, '예수님이 십자가에 못 박히신 곳은 어디인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (42, '감람산', 0),
       (42, '골고다', 1),
       (42, '갈릴리', 2),
       (42, '여리고', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (43, 9, '예수님의 부활은 언제 이루어졌나요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (43, '첫째 날', 0),
       (43, '일주일 후', 1),
       (43, '열흘 후', 2),
       (43, '셋째 날', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (44, 9, '오순절에 제자들에게 임한 사건은 무엇인가요?', 0, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (44, '성령 강림', 0),
       (44, '성전 건축', 1),
       (44, '애굽 탈출', 2),
       (44, '요단강 건넘', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (45, 9, '베드로는 예수님을 몇 번 부인했나요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (45, '한 번', 0),
       (45, '두 번', 1),
       (45, '세 번', 2),
       (45, '네 번', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (91, 9, '예수님을 배반하여 넘긴 제자는 누구인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (91, '베드로', 0),
       (91, '유다', 1),
       (91, '요한', 2),
       (91, '도마', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (92, 9, '유다가 예수님을 넘기고 받은 은의 개수는 얼마인가요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (92, '은 삼십', 0),
       (92, '은 열', 1),
       (92, '은 스무', 2),
       (92, '은 백', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (93, 9, '예수님께 채찍질을 명령한 로마 총독은 누구인가요?', 3, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (93, '헤롯', 0),
       (93, '가야바', 1),
       (93, '안나스', 2),
       (93, '빌라도', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (94, 9, '예수님의 빈 무덤을 가장 먼저 발견한 인물은 누구인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (94, '베드로', 0),
       (94, '막달라 마리아', 1),
       (94, '요한', 2),
       (94, '니고데모', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (95, 9, '오순절에 첫 설교를 전한 사도는 누구인가요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (95, '바울', 0),
       (95, '야고보', 1),
       (95, '베드로', 2),
       (95, '스데반', 3);


------------------------------- Stage 10 -------------------------------

-- Q1
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (46, 10, '사울이 바울로 변화되는 사건은 어디로 가는 길에서 일어났나요?', 2, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (46, '예루살렘', 0),
       (46, '로마', 1),
       (46, '다메섹', 2),
       (46, '안디옥', 3);

-- Q2
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (47, 10, '바울이 마게도냐 사람의 환상을 보고 처음 전도하러 건너간 지역은 어디인가요?', 1, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (47, '소아시아', 0),
       (47, '마게도냐', 1),
       (47, '예루살렘', 2),
       (47, '로마', 3);

-- Q3
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (48, 10, '요한계시록이 기록된 것으로 알려진 섬은 어디인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (48, '몰타 섬', 0),
       (48, '구브로 섬', 1),
       (48, '크레타 섬', 2),
       (48, '밧모 섬', 3);

-- Q4
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (49, 10, '다음 중 사도 바울이 기록하지 않은 책은 무엇인가요?', 0, 'HARD');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (49, '마태복음', 0),
       (49, '로마서', 1),
       (49, '에베소서', 2),
       (49, '빌립보서', 3);

-- Q5
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (50, 10, '성령의 열매로 알려진 덕목은 무엇인가요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (50, '질투', 0),
       (50, '사랑', 1),
       (50, '분노', 2),
       (50, '교만', 3);

-- Q6
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (96, 10, '바울과 바나바가 함께 파송된 교회는 어디인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (96, '예루살렘 교회', 0),
       (96, '고린도 교회', 1),
       (96, '안디옥 교회', 2),
       (96, '에베소 교회', 3);

-- Q7
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (97, 10, '빌립보에서 바울과 함께 옥에 갇혔던 동역자는 누구인가요?', 3, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (97, '디모데', 0),
       (97, '마가', 1),
       (97, '아볼로', 2),
       (97, '실라', 3);

-- Q8
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (98, 10, '에베소서에 나오는 하나님의 전신갑주에 해당하는 것은 무엇인가요?', 0, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (98, '믿음의 방패', 0),
       (98, '금관', 1),
       (98, '창끝', 2),
       (98, '화살통', 3);

-- Q9
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (99, 10, '로마서에서 강조하는 사람이 의롭다 함을 얻는 근거는 무엇인가요?', 2, 'NORMAL');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (99, '행위', 0),
       (99, '율법', 1),
       (99, '믿음', 2),
       (99, '혈통', 3);

-- Q10
INSERT INTO quiz_question (id, stage_id, question_text, answer_index, difficulty)
VALUES (100, 10, '요한계시록에 따르면 새 예루살렘은 어디에서 내려온다고 하나요?', 1, 'EASY');
INSERT INTO quiz_question_option (question_id, option_text, option_index)
VALUES (100, '바다', 0),
       (100, '하늘', 1),
       (100, '광야', 2),
       (100, '산', 3);

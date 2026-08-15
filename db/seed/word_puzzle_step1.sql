-- 📌 성경 단어 퍼즐 STEP1
INSERT INTO public.word_puzzle
    (id, title, theme_code, difficulty_code, board_width, board_height, puzzle_status_code, published_at, created_at, updated_at)
VALUES (1, 'STEP1', 'SALVATION', 'EASY', 6, 6, 'PUBLISHED', '2026-03-02 02:29:54.694', '2026-03-02 02:29:54.694', '2026-03-02 04:55:51.220');

INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (1, 1, 1, '은혜', 'ACROSS', 0, 0, 1, 'DEFINITION', '값 없이 베풀어지는 호의나 선물', '2026-03-02 02:32:40.584');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (2, 1, 2, '믿음', 'ACROSS', 0, 3, 2, 'VERSE', '__은 바라는 것들의 실상이요 보이지 않는 것들의 증거니 (히브리서 11:1)', '2026-03-02 02:32:40.584');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (6, 1, 4, '음란', 'DOWN', 0, 4, 3, 'DEFINITION', '성경에서 혼인 밖 성관계 등 성적 부도덕을 뜻하는 말', '2026-03-02 02:32:40.584');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (3, 1, 8, '구원', 'ACROSS', 2, 0, 4, 'DEFINITION', '위험이나 멸망에서 건져내는 일', '2026-03-02 02:32:40.584');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (19, 1, 304, '원수', 'DOWN', 2, 1, 5, 'DEFINITION', '하나님 또는 하나님의 백성을 대적하는 존재를 가리키는 말', '2026-03-02 03:26:58.665');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (20, 1, 15, '대속', 'DOWN', 2, 3, 6, 'DEFINITION', '대신 값을 치러 죄인을 죄와 형벌에서 구원하는 것', '2026-03-02 03:53:11.236');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (5, 1, 14, '속죄', 'ACROSS', 3, 3, 7, 'DEFINITION', '죄를 덮어 그 죄를 용서 받게 하는 것', '2026-03-02 02:32:40.584');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (21, 1, 306, '죄인', 'DOWN', 3, 4, 8, 'DEFINITION', '하나님 앞에 죄를 범한 인간의 상태', '2026-03-02 04:39:05.561');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (4, 1, 7, '회개', 'ACROSS', 5, 0, 9, 'DEFINITION', '자신의 죄를 깨닫고 마음을 바꾸어 돌아가는 것', '2026-03-02 02:32:40.584');
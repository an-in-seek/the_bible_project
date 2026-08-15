INSERT INTO public.word_puzzle
    (id, title, theme_code, difficulty_code, board_width, board_height, puzzle_status_code, published_at, created_at, updated_at)
VALUES (2, 'STEP2', 'WORSHIP', 'EASY', 6, 6, 'PUBLISHED', '2026-03-02 12:00:00.000', '2026-03-02 12:00:00.000', '2026-03-02 12:00:00.000');

INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (100, 2, 24, '기도', 'ACROSS', 0, 0, 1, 'DEFINITION', '하나님께 마음을 열어 간구와 감사를 드리는 것', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (101, 2, 21, '성령', 'ACROSS', 0, 3, 2, 'VERSE', '보혜사 곧 아버지께서 내 이름으로 보내실 __은 너희에게 모든 것을 가르치시리라 (요한복음 14:26)', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (102, 2, 36, '성결', 'DOWN', 0, 3, 2, 'DEFINITION', '죄에서 깨끗하게 되어 하나님 뜻에 합당하게 사는 상태', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (103, 2, 25, '찬양', 'ACROSS', 2, 0, 3, 'DEFINITION', '하나님의 성품과 행하신 일을 인정하고 높이는 것', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (104, 2, 45, '양자', 'DOWN', 2, 1, 4, 'DEFINITION', '하나님이 믿는 자를 자녀로 받아들이시는 것', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (107, 2, 65, '자비', 'ACROSS', 3, 1, 5, 'DEFINITION', '연약하고 죄 있는 사람을 불쌍히 여기시는 하나님의 성품', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (22, 2, 177, '비유', 'DOWN', 3, 2, 6, 'DEFINITION', '청중에게 익숙한 사물이나 일상적인 사건을 소재로 삼아 영적 진리나 하나님 나라의 의미를 설명하는 방식', '2026-03-02 16:00:09.764');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (105, 2, 23, '예배', 'ACROSS', 2, 4, 7, 'DEFINITION', '하나님을 존귀히 여기고 경배와 순종을 드리는 것', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (106, 2, 307, '배드로', 'DOWN', 2, 5, 8, 'DEFINITION', '예수님의 열두 제자 중 한 사람으로 갈릴리 어부 출신이며 반석이라 이름을 받은 인물', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (108, 2, 27, '교회', 'ACROSS', 5, 0, 9, 'DEFINITION', '예수 그리스도를 믿는 사람들이 모여 하나님을 섬기는 공동체', '2026-03-02 12:00:00.000');
INSERT INTO public.word_puzzle_entry
    (id, word_puzzle_id, dictionary_id, answer_text, direction_code, start_row, start_col, clue_number, clue_type_code, clue_text, created_at)
VALUES (109, 2, 47, '말씀', 'ACROSS', 5, 3, 10, 'VERSE', '태초에 __이 계시니라 이 __이 하나님과 함께 계셨으니 (요한복음 1:1)', '2026-03-02 12:00:00.000');
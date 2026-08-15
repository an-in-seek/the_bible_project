-- ============================================================
-- dictionary_reference 스키마 마이그레이션
-- 변경: verse_reference/verse_excerpt → book_order/chapter_number/verse_number/verse_label (자연키)
-- 대상 DB: PostgreSQL 17
-- ============================================================

-- 1. 새 컬럼 추가 (nullable로 먼저 추가)
ALTER TABLE dictionary_reference ADD COLUMN book_order INTEGER;
ALTER TABLE dictionary_reference ADD COLUMN chapter_number INTEGER;
ALTER TABLE dictionary_reference ADD COLUMN verse_number INTEGER;
ALTER TABLE dictionary_reference ADD COLUMN verse_label VARCHAR(100);

-- 2. 기존 데이터 마이그레이션
--    verse_reference ("창세기 1:1") → verse_label로 복사
--    book_order, chapter_number, verse_number은 수동 매핑 필요
UPDATE dictionary_reference
SET verse_label = verse_reference,
    book_order = 0,
    chapter_number = 0,
    verse_number = 0;

-- ⚠️ 위 UPDATE는 임시값(0)을 넣은 것입니다.
-- 실제 운영 환경에서는 verse_reference를 파싱하여 올바른 값을 매핑해야 합니다.
-- 예: "창세기 1:1" → book_order=1, chapter_number=1, verse_number=1
-- 매핑 후 아래 검증 쿼리로 확인:
-- SELECT id, verse_reference, book_order, chapter_number, verse_number FROM dictionary_reference WHERE book_order = 0;

-- 3. NOT NULL 제약조건 추가
ALTER TABLE dictionary_reference ALTER COLUMN book_order SET NOT NULL;
ALTER TABLE dictionary_reference ALTER COLUMN chapter_number SET NOT NULL;
ALTER TABLE dictionary_reference ALTER COLUMN verse_number SET NOT NULL;
ALTER TABLE dictionary_reference ALTER COLUMN verse_label SET NOT NULL;

-- 4. 유니크 제약조건 추가
ALTER TABLE dictionary_reference
    ADD CONSTRAINT uk_dict_ref_verse UNIQUE (dictionary_id, book_order, chapter_number, verse_number);

-- 5. 레거시 컬럼 삭제
ALTER TABLE dictionary_reference DROP COLUMN verse_reference;
ALTER TABLE dictionary_reference DROP COLUMN verse_excerpt;

-- ============================================================
-- 롤백 스크립트 (필요 시)
-- ============================================================
-- ALTER TABLE dictionary_reference ADD COLUMN verse_reference VARCHAR(100);
-- ALTER TABLE dictionary_reference ADD COLUMN verse_excerpt TEXT;
-- UPDATE dictionary_reference SET verse_reference = verse_label, verse_excerpt = '';
-- ALTER TABLE dictionary_reference ALTER COLUMN verse_reference SET NOT NULL;
-- ALTER TABLE dictionary_reference ALTER COLUMN verse_excerpt SET NOT NULL;
-- ALTER TABLE dictionary_reference DROP CONSTRAINT uk_dict_ref_verse;
-- ALTER TABLE dictionary_reference DROP COLUMN book_order;
-- ALTER TABLE dictionary_reference DROP COLUMN chapter_number;
-- ALTER TABLE dictionary_reference DROP COLUMN verse_number;
-- ALTER TABLE dictionary_reference DROP COLUMN verse_label;

package com.elseeker.common

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import jakarta.persistence.Table
import org.springframework.beans.factory.InitializingBean
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class DatabaseCleaner(
    @PersistenceContext private val entityManager: EntityManager
) : InitializingBean {

    private var dirtyTableQuery: String? = null

    /**
     * 엔티티 메타모델에서 물리 테이블명을 모아 dirty 테이블 감지 쿼리를 한 번만 만들어 둔다.
     *
     * PostgreSQL 은 따옴표 없는 식별자를 소문자로 접어 저장하고 Hibernate 는 DDL 에 따옴표를 붙이지
     * 않으므로, `pg_class.relname` 과 비교하려면 애노테이션 값도 소문자로 맞춰야 한다.
     *
     * 테이블명을 확정할 수 없는 엔티티가 있으면 기동 시점에 실패시킨다. 그대로 두면 그 테이블만
     * 조용히 정리 대상에서 빠져, 뒤에 실행되는 테스트가 남은 데이터에 걸려 실행 순서에 따라
     * 성패가 갈리는 형태로 늦게 드러난다.
     */
    override fun afterPropertiesSet() {
        val entities = entityManager.metamodel.entities

        val unmapped = entities.filter { physicalTableNameOf(it.javaType) == null }
        check(unmapped.isEmpty()) {
            "물리 테이블명을 확정할 수 없는 엔티티가 있습니다 (@Table(name = \"...\") 누락): " +
                unmapped.joinToString(", ") { it.javaType.simpleName } +
                ". 이 엔티티는 정리 대상에서 빠져 테스트 간 데이터가 남습니다."
        }

        val tableNames = entities.mapNotNull { physicalTableNameOf(it.javaType) }.toSortedSet()

        dirtyTableQuery = if (tableNames.isEmpty()) {
            null
        } else {
            """
            SELECT c.relname FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = current_schema()
              AND c.relkind = 'r'
              AND c.relname IN (${tableNames.joinToString(", ") { "'$it'" }})
              AND pg_relation_size(c.oid) > 0
            """.trimIndent()
        }
    }

    /**
     * 이번 테스트에서 실제로 쓰기가 발생한 테이블만 단일 TRUNCATE 문으로 비운다.
     *
     * 테이블을 하나씩 TRUNCATE 하면 다른 테이블이 건 FK 제약에 걸린다. 그래서 이전에는 테이블마다
     * DISABLE TRIGGER -> TRUNCATE -> ENABLE TRIGGER 세 문장을 실행했다(엔티티 47개 = 메서드당 141문장).
     * PostgreSQL 의 TRUNCATE 는 여러 테이블을 한 번에 받으며, 한 문장에 함께 지정된 테이블들 사이에서는
     * FK 를 검사하지 않는다. 따라서 트리거를 껐다 켤 필요 자체가 없어지고 문장 수가 3N -> 1 이 된다.
     *
     * 다만 매번 47개 전부를 TRUNCATE 하면 비어 있는 테이블까지 relfilenode 를 새로 만들고 identity
     * 시퀀스를 되돌린다. 실제로 데이터가 들어가는 테이블은 테스트당 몇 개뿐이므로 [findDirtyTables] 로
     * 대상을 좁힌다. IntegrationTest 는 @BeforeEach 에서 member 한 건만 저장하므로, 대다수 테스트의
     * 감지 결과는 member 와 해당 테스트가 건드린 테이블뿐이다.
     *
     * CASCADE 는 선택이 아니라 필수다. 정리 대상을 dirty 테이블로 좁히는 순간, 비어 있어서 목록에서
     * 빠진 자식 테이블이 dirty 부모를 FK 로 참조하는 상황이 항상 생긴다. member 는 매 테스트가 쓰는데
     * 이를 참조하는 테이블 대부분은 비어 있으므로, CASCADE 가 없으면
     * "cannot truncate a table referenced in a foreign key constraint" 로 실패한다.
     * 파급된 테이블은 어차피 비어 있어 지울 행이 없다.
     *
     * 실측(postgres:17, 이 스키마 형태로 50회 평균, 서버 측 실행 시간):
     *   기존 3N 방식 519ms -> 이 방식 136ms. 감지를 생략하고 47개를 통째로 TRUNCATE 하면 367ms 다.
     *   JDBC 왕복이 141회에서 2회로 줄어드는 몫은 이 수치에 포함돼 있지 않으므로 실제 이득은 더 크다.
     */
    @Transactional
    fun execute() {
        val query = dirtyTableQuery ?: return
        entityManager.flushAndClear()

        val dirtyTables = findDirtyTables(query)
        if (dirtyTables.isEmpty()) return

        entityManager
            .createNativeQuery("TRUNCATE TABLE ${dirtyTables.joinToString(", ")} RESTART IDENTITY CASCADE")
            .executeUpdate()
    }

    /**
     * 힙 파일이 한 페이지라도 할당된 테이블을 찾는다.
     *
     * 테이블마다 `count(*)`/`EXISTS` 를 도는 것보다 싸다. 카탈로그를 한 번 훑고 테이블당 stat() 한 번이면
     * 끝나기 때문이다. 또한 판정 기준이 논리적 행 수가 아니라 물리적 파일 크기라 안전한 쪽으로 틀린다 —
     * INSERT 후 DELETE 했거나 롤백된 테스트도 페이지가 남아 있어 dirty 로 잡힌다.
     *
     * identity 시퀀스도 마찬가지다. nextval 은 INSERT 와 함께 일어나므로 시퀀스가 올라간 테이블은
     * 반드시 페이지가 할당돼 있고, 따라서 RESTART IDENTITY 대상에서 누락되지 않는다.
     */
    private fun findDirtyTables(query: String): List<String> {
        @Suppress("UNCHECKED_CAST")
        return entityManager.createNativeQuery(query).resultList as List<String>
    }

    private fun physicalTableNameOf(javaType: Class<*>): String? =
        javaType.getAnnotation(Table::class.java)?.name?.takeIf { it.isNotBlank() }?.lowercase()

    private fun EntityManager.flushAndClear() {
        this.flush()
        this.clear()
    }
}

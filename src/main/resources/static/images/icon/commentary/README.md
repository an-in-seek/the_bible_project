# 성경 주석 사이트 favicon 폴더

`bible-commentary.html` 페이지에서 사용하는 외부 사이트 favicon을 저장하는 위치입니다.

## 파일 명세

- **포맷**: PNG
- **크기**: 64×64 (Retina 대응)
- **명명**: `bible-commentary.js`의 `BIBLE_COMMENTARY_SITES[*].favicon` 경로와 일치

## 필요한 favicon 목록

| 파일명 | 출처 사이트 |
|---|---|
| `freebiblecommentary.png` | https://www.freebiblecommentary.org/ |
| `gotquestions.png` | https://www.gotquestions.org/ |
| `biblehub.png` | https://biblehub.com/ |
| `blueletterbible.png` | https://www.blueletterbible.org/ |
| `biblegateway.png` | https://www.biblegateway.com/ |
| `studylight.png` | https://www.studylight.org/ |
| `sacred-texts.png` | https://sacred-texts.com/ |
| `ccel.png` | https://ccel.org/ |
| `netbible.png` | https://netbible.org/ |

## 운영 정책

- 외부 사이트 favicon을 hot-linking하지 않고 정적 호스팅 (외부 사이트 다운 시 카드 깨짐 방지, 사용자 IP 추적 차단)
- 가능한 경우 사이트 정책 확인 후 자체 그래픽 또는 텍스트 로고로 대체
- 파일 부재 시 클라이언트는 사이트명 이니셜로 표시 (`bible-commentary.js`의 graceful degradation)

## 추가 시 작업

1. PNG 파일을 본 폴더에 저장
2. `bible-commentary.js`의 해당 항목 `favicon` 경로 확인
3. 캐시 버스팅 필요 시 JS `?v=` 갱신

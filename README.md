# PINGO · 사용자 제보 기반 재고 탐색

매장을 방문하기 전에 메뉴의 재고 정보를 확인하고, 방문자가 사진과 수량을 제보하는 웹 프로토타입입니다. React 화면과 Express API, MongoDB 저장 계층을 한 저장소에서 다룹니다.

## 구현 범위
- 메뉴 선택, 매장 조회, 사진을 포함한 재고 제보 화면
- 최근 1시간 제보의 신뢰도 가중 평균을 이용한 재고 추정
- 사진·위치·사용자 정확도를 반영한 신뢰도 계산
- 제보 포인트, 포인트 이력, 투표 및 리더보드 API

지도 영역은 실제 지도 SDK가 아닌 시각적 프로토타입입니다. 화면의 누적 통계와 사용자 ID는 데모 값이며 운영 지표가 아닙니다. 크롤러 연동은 주석 처리되어 있습니다.

## 구성
| 영역 | 기술 / 파일 |
|---|---|
| 화면 | React 18, Tailwind CSS, Lucide · `src/App.jsx` |
| API 클라이언트 | Fetch · `src/api/pingoAPI.js` |
| 서버 | Express 5, Multer · `server.js` |
| 데이터 | MongoDB, Mongoose · 사용자·매장·메뉴·제보·포인트 모델 |

## 로컬 실행
Node.js 20 이상과 로컬 MongoDB가 필요합니다.

```bash
npm ci
node server.js
```

다른 터미널에서:
```bash
npm run dev
```

루트의 로컬 `.env` 설정:
```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/pingo
PORT=5000
VITE_API_URL=http://localhost:5000/api
SEED_DEMO_DATA=false
```

최초 데모 메뉴·매장을 넣을 때만 `SEED_DEMO_DATA=true`로 실행한 후 다시 false로 바꿉니다. 기존 메뉴가 있으면 시드를 건너뛰며 시작 시 데이터를 삭제하지 않습니다. 초기 매장은 제보 데이터가 없어 재고 있음 목록에 나오지 않을 수 있습니다.

## 주요 API
| 메서드 | 경로 | 기능 |
|---|---|---|
| GET | /api/menus | 활성 메뉴 |
| GET | /api/menus/:menuId/stores | 재고가 있는 매장 |
| POST | /api/user/report-stock | multipart 제보, photo 선택 |
| GET | /api/user/:userId/points | 포인트 |
| POST | /api/report/:reportId/vote | 제보 투표 |
| GET | /api/leaderboard | 포인트 순위 |

## 개선 기록
- ESM 프로젝트에서 CommonJS를 사용하던 서버 시작 오류 수정
- 서버 재시작 시 데이터를 지우던 시드 동작 제거 및 명시적 실행으로 변경
- 업로드 디렉터리 자동 생성
- 포인트 API의 최상위 응답과 클라이언트의 data 응답 처리 불일치 수정
- API 주소를 환경 변수로 분리

## 다음 검증 과제
실제 회원 인증, 중복 투표 방지, 제보 입력 검증, 포인트 지급 트랜잭션, 빈 매장에서도 제보를 시작하는 흐름이 필요합니다. `npm run build`는 화면 빌드이며 DB 연동 성공을 의미하지 않습니다.

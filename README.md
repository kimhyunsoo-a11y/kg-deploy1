# 전생 이야기 (Past Life Web)

이름을 입력하면 OpenAI 모델이 그 사람의 **전생**을 이야기로 써 주는 한 기능짜리 서비스 웹입니다.
TypeScript + Next.js(App Router)로 만들어졌고 Vercel 배포에 최적화되어 있습니다.

## 구조

- `app/page.tsx` — 입력창 하나가 있는 프론트엔드 화면
- `app/api/past-life/route.ts` — OpenAI를 호출하는 서버 API (여기서만 API 키 사용 → 키가 브라우저에 노출되지 않음)
- `.env.local` — 로컬용 비밀 값 (git에 커밋되지 않음)

## 로컬 실행

```bash
npm install
# .env.local 파일을 열어 OPENAI_API_KEY 값을 채운다
npm run dev
# http://localhost:3000
```

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 키 (https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | ❌ | 사용할 모델 ID (기본값 `gpt-5.5`). 계정에서 지원하는 값으로 변경 |

## Vercel 배포

1. 이 저장소를 GitHub에 push
2. [Vercel](https://vercel.com/new)에서 이 GitHub 저장소를 **Import**
3. 프로젝트 **Settings → Environment Variables**에 `OPENAI_API_KEY`(및 필요 시 `OPENAI_MODEL`) 추가
4. Deploy → 이후 GitHub에 push할 때마다 자동 배포

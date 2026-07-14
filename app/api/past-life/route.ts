import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI 호출은 Node 런타임에서 실행 (Edge 아님)
export const runtime = "nodejs";
// Vercel serverless 함수 최대 실행 시간(초)
export const maxDuration = 30;

const SYSTEM_PROMPT = `당신은 신비로운 전생(前生) 이야기꾼입니다. 사용자가 입력한 이름을 가진 사람의 '전생'을 창의적이고 흥미롭게 상상해서 들려줍니다.

규칙:
- 이 결과는 오직 재미와 엔터테인먼트를 위한 것입니다. 실제 사실이나 운세, 예언이 아닙니다.
- 따뜻하고 신비로운 말투로, 한국어로 작성합니다.
- 다음 요소를 하나의 자연스러운 이야기로 녹여냅니다: 전생의 시대와 장소, 그 사람의 신분이나 직업, 성격, 인상적인 사건 하나, 그리고 그 전생이 지금의 삶에 남긴 흔적.
- 전체 분량은 한국어 350~550자 내외, 3~4개 문단으로 작성하고 문단 사이는 빈 줄로 구분합니다.
- 부정적이거나 불쾌한 내용, 특정 실존 인물에 대한 단정은 피하고, 긍정적이고 낭만적인 톤을 유지합니다.
- 이름의 뜻이나 어감에서 영감을 얻어도 좋습니다.
- 머리말/맺음말 없이 이야기 본문만 출력합니다.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-여기")) {
    return NextResponse.json(
      { error: "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 },
    );
  }

  let name = "";
  try {
    const body = await req.json();
    name = (body?.name ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json(
      { error: "이름이 너무 깁니다. (최대 40자)" },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.5";

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `이 사람의 전생을 이야기해 주세요: "${name}"` },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "결과를 생성하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({ name, result: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `AI 호출에 실패했습니다: ${message}` },
      { status: 502 },
    );
  }
}

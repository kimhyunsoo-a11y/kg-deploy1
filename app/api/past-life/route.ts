import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pastLives from "@/app/data/pastLives.json";

// OpenAI 호출은 Node 런타임에서 실행 (Edge 아님)
export const runtime = "nodejs";
// Vercel serverless 함수 최대 실행 시간(초)
export const maxDuration = 30;

type PastLife = {
  id: number;
  occupation: string;
  era: string;
  causeOfDeath: string;
  achievement: string;
  memory: string;
};

// 탑재된 150건 데이터셋
const DATA = pastLives as PastLife[];

// 이름 → 안정적인 인덱스. 같은 이름은 항상 같은 전생이 나온다 (FNV-1a 해시).
function pickIndex(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % DATA.length;
}

function toRecord(base: PastLife) {
  return {
    occupation: base.occupation,
    era: base.era,
    causeOfDeath: base.causeOfDeath,
    achievement: base.achievement,
    memory: base.memory,
  };
}

const SYSTEM_PROMPT = `당신은 신비로운 전생(前生) 이야기꾼입니다. 입력으로 사용자의 '이름'과, 그 사람에게 배정된 전생의 기본 설정(base)이 JSON으로 주어집니다.

당신의 일: base의 정체성(직업/존재, 시대)은 그대로 유지하면서, 그 이름을 가진 사람에게 어울리도록 각 항목을 생생하고 개성 있게 다시 써서 JSON으로 돌려줍니다.

규칙:
- 오직 재미와 엔터테인먼트를 위한 창작입니다. 실제 사실·운세·예언이 아닙니다.
- 한국어로, 따뜻하고 신비로운 말투로 작성합니다.
- occupation(직업/존재)과 era(시대)는 base의 핵심 설정을 벗어나지 마세요. 시대는 반드시 기원전 약 150만 년 ~ 1980년 사이여야 합니다. 표현만 다듬는 정도는 괜찮습니다.
- causeOfDeath(사인), achievement(업적), memory(사람들의 기억)는 base를 바탕으로 이름의 어감·뜻에서 영감을 얻어 개성 있게 확장하세요.
- 각 항목은 1~2문장, 너무 길지 않게.
- 부정적·불쾌한 표현이나 특정 실존 인물 단정은 피하고 낭만적인 톤을 유지합니다.
- 반드시 아래 키를 가진 JSON 객체 하나만 출력합니다. 다른 텍스트 금지:
  {"occupation": string, "era": string, "causeOfDeath": string, "achievement": string, "memory": string}`;

export async function POST(req: NextRequest) {
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

  // 1) 이름으로 탑재된 데이터셋에서 전생 하나를 고른다 (항상 동일)
  const base = DATA[pickIndex(name)];

  const apiKey = process.env.OPENAI_API_KEY;

  // 2) OpenAI 키가 없으면 → 데이터셋 원본을 그대로 반환 (앱은 항상 동작)
  if (!apiKey || apiKey.startsWith("sk-여기")) {
    return NextResponse.json({ name, source: "dataset", record: toRecord(base) });
  }

  // 3) OpenAI로 이름에 맞춰 개성 있게 다시 쓴다
  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-5.5";

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            name,
            base: {
              occupation: base.occupation,
              era: base.era,
              causeOfDeath: base.causeOfDeath,
              achievement: base.achievement,
              memory: base.memory,
            },
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Partial<PastLife>;

    const pick = (v: unknown, fallback: string) =>
      typeof v === "string" && v.trim() ? v.trim() : fallback;

    const record = {
      occupation: pick(parsed.occupation, base.occupation),
      era: pick(parsed.era, base.era),
      causeOfDeath: pick(parsed.causeOfDeath, base.causeOfDeath),
      achievement: pick(parsed.achievement, base.achievement),
      memory: pick(parsed.memory, base.memory),
    };

    return NextResponse.json({ name, source: "ai", record });
  } catch {
    // 4) AI 호출/파싱 실패 시에도 데이터셋 원본으로 응답 (서비스 중단 없음)
    return NextResponse.json({ name, source: "dataset", record: toRecord(base) });
  }
}

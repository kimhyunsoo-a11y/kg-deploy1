"use client";

import { useState } from "react";

type Record = {
  occupation: string;
  era: string;
  causeOfDeath: string;
  achievement: string;
  memory: string;
};

const FIELDS: { key: keyof Record; label: string; icon: string }[] = [
  { key: "occupation", label: "전생의 직업 또는 존재", icon: "🎭" },
  { key: "era", label: "시대", icon: "🕰️" },
  { key: "causeOfDeath", label: "사인 (죽은 이유)", icon: "⚰️" },
  { key: "achievement", label: "전생의 업적", icon: "🏆" },
  { key: "memory", label: "사람들은 나를 이렇게 기억합니다", icon: "🕊️" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<Record | null>(null);
  const [resultName, setResultName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setRecord(null);

    try {
      const res = await fetch("/api/past-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "요청에 실패했습니다.");
      }
      setRecord(data.record as Record);
      setResultName(trimmed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="stars" aria-hidden />
      <section className="card">
        <p className="eyebrow">✦ 전생 리딩 ✦</p>
        <h1 className="title">당신의 전생은?</h1>
        <p className="subtitle">
          이름을 넣으면 AI가 그 사람의 전생을 기록으로 들려드립니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요 (본인 또는 다른 사람)"
            maxLength={40}
            autoComplete="off"
            disabled={loading}
          />
          <button
            className="button"
            type="submit"
            disabled={loading || name.trim().length === 0}
          >
            {loading ? "전생을 들여다보는 중…" : "전생 보기"}
          </button>
        </form>

        {error && <p className="error">⚠ {error}</p>}

        {record && (
          <article className="result">
            <h2 className="resultTitle">
              <span className="resultName">{resultName}</span> 님의 전생 기록
            </h2>
            <dl className="record">
              {FIELDS.map(({ key, label, icon }) => (
                <div key={key} className="recordRow">
                  <dt className="recordLabel">
                    <span className="recordIcon">{icon}</span>
                    {label}
                  </dt>
                  <dd className="recordValue">{record[key]}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}

        <p className="disclaimer">
          ※ 결과는 AI가 상상해 만든 이야기로, 재미를 위한 콘텐츠입니다.
        </p>
      </section>
    </main>
  );
}

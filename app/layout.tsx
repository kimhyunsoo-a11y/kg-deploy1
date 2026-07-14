import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "전생 이야기 — 당신의 전생은?",
  description: "이름을 입력하면 AI가 그 사람의 전생을 이야기로 들려드립니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

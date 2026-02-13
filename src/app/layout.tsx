import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "whereorwhen — 여행지별 최적 시기를 알려주는 서비스",
  description:
    "날씨, 환율, 혼잡도, 버즈를 종합한 점수로 언제, 어디로 여행가야 할지 알려드립니다.",
  keywords: [
    "여행 최적 시기",
    "해외여행 추천",
    "여행지 추천",
    "환율",
    "날씨",
    "여행 점수",
  ],
  openGraph: {
    title: "whereorwhen — 여행지별 최적 시기",
    description:
      "날씨·환율·혼잡도·버즈 종합 점수로 최적의 여행 시기를 찾아보세요.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

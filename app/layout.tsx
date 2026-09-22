import type { Metadata } from "next";
import { Noto_Sans_SC, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeKit — 一份简历，无限定制变体",
  description:
    "针对不同岗位 JD，一键生成定制版简历变体。结构化板块库 + AI 语义匹配，让每一次投递都更精准。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${notoSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

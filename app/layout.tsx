import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-serif",
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
    <html lang="zh-CN" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

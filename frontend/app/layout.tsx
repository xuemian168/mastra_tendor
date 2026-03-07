import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tender Analysis System",
  description: "AI-powered document analysis for bid/no-bid decisions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

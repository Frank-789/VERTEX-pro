import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./providers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export const metadata: Metadata = {
  title: "Vertex - AI电商经营智能体",
  description: "面向中小电商卖家的AI全流程经营决策助手。多平台数据采集、选品分析、利润测算、主图生成。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full flex">
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <OnboardingModal />
        </ThemeProvider>
      </body>
    </html>
  );
}

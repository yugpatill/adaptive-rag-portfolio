import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adaptive RAG | Intelligent AI Chatbot",
  description:
    "An intelligent RAG chatbot that routes your queries to the right source: your documents, the web, or general AI knowledge.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-surface-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}

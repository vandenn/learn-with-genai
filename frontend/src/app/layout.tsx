import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Learn with GenAI",
  description: "AI-powered learning platform with markdown notes and intelligent assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

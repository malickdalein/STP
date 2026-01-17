import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Hub - Your Personal Reading & Podcast App",
  description: "Save and organize articles, podcasts, tweets, and more in one unified app.",
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

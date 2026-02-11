import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deck Configurator",
  description: "Design your deck and get an estimated material list",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

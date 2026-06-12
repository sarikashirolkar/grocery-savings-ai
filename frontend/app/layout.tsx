import "./globals.css";

import { Newsreader, Public_Sans } from "next/font/google";

import { QueryProvider } from "@/components/query-provider";

const newsreader = Newsreader({
  adjustFontFallback: false,
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"]
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "Grocery Savings AI",
  description: "Predict grocery baskets and optimize spend across stores."
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${publicSans.variable}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

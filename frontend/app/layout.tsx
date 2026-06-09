import "./globals.css";

import { QueryProvider } from "@/components/query-provider";


export const metadata = {
  title: "Grocery Savings AI",
  description: "Predict grocery baskets and optimize spend across stores."
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

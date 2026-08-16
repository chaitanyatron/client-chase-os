import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Chase OS",
  description: "Document request management for accounting firms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Runbook Repair Lab",
  description:
    "Repair fictional runbooks by checking structured prerequisites and tool versions. No commands executed.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

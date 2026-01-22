import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HVO Events",
  description: "Underground House Events - Tech House, House, Latin House, Techno",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

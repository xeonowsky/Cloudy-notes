import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import MainNavbar from "./components/navbar";
import Footer from "./components/footer";

const dmsans = DM_Sans({
  variable: "--dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloudy Notes",
  description: "Darmowa aplikacja do notatek",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${dmsans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MainNavbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

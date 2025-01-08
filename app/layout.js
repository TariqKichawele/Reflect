import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Reflect",
  description: "A personal reflection journal",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={` ${inter.className} bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50`}>
            <div className="bg-[url('/bg.jpg')] opacity-50 fixed -z-10 inset-0 "/>

            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster richColors />

            <footer className="bg-orange-300 py-12 bg-opacity-10">
              <div className="container mx-auto px-4 text-center text-gray-900">
                <p>Made with 💗 by TK</p>
              </div>
            </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}

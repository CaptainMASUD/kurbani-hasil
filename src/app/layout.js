import { DM_Sans } from "next/font/google";
import "./globals.css"; // Ensure this contains your Tailwind directives

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-dm-sans",
});

export const metadata = {
  title: "Kurbani Hasil - Smart Haat Automation Management",
  description: "পশুর হাটের হাসিল আদায় ডিজিটালাইজড ও স্বচ্ছ করার আধুনিক ক্লাউড প্ল্যাটফর্ম",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable}`} suppressHydrationWarning>
      <body 
        className="min-h-full flex flex-col font-sans antialiased" 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
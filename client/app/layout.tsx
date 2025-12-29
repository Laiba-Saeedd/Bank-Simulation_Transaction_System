// app/layout.tsx
import "./globals.css"; // if you have global CSS
export const metadata = { title: "Banking App" };
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}
          <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}

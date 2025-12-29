// app/layout.tsx
import "./globals.css"; // if you have global CSS
export const metadata = { title: "Banking App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

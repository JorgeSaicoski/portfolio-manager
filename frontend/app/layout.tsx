import Providers from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 20 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

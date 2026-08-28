export const metadata = {
  title: "Crafty Admin",
  description: "Crafty system administration"
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

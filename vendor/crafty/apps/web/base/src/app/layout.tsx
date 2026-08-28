export const metadata = {
  title: "Crafty",
  description: "Professional interface-design environment"
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

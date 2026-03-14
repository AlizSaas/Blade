import { ModeToggle } from "@/components/mode-toggle";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-end px-4 md:px-6">
          <ModeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

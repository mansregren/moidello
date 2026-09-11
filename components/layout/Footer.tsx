import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { OUTFIT_CREATE_PUBLIC } from "@/lib/flags";

const footerLinks = {
  Platform: [
    { href: "/", label: "Home" },
    { href: "/upptack", label: "Discover" },
    ...(OUTFIT_CREATE_PUBLIC ? [{ href: "/skapa", label: "Create" }] : []),
  ],
  Company: [
    { href: "/om", label: "About Moidello" },
    { href: "/faq", label: "FAQ" },
    { href: "/kontakt", label: "Contact" },
  ],
  Legal: [
    { href: "/villkor", label: "Terms of Use" },
    { href: "/integritet", label: "Privacy Policy" },
  ],
};

export function Footer({
  bg = "/images/bg/harbor.webp",
}: { bg?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border overflow-hidden">
      <div className="absolute inset-0">
        <Image src={bg} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-background/85" />
      </div>
      <Container className="relative z-10 py-16 md:py-24">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-heading text-3xl uppercase tracking-tight text-foreground"
            >
              Moidello
            </Link>
            <p className="mt-4 text-sm text-foreground-muted max-w-xs leading-relaxed">
              A platform for outfits and inspiration. Tag every piece, share where you found it.
            </p>
            <a
              href="mailto:hello@moidello.com"
              className="mt-6 inline-block text-sm text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
            >
              hello@moidello.com
            </a>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-[0.15em]">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <p className="text-xs text-foreground-subtle">
            © {year} Moidello. All rights reserved.
          </p>
          <p className="text-xs text-foreground-subtle tracking-wide">
            Made in Stockholm
          </p>
        </div>
      </Container>
    </footer>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { Container } from "./Container";

const footerLinks = {
  Plattform: [
    { href: "/feed", label: "Feed" },
    { href: "/discover", label: "Upptäck" },
    { href: "/create", label: "Skapa" },
  ],
  Företag: [
    { href: "#", label: "Om oss" },
    { href: "#", label: "Karriär" },
    { href: "#", label: "Press" },
  ],
  Support: [
    { href: "#", label: "Hjälpcenter" },
    { href: "#", label: "Villkor" },
    { href: "#", label: "Integritet" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src="/images/bg/harbor.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/85" />
      </div>
      <Container className="relative z-10 py-16 md:py-24">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-heading text-3xl uppercase tracking-tight text-white"
            >
              Moidello
            </Link>
            <p className="mt-4 text-sm text-foreground-muted max-w-xs">
              Upptäck, dela och shoppa outfits. Tagga varje plagg, länka var du köper.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-white/10"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground-subtle">
            © 2025 Moidello. Alla rättigheter förbehållna.
          </p>
          <p className="text-xs text-foreground-subtle flex items-center gap-1.5">
            Created in Sweden
            <span className="inline-block text-sm">🇸🇪</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export const dynamic = "force-static";

export default function IntegritetPage() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Legal
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Privacy Policy
            </h1>
            <p className="mt-6 text-sm text-foreground-muted">
              Last updated 6 May 2026
            </p>
          </div>

          <div className="space-y-12 text-foreground-muted leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                1. Introduction
              </h2>
              <p>
                Moidello cares about your privacy. This policy describes how we
                collect, use and protect information in connection with your use
                of the service, in accordance with the General Data Protection
                Regulation (GDPR).
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                2. Data controller
              </h2>
              <p>
                Moidello is the data controller for the processing of personal
                data within the service. Questions about the processing can be
                sent to{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
                >
                  hello@moidello.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                3. What data we collect
              </h2>
              <p>We collect limited information:</p>
              <ul className="mt-4 space-y-2 list-disc list-outside pl-6">
                <li>
                  <strong className="text-foreground font-medium">Anonymous visitor statistics</strong>
                  {" "}via Vercel Web Analytics — without cookies and without an
                  IP address that identifies an individual.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Local settings</strong>
                  {" "}(such as the chosen category filter) are stored in your
                  browser via localStorage. This data never leaves your device.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Click log for buy links</strong>
                  {" "}stores the visitor's country (ISO code, e.g. SE), referrer
                  and user agent when someone clicks a buy link in a tagged
                  outfit. This is used only for fraud detection and platform
                  statistics, and is deleted automatically after 90 days.
                </li>
              </ul>
              <p className="mt-4">
                When you create an account we also collect your email address,
                username and the content you publish.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                4. How we use the data
              </h2>
              <p>
                Anonymous statistics are used to understand how the service is
                used and to improve the experience. Local settings are used to
                personalise your feed. We never sell data to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                5. Third-party services
              </h2>
              <p>
                The service is hosted on Vercel. Anonymous visitor statistics
                are provided by Vercel Web Analytics. When you click an
                affiliate link published by another user you leave Moidello and
                are covered by the terms and privacy policy of the linked site.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                6. Cookies
              </h2>
              <p>
                Moidello uses no marketing or tracking cookies. We use only
                technically necessary storage (localStorage) to remember your
                settings between visits, plus a cookie that keeps you signed in.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                7. Your rights
              </h2>
              <p>
                Under the GDPR you have the right to request information about
                which personal data we process about you, and to request
                rectification, erasure, restriction or data portability. You
                also have the right to object to processing and to lodge a
                complaint with the Swedish Authority for Privacy Protection
                (IMY).
              </p>
              <p className="mt-4">
                Requests can be sent to{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
                >
                  hello@moidello.com
                </a>
                . We respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                8. Security
              </h2>
              <p>
                We take technical and organisational measures to protect the
                data we process against unauthorised access, loss and
                corruption.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                9. Changes
              </h2>
              <p>
                This policy may be updated. The date of the most recent update
                is shown above.
              </p>
            </section>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
            <Link
              href="/villkor"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Read the Terms of Use too →
            </Link>
          </div>
        </Container>
      </main>
    </>
  );
}

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export const dynamic = "force-static";

export default function VillkorPage() {
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
              Terms of Use
            </h1>
            <p className="mt-6 text-sm text-foreground-muted">
              Last updated 15 May 2026
            </p>
          </div>

          <div className="space-y-12 text-foreground-muted leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                1. Introduction
              </h2>
              <p>
                These terms (&quot;the Terms&quot;) govern your use of Moidello,
                a platform for discovering, sharing and being inspired by
                outfits. By using the service you accept the Terms in full. If
                you do not accept them, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                2. The service
              </h2>
              <p>
                Moidello is a platform where outfits are published as images,
                pieces are tagged and linked to where they can be bought. The
                service is provided as is. Features may change, be added or be
                removed without prior notice.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                3. User accounts
              </h2>
              <p>
                Some features require a user account. You are responsible for
                keeping your login details secure and for the accuracy of the
                information you provide. You may not transfer your account to
                anyone else.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                4. User-generated content
              </h2>
              <p>
                You retain ownership of the content you publish, but you grant
                Moidello a non-exclusive, royalty-free, worldwide licence to
                store, display and distribute the content within the service
                and to market the service.
              </p>
              <p className="mt-4">
                You warrant that you hold the rights to all content you
                publish, including images, trademarks and links, and that the
                content does not infringe the rights of any third party.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                5. Licence to uploaded content
              </h2>
              <p>
                You retain ownership of your content. By uploading it you grant
                Moidello the right to use, display and share it on our social
                media and in marketing, with credit to your profile. The
                licence ends for future use if you delete the content, but
                material already published on social media may remain.
              </p>
              <p className="mt-4">
                You warrant that you hold the rights to the content and have
                the consent of any people shown in the images.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                6. Affiliate links and marketing
              </h2>
              <p>
                Content that contains affiliate links or other commercial
                compensation must be clearly marked as advertising, in line
                with applicable marketing law and consumer-protection guidance.
                It is your responsibility as a user to ensure correct ad
                labelling.
              </p>
              <p className="mt-4">
                Moidello is not a party to any agreement between users,
                affiliate networks or brands, and has no responsibility for
                compensation generated through users' links.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                7. Prohibited content
              </h2>
              <p>You may not publish content that:</p>
              <ul className="mt-4 space-y-2 list-disc list-outside pl-6">
                <li>is unlawful, misleading or offensive</li>
                <li>infringes copyright or trademarks</li>
                <li>promotes copies, counterfeits or knock-offs</li>
                <li>links to malware, scams or illegal products</li>
                <li>breaches good marketing practice</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                8. Reporting infringement
              </h2>
              <p>
                If you believe content on Moidello infringes your copyright,
                trademark or other right, you can report it to{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
                >
                  hello@moidello.com
                </a>
                .
              </p>
              <p className="mt-4">A report should include:</p>
              <ul className="mt-4 space-y-2 list-disc list-outside pl-6">
                <li>a link to the content believed to infringe</li>
                <li>a description of the right that has been infringed</li>
                <li>
                  your contact details and a statement that the information is
                  accurate
                </li>
              </ul>
              <p className="mt-4">
                We review reports without undue delay, normally within five
                business days, and remove content that, on a first assessment,
                appears to infringe. The user who published the content is
                informed of the action and may submit a counter-notice if they
                believe the removal was in error.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                9. Moderation
              </h2>
              <p>
                Moidello reserves the right to remove content and to restrict
                or suspend accounts that breach the Terms, with no obligation
                to compensate. Reported content is reviewed within a reasonable
                time.
              </p>
              <p className="mt-4">
                Users who repeatedly publish content that infringes third-party
                rights may be permanently suspended without prior warning.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                10. Intellectual property
              </h2>
              <p>
                Moidello, the logo, trademarks and the platform's design belong
                to Moidello. Nothing in the Terms transfers any rights to you
                beyond the right to use the service under these terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                11. Limitation of liability
              </h2>
              <p>
                The service is provided as is, without warranties of any kind.
                To the extent permitted by law, Moidello is not liable for
                indirect damages, lost income or damages arising from
                interruptions, errors or loss of data.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                12. Changes
              </h2>
              <p>
                The Terms may be updated. Active users are informed of material
                changes. Continued use after changes means you accept the new
                terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                13. Governing law
              </h2>
              <p>
                Swedish law applies to the Terms. Disputes are settled by the
                Swedish courts, with Stockholm District Court as the court of
                first instance.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-4">
                14. Contact
              </h2>
              <p>
                Questions about the Terms can be sent to{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
                >
                  hello@moidello.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
            <Link
              href="/integritet"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Read the Privacy Policy too →
            </Link>
          </div>
        </Container>
      </main>
    </>
  );
}

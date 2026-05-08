/**
 * Wrapper around <a> for outgoing user-generated links — buy URLs,
 * social-bio links, anything pointing off-site that a user typed in.
 *
 * Why a single component:
 * - rel="ugc nofollow noopener noreferrer" is the canonical recipe for
 *   user-content external links: "ugc" tells search engines this is
 *   user-generated content, "nofollow" blocks SEO juice, "noopener"
 *   prevents the destination from accessing window.opener, "noreferrer"
 *   strips the Referer header
 * - target="_blank" so users don't lose their place
 * - One place to add tracking later (e.g. /go/[id] redirect wrapper)
 *
 * NOT for internal Next.js navigation — use next/link for that.
 */

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

interface UserLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  /** Set to false for mailto/tel etc. where target=_blank doesn't make sense */
  external?: boolean;
}

export const UserLink = forwardRef<HTMLAnchorElement, UserLinkProps>(
  function UserLink({ href, children, external, rel, target, ...rest }, ref) {
    const isMailtoOrTel = /^(mailto|tel|sms):/i.test(href);
    const treatExternal = external ?? !isMailtoOrTel;

    // Compose rel without overwriting caller-supplied tokens.
    const baseRel = treatExternal
      ? "ugc nofollow noopener noreferrer"
      : undefined;
    const finalRel = [rel, baseRel]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/)
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .join(" ");

    return (
      <a
        ref={ref}
        href={href}
        target={target ?? (treatExternal ? "_blank" : undefined)}
        rel={finalRel || undefined}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

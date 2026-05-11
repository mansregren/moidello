/**
 * Plain, restrained HTML templates that match Moidello's editorial tone.
 * Inline styles only — most email clients strip <style> tags. Tested
 * against Gmail web, Apple Mail and Outlook 365.
 */

const BASE_STYLES = `
  font-family: -apple-system, "Segoe UI", Inter, system-ui, sans-serif;
  color: #0b0b0b;
  line-height: 1.55;
`;

function wrap(body: string, footerNote?: string): string {
  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;padding:0;background:#f4f4f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #ececec;border-radius:18px;overflow:hidden;${BASE_STYLES}">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#777;font-weight:600;">Moidello</p>
              </td>
            </tr>
            <tr><td style="padding:0 32px 28px;">${body}</td></tr>
            <tr>
              <td style="padding:18px 32px;background:#fafaf8;border-top:1px solid #ececec;font-size:12px;color:#6e6e6e;">
                ${footerNote ?? ""}
                <p style="margin:0;">Moidello · Inspiration för varje outfit · <a href="https://moidello.com" style="color:#0b0b0b;text-decoration:none;">moidello.com</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail(opts: {
  displayName: string;
  username: string;
}): { html: string; text: string; subject: string } {
  const url = `https://moidello.com/profile/${opts.username}`;
  return {
    subject: `Välkommen till Moidello, ${opts.displayName}`,
    html: wrap(`
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.01em;">Välkommen.</h1>
      <p style="margin:0 0 18px;">Hej ${opts.displayName} — kul att du är här. Din profil är klar och redo att fyllas.</p>
      <p style="margin:0 0 24px;">Börja med att ladda upp din första outfit, eller bläddra runt och se vad andra delar.</p>
      <p style="margin:0;">
        <a href="${url}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.02em;">Öppna din profil</a>
      </p>
    `),
    text: `Välkommen till Moidello, ${opts.displayName}.\n\nDin profil ligger på ${url}.\n\n— Moidello`,
  };
}

export function newFollowerEmail(opts: {
  recipientName: string;
  followerName: string;
  followerUsername: string;
}): { html: string; text: string; subject: string } {
  const url = `https://moidello.com/profile/${opts.followerUsername}`;
  return {
    subject: `${opts.followerName} följer dig nu på Moidello`,
    html: wrap(`
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;">Ny följare</h1>
      <p style="margin:0 0 18px;">Hej ${opts.recipientName} — <strong>${opts.followerName}</strong> följer dig nu.</p>
      <p style="margin:0;">
        <a href="${url}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;">Visa profil</a>
      </p>
    `),
    text: `${opts.followerName} följer dig nu på Moidello.\n\n${url}`,
  };
}

export function newCommentEmail(opts: {
  recipientName: string;
  commenterName: string;
  commentBody: string;
  outfitTitle: string;
  outfitUrl: string;
}): { html: string; text: string; subject: string } {
  return {
    subject: `${opts.commenterName} kommenterade din outfit`,
    html: wrap(`
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;">Ny kommentar</h1>
      <p style="margin:0 0 8px;color:#555;">På <strong>${opts.outfitTitle}</strong></p>
      <blockquote style="margin:0 0 18px;padding:14px 18px;border-left:3px solid #0b0b0b;background:#fafaf8;font-size:15px;">
        ${escapeHtml(opts.commentBody)}
      </blockquote>
      <p style="margin:0 0 18px;color:#555;">– ${opts.commenterName}</p>
      <p style="margin:0;">
        <a href="${opts.outfitUrl}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;">Öppna outfit</a>
      </p>
    `),
    text: `${opts.commenterName} kommenterade din outfit "${opts.outfitTitle}":\n\n${opts.commentBody}\n\n${opts.outfitUrl}`,
  };
}

export function newMessageEmail(opts: {
  recipientName: string;
  senderName: string;
  senderUsername: string;
}): { html: string; text: string; subject: string } {
  const url = `https://moidello.com/meddelanden`;
  return {
    subject: `${opts.senderName} skickade ett meddelande`,
    html: wrap(`
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;">Nytt meddelande</h1>
      <p style="margin:0 0 18px;">Hej ${opts.recipientName} — <strong>${opts.senderName}</strong> (@${opts.senderUsername}) har skickat dig ett meddelande på Moidello.</p>
      <p style="margin:0;">
        <a href="${url}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;">Öppna inkorgen</a>
      </p>
    `),
    text: `${opts.senderName} (@${opts.senderUsername}) skickade ett meddelande.\n\n${url}`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SanitizeOptions = {
  title: string;
  brandName: string;
  description?: string;
};

/**
 * Ensures published HTML has your branding in the <head> so link previews
 * (Telegram/WhatsApp/etc.) don't display default template metadata.
 */
export function sanitizePublishedHtml(rawHtml: string, opts: SanitizeOptions): string {
  const description =
    opts.description ??
    `Built with ${opts.brandName}. Create and publish landing pages in minutes.`;
  const safeTitle = opts.title?.trim() ? `${opts.title} — ${opts.brandName}` : opts.brandName;

  // Browser-side robust path
  try {
    if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, "text/html");

      // Ensure head exists
      const head = doc.head ?? doc.getElementsByTagName("head")[0];
      if (!head) {
        // Extremely rare; fallback to regex path below
        throw new Error("Missing head");
      }

      doc.title = safeTitle;

      const upsertMeta = (selector: string, create: () => HTMLMetaElement, content: string) => {
        let el = doc.head.querySelector(selector) as HTMLMetaElement | null;
        if (!el) {
          el = create();
          doc.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };

      upsertMeta(
        'meta[name="description"]',
        () => {
          const m = doc.createElement("meta");
          m.setAttribute("name", "description");
          return m;
        },
        description
      );

      upsertMeta(
        'meta[property="og:title"]',
        () => {
          const m = doc.createElement("meta");
          m.setAttribute("property", "og:title");
          return m;
        },
        safeTitle
      );
      upsertMeta(
        'meta[property="og:description"]',
        () => {
          const m = doc.createElement("meta");
          m.setAttribute("property", "og:description");
          return m;
        },
        description
      );

      upsertMeta(
        'meta[name="twitter:title"]',
        () => {
          const m = doc.createElement("meta");
          m.setAttribute("name", "twitter:title");
          return m;
        },
        safeTitle
      );
      upsertMeta(
        'meta[name="twitter:description"]',
        () => {
          const m = doc.createElement("meta");
          m.setAttribute("name", "twitter:description");
          return m;
        },
        description
      );

      // Remove common default strings if they appear in title/description
      // (kept minimal to avoid breaking user content).
      doc.title = doc.title
        .replace(/\bLovable App\b/gi, opts.brandName)
        .replace(/\bLovable Generated Project\b/gi, description);

      return "<!doctype html>\n" + doc.documentElement.outerHTML;
    }
  } catch {
    // Fall through to regex replacement
  }

  // Regex fallback (runs in any environment). Intentionally conservative.
  let html = rawHtml;

  const replaceOrInsert = (pattern: RegExp, replacement: string, insertAfter?: RegExp) => {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
      return;
    }
    if (insertAfter && insertAfter.test(html)) {
      html = html.replace(insertAfter, (m) => `${m}\n${replacement}`);
    }
  };

  replaceOrInsert(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(safeTitle)}</title>`);
  replaceOrInsert(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    /<head[^>]*>/i
  );
  replaceOrInsert(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(safeTitle)}" />`,
    /<head[^>]*>/i
  );
  replaceOrInsert(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    /<head[^>]*>/i
  );

  // Last resort string replacements for known defaults
  html = html
    .replace(/Lovable App/gi, opts.brandName)
    .replace(/Lovable Generated Project/gi, description);

  return html;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

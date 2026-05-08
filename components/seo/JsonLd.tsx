/**
 * Server-renders a <script type="application/ld+json"> element. Use this
 * to attach structured data (schema.org) blobs to a page so search
 * engines can understand the content without scraping the DOM.
 *
 * The data object is JSON.stringify'd and inserted via
 * dangerouslySetInnerHTML, which is the documented pattern for JSON-LD
 * in React. Don't pass user-controlled data without escaping — every
 * caller in this app builds the object server-side from typed values.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

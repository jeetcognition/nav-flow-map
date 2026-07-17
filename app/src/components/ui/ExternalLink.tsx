import type { AnchorHTMLAttributes, ReactNode } from "react";

/** Only http(s) URLs are rendered as links — data-sourced URLs can't inject javascript: etc. */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> {
  href: string;
  children: ReactNode;
}

/** External link with enforced noopener/noreferrer and URL-scheme validation. */
export function ExternalLink({ href, children, ...rest }: Props) {
  if (!isSafeUrl(href)) {
    return <span {...rest}>{children}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

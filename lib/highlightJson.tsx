import type { ReactNode } from "react";

/**
 * Resaltado de sintaxis JSON sin dependencias.
 * Las cadenas se consumen completas antes que los números, así que
 * los dígitos dentro de una URL nunca se colorean como números.
 */
const TOKEN_PATTERN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export function highlightJson(json: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of json.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(json.slice(cursor, index));

    const [token, quoted, colon, literal] = match;
    if (quoted && colon) {
      nodes.push(<span key={key++} className="tok-key">{quoted}</span>, colon);
    } else if (quoted) {
      nodes.push(<span key={key++} className="tok-string">{quoted}</span>);
    } else if (literal) {
      nodes.push(<span key={key++} className="tok-literal">{literal}</span>);
    } else {
      nodes.push(<span key={key++} className="tok-number">{token}</span>);
    }
    cursor = index + token.length;
  }

  if (cursor < json.length) nodes.push(json.slice(cursor));
  return nodes;
}

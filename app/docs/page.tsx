import { readFile } from "node:fs/promises";
import path from "node:path";

import GithubSlugger from "github-slugger";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/CopyButton";
import { highlightJson } from "@/lib/highlightJson";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Documentación" };

/** El Markdown de la Parte 1 es la única fuente: esta página lo renderiza tal cual. */
const DOC_PATH = path.join(process.cwd(), "docs", "character-endpoint.md");

interface TocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

/** Genera el índice con el mismo algoritmo de slugs que rehype-slug, para que los enlaces coincidan. */
function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  return [...markdown.matchAll(/^(#{1,3}) (.+)$/gm)].flatMap(([, hashes, title]) => {
    const id = slugger.slug(title);
    return hashes.length === 1 ? [] : [{ id, title, level: hashes.length as 2 | 3 }];
  });
}

/** Extrae el texto plano de un nodo HAST (para el botón de copiar). */
function textOf(node: unknown): string {
  const current = node as { value?: string; children?: unknown[] };
  if (typeof current.value === "string") return current.value;
  return (current.children ?? []).map(textOf).join("");
}

const markdownComponents: Components = {
  table: ({ node: _node, ...props }) => (
    <div className={styles.tableWrap}>
      <table {...props} />
    </div>
  ),
  pre: ({ node, children }) => {
    const code = textOf(node).replace(/\n$/, "");
    return (
      <div className={styles.codeWrap}>
        <span className={styles.copy}>
          <CopyButton text={code} />
        </span>
        <pre className="code-block">{children}</pre>
      </div>
    );
  },
  code: ({ node: _node, className, children, ...props }) => {
    if (className === "language-json") {
      return <code className={className}>{highlightJson(String(children).replace(/\n$/, ""))}</code>;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export default async function DocsPage() {
  const markdown = await readFile(DOC_PATH, "utf8");
  const toc = buildToc(markdown);

  return (
    <div className={styles.layout}>
      <aside className={styles.toc} aria-label="En esta página">
        <p className={styles.tocTitle}>En esta página</p>
        <ol>
          {toc.map((item) => (
            <li key={item.id} className={item.level === 3 ? styles.tocSub : undefined}>
              <a href={`#${item.id}`}>{item.title}</a>
            </li>
          ))}
        </ol>
      </aside>

      <article className={styles.prose}>
        <span className="eyebrow">Referencia de API</span>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      </article>

      <aside className={styles.rail}>
        <div className={styles.cta}>
          <p className={styles.ctaTitle}>Pruébalo en vivo</p>
          <p className={styles.ctaText}>Envía peticiones reales y mira la respuesta sin salir de la documentación.</p>
          <Link href="/try" className="btn btn-primary">
            Abrir consola
          </Link>
        </div>
      </aside>
    </div>
  );
}

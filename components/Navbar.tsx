"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { parseCharacterId } from "@/lib/rickandmorty";

import styles from "./Navbar.module.css";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/docs", label: "Docs" },
  { href: "/try", label: "Try it out" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Atajo "/" para abrir la búsqueda y Escape para cerrarla.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Al abrir, enfocamos el campo; un clic fuera la cierra.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!formRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = parseCharacterId(value);
    if (id === null) {
      setError("Ingresa un ID numérico mayor que 0.");
      return;
    }
    setError(null);
    setValue("");
    setOpen(false);
    router.push(`/character/${id}`);
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.left}>
          <nav className={styles.nav} aria-label="Principal">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.link}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link href="/" className={styles.logo} aria-label="Rick and Morty, ir al inicio">
          <Wordmark variant="inline" />
        </Link>

        <div className={styles.right}>
          <form
            ref={formRef}
            className={`${styles.search} ${open ? styles.searchOpen : ""}`}
            onSubmit={handleSubmit}
            role="search"
          >
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Buscar personaje por ID"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className={styles.popover} hidden={!open}>
              <label htmlFor="nav-search" className={styles.popoverLabel}>
                Ir a un personaje <kbd>/</kbd>
              </label>
              <div className={styles.field}>
                <span className={styles.prefix}>/character/</span>
                <input
                  ref={inputRef}
                  id="nav-search"
                  className={styles.input}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="ID"
                  value={value}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "nav-search-error" : undefined}
                  onChange={(event) => {
                    setValue(event.target.value);
                    if (error) setError(null);
                  }}
                />
                <button type="submit" className={styles.go} aria-label="Buscar">
                  →
                </button>
              </div>
              {error && (
                <p id="nav-search-error" role="alert" className={styles.error}>
                  {error}
                </p>
              )}
            </div>
          </form>

          <Link href="/try" className={styles.cta}>
            Probar API
          </Link>
        </div>
      </div>
    </header>
  );
}

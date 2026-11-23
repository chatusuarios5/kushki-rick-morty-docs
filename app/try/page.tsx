import type { Metadata } from "next";
import { Suspense } from "react";

import { TryItOut } from "@/components/TryItOut";

export const metadata: Metadata = { title: "Try it out" };

export default function TryPage() {
  // useSearchParams (para ?id=) necesita un límite de Suspense en páginas estáticas.
  return (
    <Suspense fallback={null}>
      <TryItOut />
    </Suspense>
  );
}

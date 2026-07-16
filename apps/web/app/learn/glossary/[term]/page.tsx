import { GlossaryTermView } from "@/components/lessons/glossary-view";
import { getTerm, TERM_IDS, type TermId } from "@/lib/glossary";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return TERM_IDS.map((term) => ({ term }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>;
}): Promise<Metadata> {
  const { term } = await params;
  const entry = getTerm(term);
  if (!entry) return { title: "Term not found" };
  return { title: entry.term, description: entry.what };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  if (!getTerm(term)) notFound();
  return <GlossaryTermView id={term as TermId} />;
}

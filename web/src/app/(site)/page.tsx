import React from "react";
import { loadSiteEvidence } from "@/lib/siteEvidence";
import { Hero, Proof, RunIt, Steps } from "@/components/site/HomeSections";
import { ScrollFx } from "@/components/site/ScrollFx";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

// Figures come from committed evidence files read at request time, never from constants in the page.
export const dynamic = "force-dynamic";

export default function LandingPage() {
  const evidence = loadSiteEvidence();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Steps evidence={evidence} />
        <Proof evidence={evidence} />
        <RunIt />
      </main>
      <SiteFooter />
      <ScrollFx />
    </>
  );
}

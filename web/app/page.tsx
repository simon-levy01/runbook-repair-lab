import Link from "next/link";
import Lab from "../components/lab";
import { getGuides, projectId, dataset, publicDatasetUrl } from "../lib/sanity";
export const dynamic = "force-dynamic";
export default async function Home() {
  let guides;
  try {
    guides = await getGuides();
  } catch {
    /* A truthful service failure; never fake fallback content. */
  }
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            R<span>↗</span>
          </span>
          Runbook Repair Lab
        </Link>
        <a
          className="source-link"
          href="https://github.com/simon-levy01/runbook-repair-lab"
        >
          Source ↗
        </a>
      </header>
      <main>
        <section className="intro">
          <div>
            <h1>
              A guide is only as good
              <br className="desktop-break" /> as its starting conditions.
            </h1>
            <p>
              Find missing prerequisites and incompatible versions.
              <br className="desktop-break" /> Repair a fictional runbook
              without running a single command.
            </p>
          </div>
          <div className="intro-note">
            <span className="read-only-dot" />
            Read-only Sanity content<span>Browser-local experiments</span>
          </div>
        </section>
        {guides ? (
          <Lab guides={guides} />
        ) : (
          <section className="service-error">
            <h2>The guide library is unavailable</h2>
            <p>
              We could not load valid published content from Sanity. Your saved
              experiments have not been changed.
            </p>
            <Link href="/">Try loading again ↗</Link>
          </section>
        )}
        <section className="provenance">
          <div>
            <h2>Structured content. Explainable findings.</h2>
            <p>
              Sanity stores tool releases, capability prerequisites and ordered
              guide steps. The server queries published content; deterministic
              browser checks explain each dependency and version conflict.
              Everything here is fictional.
            </p>
          </div>
          <a href={publicDatasetUrl} target="_blank" rel="noreferrer">
            Explore the public dataset ↗
            <small>
              Project {projectId} · {dataset}
            </small>
          </a>
        </section>
      </main>
      <footer>
        <span>Built with Next.js + Sanity</span>
        <span>Designed and coded with OpenAI Codex · No runtime AI</span>
        <span>MIT source</span>
      </footer>
    </>
  );
}

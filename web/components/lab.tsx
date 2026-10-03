"use client";
import { useState, useSyncExternalStore } from "react";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
import {
  baseline,
  inspect,
  repair,
  restore,
  type Guide,
  type Experiment,
} from "../lib/model";
function LabExperiment({
  guide,
  ready,
  approved,
}: {
  guide: Guide;
  ready: boolean;
  approved?: Experiment;
}) {
  const storageKey = `runbook-repair:v1:${guide.id}`;
  const [initial] = useState(() => {
    if (!ready) return { experiment: baseline(guide), available: true };
    try {
      return {
        experiment: restore(guide, localStorage.getItem(storageKey)),
        available: true,
      };
    } catch {
      return { experiment: baseline(guide), available: false };
    }
  });
  const [experiment, setExperiment] = useState<Experiment>(initial.experiment);
  const [storageAvailable, setStorageAvailable] = useState(initial.available);
  const [notice, setNotice] = useState("");
  function update(next: Experiment, message = "") {
    setExperiment(next);
    setNotice(message);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ revision: guide.revision, experiment: next }),
      );
    } catch {
      setStorageAvailable(false);
    }
  }
  const findings = inspect(guide, experiment);
  const enabled = guide.steps.filter(
    (s) => !experiment.disabled.includes(s.id),
  ).length;
  const toggle = (field: "prerequisites" | "disabled", id: string) => {
    update({
      ...experiment,
      [field]: experiment[field].includes(id)
        ? experiment[field].filter((item) => item !== id)
        : [...experiment[field], id],
    });
  };
  return (
    <>
      <section className="guide-workspace" aria-labelledby="guide-title">
        <div className="guide-heading">
          <div>
            <p className="section-label">
              Published guide · {guide.difficulty}
            </p>
            <h2 id="guide-title">{guide.title}</h2>
            <p>{guide.summary}</p>
          </div>
          <span className="step-count">{guide.steps.length} steps</span>
        </div>
        <div className="status-strip" aria-live="polite">
          <span className={`status-dot ${findings.length ? "warning" : ""}`} />
          <strong>
            {!ready
              ? "Loading experiment…"
              : enabled === 0
                ? "All steps skipped"
                : findings.length
                  ? `${findings.length} findings in this experiment`
                  : "All enabled steps pass"}
          </strong>
          <span>
            {enabled} / {guide.steps.length} enabled
          </span>
        </div>
        <section className="status-strip">
          <span>
            {approved
              ? "Owner-approved repair available in this snapshot."
              : "No current owner-approved repair in this snapshot."}
          </span>
          {approved && (
            <button
              onClick={() =>
                update(approved, "Loaded owner-approved conditions locally.")
              }
            >
              Try owner-approved repair
            </button>
          )}
        </section>
        <ol className="steps">
          {guide.steps.map((step, index) => {
            const issues = findings.filter((f) => f.step === step.id);
            const skipped = experiment.disabled.includes(step.id);
            return (
              <li key={step.id} className={`step ${skipped ? "skipped" : ""}`}>
                <div className="step-top">
                  <span className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                  <label className="skip">
                    <input
                      type="checkbox"
                      checked={!skipped}
                      onChange={() => toggle("disabled", step.id)}
                      disabled={!ready}
                      aria-label={`Enable ${step.title}`}
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <code className="command">{step.example}</code>
                <p className="command-caption">
                  Fictional example · displayed only, never executed
                </p>
                <div className="contracts">
                  <span>
                    <b>Needs</b> {step.needs.join(", ") || "nothing"}
                  </span>
                  <span>
                    <b>Produces</b> {step.gives.join(", ") || "nothing"}
                  </span>
                </div>
                {skipped ? (
                  <p className="skipped-note">
                    Skipped in your experiment. This step produces no
                    capabilities.
                  </p>
                ) : issues.length ? (
                  <ul className="findings">
                    {issues.map((f) => (
                      <li key={f.id}>
                        <span className="finding-kind">
                          {f.kind === "version" ? "Version" : "Dependency"}
                        </span>
                        <strong>{f.title}</strong>
                        <p>{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="passed">✓ Requirements satisfied</p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <aside className="inspector" aria-labelledby="experiment-title">
        <div className="inspector-heading">
          <span className="lab-icon" aria-hidden="true">
            ⌁
          </span>
          <h2 id="experiment-title">Your experiment</h2>
        </div>
        <p>Change the starting conditions. Watch the guide respond.</p>
        <fieldset disabled={!ready}>
          <legend>Prerequisites</legend>
          <p className="field-help">
            Which capabilities are already available?
          </p>
          {guide.prerequisites.map((p) => (
            <label className="prerequisite" key={p.id}>
              <input
                type="checkbox"
                checked={experiment.prerequisites.includes(p.id)}
                onChange={() => toggle("prerequisites", p.id)}
              />
              <span>
                <strong>{p.title}</strong>
                <small>{p.detail}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset disabled={!ready}>
          <legend>Tool versions</legend>
          <p className="field-help">
            Fictional major releases, checked inclusively.
          </p>
          {guide.defaults.map((d) => (
            <label className="version-control" key={d.tool.id}>
              <span>{d.tool.title}</span>
              <select
                aria-label={`${d.tool.title} version`}
                value={experiment.versions[d.tool.id]}
                onChange={(e) => {
                  update({
                    ...experiment,
                    versions: {
                      ...experiment.versions,
                      [d.tool.id]: Number(e.target.value),
                    },
                  });
                }}
              >
                {d.tool.releases.map((v) => (
                  <option key={v} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
        <button
          className="primary"
          disabled={!ready}
          onClick={() => {
            const next = repair(guide);
            update(
              next,
              inspect(guide, next).length
                ? "Starting conditions updated. Remaining findings need a guide author correction."
                : "Compatible starting conditions applied. All steps restored.",
            );
          }}
        >
          Try compatible conditions <span aria-hidden="true">↗</span>
        </button>
        <button
          className="reset"
          disabled={!ready}
          onClick={() => {
            update(
              baseline(guide),
              "Reset to the published starting conditions.",
            );
          }}
        >
          Reset experiment
        </button>
        <p className="notice" role="status">
          {notice}
        </p>
        <div className="local-note">
          <strong>Only on this browser</strong>
          <p>
            {storageAvailable
              ? "Changes are saved locally and survive refresh. Nothing is written to Sanity."
              : "Browser storage is unavailable. Changes last only until refresh."}
          </p>
          <p>
            Reset restores the original missing prerequisites and tool versions.
          </p>
        </div>
        <details>
          <summary>How the checks work</summary>
          <p>
            Steps are checked in order. Each needs declared capabilities and
            supported published tool releases. Only enabled steps with no
            findings supply outputs to later steps.
          </p>
          <p>
            These checks cover modeled dependencies and major version ranges.
            They do not prove a real command is safe or correct.
          </p>
        </details>
      </aside>
    </>
  );
}
export default function Lab({
  guides,
  approved = {},
}: {
  guides: Guide[];
  approved?: Record<string, Experiment>;
}) {
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [selectedId, setSelectedId] = useState(guides[0].id);
  const guide = guides.find((g) => g.id === selectedId) ?? guides[0];
  return (
    <div className="lab-layout">
      <nav className="library" aria-label="Guide library">
        <h2>Guide library</h2>
        <p>{guides.length} fictional runbooks</p>
        {guides.map((g, index) => (
          <button
            key={g.id}
            className={`guide-choice ${g.id === guide.id ? "selected" : ""}`}
            aria-pressed={g.id === guide.id}
            onClick={() => setSelectedId(g.id)}
          >
            <span className="guide-index">0{index + 1}</span>
            <span>
              <strong>{g.title}</strong>
              <small>
                {g.steps.length} steps · {g.difficulty}
              </small>
            </span>
            <span className="choice-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
        <div className="library-note">
          <span aria-hidden="true">◎</span>
          <p>
            Same guide.
            <br />
            Different conditions.
            <br />
            <strong>See what breaks.</strong>
          </p>
        </div>
      </nav>
      <LabExperiment
        key={`${guide.id}:${guide.revision}:${ready}`}
        guide={guide}
        ready={ready}
        approved={approved[guide.id]}
      />
    </div>
  );
}

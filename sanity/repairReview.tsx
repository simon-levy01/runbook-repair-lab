import {useState, useEffect} from 'react'
import {useClient, useCurrentUser, definePlugin} from 'sanity'
import {query} from '../web/lib/query'
import {parseGuides, inspect, repair, type Guide} from '../web/lib/model'
import {
  fingerprint,
  validateProposal,
  decisionMutations,
  storedExperiment,
} from '../web/lib/workflow.mjs'
type Proposal = {
  _id: string
  _rev: string
  _type: string
  title: string
  status: string
  guide: {_ref: string}
  fingerprint: string
  experiment: ReturnType<typeof repair>
}
type Source = {_id: string; _rev: string}
const reviewQuery = `{ "guides": ${query}, "sources": *[_type in ["guide", "tool", "prerequisite"] && !(_id in path("drafts.**"))]{_id,_rev}, "proposals": *[_type == "repairProposal" && !(_id in path("drafts.**"))] | order(createdAt desc)[0...100] }`
function ReviewTool() {
  const client = useClient({apiVersion: '2026-09-01'}).withConfig({
    useCdn: false,
    perspective: 'published',
  })
  const user = useCurrentUser()
  const owner = Boolean(user?.roles.some((role) => role.name === 'administrator'))
  const [guides, setGuides] = useState<Guide[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [message, setMessage] = useState('Loading published content…')
  const [busy, setBusy] = useState(false)
  async function snapshot() {
    const result = await client.fetch<{guides: unknown; sources: Source[]; proposals: Proposal[]}>(
      reviewQuery,
    )
    const guides = await Promise.all(
      parseGuides(result.guides).map(async (guide) => ({
        ...guide,
        revision: await fingerprint(guide),
      })),
    )
    setGuides(guides)
    setProposals(result.proposals)
    return {...result, guides}
  }
  useEffect(() => {
    void snapshot()
      .then(() => setMessage('Ready. No commands are executed.'))
      .catch(() => setMessage('Content could not be loaded. Refresh to retry.'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function perform(action: () => Promise<void>, readOnly = false) {
    if ((!owner && !readOnly) || busy) return
    setBusy(true)
    try {
      await action()
      await snapshot()
      setMessage(
        readOnly
          ? 'Refreshed from Sanity. No content was changed.'
          : 'Saved to Sanity. Rebuild the public app to update its approved snapshot.',
      )
    } catch {
      setMessage(
        'Not confirmed. Content may have changed or access/network failed. Refresh before retrying; an interrupted request may have committed.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function create(id: string) {
    await perform(async () => {
      const {guides} = await snapshot()
      const guide = guides.find((item) => item.id === id)!
      const experiment = repair(guide)
      const proposal = {
        _id: `repair-${crypto.randomUUID()}`,
        _type: 'repairProposal',
        title: guide.title,
        guide: {_type: 'reference', _ref: id},
        fingerprint: guide.revision,
        status: 'pending',
        experiment: storedExperiment(experiment),
        createdAt: new Date().toISOString(),
      }
      validateProposal(guide, proposal, inspect)
      await client.create(proposal)
    })
  }
  async function decide(id: string, status: 'approved' | 'rejected') {
    await perform(async () => {
      const current = await snapshot()
      const proposal = current.proposals.find((item) => item._id === id)!
      const guide = current.guides.find((item) => item.id === proposal.guide._ref)
      if (status === 'approved') {
        if (!guide) throw new Error('Missing guide')
        validateProposal(guide, proposal, inspect)
      }
      const ids = new Set(
        guide
          ? [
              guide.id,
              ...guide.prerequisites.map((item) => item.id),
              ...guide.defaults.map((item) => item.tool.id),
              ...guide.steps.flatMap((step) => step.tools.map((item) => item.tool.id)),
            ]
          : [],
      )
      const sources = current.sources.filter((item) => ids.has(item._id))
      if (status === 'approved' && sources.length !== ids.size)
        throw new Error('Missing dependency')
      await client.mutate(
        decisionMutations(proposal, status, sources, new Date().toISOString(), crypto.randomUUID()),
        {visibility: 'sync'},
      )
    })
  }
  return (
    <div style={{padding: '2rem', maxWidth: 900, margin: 'auto'}}>
      <h1>Repair review</h1>
      <p>
        Create a proposal from deterministic compatible conditions, then explicitly approve or
        reject it. Public visitors cannot write. Approval does not change guide instructions.
      </p>
      {!owner && <p>Sign in as this project’s administrator to review repairs.</p>}
      <p role="status">{message}</p>
      <button
        disabled={busy}
        onClick={() =>
          void perform(async () => {
            await snapshot()
          }, true)
        }
      >
        Refresh
      </button>
      <h2>Published guides</h2>
      {guides.map((guide) => (
        <p key={guide.id}>
          {guide.title}{' '}
          <button disabled={!owner || busy} onClick={() => void create(guide.id)}>
            Create pending proposal
          </button>
        </p>
      ))}
      <h2>Proposals</h2>
      {!proposals.length && <p>No proposals yet. This is live Sanity content.</p>}
      {proposals.map((proposal) => (
        <section key={proposal._id} style={{borderTop: '1px solid #999', padding: '1rem 0'}}>
          <h3>
            {proposal.title} — {proposal.status}
          </h3>
          <p>
            Content fingerprint: <code>{proposal.fingerprint}</code>
          </p>
          <pre style={{overflow: 'auto'}}>{JSON.stringify(proposal.experiment, null, 2)}</pre>
          {proposal.status === 'pending' && (
            <>
              <button
                disabled={!owner || busy}
                onClick={() => void decide(proposal._id, 'approved')}
              >
                Approve repair
              </button>{' '}
              <button
                disabled={!owner || busy}
                onClick={() => void decide(proposal._id, 'rejected')}
              >
                Reject repair
              </button>
            </>
          )}
        </section>
      ))}
    </div>
  )
}
export const repairReview = definePlugin({
  name: 'repair-review',
  tools: [{name: 'repair-review', title: 'Repair review', component: ReviewTool}],
})

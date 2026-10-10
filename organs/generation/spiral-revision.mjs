// Penelope — a bounded, append-only artifact revision. All tests are injected;
// neither a model nor a generated artifact can certify itself.
import { createHash } from 'node:crypto';
export const GENERATION_SPIRAL_SCHEMA = 'GenerationSpiral@2';

function frozen(x) {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    for (const v of Object.values(x)) frozen(v);
    Object.freeze(x);
  }
  return x;
}
function view(x) { return frozen(structuredClone(x)); }
function canonical(x) {
  if (x === null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object' && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null))
    return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  throw new TypeError('artifact must be plain JSON data or text');
}
const digest = (x) => createHash('sha256').update(canonical(x)).digest('hex');

/** An attempted revision only becomes the new current projection after the
 * source/child gate and the parent-impact gate both approve it. Callback
 * failure, mutation, unchanged content, or test rejection cannot alter the
 * previously admitted artifact. Same log -> same last accepted bytes. */
export async function reviseArtifact({ artifact, propose, test, assessParent, budget = 3 } = {}) {
  if (typeof propose !== 'function' || typeof test !== 'function' || typeof assessParent !== 'function') throw new TypeError('reviseArtifact: propose, test, and assessParent required');
  if (!Number.isInteger(budget) || budget < 0) throw new TypeError('revision budget must be a nonnegative integer');
  let current = structuredClone(artifact);
  let currentDigest = digest(current);
  const log = [];
  for (let round = 0; round < budget; round++) {
    let proposal, proposalDigest;
    try {
      proposal = await propose(view(current), { round, log: view(log) });
      if (proposal != null) proposalDigest = digest(proposal);
    } catch (e) {
      log.push({ round, kind: 'refusal', why: 'proposal_error', basis: String(e?.message ?? e), beforeHash: currentDigest });
      continue;
    }
    if (proposal == null || proposalDigest === currentDigest) {
      log.push({ round, kind: 'stopped', why: 'no_changed_product', beforeHash: currentDigest });
      break;
    }
    const candidate = structuredClone(proposal);
    let child, ancestor;
    try {
      child = await test(view(candidate), view(current));
      if (!child?.ok) {
        log.push({ round, kind: 'refusal', why: 'failed_child_test', basis: child?.basis ?? null, beforeHash: currentDigest, proposalHash: proposalDigest });
        continue;
      }
      ancestor = await assessParent(view(candidate), view(current));
      if (!ancestor?.ok) {
        log.push({ round, kind: 'refusal', why: 'broke_parent', basis: ancestor?.basis ?? null, beforeHash: currentDigest, proposalHash: proposalDigest });
        continue;
      }
    } catch (e) {
      log.push({ round, kind: 'refusal', why: 'test_error', basis: String(e?.message ?? e), beforeHash: currentDigest, proposalHash: proposalDigest });
      continue;
    }
    log.push({ round, kind: 'admitted', basis: child.basis ?? null, parentBasis: ancestor.basis ?? null,
      beforeHash: currentDigest, afterHash: proposalDigest });
    current = candidate;
    currentDigest = proposalDigest;
  }
  return { schema: GENERATION_SPIRAL_SCHEMA, artifact: current, artifactHash: currentDigest, log,
    admitted: log.filter((x) => x.kind === 'admitted').length,
    refusals: log.filter((x) => x.kind === 'refusal'),
    exhausted: log.length === budget && budget > 0 };
}

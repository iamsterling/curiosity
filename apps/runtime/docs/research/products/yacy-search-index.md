# YaCy P2P search/index architecture: clean-room research dossier

**Access date for web sources:** 2026-08-17  
**Inspected source snapshot:** official `yacy/yacy_search_server` `master` at
`7bc99cdceb09a60e1d5b201f172c172c14273922` (committed 2026-08-17)  
**Scope:** YaCy's peer-to-peer index distribution, peer network, and distributed
query path. Crawling is discussed only where an index record enters, changes, or
is verified; crawler/frontier design is intentionally out of scope.  
**Status:** research and clean-room lessons, not implementation, deployment, or
legal advice.

## Executive verdict

**REJECT YaCy's public P2P index as Curiosity's production search core (high
confidence). ADAPT selected ideas only (high confidence).** YaCy is a valuable,
long-running proof that commodity peers can exchange an inverted index and
federate query execution. Its most transferable ideas are:

1. split durable local ownership from an exchange index;
2. route term postings directly to deterministic owners rather than broadcast;
3. make replication, transfer acceptance, query fan-out, timeouts, and resource
   shedding explicit;
4. merge heterogeneous local and remote candidates at the requesting node;
5. diversify early results by host; and
6. treat every remote posting and result as untrusted.

The public design is not, however, a strong consistency, privacy, or Byzantine
trust system. Its “DHT” is a globally known hash ring with direct peer contacts,
not a routed DHT. Peers choose persistent hashes, advertise their own
capabilities and counts, and the default `freeworld` protocol is uncontrolled;
HTTP remains the default preference. RWI term hashes conceal plaintext only
superficially: deterministic hashes of likely words are dictionary-reversible,
the contacted peer sees the requester's network address, and remote Solr queries
expose the query. Published experiments demonstrated eclipse, route-capture,
query-monitoring, and censorship attacks against the 2014 design [S6]. The 2026
source still has the enabling structural properties—self-generated IDs,
self-reported seeds, direct requests, hash-successor targeting, and no anonymous
query path—although this review did not repeat the attacks.

The exchange index is intentionally “dissolvable”: successful RWI transfer
removes the sender's local RWI copy while retaining its local Solr document.
There is replicated placement and retry, but no global snapshot, authoritative
version, anti-entropy proof, quorum read/write, or distributed deletion
tombstone found. RWI `freshUntil` is marked unused since 2009. Local deletion
does not establish network-wide erasure. This makes YaCy's result set
best-effort and eventually discoverable, not complete, current, or reproducible.

For Curiosity, **ADOPT the separation of authoritative corpus storage from
replaceable retrieval replicas; ADAPT deterministic partitioning and bounded
fan-out inside an authenticated operator-controlled cluster; REJECT untrusted
public peers as index authorities; REJECT query-hash privacy claims; REJECT
query-driven ingestion of remote results; and DEFER any cross-organization
index exchange until signed provenance, deletion, privacy, abuse, and evaluation
contracts exist.**

## 1. Decision frame, bounded questions, and method

### 1.1 Decision

What, if anything, should Curiosity learn from YaCy's P2P search/index plane
without copying GPL code, inheriting its public-network trust model, or widening
agent authority?

### 1.2 Bounded sub-questions

1. What is actually partitioned, replicated, transferred, and retained?
2. How are peers discovered, classified, selected, and trusted?
3. How does a query fan out, join multi-term results, rank, deduplicate, and
   verify returned material?
4. What consistency, freshness, loss, deletion, and churn semantics follow?
5. Which privacy and abuse claims survive an active-adversary model?
6. What are the operational and scaling consequences of the architecture?
7. Which concepts are safe clean-room lessons under YaCy's GPL/LGPL boundary?

**Depth budget:** current official source at architecture-critical call sites,
official operational documentation and network defaults, and original YaCy
architecture/security studies. No peer was operated, no live public query was
sent, no network traffic was captured, no crawler was run, and no YaCy code or
data was copied into the repository.

**Stop conditions:** every requested category has current-source evidence plus
triangulation where material; stop on coverage and saturation. Live network
quality, current peer count, and attack reproduction require a separately
authorized experiment and are not inferred from documentation.

### 1.3 Evidence labels

- **FACT** — directly supported by cited official source/docs or original study.
- **INFERENCE** — reasoned from facts; not directly measured in this review.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Historical claims from the 2014 papers are not silently presented as current.
Where current code confirms the mechanism, both are cited. Repository citations
use commit-pinned paths in [S1]; line ranges below identify the inspected
snapshot.

## 2. System model: two indexes with different ownership semantics

### 2.1 Local Solr and distributed RWI

**FACT (high):** an ordinary YaCy peer maintains two relevant index forms:

- a local Solr/Lucene full-document index (“horizontal” in YaCy's operational
  documentation), principally preserving what that instance acquired; and
- a kelondro reverse-word index (RWI), mapping a deterministic word hash to
  compact URL references and associated rank fields. This RWI is the exchange
  substrate distributed over the P2P network [S2]. Current `WordReferenceRow`
  fields include URL hash, last-modified, title/text counts, language, link
  counts, URL shape, occurrence/position, and flags
  (`WordReferenceRow.java:43-69,80-112`) [S1].

**FACT (high):** the operational documentation calls RWI “dissolvable.” A peer
creates local Solr documents and RWI references, then moves RWI fragments to
network owners. Successful selection removes references from the local RWI, not
from Solr (`Dispatcher.java:139-224`) [S1, S2]. Failed or insufficiently
replicated chunks are restored (`Dispatcher.java:55-85`;
`Transmission.java:207-269`) [S1].

**INFERENCE (high):** this is not one homogeneous distributed database. It is a
durable, peer-local document index plus a lossy replicated directory of
term-to-document references. Calling the union a “distributed Solr index” can
obscure that the current DHT dispatcher specifically moves RWI references while
local Solr copies persist.

### 2.2 Data-flow reconstruction

```text
document accepted by a peer
  -> local Solr document (retained by acquiring peer)
  -> compact RWI entries: word_hash -> URL-hash + rank fields
  -> periodic RWI selection (selected entries removed provisionally)
  -> split each word container by URL-hash vertical partition
  -> choose successor peers near (word-hash, vertical-partition) positions
  -> send bounded chunks to configured number of replicas
       success -> sender leaves RWI removed; local Solr remains
       failure -> retry/alternate target; ultimately restore RWI
  -> receiver validates bounds/policy and stores RWI
  -> receiver requests missing URL metadata/full document from sender

query
  -> local Solr + local RWI in parallel
  -> choose DHT RWI peers for term-hash positions
  -> choose extra Solr-capable/Robinson peers
  -> primary remote RWI searches (+ Solr searches)
  -> for multi-term queries, join index abstracts and issue secondary URL-hash
     restricted searches
  -> validate remote result shape/policy
  -> cache/store returned references (and optionally metadata)
  -> rank, URL-hash dedupe, host diversification, optional snippet verification
  -> requester renders final result stream
```

The initial document acquisition/parsing step is shown only to locate the index
boundary; crawler scheduling is outside this report.

## 3. Distributed partitioning and exchange

### 3.1 YaCy's “DHT” is direct placement over a globally learned ring

**FACT (high):** YaCy uses 12-character hashes ordered in a circular address
space. The 2014 architecture study, verified with the YaCy community, describes
the network as a hybrid structured/unstructured P2P system: it arranges peers
and data in a Chord-like ring but does **not** route lookups hop by hop [S5,
pp. 2, 5-6]. Current code enumerates the connected seed database in hash order,
wraps at the end, and directly contacts selected peers
(`DHTSelection.java:246-356`) [S1].

**INFERENCE (high):** every searching peer's seed view is part of query
correctness. A missing or poisoned peer view changes both placement and lookup;
there is no independent routed overlay to converge on the true owner.

### 3.2 Folded horizontal/vertical partitioning

**FACT (high):** the horizontal position is the ordered cardinal value of the
word hash. A configurable exponent creates `2^e` vertical partitions; the
default `freeworld` exponent is 4, hence 16 partitions. Placement combines the
lower term-position bits with upper URL-hash bits
(`Distribution.java:50-77,118-157`; `yacy.network.freeworld.unit:26-40`) [S1].
The current dispatcher splits every word container by the vertical partition of
each URL hash (`Dispatcher.java:227-256`) [S1].

This “folding” solves a hot-key problem: postings for a frequent word do not all
land on one ring position. A query for that word computes all 16 possible
positions and addresses peers near each one [S5, pp. 6-7].

**ADAPTED LESSON (high):** separate term partitioning from posting subsharding.
For an owned cluster, use an explicit manifest and stable document partition key,
not peer-chosen IDs or an implicit global seed view.

### 3.3 Replication and transfer protocol

**FACT (high):** `freeworld` configures one replica target for junior peers and
three for senior peers (`yacy.network.freeworld.unit:31-40`) [S1]. For each
vertical position, current selection walks acceptable remote-index peers from
the computed ring point and chooses up to the redundancy count
(`DHTSelection.java:174-223`) [S1].

**FACT (high):** transfer is buffered and bounded:

- selected RWI containers are removed provisionally, partitioned, accumulated
  by target, and transmitted concurrently;
- a chunk accepts at most 1,000 RWI references; excess is returned locally;
- references lacking corresponding local fulltext metadata are omitted;
- successful transfer updates counters; failed transfer can mark the target as
  no longer accepting remote index and restores data if the transfer job cannot
  complete (`Dispatcher.java:55-85,270-293`;
  `Transmission.java:50-52,80-188,207-269`) [S1].

**FACT (high):** a receiver can disable index receipt. It rejects unknown
senders, wrong targets, Robinson mode, high load, memory pressure, or an
oversized RWI buffer. It caps parsing at 1,000 entries, checks syntax, optional
blacklists, accepted-domain hashes, and known error URLs, then asks for metadata
it lacks (`transferRWI.java:68-173,179-229,231-348`) [S1].

**INFERENCE (high):** replication is acknowledgement-based availability, not
consensus. Acknowledgement proves only that a peer accepted a payload at that
moment. It does not prove durable storage, truthful future responses, equal
versions across replicas, or eventual repair after that peer disappears.

### 3.4 Query-driven diffusion

**FACT (high):** official documentation says remote search results are retained
as RWIs by the requester, spreading popular-query material [S2]. Current remote
result processing validates and then stores constructed RWI containers into the
requester's segment (`Protocol.java:678-843`) [S1]. Depending on configuration,
returned metadata documents may also be written into the local index before the
result is emitted (`Protocol.java:788-832`) [S1].

**INFERENCE (high):** this behaves partly like demand-driven caching. It can
improve repeated popular searches, but amplifies popularity bias, propagates
malicious/stale records, entangles query processing with index mutation, and
makes data lineage harder to explain.

**RECOMMENDATION (high):** Curiosity retrieval must not mutate the authoritative
corpus merely because an untrusted remote result was returned. Cache candidates
under short, explicit leases with source identity and version; promotion into an
authoritative index requires a separate verified ingestion event.

## 4. Peer discovery, identity, and trust

### 4.1 Discovery and reachability classes

**FACT (high):** peers bootstrap from configured seed-list URLs, then exchange
seeds during `hello`/peer-ping. A responding peer can return its own seed and up
to 100 recent peer seeds (`hello.java:247-282`) [S1]. The current default file
lists eleven bootstrap URLs, a mixture of HTTP and HTTPS
(`yacy.network.freeworld.unit:57-68`) [S1].

**FACT (high):** the important reachability roles are:

- **virgin:** not yet network-connected;
- **junior:** can initiate but cannot receive public connections;
- **senior:** publicly reachable; and
- **principal:** a senior that publishes a seed list externally.

Current `Seed` comments define these roles (`Seed.java:117-139`) [S1]. The
`hello` receiver back-pings reported addresses and classifies a reachable peer
as senior/principal, otherwise junior (`hello.java:158-237`) [S1]. Robinson mode
is orthogonal: a peer/cluster can retain its own index and decline general RWI
receipt while still answering selected Solr searches [S5, p. 4].

### 4.2 What is checked

**FACT (high):** peer admission performs useful sanity checks: valid seed shape,
qualified type, no self-reference, no different hashes on the same IP/port,
reasonable `LastSeen`, and direct reachability updates
(`PeerActions.java:53-180`) [S1]. The client patches the contacted peer's address
from the actual connection and checks that the returned peer hash matches the
expected hash (`Protocol.java:233-251,338-360`) [S1].

These are operational plausibility and anti-spoof checks, not a trust root.

### 4.3 What is not established

**FACT (high):** a new peer hash is generated locally and persisted. Seed
serialization is encoded/compressed and syntactically validated, but no public
key signature or certificate binds the hash to an operator
(`Seed.java:1290-1361,1463-1497`) [S1]. The security study notes that peer
positions and important seed values were freely/self reported [S6, pp. 3-4].

**FACT (high):** the public network definition is
`network.unit.protocol.control = uncontrolled`. The server accepts a request
after the network name matches when uncontrolled; controlled networks may use a
shared `salted-magic-sim` MD5 construction
(`Protocol.java:2214-2294`; `yacy.network.freeworld.unit:78-83`) [S1]. This is
neither per-peer public-key identity nor modern authenticated transport.

**FACT (high):** both general P2P and remote-search HTTPS preference defaults
are false (`SwitchboardConstants.java:312,608`) [S1]. Implementations can use
HTTPS and fall back to HTTP, but public-network confidentiality and authentic
peer identity are not guaranteed by the architecture.

**INFERENCE (high):** YaCy's trust model is “reachable participant plus local
filters,” not Byzantine membership. Sybil resistance, durable operator identity,
capability attestation, provenance signatures, and independent reputation are
absent from the inspected index/query path.

**RECOMMENDATION (high):** Curiosity should use authenticated, operator-issued
node identities; signed membership epochs; transport encryption without silent
downgrade; separately authorized storage/query roles; and measured, not
self-reported, health/capacity. Public peers must never become authorities merely
because their IDs are near a partition key.

## 5. Query execution, ranking, and deduplication

### 5.1 Candidate selection and fan-out

**FACT (high):** a global search concurrently checks local Solr, local RWI, RWI
DHT peers, and additional Solr-capable/Robinson peers. Current remote-search
selection:

- computes candidate peers for every included word and vertical partition;
- excludes very young/empty RWI peers from DHT search;
- randomly samples among redundant eligible successors to spread load;
- caps a multi-word DHT target set to roughly one word's partition fan-out;
- adds a bounded set of extra Solr-capable peers using tags, root-node status,
  age, and advertised size; and
- reduces fan-out under local queue, CPU, memory, or load pressure
  (`DHTSelection.java:67-171`; `RemoteSearch.java:172-319`) [S1].

**FACT (high):** `freeworld` caps a remote RWI reply at ten results and three
seconds (`yacy.network.freeworld.unit:20-24`; `search.java:120-145`) [S1]. The
limit bounds each peer, not the whole fan-out.

**INFERENCE (high):** latency is tail-sensitive and coverage is probabilistic.
The requester receives whichever bounded peers answer within deadlines; there
is no snapshot-wide completeness marker. Resource pressure silently narrows
coverage.

### 5.2 Hashed RWI search and plaintext Solr search

**FACT (high):** RWI requests send concatenated word hashes, exclusion hashes,
filters, profile, count, and deadline. Remote Solr sends the Solr query to a
selected peer. The 2014 architecture study explicitly distinguishes hashed RWI
terms from plaintext Solr terms [S5, p. 6]; the current source retains separate
RWI and Solr request paths (`Protocol.java:490-675,1207-1473`) [S1].

**FACT (high):** for a multi-term RWI query, primary replies may include compact
index abstracts mapping URL hashes to peer hashes. The requester joins abstracts
across terms, then sends secondary searches restricted to URL hashes to peers
that can satisfy the conjunction (`SecondarySearchSuperviser.java:20-198`) [S1].

**ADAPTED LESSON (medium):** a two-stage distributed join can reduce expensive
metadata transfer. Curiosity should implement it only inside trusted shards,
with explicit candidate-set versions and deterministic merge semantics; term
hashes are not a privacy mechanism.

### 5.3 Remote result validation

**FACT (high):** the requester limits processing to the requested count, checks
the URL hash length, local search blacklist and corpus-domain policy, requires an
attached RWI reference, and rejects a metadata URL hash that does not match the
attached reference (`Protocol.java:688-785`) [S1]. Receivers likewise bound and
filter RWI transfer (section 3.3).

**FACT (high):** inbound remote-search rate limiting is address based: more than
one prior request in three seconds, twelve in a minute, or thirty-six in ten
minutes blocks non-local callers. Returned count and work time are locally
bounded (`search.java:107-194`) [S1].

**INFERENCE (high):** these controls are valuable parser/load defenses but do
not prove relevance, origin, freshness, or honest omission. Hash consistency
detects malformed substitution, not a peer that returns a valid but censored or
poisoned subset.

### 5.4 Ranking and merge

**FACT (high):** the requester supplies a ranking profile to the remote RWI
search; the serving peer ranks within its local result set. Current RWI ranking
has configurable coefficients for title/URL/metadata occurrence, term frequency,
position/distance, date, language, link counts, URL shape, category flags, and
later citation/preference signals (`RankingProfile.java:39-125`) [S1]. Solr
queries use field boosts, boost queries/functions, and filters [S3].

**FACT (high):** final aggregation is requester-side. RWI entries are normalized
and pre-ranked; Solr nodes initially use Solr score (with a URL-length tie
adjustment) or fall back to RWI cardinal ranking. Final post-ranking can add
local citation ratio, preferred URL/title patterns, and query/top-word
occurrence in URL/title (`SearchEvent.java:682-860,963-1153,1985-2063`) [S1].

**FACT (high):** the search event begins producing results while remote feeders
run. The historical architecture study observed arrival-dependent normalization
and therefore potentially different rankings for the same result set [S5, p. 7].
Current asynchronous queues and immediate result draining preserve the general
streaming architecture, but this review did not construct a determinism test.

**INFERENCE (medium):** YaCy optimizes responsiveness over reproducible global
ranking. Scores from different peers are not calibrated global statistics; a
requester combines compact RWI scores, Solr scores, and locally available
citation features. Result order can depend on peer coverage, local state, and
arrival timing.

### 5.5 Dedupe and diversity

**FACT (high):** current merge tracks best candidate quality by URL hash and
drops lower-quality duplicate RWI/Solr candidates
(`SearchEvent.java:706-759,1013-1043`) [S1]. Final emission also tracks URL
hashes, while optional “double domain” behavior emits the first best result for
a host and holds further same-host results until distinct hosts are exhausted
(`SearchEvent.java:1318-1434,2624-2629`) [S1]. Solr can boost or filter fuzzy,
HTTP/HTTPS, and `www` uniqueness fields [S3].

**INFERENCE (high):** URL-hash dedupe handles the same normalized URL, and
host-level deferral improves visible diversity. It is not robust content,
syndication, publisher-owner, or near-duplicate clustering. Different URLs with
the same content can still dominate unless local Solr uniqueness signals happen
to catch them.

**RECOMMENDATION (high):** Curiosity should retain stable document/version IDs,
exact-content and near-duplicate cluster IDs, publisher/owner clusters, and an
explicit diversity stage after score calibration. Do not equate URL identity
with evidence independence.

## 6. Consistency, freshness, deletion, and availability

### 6.1 Consistency model

**FACT (high):** transfer removes an RWI at the sender only after successful
replicated sends; failed chunks are restored [S1]. Query reads fan out to a
sample of currently known owner and extra peers, and remote results can be
cached locally. No read quorum, write quorum, version vector, Merkle/anti-entropy
exchange, snapshot identifier, or repair-on-peer-departure path was found in the
inspected P2P package.

**INFERENCE (high):** the useful consistency description is **best-effort,
asynchronous replicated placement with query-time union**, not conventional
eventual consistency with convergence guarantees. A result's existence on one
replica does not imply visibility, and replicas can diverge indefinitely.

### 6.2 Churn and loss

**FACT (high):** peer discovery maintains connected/disconnected/potential
records and removes stale seed records; failed direct contacts move peers out of
the active view (`PeerActions.java:195-214`; `Switchboard.java:2610-2647`) [S1].
The historical design sends no graceful leave message; a crash and leave are
equivalent to other peers [S5, p. 4].

**INFERENCE (medium-high):** redundancy masks some churn, but no evidence was
found that surviving replicas continuously prove replica count or proactively
rebuild a lost copy. If all acknowledged holders disappear before another copy
diffuses, the RWI reference is lost even though an acquiring peer may still
retain its local Solr document.

### 6.3 Freshness and stale entries

**FACT (high):** RWI carries compressed `lastModified` and a `freshUntil` field,
but the latter is explicitly marked “TODO: unused (since 2009)”
(`WordReferenceRow.java:49-69`) [S1]. Official RWI distribution documentation
states that age is not relevant to regular transfer selection [S2]. Local Solr
has load/fresh dates and recrawl facilities, but those are peer-local crawler
semantics, not a network-wide RWI freshness protocol.

**FACT (high):** a receiving peer may reject RWIs for URLs already known locally
as permanent errors or temporarily suppress recent failures
(`transferRWI.java:231-298`) [S1]. Search-time snippet fetching can check current
content, but current code deliberately retains remote/cache-oriented results
without snippets in several failure modes (`SearchEvent.java:2065-2124`) [S1].

**INFERENCE (high):** freshness is a ranking/verification hint, not a serving
contract. A peer cannot tell whether silence means no match, a stale seed view,
an offline owner, deadline expiry, censorship, or a result removed elsewhere.

### 6.4 Deletion and erasure

**FACT (high):** local administration can remove a URL's local Solr document and
local RWI references by reconstructing its words (`Segment.java:797-841`) [S1].
No distributed delete/tombstone message or acknowledged erasure protocol was
found in the P2P transfer endpoints. Query-driven diffusion creates additional
copies.

**INFERENCE (high):** local deletion is not global deletion. YaCy's architecture
cannot provide a bounded network-wide deindex/erasure SLA from the inspected
mechanisms. This is a critical privacy, copyright, correction, and abuse-response
gap for Curiosity.

**RECOMMENDATION (high):** Curiosity needs signed monotonically versioned
upserts/tombstones, authoritative corpus policy, immutable manifests, bounded
deletion propagation, replica acknowledgements, periodic repair, and serving
filters that fail closed on an unknown policy epoch. Search responses should
name the index snapshot and report shard/time/replica coverage.

## 7. Privacy and abuse analysis

### 7.1 Privacy claims versus threat model

**FACT (high):** first-party presentations claim privacy because RWI words are
sent as hashes, transferred indexes are mixed, and the original contribution is
not retained in the RWI [S4]. That is useful against casual inspection and a
single central query log.

**FACT (high):** deterministic word hashes are enumerable. The original security
study showed that a malicious owner peer can build a dictionary from words in
known pages, map hashes back to likely terms, and log the requester's IP. In a
149-node controlled YaCy network, the authors demonstrated keyword monitoring
and censorship; they did not attack `freeworld`, and they obtained community
permission for limited non-invasive measurements [S6, pp. 3-5].

**FACT (high):** the same study identified two required privacy properties:
searcher anonymity and query unlinkability, and concluded that anonymous paths
are needed [S6, pp. 5, 8]. Current search requests directly contact target peers;
no onion/relay path was found in the inspected query path.

**INFERENCE (high):** term hashing is pseudonymization, not confidentiality.
Even an unknown hash is linkable across repeated requests. Multi-term hash sets,
timing, source IP, target partition, secondary URL-hash requests, and plaintext
Solr queries increase fingerprintability. Default HTTP preference exposes still
more to network observers.

**RECOMMENDATION (high):** never claim privacy from hashing low-entropy query
terms. Curiosity should minimize query logs, separate tenant identity from
retrieval, encrypt transport, enforce retention and access controls, and use a
formal privacy threat model. Anonymous routing/PIR is a separate, expensive
design decision—not an incidental benefit of sharding.

### 7.2 Censorship, poisoning, and Sybil/eclipse risk

**FACT (high):** the 2014 IEEE P2P study demonstrated that self-chosen IDs and
self-reported seed fields enabled eclipse and route-capture attacks. In its then
candidate selection, 32 positioned peers could fully capture a one-term RWI
query regardless of honest network size; malicious peers could omit results or
observe searchers. It also demonstrated manipulation of Solr candidate
selection [S6, pp. 3-5].

**FACT (high):** current target-selection details have changed (section 5.1),
but current source still permits locally generated peer hashes, seed exchange,
direct successor selection, and self-advertised capability/count fields. No
proof-of-resource IDs, CA-signed membership, secure DHT routing, anonymous
querying, or replicated omission proof was found [S1].

**INFERENCE (medium-high):** the exact “32 peers” result must not be projected
unchanged onto 2026 `freeworld`; a fresh attack requires a reviewed experiment.
The underlying attack classes remain credible because their prerequisites are
still visible.

**FACT (high):** YaCy has pragmatic abuse controls: input/count/time bounds,
per-IP search throttling, load/memory gates, blacklists, accepted-domain checks,
known-error suppression, URL/reference hash consistency, and optional search
result inspection [S1]. These protect a peer from malformed/flooding input and
some obvious spam. They do not establish result completeness or Byzantine
honesty.

**RECOMMENDATION (high):** Curiosity must treat index writers as higher-trust
principals than query clients. Require signed ingestion provenance, admission
quotas, content/host/owner-level rate limits, replay protection, poison
quarantine, independent fetch verification, cross-replica inconsistency alerts,
and appeal/takedown workflows. Search content remains untrusted external data
and can never authorize agent actions.

## 8. Operations and scale

### 8.1 Useful bounded behavior

**FACT (high):** YaCy contains many explicit pressure valves: bounded transfer
chunks, concurrent sender cap, retry/restore, configurable replica factor,
receiver load and memory checks, RWI buffer limit, query result/time limits,
fan-out reduction under local pressure, and peer flags to opt out of index
receipt [S1]. Network and DHT transfer counters are visible in the UI [S2].

**ADAPTED LESSON (high):** make overload alter a declared coverage field, not
only hidden fan-out. Curiosity should surface `partial=true`, skipped shard
classes, snapshot lag, timeout causes, and budget exhaustion to the researcher.

### 8.2 Storage and recovery cost

**FACT (medium-high):** official operational documentation warns that kelondro
RWI files consume material RAM, merge in the background, prolong startup and
shutdown, and after a crash may take hundreds of minutes to rebuild; some
operators delete RWI to recover performance [S2]. This is a first-party operator
warning, not a controlled benchmark.

**FACT (medium):** project issue #731 reports an observed RWI heap-exhaustion
failure during startup and is labeled high-priority/index/bug. The supplied
trace shows multi-gigabyte blob index reconstruction exhausting heap [S7]. This
is one operator report, not a population estimate.

**FACT (high):** under disk pressure current code trims large RWI posting lists
to at most 100 entries; the “delete too old RWIs” step is only a comment, and
wholesale deletion is disabled (`ResourceObserver.java:151-204`) [S1].

**INFERENCE (high):** peer-local scarcity can silently reduce recall. A compact
posting representation still needs large term dictionaries and in-memory file
indexes; query fan-out adds tail latency and partial failures; replica and
query-cache copies multiply uncontrolled storage. Consumer peers are an
unreliable capacity pool for a freshness- and deletion-SLO search service.

### 8.3 Scaling limits and unknown current capacity

**FACT (high):** direct peer lookup removes multi-hop DHT latency but assumes a
near-global peer view. Per-term fan-out grows with vertical partitions and
redundancy, while current code caps multi-term target count and remote results to
protect the initiating peer [S1]. This deliberately trades recall for bounded
work.

**UNKNOWN:** no reproducible current measurement was found for `freeworld` peer
count, indexed-document coverage, RWI recall, freshness, query p50/p95/p99,
replica durability, deletion lag, or relevance. The Grafana-backed
`yacystats.de` landing page did not expose stable figures to this text-only
review. The 2014 papers' “several hundred daily users” is historical and is not
a 2026 capacity claim [S5, S6].

**RECOMMENDATION (high):** do not use “number of peers” or “URLs indexed” as a
Curiosity scale argument. Gate any distributed design on judged Recall@k/nDCG,
freshness and deletion lag, shard coverage, exact/near duplicate rate, poison
rate, p95/p99 latency, rebuild/restore time, replica deficit, and cost per
verified relevant citation.

## 9. GPL/LGPL and clean-room boundary

This is an engineering boundary, not legal advice.

### 9.1 License facts

**FACT (high):** YaCy's current README identifies the project as GPL 2.0 or
later with some LGPL elements. `COPYRIGHT` states that files under
`source/net/yacy/cora` are LGPL v2-or-later and all other files GPL v2-or-later,
unless stated otherwise [S1, S8]. Individual source headers inspected here use
GPL v2-or-later language.

**FACT (high):** GPL is copyleft tied materially to copying/modifying and
distribution/conveyance of covered code; it is not the Affero GPL network-use
clause. Exact obligations depend on what is copied, linked, modified, and
distributed. Individual files and bundled dependencies still require a complete
notice and license audit; the repository metadata's `NOASSERTION` does not
override file notices. GPL v2 sections 0-3 place running outside scope and state
the source/license conditions for distributed modified or object-code works
[S9].

### 9.2 Clean-room controls

**RECOMMENDATION (high):** YaCy code is **REJECTED** for Curiosity's strict
project-owned core unless a separately reviewed GPL/LGPL dependency decision is
made. Do not copy, translate, mechanically port, or preserve distinctive class,
field, protocol, row-layout, or serialization expressions from YaCy.

Permissible learning, subject to counsel and provenance records:

- high-level facts and functional requirements described in this dossier;
- public distributed-systems concepts: consistent hashing/rings, inverted
  indexes, replication, sharding hot terms, bounded fan-out, two-stage joins,
  host diversification, admission control, and backpressure;
- published security properties and attack classes from [S6]; and
- independently authored tests using project-created fixtures and a neutral
  specification.

Clean-room handoff should contain only behavior and acceptance tests, for
example: “partition postings by stable document key; acknowledge only durable
replicas; return a signed snapshot/coverage vector.” It should not contain YaCy
method names, constants, row fields, wire examples, or implementation order.
Researchers who inspected source should not supply code. Implementers should
work from the approved neutral contract and independent algorithms/standards.

### 9.3 Curiosity implications and verdict ledger

| YaCy lesson | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Separate retained local fulltext from exchange postings | **ADAPTED** | High | Separate authoritative captures/documents from rebuildable index replicas, but do not “dissolve” the only searchable reference. |
| Fold term partition with document subpartition | **ADAPTED** | High | Useful hot-term sharding pattern inside an owned, manifested cluster. |
| Direct deterministic owner lookup | **ADAPTED** | High | Use authenticated membership and versioned placement, not global self-reported seed lists. |
| Replicate before sender removal; restore failed chunks | **ADAPTED** | High | Add durable acknowledgements, repair, checksums, versions, and tombstones. |
| Query local and remote channels concurrently | **ADOPTED concept** | High | Keep bounded lexical/vector/federated candidate channels and explicit partial coverage. |
| Primary abstracts then secondary restricted fetch | **ADAPTED** | Medium | Consider only if measured to reduce trusted-cluster network cost without recall loss. |
| URL-hash dedupe and first-host diversity | **ADAPTED** | High | Extend to document/version, near-duplicate, publisher/owner, source-type, and temporal diversity. |
| Requester-controlled ranking profile | **ADAPTED** | Medium | Send a versioned rank-policy ID; execute deterministically on trusted shards; merge calibrated features centrally. |
| Query-driven RWI/result storage | **REJECTED** | High | Cache under provenance/TTL only; no promotion from untrusted query response. |
| Public volunteer peers as index owners | **REJECTED** | High | No identity, rights, durability, freshness, or deletion SLA. |
| Word hashes as query privacy | **REJECTED** | High | Dictionary-reversible and linkable; direct peers observe request metadata. |
| Self-chosen IDs/self-reported capacity | **REJECTED** | High | Use issued identities and measured health/capacity. |
| Best-effort replicated RWI as authoritative corpus | **REJECTED** | High | Missing convergence, version, repair, and global deletion guarantees. |
| YaCy GPL/LGPL code in owned core | **REJECTED pending exception** | High | Concepts/spec only; any dependency exception needs license review. |
| Cross-organization index exchange | **DEFERRED** | High | Requires signed provenance, membership, deletion, privacy, abuse, and quality contracts. |

## 10. Recommended checks before any Curiosity adaptation

1. **Partition property tests:** every posting maps deterministically under a
   versioned membership manifest; movement after membership change is measured.
2. **Replica invariant:** no authoritative version is retired until the target
   durable replica count is acknowledged and periodically re-proven.
3. **Deletion invariant:** a signed tombstone wins over all older writes and is
   excluded from every serving replica within a declared SLA.
4. **Snapshot contract:** every response identifies corpus/index/ranker versions
   and which shards, replicas, and time classes were covered or skipped.
5. **Byzantine fixtures:** malformed postings, valid-hash poison, omission,
   equivocation, replay, self-inflated capacity, Sybil membership, and eclipse
   placement cannot become trusted evidence.
6. **Privacy checks:** query logs and traces are minimized; repeated queries
   cannot be casually linked across services; no “hashed means anonymous” claim
   passes review.
7. **Ranking reproducibility:** frozen candidates and versions yield the same
   ordering; remote arrival time cannot silently change scores.
8. **Dedupe evaluation:** exact URL, canonical, content, near-duplicate,
   syndication, and publisher-owner clusters are separately measured.
9. **Operational recovery:** shard rebuild, crash restart, replica repair,
   rollback, and restore meet measured memory/time envelopes without deleting
   search data to recover availability.
10. **Authority preservation:** retrieval returns bounded untrusted evidence to
    the researcher; no result content can request tools, mutate policy, approve
    work, or extend the caller-declared Curiosity frame.

## 11. Unknowns and negative results retained

- **UNKNOWN:** current live `freeworld` peer population, corpus size, traffic,
  churn, geographic diversity, and replica distribution.
- **UNKNOWN:** 2026 end-to-end relevance, freshness, latency, and deletion lag;
  no reproducible official benchmark was found.
- **UNKNOWN:** whether operators commonly override the default uncontrolled/HTTP
  preferences; configuration capability is not deployment evidence.
- **UNKNOWN:** exact 2026 eclipse cost. The 2014 “32 peers” experiment is strong
  historical evidence, not a current exploit count.
- **NEGATIVE RESULT:** no cryptographic binding of public peer hash to operator,
  signed seed membership, or proof-of-resource ID generation was found in the
  inspected identity/discovery path.
- **NEGATIVE RESULT:** no anonymous/onion query path was found in the inspected
  RWI or Solr query path.
- **NEGATIVE RESULT:** no global index snapshot, quorum semantics, anti-entropy
  proof, replica repair protocol, or distributed tombstone/erasure acknowledgement
  was found in the inspected P2P index path.
- **NEGATIVE RESULT:** no evidence was found that RWI `freshUntil` affects
  current serving or expiry; source marks it unused since 2009.
- **NEGATIVE RESULT:** no basis was found to treat URL hashes as content dedupe,
  source diversity, or provenance.
- **NEGATIVE RESULT:** no basis was found to treat decentralization alone as
  censorship resistance or privacy; [S6] directly contradicts that assumption.
- **NEGATIVE RESULT:** no stable current scale figures could be extracted from
  the public stats landing page in this environment; figures were not guessed.

## 12. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify whether 2014 trust prerequisites remain in current source | 5 | 5 | 4 | 2 | **Pursued:** self-generated IDs, self-reported seeds, direct successor lookup, uncontrolled public protocol, and direct queries remain [S1]. |
| Verify actual RWI expiry/deletion semantics | 5 | 5 | 4 | 2 | **Pursued:** `freshUntil` is unused; local deletion exists; no distributed tombstone found [S1]. |
| Check current resource-failure evidence | 4 | 4 | 3 | 2 | **Pursued:** official operations page plus high-priority issue #731 corroborate RAM/rebuild risk [S2, S7]. |
| Operate peers and repeat eclipse/monitoring attacks | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: live adversarial execution lacks separate authority, ethics plan, and isolated test network. |
| Query `freeworld` to benchmark recall/latency | 4 | 5 | 4 | 4 | `CURIOSITY_NO_GO`: no approved corpus, peer-operation authority, or reproducible baseline. |
| Infer current scale from historical user counts or inaccessible dashboard | 3 | 2 | 1 | 1 | `CURIOSITY_NO_GO`: would create false precision; retained as unknown. |
| Reverse engineer crawler/frontier | 1 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: explicitly outside the caller's search/index frame. |
| Produce YaCy-compatible protocol/schema or implementation pseudocode | 2 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: unnecessary for the decision and increases GPL clean-room contamination risk. |
| Make a definitive GPL legal ruling | 4 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: counsel authority required; engineering boundary is sufficient now. |

**Coverage check:** partition/exchange, peer discovery/trust, query/ranking/dedupe,
consistency/freshness/deletion, privacy/abuse, operations/scale, licensing,
clean-room lessons, Curiosity implications, checks, unknowns, and verdicts are
all covered.

**Saturation check:** official docs, current source, and two original studies
converge on the same core model. Additional historical presentations repeated
the ring/RWI/privacy claims without changing the decision.

**Stop:** coverage and saturation reached. Live performance and current attack
cost remain intentionally unresolved pending caller authority and an isolated,
ethically reviewed experiment.

## 13. Sources and traceability

All web sources accessed 2026-08-17. Primary project sources and original
research were preferred; search snippets were leads only.

1. **[S1] YaCy official source repository, inspected commit
   `7bc99cdceb09a60e1d5b201f172c172c14273922`.**
   https://github.com/yacy/yacy_search_server/tree/7bc99cdceb09a60e1d5b201f172c172c14273922
   — primary current implementation and defaults. Principal inspected paths:
   `source/net/yacy/peers/{Dispatcher,DHTSelection,Transmission,Protocol,RemoteSearch,Network,PeerActions,Seed}.java`,
   `source/net/yacy/htroot/yacy/{hello,search,transferRWI}.java`,
   `source/net/yacy/search/query/{SearchEvent,SecondarySearchSuperviser}.java`,
   `source/net/yacy/search/ranking/RankingProfile.java`,
   `source/net/yacy/cora/federate/yacy/Distribution.java`,
   `source/net/yacy/kelondro/data/word/WordReferenceRow.java`,
   `source/net/yacy/search/{ResourceObserver,SwitchboardConstants}.java`,
   `source/net/yacy/search/index/Segment.java`, and
   `defaults/yacy.network.freeworld.unit`.
2. **[S2] YaCy, “RWI Index distribution in YaCy.”**
   https://yacy.net/operation/rwi-index-distribution/ — first-party operational
   description of dual indexes, dissolving RWI, transfer, storage, resource
   behavior, replication, and search.
3. **[S3] YaCy, “Definition of Ranking Rules.”**
   https://yacy.net/operation/ranking/ — first-party Solr/RWI ranking,
   post-ranking, boosts, and uniqueness controls.
4. **[S4] YaCy project presentation, “Web Search By The People For The
   People” (FSCONS 2010).**
   https://yacy.net/material/YaCy_FSCONS_2010.pdf — first-party historical
   architecture and privacy claims; used as a claim origin, not proof.
5. **[S5] Michael Herrmann, Kai-Chun Ning, Claudia Diaz, Bart Preneel,
   “Description of the YaCy Distributed Web Search Engine” (2014).**
   https://yacy.net/material/Description_of_the_YaCy_Distributed_Web_Search_Engine_Herrmann_Ning_Diaz_Preneel_ESAT_KULeuven_COSIC_article-2459.pdf
   — original source/runtime reverse engineering confirmed with the YaCy
   community; historical ring, peer, distribution, query, and ranking detail.
6. **[S6] Michael Herrmann, Ren Zhang, Kai-Chun Ning, Claudia Diaz, Bart
   Preneel, “Censorship-Resistant and Privacy-Preserving Distributed Web
   Search,” IEEE P2P 2014.**
   https://cosicdatabase.esat.kuleuven.be/backend/publications/files/conferencepaper/2422
   — original threat model, controlled YaCy experiments, attack results,
   security properties, and proposed mitigations.
7. **[S7] YaCy issue #731, “RWIs fill out the whole memory space for YaCy”
   (opened 2025-09-03).**
   https://github.com/yacy/yacy_search_server/issues/731 — primary operator
   report and trace; evidence of a failure mode, not prevalence.
8. **[S8] YaCy `COPYRIGHT` and README license sections at inspected commit.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/COPYRIGHT
   and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/README.md#license
   — primary GPL-2.0-or-later/LGPL-2.0-or-later project boundary.
9. **[S9] Free Software Foundation, GNU General Public License, version 2.**
   https://www.gnu.org/licenses/old-licenses/gpl-2.0.html — primary license text,
   especially sections 0-3 on scope, modification, distribution, and source.

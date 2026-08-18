# Bright Data proxy networks: clean-room acquisition-product dossier

**Research and primary-source access date:** 2026-08-17  
**Exclusive scope:** Bright Data's raw Residential, ISP, Datacenter, and
documented Mobile proxy-network family as standalone acquisition infrastructure.
Web Unlocker, Browser API, SERP API, Proxy Manager, and managed scrapers appear
only where an official source defines a boundary or alternative.  
**Access boundary:** public first-party documentation, product/pricing pages,
release notes, security/trust material, MSA, SLA, AUP, Privacy Policy, and public
DPA references only. No account, credentials, trial, paid request, target probe,
traffic capture, peer/IP mapping, bypass, source/binary inspection, or
implementation was used. This is not a service benchmark or legal opinion.

## Executive decision

**VERDICT — REJECT Bright Data proxy networks as a required dependency of an
owned crawler; DEFER the provider; ADAPT a few egress-control patterns (high
confidence).** Raw proxies provide selectable network egress, not crawling.
Curiosity would still own URL admission, DNS/IP safety, robots and publisher
policy, per-origin pacing, retries, rendering, content validation, extraction,
provenance, deduplication, storage, and cost control. A gateway zone selects a
Residential, ISP, or Datacenter exit according to username-encoded geography,
session, and failover directives, then relays the target response [S1-S8].

Bright Data's useful observable ideas are: a logical zone as a policy/billing
boundary; requested versus observed exit metadata; explicit rotating versus
sticky versus fixed identity; fail-open/fail-closed peer substitution; standard
proxy error fields; and separate traffic/cost telemetry. They need substantial
adaptation because public contracts contain important drift, substitutions can
silently change the acquisition path, and most evidence is operational rather
than source provenance.

The adoption blockers are material:

1. the June 2026 MSA permits Bright Data to retain data collected through Proxy
   Services and use it for its own purposes in its sole discretion [S20];
2. Residential supply and consent are vendor representations that were not
   independently auditable here; every new Residential zone after 2026-07-07
   also requires company-only, human-reviewed KYC and approved-use monitoring
   [S1][S9][S18];
3. the native Residential path may require trusting a Bright Data root CA, while
   first-party examples also show disabling TLS verification—an unacceptable
   production pattern [S17];
4. default peer failover, IPv6-to-IPv4 fallback, and Super Proxy bypass can alter
   the exit class or identity unless explicitly failed closed [S2][S6][S8];
5. no public raw-proxy contract provides origin-response integrity, complete
   redirect/attempt evidence, freshness, crawl politeness, or semantic success;
6. list-price, pool-size, session-idle, geotargeting, uptime, and Mobile-product
   sources conflict; and
7. the provider's own current agent guidance says not to fetch and parse through
   a raw proxy when higher-level products are available [S27].

**RECOMMENDATION (high):** an owned crawler should remain fully functional with
ordinary direct egress. If procurement later approves Bright Data, admit only a
narrow, replaceable egress adapter—preferably Datacenter first, ISP only for a
documented geo/stability need, and Residential only after separate peer-sourcing,
privacy, KYC, rights, TLS, and contract review. Never rotate identity to defeat a
publisher block or per-origin rate limit. Do not make Mobile or dedicated
Residential a default lane.

## 1. Decision frame, bounded questions, and evidence rules

### 1.1 Decision

> Does Bright Data's raw proxy family add enough bounded, observable acquisition
> value to justify any role in an owned public-web crawler, without delegating
> publisher policy, evidence, privacy, security, reliability, or budget control?

### 1.2 Bounded sub-questions

1. Which network/pool products exist, who supplies their IPs, and what exclusivity
   or stability is actually promised?
2. What can a request control about exit, geography, DNS, session, rotation,
   failover, protocols, and target routing?
3. Which identity substitutions occur automatically, and can they fail closed?
4. What governance constrains customers, targets, ports, methods, and real-device
   peers?
5. What TLS, credential, SSRF, privacy, data-retention, and legal risks follow?
6. Which errors, peer metadata, logs, usage, status, and SLA signals are exposed?
7. What hard limits and public prices apply, and where do sources conflict?
8. Which patterns should Curiosity adopt, adapt, reject, or defer?

### 1.3 Labels and method

- **FACT** — directly stated or structurally present in a cited first-party
  source. Vendor performance, pool, ethics, audit, and compliance statements
  remain attributed representations, not independent proof.
- **INFERENCE** — the narrowest clean-room conclusion consistent with documented
  behavior; never a claim about proprietary algorithms or deployment.
- **RECOMMENDATION** — a Curiosity architecture, safety, or procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established by the public sources reviewed.
- Confidence is **high**, **medium**, or **low**.

The official documentation index and complete public docs corpus were searched
for proxy, session, rotation, geo, DNS, errors, logs, usage, security, Mobile,
limits, and legal terms [S27]. Contradictions are retained rather than silently
reconciled. The MSA prohibits reverse engineering and mapping Bright Data IPs;
this dossier stays at the public contract boundary [S20].

## 2. Product family and sourcing

### 2.1 Observable network types

| Product/pool | First-party boundary | Stability and exclusivity | Meter shape |
| --- | --- | --- | --- |
| Residential shared IPv4 | Real end-user devices; random peer normally changes per request | Ephemeral; caller can request sticky affinity, but a peer may disappear | Bandwidth [S1-S2][S7] |
| Residential shared IPv4+IPv6 “Mega Pool” | Combined rotating pool; current docs claim about 150,000 IPv6 peers | Same gateway/credentials; several IPv4 targeting controls are ignored in IPv6 | Bandwidth, same stated rate as IPv4 [S2] |
| Residential shared IPv6 | IPv6-only rotating real-device pool | No `gip`, ASN, ZIP, explicit IP, carrier, or OS targeting; optional IPv4 fallback | Bandwidth [S2] |
| Dedicated Residential | A `gIP` groups 6–90 changing peers with shared attributes | Exclusive only toward configured domains; other domains are sent through Bright Data-hosted Datacenter proxies | Public current price not clearly exposed [S2][S7] |
| ISP shared rotating | Residential-registered addresses bought/leased from ISPs and hosted on servers | Random rotating pool; docs conflict on 10,000 versus about 40,000 pool size | Bandwidth [S3][S5][S11] |
| ISP shared unlimited | Fixed allocated addresses shared with others | “Static” allocation; provider may replace degraded/unavailable IPs | Per IP plus fair-use overage [S5][S13] |
| ISP dedicated unlimited | Fixed allocated addresses exclusive to customer | Long-lived while allocated, subject to replacement, billing, and suspension | Per IP plus fair-use overage [S5][S11][S13] |
| Datacenter shared rotating | Server-assigned addresses from a shared pool | Random rotation; docs describe about 40,000 rotating IPs | Bandwidth [S4][S5] |
| Datacenter shared/dedicated unlimited | Fixed server IP allocations, shared or exclusive | Stable while allocated; refresh/reallocation and provider replacement can change IPs | Per IP plus fair-use overage [S5][S12-S13] |
| Mobile | Legacy/current cross-cutting docs describe real-device Mobile, shared rotation, geo, sessions, SOCKS, status, and a `mobile` cost dimension | **Product-status unknown:** the current docs/product indexes and pricing selector omit a dedicated Mobile product/page, while API/docs still enumerate it | Current public list price not found [S6-S8][S16][S27] |

**FACT (high):** current top-level docs present Residential, Datacenter, and ISP as
the three proxy-network products. Authentication, rotation, geo, status, port,
and pricing FAQ material still refers to Mobile [S6-S8][S16][S27].

**RECOMMENDATION (high):** do not code or procure against “Mobile” until Bright
Data provides a current product order form, technical contract, sourcing model,
KYC rule, and price. Treat the surviving references as documentation drift, not
proof of generally purchasable inventory.

### 2.2 Residential peer sourcing and governance

**FACT (medium; vendor representation):** Bright Data says Residential peers are
real users who explicitly opt in through approved applications, are informed how
their IP will be used, receive compensation or an app benefit, and can opt out.
Its product page describes app owners integrating a Bright Data SDK and being
paid according to opted-in users [S1][S10][S18].

**FACT (medium; vendor representation):** the sourcing checklist says SDK
partners must use a clear consent screen, include participation in their own
terms/privacy policy, provide a benefit, expose easy opt-out, avoid PUA status,
and permit only opted-in users as nodes. Separate docs claim idle/battery/data
controls, daily/weekly bandwidth caps, sandboxing, and no collection of the
peer's private traffic [S10][S18][S19].

**FACT (high):** the Privacy Policy warns a peer that, although Bright Data says
it does not disclose the peer IP to customers, a customer using that address can
observe it by checking its current IP [S22].

**UNKNOWN (high importance):** public sources reviewed do not provide a current
peer-level consent ledger, SDK/app inventory, compensation schedule, opt-in and
opt-out evidence, jurisdiction/age controls, per-peer traffic record, independent
sampling result, deletion proof, or customer-verifiable provenance for the exit
used by a request. “Independently audited” product copy did not link a public
peer-sourcing audit report with sample methodology and exceptions [S10][S18].

**INFERENCE (high):** Residential is a supply-chain dependency on app developers,
end-user consent UX, device availability, and provider enforcement—not merely a
larger set of addresses. A network-wide ethics claim cannot establish that the
particular peer behind one acquisition was correctly consented and eligible.

**RECOMMENDATION (high):** Residential needs vendor diligence equivalent to a
high-risk subprocessor/supplier review: current partner-control audit, revocation
and complaint evidence, geography/age restrictions, peer resource limits,
incident process, and contractual warranties. Hidden peer IPs should remain
hidden in normal Curiosity telemetry; operators do not need to map the network.

### 2.3 ISP and Datacenter sourcing

**FACT (high):** ISP proxies are residential-registered IPs bought or leased from
ISPs for commercial use but hosted on servers. Datacenter proxies are addresses
assigned from datacenter servers [S3-S4].

**UNKNOWN:** the public pages do not identify upstream ISPs/hosting suppliers,
RIR allocation/authorization evidence, lease terms, abuse-contact delegation,
shared-user cardinality, IP reputation history, or region-specific data path for
an allocated ISP/Datacenter address.

**INFERENCE (high):** ISP and Datacenter avoid routing through an end user's
device and therefore reduce peer-consent/resource risk. They do not remove IP
reputation, upstream abuse, target-rights, privacy, or provider-retention risk.

## 3. Request and routing contract

### 3.1 Gateway, zone, and credentials

**FACT (high):** native access connects to `brd.superproxy.io:44445` using a zone
username/password. The username contains account ID, immutable zone name, and
optional routing controls. A zone denotes one proxy product and base
configuration [S6][S8][S17].

**INFERENCE (high):** the zone is the central customer-visible policy object. It
binds network class/pool, credentials, geo defaults, allocated IPs, access and
target lists, port permissions, spend/traffic limits, compliance policy, and
billing. The Super Proxy gateway authenticates and chooses the effective exit.

**SECURITY INFERENCE (high):** credentials embedded in proxy URLs/usernames can
leak through command history, process arguments, client exceptions, telemetry,
and crawler configuration. Request controls appended to the username can also
create accidental high-cardinality secret-like logs.

**RECOMMENDATION (high):** one zone per environment and approved network class;
broker credentials in the adapter; rotate zone passwords; allowlist stable
Curiosity egress IPs; never return proxy credentials to an agent; and keep zone,
session, `gIP`, hashed peer, and C-Tag details out of the provider-neutral ABI.

### 3.2 Caller-visible controls

| Control | Documented behavior | Evidence caveat |
| --- | --- | --- |
| Country | `-country-xx`; `eu` selects a random EU member state | Requested constraint; inventory may be absent [S6] |
| State, city, ZIP, ASN | Residential supports state/city/US ZIP/ASN; carrier and OS appear in broader docs | Current config says Datacenter/ISP are country-only; marketing still claims city [S2][S6][S12] |
| OS | Residential Windows/macOS/Android targeting | It denotes provider classification, not a browser/device fingerprint proof [S6] |
| DNS | `-dns-local` at Super Proxy or `-dns-remote` at exit; an entry-gate DNS existence check still occurs | DNS-check location and exit location can differ [S6][S14] |
| Session | `-session-<alphanumeric>` requests same peer | Same parameters and caller global region required; idle expiry resets identity [S7] |
| Fixed IP / group | `-ip` for allocated static IP; `-gip` for dedicated Residential group | `gIP` is a changing group, not one guaranteed device [S2][S7] |
| Fail closed | `-const` fails if session peer is unavailable; `-route_err-block` forbids Super Proxy bypass | Needed to preserve path semantics [S6-S8] |
| Correlation | `-c_tag` echoed as `x-brd-c_tag` | Correlation only, not a job/idempotency/evidence object [S15] |
| Protocol/port | HTTP/HTTPS; SOCKS5 via port 22228; HTTP/3/QUIC described for selected enterprise users | Allowed target ports vary by network and compliance approval [S5][S26] |

**FACT (high):** raw proxies do not select browser fingerprints, solve CAPTCHAs,
render JavaScript, validate block pages, parse records, or own target retries as
part of their documented core contract. Bright Data directs users needing those
behaviors to Web Unlocker [S1][S3-S4][S27].

**INFERENCE (high):** the work unit is a network request/connection, not a
provider job. A successful tunnel or target HTTP response says nothing about
content completeness, freshness, semantic quality, permission, or crawler
coverage.

### 3.3 Geography is a selection claim, not provenance

**FACT (high):** shared pools choose a random peer from eligible configured
countries. If default countries exist and no peer is available in the randomly
selected country, the request fails; without defaults, selection is random from
the pool [S6]. Residential supports finer targeting; city for Datacenter/ISP is
explicitly deprecated in technical docs [S6].

**FACT (high):** Bright Data's diagnostic endpoint returns explicit IP/location
for Datacenter and ISP, but for Residential/Mobile it returns location details
without the explicit IP. Bright Data says it maintains MaxMind records and warns
third-party GeoDBs may disagree [S14].

**RECOMMENDATION (high):** preserve separately:

- requested geo and strict/fallback policy;
- provider-selected product/pool and provider-reported observed geo/ASN;
- explicit or hashed exit identifier when contractually returned;
- target-reported locale and content localization; and
- independent sample validation result, when later authorized.

None is proof of legal jurisdiction, residence, source publication location, or
target content completeness.

## 4. Rotation, stickiness, substitution, and identity

### 4.1 Default rotation

**FACT (high):** in a shared pool, Bright Data normally selects a random eligible
proxy for each request; high-rate or parallel callers may still reuse an IP.
Dedicated/static pools rotate through the caller's allocated addresses unless an
IP/session/group is selected [S7].

**INFERENCE (high):** “rotating” does not promise no reuse, round-robin order,
uniform sampling, reputation diversity, or a fresh household/device. It means
provider-controlled selection from currently eligible inventory.

### 4.2 Sticky sessions

**FACT (high):** the caller supplies an alphanumeric session ID. Reusing it with
identical routing parameters and from the same broad caller region (AMER, EMEA,
or APAC) requests the same peer. A changed geo/option or caller region loses
context. `-const` converts peer loss/reset into HTTP 502 rather than silently
assigning a new peer [S7-S8].

**CONTRADICTION:** the normative rotation page says five minutes of idle time;
current FAQ copies say one minute in one location and seven minutes in another.
No portable duration should be assumed [S5][S7].

**CHECK / CONTRADICTION:** release notes describe `min_ttl=1..60` as both a
“guaranteed minimum session lifetime” and a peer **estimated** to remain online.
No dedicated public parameter contract or failure semantics was found [S25].

**INFERENCE (high):** a sticky session is exit affinity only. It does not preserve
cookies, browser storage, TLS sessions, authenticated state, request ordering, or
one physical device. Even a requested minimum TTL cannot prevent device/network
loss unless a written contract says otherwise.

**RECOMMENDATION (high):** owned crawling ordinarily needs no cross-request
identity affinity. If a benign public flow truly requires it, mint a short-lived,
task- and origin-bound opaque handle; keep all cookies/state locally partitioned;
use `const`/fail-closed behavior; and record an identity-change event. Never send
dummy keep-alive target requests merely to preserve a proxy lease—they create
unnecessary publisher traffic and cost.

### 4.3 Hidden path changes

**FACT (high):** documented substitutions include:

- unavailable-peer failover to another peer;
- IPv6-to-IPv4 fallback, enabled by default for IPv4-only targets;
- Datacenter/ISP automatic failover to an equivalent replacement on the next
  connection, except when an exact IP was selected;
- default re-assignment after sticky-session peer loss;
- dedicated Residential requests to non-dedicated domains exiting through
  Bright Data-hosted Datacenter proxies; and
- policy/technical Super Proxy bypass, where gateway infrastructure originates
  the request instead of a peer [S2][S5-S8].

**FACT (high):** `-route_err-block` prevents a request from falling back to the
Super Proxy; `-const` prevents peer substitution within a session [S6-S8].

**INFERENCE (high):** “Residential request” describes the selected zone, not
necessarily the effective exit class. Without fail-closed settings and returned
path evidence, provenance can silently overstate residential, IPv6, dedicated,
or sticky execution.

**RECOMMENDATION (high):** fail closed on product class, IP version, geo, and
session identity whenever those attributes matter. A fallback must be a new
Curiosity attempt with a new attempt ID and policy decision—not an invisible
continuation. If path evidence is absent, mark `effective_exit_class: unknown`.

## 5. Crawler semantics and evidence

### 5.1 What the proxy supplies

**FACT (high):** target bytes and headers flow through the caller's proxy client.
Bright Data adds operational headers including structured proxy errors, peer/path
metadata, timeline data, and optional C-Tag. Bandwidth includes request headers,
POST body, response headers, and response body [S15-S16][S24].

**FACT (high):** starting October 2025 Bright Data added RFC 9209
`Proxy-Status`; proprietary `x-brd-err-code`/`x-brd-err-msg` remain during a 2026
migration. `x-luminati-*` headers were scheduled to disappear after 2026-05-01
[S16][S25].

**UNKNOWN / NEGATIVE RESULT (high confidence):** no reviewed raw-proxy contract
guarantees:

- complete redirect chain, origin-connect timestamps, TLS identity/transcript,
  or original wire bytes;
- a target/provider status envelope for every client/protocol;
- exact effective exit class, public exit IP, geo source/version, or every
  failover event;
- retry count (caller retries are outside provider scope), cache disposition,
  origin contact, `Age`, or freshness SLA;
- browser/runtime/fingerprint, robots decision, user-agent identity, pacing, or
  per-origin concurrency;
- content digest, immutable request manifest, WARC/HAR, replay, or artifact
  retention; or
- semantic block detection, body validity, extraction, canonicalization, or
  duplicate relation.

**INFERENCE (high):** proxy metadata is acquisition telemetry, not source
evidence. `x-brd-ip` is especially ambiguous: one error page calls it the peer IP,
while FAQs describe a unique hash for Residential selection. Never assume it is
a routable address or stable global identity [S5][S16].

### 5.2 Minimum Curiosity evidence envelope

**RECOMMENDATION (high):** an optional proxy adapter should add, without exposing
provider details to core callers:

```text
request_id, attempt_id, provider, adapter_version, zone_profile
requested_url, normalized_url, final_url?, redirect_chain?
started_at, headers_at, body_completed_at
requested_network_class, effective_network_class?, fallback_events[]
requested_geo, provider_observed_geo?, exit_ref_hash?, ip_version?
session_policy, identity_change, dns_policy
transport_outcome, proxy_outcome, origin_status, content_outcome
proxy_status_raw?, provider_error_code?, provider_timeline?
media_type, encoded_bytes, decoded_bytes, sha256, truncated
origin_validators?, cache_disposition=unknown, freshness=unknown
policy_decision_id, robots_decision_id, pacing_bucket_id
provider_billed_bytes?, estimated_cost, untrusted_external_data=true
```

Question marks are first-class missing evidence. Preserve raw proxy headers in a
restricted diagnostic record, redact credentials/peer identifiers, and do not
forward vendor control headers into content processing.

### 5.3 Why rotating proxies conflict with owned-crawler governance

**INFERENCE (high):** publisher load and consent attach to the **origin and
crawler**, not to an exit IP. Rotating exits can accidentally defeat IP-based
publisher rate controls, obscure a consistent crawler identity, fragment cookie
state, and make failures less reproducible. Those effects are liabilities for a
governed crawler even when rotation improves reachability.

**RECOMMENDATION (high):** Curiosity's per-origin scheduler, robots identity,
contact URL, concurrency, delay, retry budget, and block response must remain
constant across all exits. A 403/429/challenge is a policy/quality signal, not a
trigger to churn peers until access succeeds. Proxy selection may satisfy an
approved localization or availability need; it must not expand crawl authority.

## 6. Abuse, security, privacy, and legal boundary

### 6.1 Provider governance

**FACT (high):** new Residential zones after 2026-07-07 require a registered
company, corporate email, funded account, registration evidence, a human-reviewed
use case, and sometimes ID/video verification. Bright Data says review normally
updates within 48 hours, monitors Residential traffic 24/7, and blocks domains,
categories, methods, or uses outside approval [S9].

**FACT (high):** the error catalog exposes blocks for government, search-engine,
restricted category/network/country/port, zone host allowlist/denylist, excessive
per-domain or per-peer traffic, and legacy immediate-access robots restrictions.
Direct-IP targeting and SMTP are blocked or rerouted in FAQ material [S5][S16].

**FACT (high):** the AUP prohibits nonpublic/behind-login collection, DDoS, spam,
fraud, impersonation, fake accounts/content/engagement, ticket bots, proxy resale,
streaming, and violations of law or third-party rights. Bright Data can add or
remove content blocks at its discretion [S21].

**INFERENCE (high):** these controls are useful defense in depth but are neither
complete nor stable authorization. KYC approves a customer/use case; it does not
grant permission from a publisher or resolve robots, terms, copyright, database
rights, privacy, or proportionality.

### 6.2 Destination and SSRF security

**FACT (high):** zones support caller-source IP allowlists and target-domain
allow/denylists. Empty source allowlists permit other credential holders; adding
one source IP causes other source IPs to be blocked. Target rules support broad
wildcards [S5][S23].

**NEGATIVE RESULT (high):** reviewed public raw-proxy sources do not establish a
complete SSRF contract covering private, loopback, link-local, multicast,
reserved, cloud-metadata, service-network, IDN/confusable, alternate-IP,
DNS-rebinding, and redirect targets across HTTP, CONNECT, SOCKS5, and HTTP/3.
Forbidding literal-IP target URLs is not equivalent to post-DNS address policy.

**RECOMMENDATION (high):** Curiosity must validate scheme/host/port before the
proxy call, resolve and reject unsafe addresses, pin/recheck DNS as appropriate,
revalidate every redirect and connection, and use a strict target-domain
allowlist in the Bright Data zone as secondary containment. Deny non-HTTP(S),
unsafe ports, target credentials, arbitrary CONNECT/SOCKS, and caller-supplied
proxy username controls in the public-web lane.

### 6.3 TLS interception and credentials

**FACT (high):** Bright Data documents a root CA for native Residential,
Unlocker, and SERP access on port 44445, with old port certificates expiring
2026-09-25. The same page says API access or KYC can avoid the certificate, but
also publishes examples that disable certificate/hostname verification [S17].

**INFERENCE (high):** where the Bright Data CA signs the target-facing client
connection, Bright Data or its software terminates/analyzes HTTPS rather than
providing a transparent end-to-end tunnel. The exact products, account modes,
targets, headers, and post-KYC path for which this occurs are not normatively
resolved by the reviewed docs.

**RECOMMENDATION (high):** **REJECT all `-k`, `verify=false`, trust-all manager,
and global-root-store examples.** Before any native pilot, obtain a written TLS
data-flow specification and CA rotation/revocation process. If interception is
required, confine the reviewed CA to an isolated adapter trust store; send no
origin Authorization, client certificate, private cookie, secret query/body, or
authenticated page through it. Prefer a non-intercepting verified tunnel; if one
cannot be guaranteed, reject the integration.

### 6.4 Data handling and contract

**FACT (high; consequential):** MSA §10.1.IV says Bright Data may retain data the
client collected via Proxy Services and use it for its own purposes in its sole
discretion. The MSA also permits use monitoring, makes the client responsible for
law/rights, disclaims security, accuracy, completeness, non-infringement, and
continuous operation, caps aggregate liability at one prior month of fees, and
prohibits reverse engineering or mapping Bright Data IPs [S20].

**FACT (high):** the Privacy Policy covers account/KYC identity documents,
addresses, payment data, IPs, and possible call recordings; uses purpose/legal-
need retention rather than one fixed period; may transfer information outside
the EEA; says it does not rent/sell User Data while its CCPA notice says it may
have sold “Identifiers” in the preceding 12 months [S22].

**FACT (high):** the public DPA requires documented instructions,
confidentiality, reasonable security, rights and breach assistance, breach notice
without undue delay, deletion on request or termination subject to law, transfer
safeguards, and annual audit rights on 30 days' notice. It gives general
subprocessor authorization with seven days' notice/objection but does not name
subprocessors or set fixed breach/deletion periods [S34].

**UNKNOWN:** retention/deletion for target URLs, query strings, headers, bodies,
responses, DNS data, peer/session mappings, errors, timelines, event logs, raw
export logs, and backups; independent-use/model-training scope under MSA §10.1.IV;
regional processing; current subprocessors; customer-managed keys; and how a DPA
instruction interacts with the MSA's own-purpose right.

**RECOMMENDATION (high):** require an order-form/DPA override: no payload or URL
retention beyond tightly defined operations; no independent use, analytics reuse,
or training; named subprocessors/regions; fixed deletion and backup-purge SLA;
incident deadline; support-access logging; output rights; and precedence over
online terms. Until then, no sensitive URLs, personal query parameters,
credentials, unpublished content, or regulated data.

### 6.5 Security attestations

**FACT (medium; vendor-claimed with linked attestations):** Bright Data reports
ISO/IEC 27001:2022, 27017, 27018, SOC 2 Type II under NDA, public SOC 3, TLS
1.3/minimum 1.2, AES-256 at rest, AWS multi-AZ, annual penetration testing, and a
2025 test explicitly covering Datacenter, Residential, Mobile, and ISP proxies
[S28].

**UNKNOWN:** no reviewed public report maps those controls to per-request TLS
interception, raw-log/payload retention, peer-supply consent, DNS-rebinding/SSRF,
zone credential isolation, or exact target/peer metadata access. Platform
certification is not product-specific proof of those properties.

## 7. Reliability and observability

### 7.1 Error and health surfaces

**FACT (high):** Bright Data publishes a real-time product/datacenter status page,
email subscriptions, and an authenticated `GET /network_status/{NETWORK_TYPE}`
endpoint. The API enum exposes `all`, `res`, `dc`, and `mobile` but omits ISP,
while the public page separately lists ISP [S16][S29-S30].

**FACT (high):** proxy errors distinguish client/auth/config, policy, peer,
target/DNS, timeout, capacity/rate, and account/billing failures through HTTP,
`Proxy-Status`, and `x-brd-*` fields. A response without provider headers may be
target-originated, and HTTP 200 without expected data may still be a block page
[S16].

**RECOMMENDATION (high):** preserve raw provider and target statuses separately;
classify deterministic policy/auth/config failures as non-retryable; retry peer,
gateway, and target failures only under Curiosity attempt/deadline/pacing budgets;
and validate the body independently. Never infer semantic success from HTTP 200,
absence of `x-brd-error`, or provider network health.

### 7.2 Usage, cost, and request telemetry

**FACT (high):** dashboard usage can be grouped by product, zone, target domain,
bandwidth, request count, and average bandwidth. APIs expose zone/all-zone
bandwidth, zone cost, detailed cost export, allocated/unavailable static IPs,
recent source IPs, and zone/account state [S5][S24][S31].

**FACT (high):** the control-panel event log is not a complete request ledger. Its
dedicated page says it shows one line for the first request from each unique
source IP in the past hour; a FAQ instead says “at most the last 200 requests.”
Fields are date, zone, caller source IP, target URL, and success/fail [S5][S32].

**FACT (high):** cost export is the invoice source of truth. Bright Data warns
customer raw logs may differ from billed records by a few percent because of
asynchronous aggregation or transient issues [S31]. Usage limits are evaluated
about every 15 minutes and can overshoot; high load can delay statistics [S2]
[S24].

**UNKNOWN:** stable per-request billable byte/cost export, event-log retention,
URL redaction, proxy-timeline schema, log-export schema/delivery authentication,
complete path-change events, metric freshness SLO, and reconciliation keys
between C-Tag, provider telemetry, and invoice records.

**RECOMMENDATION (high):** Curiosity needs its own request/byte/latency/error/
fallback counters and immutable attempt IDs. Use provider stats for reconciliation,
not provenance. Treat target URLs and source IPs in logs as sensitive metadata;
redact query strings, deny secret headers, restrict operator access, and use
short retention.

### 7.3 SLA versus marketing

**FACT (high):** the May 2026 public SLA commits only commercially reasonable
**99.9%** monthly network uptime. Credits are 5% (capped at $1,000) for 99.0–99.9%
and 10% (capped at $2,000) below 99%; scheduled maintenance and broad external/
customer/policy causes are excluded, and a documented claim is required [S33].

**CONTRADICTION:** product/pricing pages repeatedly advertise **99.99%** network
uptime and Residential 99.95% success, while the legal SLA is 99.9% availability
and defines success-rate incidents only for Unlocker/SERP—not raw proxies
[S11-S13][S33].

**INFERENCE (high):** availability is provider-gateway transfer availability,
not peer-in-geo availability, target reachability, response correctness, or
crawler success. Marketing performance numbers are not the raw-proxy SLO.

**RECOMMENDATION (high):** require a product/network/region-specific enterprise
SLO if business continuity depends on it, but architect multi-provider/direct
fallback regardless. Service credits are not a recovery mechanism.

## 8. Limits and pricing observed 2026-08-17

Prices are time-sensitive, promotional, and not a quote. They establish meter
shape and worst-case questions.

### 8.1 Public price snapshot

| Product | Current public page | Important qualification |
| --- | --- | --- |
| Residential shared | List/PAYG $8/GB displayed with 50%-off $4/GB coupon; $499 for 141 GB at displayed $3.50/GB promo; $999/332 GB at $3; $1,999/798 GB at $2.50 | Request+response headers/bodies count; no unlimited Residential [S13][S18][S24] |
| ISP shared unlimited | 10 IPs $1.80/IP; 100 $1.45; 500 $1.40; 1,000 $1.30 monthly | 100 GB/IP/month pooled fair use, then PAYG overage [S11][S13] |
| ISP dedicated unlimited | 10 IPs $3.50/IP; 100 $2.75; 500 $2.60; 1,000 $2.50 monthly | Same 100 GB/IP/month pooled fair use [S11][S13] |
| ISP pay/GB | $8/GB PAYG; $499/71 GB at $7; $999/166 GB at $6; $1,999/399 GB at $5 | Geo inventory and target restrictions vary [S11] |
| Datacenter shared unlimited | 10 IPs $1.40/IP; 100 $1; 500 $0.95; 1,000 $0.90 monthly | 100 GB/IP/month pooled fair use [S12-S13] |
| Datacenter dedicated unlimited | 10 IPs $2.20/IP; 100 $1.70; 500 $1.50; 1,000 $1.30 monthly | Refresh/reallocation may incur charges [S5][S12] |
| Datacenter pay/GB | $0.60/GB PAYG; $499/1 TB at $0.51; $999/2 TB at $0.45; $1,999/5 TB at $0.42 | Marketing “unlimited bandwidth” does not describe the pay/GB lane [S12] |
| Mobile / dedicated Residential | No current dedicated price found in the reviewed main pricing/index pages | Written quote/product status required [S27] |

**FACT (high):** “unlimited” ISP/Datacenter actually means per-IP pricing with a
100 GB/IP calendar-month fair-use allowance pooled across zones of the same
network type. Overages continue and are billed at current PAYG rates; reducing IP
count immediately reduces allowance and cannot reverse an incurred overage
[S13].

**FACT (high):** up to 50 zones are free; additional zones cost $5/month.
Disabling/releasing zones can release allocated IPs; monthly commitments do not
roll over while active [S24].

### 8.2 Throughput and capacity

**FACT (high):** Bright Data says there is no single global proxy request limit,
but it monitors general inflow and per-IP traffic and can issue 429s. An unfunded
account may have a default 1,000 requests/minute cap. Domain health monitoring can
also throttle traffic [S5][S16].

**UNKNOWN:** numeric funded-account QPS/concurrency, per-gateway and per-region
capacity, queueing, connection/tunnel/idle timeout, maximum URL/header/body/
response size, decompression limit, redirect limit, per-peer load ceiling,
bandwidth rounding, minimum billable unit, failed-request billing, and exact
overage rate for every plan.

**RECOMMENDATION (high):** admission must enforce hard Curiosity limits for
concurrency, per-origin rate, requests, redirects, encoded/decoded bytes, wall
time, attempts, and dollars. Provider zone limits lag by up to 15 minutes and are
not a hard denial-of-wallet boundary.

### 8.3 Documentation and marketing drift

1. **Datacenter scale:** technical intro says 1.6M+; product hero says 1.3M+; the
   same product page later says 770,000 [S4][S12]. Treat all as volatile marketing.
2. **ISP rotating pool:** config says about 40,000; FAQ says 10,000 [S5].
3. **ISP geography:** technical docs say country-only and city deprecated;
   product copy claims any city/free geotargeting [S6][S11]. Use country only.
4. **Session idle:** one, five, and seven minutes appear in current docs [S5][S7].
5. **Minimum TTL:** “guaranteed” and “estimated” describe the same 1–60 minute
   feature [S25]. Treat as best effort absent a contract.
6. **Uptime:** 99.99% marketing versus 99.9% legal SLA [S11-S13][S33].
7. **Mobile:** still appears in API/config/status/FAQ schemas but is absent from
   current top-level product and price indexes [S6-S8][S16][S27].
8. **Ports:** current native examples use 44445, while product snippets still use
   22225/33335; old certificates expire 2026-09-25 [S11-S12][S17].
9. **Residential KYC:** current policy says all new zones require funded,
   company-only KYC; older FAQ/error language retains immediate/no-KYC modes only
   for grandfathered zones [S9][S16].
10. **Dedicated Residential:** “dedicated” means domain-specific exclusivity and
    a rotating `gIP`, not one universally exclusive stable device [S2][S7].

## 9. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data source code,
services, algorithms, storage, cloud topology, or peer SDK internals.

```text
Curiosity crawler
  -> local URL/robots/rights/pacing/budget gate
  -> provider adapter holding zone credentials
  -> Bright Data Super Proxy gateway
       auth + zone + source/target/port policy + account/KYC + billing
       entry DNS existence check
       routing planner
          network pool + geo + IP version + session + availability
          failover / Super Proxy bypass (unless failed closed)
  -> effective exit
       Datacenter server | ISP-hosted server | Residential peer/device
  -> exit DNS resolution -> public target
  -> target response + proxy/error/path headers

Observation/control plane:
  dashboard/event samples | network status | bandwidth/cost APIs
  zone/IP inventory | policy errors | optional exported logs
```

Evidence supporting only this decomposition:

- all native calls enter a common Super Proxy with zone credentials [S6][S8];
- the gateway chooses peers, balances load, performs an entry DNS check, and may
  originate a bypass request [S5][S14];
- username parameters control pool, geo, DNS, session, and fallback [S6-S8];
- network classes have distinct sourcing and stability [S1-S5]; and
- account APIs/status/error headers expose a separate policy/billing/observation
  plane [S16][S29-S32].

**NOT ESTABLISHED:** scheduler algorithm, peer scoring, warm pools, region
topology, inter-service protocols, customer/peer isolation mechanism, raw log
stores, cache, exact TLS termination path, retry behavior inside a connection,
or selection/fraud models. No private architecture is needed for the decision.

## 10. Curiosity verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Zone as product/policy/budget boundary | **ADOPTED conceptually** | High | Provider profile per environment/network; credentials stay adapter-private. |
| Requested and observed geo kept separately | **ADOPTED** | High | Record constraint, provider observation, and target locale independently. |
| Rotating/sticky/fixed exit as explicit modes | **ADOPTED** | High | Default crawler mode is stable/direct; affinity needs narrow approval. |
| Fail-open versus fail-closed routing | **ADOPTED** | High | Fail closed when class/geo/IP/session matters; fallback is a new attempt. |
| RFC 9209 proxy errors | **ADOPTED** | High | Normalize error ownership while preserving raw fields. |
| Provider traffic/cost APIs | **ADAPTED** | High | Reconciliation signal only; Curiosity owns real-time ceilings and ledger. |
| Residential peer sourcing | **DEFERRED** | High | Needs supplier/consent audit and legal/privacy/KYC approval. |
| ISP as stable localized egress | **DEFERRED** | Medium-high | Consider only if direct/Datacenter cannot meet an approved need. |
| Datacenter as optional alternate egress | **DEFERRED** | High | Lowest peer risk, but contract/TLS/security/fixture checks still required. |
| Mobile network | **DEFERRED / unavailable until clarified** | High | Current product, sourcing, KYC, docs, and price are not coherent. |
| Raw proxy as crawler, fetch evidence, or success oracle | **REJECTED** | High | It supplies routing, not policy, provenance, freshness, or content quality. |
| Bright Data as required owned-crawler dependency | **REJECTED** | High | Creates commercial, legal, path, ethics, and availability coupling. |
| Rotation after target block/rate limit | **REJECTED** | High | Circumvents publisher signals and breaks per-origin governance. |
| Silent peer/class/IP-version/Super Proxy fallback | **REJECTED** | High | Corrupts path evidence and reproducibility. |
| Trust-all TLS / global Bright Data root | **REJECTED** | High | Excessive interception and credential risk. |
| Agent-controlled URL/proxy flags/session/headers | **REJECTED** | High | SSRF, policy expansion, identity simulation, secrets, and cost risk. |
| Provider logs as archive/provenance | **REJECTED** | High | Sampled/operational, retention unclear, and not capture evidence. |

### 10.1 Owned-crawler dependency answer

**RECOMMENDATION (high): reject dependency, not optional interoperability.** The
owned crawler's contracts should define a generic `EgressPolicy` and accept zero
or more replaceable providers. Direct egress must remain a tested implementation.
A provider adapter can request a network class and geo, but it must not own:

1. crawl scope, robots identity/decision, publisher opt-out, or legal authority;
2. per-origin queue, concurrency, delay, retry, stop, or block response;
3. URL/DNS/redirect safety and secret handling;
4. target response validation, raw capture, hashing, or extraction;
5. canonicalization, deduplication, frontier, or coverage;
6. evidence retention, cost ceiling, or incident kill switch.

This design preserves leverage, makes Residential revocable, and prevents a
proxy outage or contract change from disabling the owned acquisition plane.

## 11. Unknowns and required pre-adoption checks

### 11.1 Contract, privacy, and supply blockers

1. Supersede MSA §10.1.IV: no target/request/response retention, independent use,
   analytics reuse, or model training beyond explicit short-lived operations.
2. Obtain current DPA annex, subprocessor list/regions, transfer mechanism,
   fixed incident deadline, payload/log/session/DNS/backup retention and deletion,
   government-request handling, and audit rights.
3. Obtain current Residential/Mobile sourcing audit: app/SDK control framework,
   consent and opt-out sampling, age/jurisdiction limits, compensation, peer
   resource caps, revocation, complaints, and exceptions.
4. Clarify output/capture rights, target complaints/takedown, liability,
   indemnity, online-term change notice, and SLA applicability per network.

### 11.2 Technical and security blockers

5. Define exact TLS tunnel/interception behavior for each network/account/KYC
   mode; CA scope/rotation/revocation; target certificate validation; and whether
   a verified, non-intercepting CONNECT path is guaranteed.
6. Define SSRF controls after DNS resolution and across redirects, CONNECT,
   SOCKS5, HTTP/3, IPv6, and Super Proxy fallback; confirm private/reserved/
   link-local/metadata/service addresses and unsafe schemes/ports fail closed.
7. Define all automatic substitutions and returned evidence: peer, product class,
   IP version, country/region, Super Proxy bypass, dedicated-domain miss, and
   static-IP replacement.
8. Reconcile session idle and `min_ttl`; define session collision scope,
   concurrency, geo/parameter changes, caller-region changes, and `const` errors.
9. Publish hard connection/request/header/body/response/redirect/decompression/
   timeout/concurrency limits and a stable retryability taxonomy.
10. Define API/password least privilege, per-zone key scope, rotation overlap,
    audit events, source IP rules, target wildcard semantics, and log redaction.

### 11.3 Reliability, evidence, and billing blockers

11. Reconcile product/pool/geo/Mobile documentation and quote the exact selected
    pool, inventory commitment, refresh/replacement charges, and overage rate.
12. Define per-request billable bytes, failures/timeouts/fallbacks, rounding,
    fair-use attribution, statistics lag, limit overshoot, and reconciliation ID.
13. Define status/incident history API, ISP status support, product/region SLO,
    maintenance, peer-in-geo availability, and credit calculation.
14. Define raw/event log schema, sampling, retention, export authentication,
    query redaction, C-Tag limits, peer metadata, and deletion.

### 11.4 Separately authorized no-cost fixture checks — not executed

Only after the written blockers pass, legal/privacy/security approval, and new
caller authority, use project-owned or explicitly permitted public fixtures and
a hard no-cost budget to verify:

- direct versus proxy response/status/header/body preservation and content hash;
- target/provider error separation and RFC 9209 migration behavior;
- geo request versus reported observation, DNS mode, and IP-version behavior;
- session reuse/expiry/`const`, peer loss, and every failover path;
- strict class/geo/IPv6/Super Proxy fail-closed behavior;
- redirect destination enforcement, size/time cancellation, and credential
  redaction—without probing private addresses or cloud metadata;
- usage/cost/byte/C-Tag reconciliation and delayed zone kill switch; and
- network-status/API/alert and static-IP replacement signals.

No target-block bypass, CAPTCHA, restricted target, login, paywall, private-IP,
peer mapping, paid load, or success-rate test is authorized by this document.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin/check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Current core docs expose Residential, ISP, and Datacenter; Mobile survives in cross-cutting contracts. | High | S1-S8, S16, S27. |
| F2 | FACT | Residential peers are represented as opted-in, compensated real users. | Medium | Vendor assertion S1, S10, S18-S19. |
| F3 | FACT | ISP addresses are bought/leased from ISPs but server-hosted; Datacenter addresses are server-assigned. | High | S3-S4. |
| F4 | FACT | Zone username parameters control geo, DNS, session, IP/group, fallback, and correlation. | High | S6-S8, S15. |
| F5 | FACT | Shared pools rotate by default; sticky identity can be lost or substituted. | High | S7-S8. |
| F6 | FACT | Dedicated Residential is domain-specific and uses changing peer groups. | High | S2, S7. |
| F7 | FACT | Public docs expose peer, IPv4, and Super Proxy fallback paths. | High | S2, S5-S8. |
| F8 | FACT | Current Residential access is company-only, funded, human-reviewed KYC for new zones. | High | S9. |
| F9 | FACT | Proxy errors are migrating to RFC 9209; telemetry and billing APIs exist. | High | S16, S24-S25, S31. |
| F10 | FACT | MSA permits retention and own-purpose use of proxy-collected data. | High | S20 §10.1.IV. |
| F11 | FACT | Native Residential docs may require Bright Data CA and publish unsafe verification-disable examples. | High | S17. |
| F12 | FACT | Legal SLA is 99.9%, not the 99.99% commonly marketed. | High | S11-S13 versus S33. |
| F13 | FACT | Zone usage limits can lag/overshoot by about 15 minutes. | High | S2, S24. |
| I1 | INFERENCE | Zone is the provider-visible policy/billing boundary around a shared gateway. | High | F4, F7-F9. |
| I2 | INFERENCE | A Residential zone does not prove the effective request used a Residential peer. | High | F6-F7. |
| I3 | INFERENCE | Sticky session means exit affinity, not browser/user state. | High | F5 and absence of state contract. |
| I4 | INFERENCE | Raw proxy telemetry is not capture provenance or freshness evidence. | High | Missing evidence in Section 5. |
| I5 | INFERENCE | Rotating exits can undermine publisher-facing crawler governance. | High | F5 plus owned per-origin policy requirements. |
| R1 | RECOMMENDATION | Reject Bright Data as a required owned-crawler dependency. | High | F10-F13, I2-I5. |
| R2 | RECOMMENDATION | Permit only a replaceable, fail-closed, policy-wrapped egress adapter. | High | F4-F9. |
| R3 | RECOMMENDATION | Reject trust-all TLS and sensitive/authenticated traffic. | High | F10-F11. |
| R4 | RECOMMENDATION | Defer Residential/Mobile; consider Datacenter first only after blockers. | High | F1-F3, F8-F12. |

## 13. Bounded curiosity pass and stop

Scores are relevance (**R**), value (**V**), novelty (**N**), and cost (**C**),
each 1–5 where higher cost is worse. Only public, first-party, in-frame threads
were eligible.

| Thread | R/V/N/C | Decision/result |
| --- | ---: | --- |
| Effective exit can differ from selected product | 5/5/5/1 | **Pursued.** Found peer, IPv4, Datacenter, and Super Proxy substitutions; made fail-closed evidence a core requirement [S2][S5-S8]. |
| Residential consent/sourcing verifiability | 5/5/5/2 | **Pursued.** Found SDK/benefit/opt-out representations but no public request-to-peer consent evidence or auditable sample [S10][S18-S19]. |
| Raw-proxy MSA data use | 5/5/5/1 | **Pursued.** Express own-purpose retention right is a procurement blocker [S20]. |
| Session and minimum-lifetime semantics | 5/4/4/1 | **Pursued.** One/five/seven-minute idle conflict and guaranteed/estimated TTL contradiction retained [S5][S7][S25]. |
| Legal SLA versus uptime marketing | 5/4/4/1 | **Pursued.** 99.9% legal availability differs from 99.99% copy; no raw-proxy success SLO [S11-S13][S33]. |
| Is Mobile a current standalone product? | 4/5/5/2 | **Pursued to public-source exhaustion.** APIs/docs still name it; current top-level product/pricing indexes omit it. Deferred rather than guessed. |
| Native TLS trust boundary | 5/5/4/2 | **Pursued.** Root-CA and trust-disable guidance found; exact post-KYC/non-intercepting path remains unknown [S17]. |
| Empirically map peers or validate individual consent | 2/4/5/5 | **CURIOSITY_NO_GO:** prohibited mapping/invasive work, outside authority, and contrary to MSA boundary. |
| Inspect Bright SDK/app binaries or traffic | 2/3/4/5 | **CURIOSITY_NO_GO:** source/binary reverse engineering was not authorized and is unnecessary for procurement blockers. |
| Probe target blocks, CAPTCHA, private IPs, DNS rebinding, or bypasses | 4/4/3/5 | **CURIOSITY_NO_GO:** unsafe/bypass testing and credentials were prohibited. |
| Paid speed/success/availability benchmark | 3/4/2/5 | **CURIOSITY_NO_GO:** paid tests prohibited; a sample would not create a durable contract. |
| Jurisdiction-specific proxy/scraping case-law review | 4/5/4/5 | **CURIOSITY_NO_GO:** requires target, corpus, purpose, and jurisdiction facts plus counsel; outside product-contract frame. |
| Reconstruct peer-selection or anti-detection algorithms | 1/1/4/5 | **CURIOSITY_NO_GO:** no decision value and outside clean-room boundaries. |

**Coverage:** network types/sourcing/governance; request/session/geo/DNS controls;
rotation and substitution; abuse/security/privacy/legal; reliability and
observability; limits/pricing; owned-crawler dependency decision; architecture;
facts/inferences/recommendations; confidence, unknowns, checks, and verdicts are
covered.

**Saturation:** the complete public docs corpus repeated the same network and
control pages. Further resolution requires a negotiated contract, current audit
evidence, or separately authorized fixture evaluation.

**Stop:** coverage and public-source saturation reached. No live autonomous
follow-up is authorized beyond this declared frame.

## Sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product, pool, speed, success, uptime, ethics, security-effectiveness, and
compliance claims are vendor representations unless a cited report itself was
reviewed.

- **[S1]** Residential proxy introduction —
  <https://docs.brightdata.com/proxy-networks/residential/introduction.md>
- **[S2]** Residential configuration (IPv4/IPv6, dedicated `gIP`, failover,
  limits) —
  <https://docs.brightdata.com/proxy-networks/residential/configure-your-proxy.md>
- **[S3]** ISP introduction —
  <https://docs.brightdata.com/proxy-networks/isp/introduction.md>
- **[S4]** Datacenter introduction —
  <https://docs.brightdata.com/proxy-networks/data-center/introduction.md>
- **[S5]** Proxy product FAQ plus ISP/Datacenter configuration —
  <https://docs.brightdata.com/proxy-networks/faqs.md>,
  <https://docs.brightdata.com/proxy-networks/isp/configure-your-proxy.md>,
  <https://docs.brightdata.com/proxy-networks/data-center/configure-your-proxy.md>
- **[S6]** Proxy configuration options and geolocation targeting —
  <https://docs.brightdata.com/proxy-networks/config-options.md>,
  <https://docs.brightdata.com/api-reference/proxy/geolocation-targeting.md>
- **[S7]** Proxy/IP rotation control —
  <https://docs.brightdata.com/api-reference/proxy/rotate_ips.md>
- **[S8]** Disable peer rotation and request-error routing —
  <https://docs.brightdata.com/api-reference/proxy/keep_same_peer_in_session.md>,
  <https://docs.brightdata.com/api-reference/proxy/request_error_handling.md>
- **[S9]** Residential network access policy —
  <https://docs.brightdata.com/proxy-networks/residential/network-access.md>
- **[S10]** Residential sourcing checklist —
  <https://brightdata.com/trustcenter/sourcing>
- **[S11]** ISP product and pricing —
  <https://brightdata.com/proxy-types/isp-proxies>
- **[S12]** Datacenter product and pricing —
  <https://brightdata.com/proxy-types/datacenter-proxies>
- **[S13]** Unlimited ISP/Datacenter fair use —
  <https://docs.brightdata.com/general/usage-monitoring/fair_use_allowance.md>
- **[S14]** Proxy DNS and exit-location behavior —
  <https://docs.brightdata.com/proxy-networks/dns-location-mismatch.md>
- **[S15]** Request/response C-Tag —
  <https://docs.brightdata.com/api-reference/proxy/c-tag.md>
- **[S16]** Proxy error catalog —
  <https://docs.brightdata.com/proxy-networks/errorCatalog.md>
- **[S17]** SSL certificate and API/native authentication —
  <https://docs.brightdata.com/general/account/ssl-certificate.md>,
  <https://docs.brightdata.com/api-reference/authentication.md>
- **[S18]** Residential product/sourcing representation —
  <https://brightdata.com/proxy-types/residential-proxies>
- **[S19]** Peer app privacy/resources —
  <https://docs.brightdata.com/general/privacy/privacy-and-security-for-apps.md>,
  <https://docs.brightdata.com/general/privacy/protect-end-users-resources.md>
- **[S20]** Master Service Agreement, updated 2026-06-16 —
  <https://brightdata.com/license>
- **[S21]** Acceptable Use Policy —
  <https://brightdata.com/acceptable-use-policy>
- **[S22]** Privacy Policy, reviewed 2026-05-14 —
  <https://brightdata.com/privacy>
- **[S23]** Zone source/target allowlists and denylists —
  <https://docs.brightdata.com/general/security/allowlist-denylist-ips-domains.md>
- **[S24]** Usage and bandwidth accounting —
  <https://docs.brightdata.com/general/usage-monitoring/Usage.md>,
  <https://docs.brightdata.com/general/usage-monitoring/bandwidth.md>
- **[S25]** Release notes —
  <https://docs.brightdata.com/release-notes.md>
- **[S26]** SOCKS5 and protocol/port support —
  <https://docs.brightdata.com/proxy-networks/socks5.md>
- **[S27]** Official documentation/product indexes —
  <https://docs.brightdata.com/llms.txt>, <https://brightdata.com/llms.txt>
- **[S28]** Security and compliance overview —
  <https://docs.brightdata.com/general/security/security-overview.md>
- **[S29]** Public network status —
  <https://brightdata.com/network-status>
- **[S30]** Network-status API —
  <https://docs.brightdata.com/api-reference/account-management-api/Get_current_service_status.md>
- **[S31]** Cost/bandwidth APIs —
  <https://docs.brightdata.com/api-reference/account-management-api/Export_cost_breakdown.md>,
  <https://docs.brightdata.com/api-reference/account-management-api/Get_the_total_cost_and_bandwidth_stats_for_a_Zone.md>,
  <https://docs.brightdata.com/api-reference/account-management-api/Get_the_bandwidth_stats_for_a_Zone.md>
- **[S32]** Event log —
  <https://docs.brightdata.com/general/usage-monitoring/Event_log.md>
- **[S33]** Service Level Agreement, updated 2026-05-24 —
  <https://brightdata.com/sla>
- **[S34]** Data Protection Addendum —
  <https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf>

## Confidence summary

- **High:** public network classes, zone/gateway authentication, username
  controls, rotation/fallback semantics, KYC policy, error/status/accounting
  surfaces, current price-page values, AUP/MSA/SLA text, and identified
  documentation contradictions.
- **Medium:** clean-room gateway/control-plane decomposition; vendor peer-sourcing,
  performance, security, and compliance representations not independently
  verified; current Mobile availability.
- **Low/unknown:** exact TLS path by mode, peer consent for any request, effective
  exit/path evidence completeness, cache/freshness, hard throughput/size limits,
  logs/payload retention and secondary use in practice, SSRF coverage, actual
  billed cost, and empirical quality/availability.

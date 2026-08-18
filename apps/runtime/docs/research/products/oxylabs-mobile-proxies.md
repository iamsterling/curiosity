# Oxylabs Mobile Proxies: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Oxylabs **Mobile Proxies as a standalone product**: advertised pool
and sourcing, proxy/session/rotation/localization controls, carrier and device
semantics, protocols, errors, operations, pricing, abuse/security/privacy/legal
governance, and implications for a Curiosity-owned crawler.  
**Boundary:** first-party public product pages, documentation, policies, terms,
trust material, and the public Residential Proxy Pool Handbook only. No account,
credentials, free or paid trial, proxy request, target test, bypass attempt,
traffic interception, supplier/app inspection, or implementation. The work
describes the public contract; it does not establish private implementation,
pool quality, end-user consent, legality of a collection, or legal advice.

## Decision frame

The relevant question is not whether a mobile exit can relay HTTP. It is:

> Does the incremental value of third-party mobile-carrier egress justify its
> cost, dynamic identity, supply-chain, privacy, provenance, and governance
> burden in an owned public-web crawler—and, if so, behind what boundary?

Bounded sub-questions:

1. What network path and controls does the public product actually expose?
2. What do carrier, “real device,” geography, rotation, and session claims mean,
   and which frequently assumed controls are absent?
3. What does Oxylabs disclose about mobile-exit sourcing and governance?
4. What reliability, failure, observability, usage, and price contracts exist?
5. What abuse, security, privacy, and legal constraints remain with the caller?
6. Which observable patterns should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — directly stated or shown by a cited first-party source.
- **INFERENCE** — the narrowest clean-room explanation consistent with facts;
  not a statement about private code, topology, suppliers, or algorithms.
- **RECOMMENDATION** — a Curiosity architecture, policy, or procurement action.
- **UNKNOWN** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Vendor scale, performance,
security, sourcing, and consent statements remain vendor representations unless
the underlying evidence was independently inspectable.

## Executive assessment

**FACT (high):** Mobile Proxies is a shared, bandwidth-priced, backconnect proxy
pool reached primarily at `pr.oxylabs.io:7777`. A request receives a new exit by
default. Username parameters or a geolocation proxy header select location, ASN,
and session behavior. The product carries ordinary caller traffic; it is not a
managed fetch, unblock, browser, parser, job, or result-storage API [S1-S10].

**FACT (medium; vendor representation):** Oxylabs markets 20M+ “real mobile IPs,”
140+ countries, 3G/4G/5G/LTE carrier networks, 1.1-second average response time,
99.9% average uptime, unlimited concurrent sessions, and “A+ tier” ethically
procured exits from legitimate trusted sources [S2]. No reviewed public SLA,
measurement method, measurement period, simultaneous-availability count, or
mobile-specific supplier audit substantiates those figures.

**INFERENCE (high):** the product is a routing primitive, not an owned-crawler
foundation. Curiosity would still own URL policy, robots and rights decisions,
DNS/redirect safety, HTTP behavior, cookies, retry/politeness, parsing, content
validation, provenance, storage, deletion, and budget enforcement. A successful
proxy tunnel says nothing about content completeness, freshness, permission, or
semantic quality.

**RECOMMENDATION (high):** **DEFER provider adoption; REJECT Mobile Proxies as
the default crawl plane.** If a later, separately approved public-data use case
demonstrates that mobile-carrier localization materially changes required
content, adapt the rotating/sticky/strict-one-IP controls behind a narrow,
provider-neutral egress profile. Prefer owned or datacenter/ISP egress for normal
crawling. Do not use mobile exits to impersonate people, evade a Curiosity deny,
access authenticated/non-public material, or escalate around target controls.

The largest unresolved issue is supply governance: the Mobile product page says
the pool is A+ and ethically procured, but the published acquisition handbook is
explicitly for **Residential Proxies**, not Mobile Proxies. Public evidence does
not expose the mobile suppliers, participant applications, consent/revocation
flow, compensation, traffic safeguards, audits, or mobile-versus-ISP share [S2]
[S18]. That gap is material, not cured by a marketing label.

## 1. Observable product boundary

| Dimension | Published Mobile Proxies behavior | Consequence |
| --- | --- | --- |
| Access | Backconnect entry `pr.oxylabs.io:7777`; Basic proxy credentials use `customer-` prefix [S1][S3] | Credentials and routing options are encoded together; adapter must keep both private. |
| Unit of work | An ordinary request/connection through a selected exit | No provider job ID, poll/cancel lifecycle, result envelope, parser, callback, or durable result. |
| Pool | Shared pool; Oxylabs says the customer is the only user of a chosen IP “at a given time” [S2] | Not a dedicated or caller-owned device/IP; exclusivity duration and enforcement are undocumented. |
| Default rotation | New/random exit for every request [S1][S3] | Each response can have a different network identity and path. |
| Affinity | `sessid`, timed `sesstime`, strict `sessid_oneip`, or port-based sticky entries [S4] | Affinity is to an exit IP, not a browser, person, SIM, handset, or full stateful session. |
| Localization | Continent, country, US state, city, coordinates/radius, and ASN [S5-S9] | Requested database classification, not proof of physical device location. |
| Protocols | HTTP proxy, HTTPS proxy, SOCKS5/TCP, and beta SOCKS5/UDP for HTTP/3 [S10] | Different ingress and DNS/TLS behavior must be threat-modeled and tested separately. |
| Management | Dashboard plus Public API for sub-users, traffic limits, and aggregate usage [S11] | Useful account control; not request-level crawl provenance. |

**FACT (high):** proxy-user credentials are separate from dashboard login. The
Public API uses the main proxy user's Basic credentials to mint a one-hour JWT,
then manages sub-users and usage under a user ID [S3][S11].

**FACT (high):** source-IP allowlisting can replace per-request credentials for
HTTP(S), supports up to ten IPv4 addresses in the dashboard, and does not support
SOCKS5. Oxylabs warns that allowlisting obscures usage attribution when people or
teams share a public IP [S12].

**RECOMMENDATION (high):** use one restricted sub-user per environment/purpose,
hard traffic limits, short credential rotation, and secret-manager injection.
Do not embed the credential-bearing proxy URL in agent prompts, crawl records,
exceptions, traces, or shell history. Prefer credentials over broad NAT-source
allowlisting when per-workload attribution matters.

## 2. Carrier, device, network, and geography controls

### 2.1 Carrier and ASN

**FACT (high):** Mobile Proxies exposes carrier selection only through an ASN
number in the username. Some ASNs are reserved for KYC-approved customers and
return `403`; no currently available exit under the ASN returns `502`. Country
and ASN cannot be jointly enforced: if both are supplied, country wins [S6].

**INFERENCE (high):** ASN is a routing-class constraint, not proof of the exact
consumer carrier contract, radio access network, SIM ownership, or handset. ASN
databases and mobile-carrier network arrangements can include MVNOs, roaming,
carrier-grade NAT, and shared infrastructure; the public response has no signed
attestation of any of these properties.

**UNKNOWN:** carrier-name filter, MVNO/host-carrier distinction, SIM country,
roaming state, subscriber class, mobile network code, cell/tower, radio
generation, and observed ASN evidence in every target response.

### 2.2 Device and network generation

**FACT (high):** product material says exits use IPs attached to real mobile
devices and span 3G/4G/5G/LTE networks [S1][S2].

**Negative result / UNKNOWN (high confidence):** reviewed Mobile documentation
publishes no selector for Android/iOS, phone/tablet/hotspot, make/model, browser
or User-Agent, device fingerprint, OS, SIM, radio generation (3G versus 4G versus
5G/LTE), battery/charging state, Wi-Fi fallback, or device capabilities. It also
does not return a device identifier or attest that a request traversed a
particular physical handset. The separate Residential product's advanced filter
surface must not be projected onto Mobile Proxies [S1-S10].

**RECOMMENDATION (high):** call the capability `mobile_carrier_egress`, not
`mobile_device_emulation`. If responsive/mobile page rendering is required, set
and record browser viewport/User-Agent in Curiosity's browser capability; do not
infer it from the exit IP.

### 2.3 Geography

| Control | Documented contract | Important qualification |
| --- | --- | --- |
| Continent | `cn-{code}` for seven listed continents [S7] | Antarctica is syntactically listed despite no availability promise. |
| Country | `cc-{ISO2}` or a country-specific host/port [S3][S8] | Country-specific entry ports rotate; they do not support city selection. |
| State | `st-us_{state}`; US states only in the dedicated page [S9] | Product copy saying “state” does not establish other-country regions. |
| City | `cc` + English city name; spaces become underscores [S5] | Oxylabs says every city is supported syntactically but availability is not guaranteed. |
| Coordinates | `X-Oxylabs-Geolocation: lat:lon;radius_miles`; radius minimum 10 miles [S5] | No matching exit returns `502`; precise actual coordinates are not returned or guaranteed. |
| ASN | `ASN-{number}` [S6] | Mutually exclusive in effect with country; pool is dynamic. |

**FACT (high):** Oxylabs says exit-node country values use MaxMind GeoIP2 and are
updated weekly; its own IP-check endpoint aggregates MaxMind, IP2Location, DB-IP,
and IPinfo fields. It warns that target sites using another database may disagree
with Oxylabs' classification [S1][S5].

**Documentation contradiction:** the General Conditions say Mobile proxy
geography is determined using **GeoLite2**, while current product documentation
says **GeoIP2** [S5][S21, clause 1.5.5]. This may be contract drift or shorthand;
it requires written resolution.

**UNKNOWN:** selection fallback (other than documented no-match `502` cases),
city/state/coordinate database and refresh cadence, measured accuracy, actual
exit location, target-observed location, and whether a later automatic session
replacement preserves all requested filters.

**RECOMMENDATION (high):** preserve three separate fields:
`requested_exit_constraints`, `provider_reported_exit`, and
`target_observed_locale`. Treat all as untrusted observations. Never represent a
coordinate radius as a precise device location or use it to simulate an
individual's movements.

## 3. Rotation and session semantics

### 3.1 Default rotation

**FACT (high):** absent a session parameter, each new request receives a new
random exit. The backconnect gateway performs the selection; callers do not
download a mobile IP list [S1-S3].

**INFERENCE (high):** “new IP” is a behavioral assignment statement, not a
global uniqueness promise. Pool reuse across time and customers is inherent in a
shared, dynamic pool; the documentation does not provide a no-reuse window.

### 3.2 Session variants

| Mode | Documented behavior | Failure/expiry behavior |
| --- | --- | --- |
| `sessid` | Same IP while online; default maximum 10 minutes and 60-second idle expiry [S4] | If exit disappears, a replacement IP is automatically assigned under the same session ID. |
| `sessid` + `sesstime` | Requests a chosen lifetime up to 1,440 minutes/24 hours in the detailed session and endpoint-generator pages [S4][S13] | Dynamic exit can disappear sooner; expiry can occur while a request is in progress. |
| `sessid_oneip` | Binds strictly to one exit [S4] | If that exit disappears, request fails `502`; caller must mint a new session. |
| Sticky country port | Port maps to an IP for up to 10 minutes [S4] | Country-specific only; no city targeting; replacement occurs after the interval. |

**Documentation contradiction (high relevance):** the Making Requests parameter
table says `sesstime` has a **30-minute maximum**, while the dedicated Session
Control page, Endpoint Generator, product page, and pricing page say up to
**1,440 minutes / 24 hours** [S3][S4][S2][S13]. Use 24 hours only as a current
marketing/documentation claim pending an authoritative contract; do not build a
correctness dependency on either duration.

**INFERENCE (high):** ordinary `sessid` provides best-effort continuity, whereas
`sessid_oneip` exposes a useful consistency-versus-availability choice. Neither
means one TCP connection, one device, one user, one browser profile, persistent
cookies, or stable geolocation. Any state above IP affinity belongs to the
caller's client.

**UNKNOWN:** session namespace/collision scope, clock start and refresh rules,
concurrent-request behavior, whether filters are immutable within a session,
connection reuse, exact replacement policy, IP reuse after expiry, and whether
strict one-IP failure always carries a distinct machine-readable error reason.

**RECOMMENDATION (high):** Curiosity should mint opaque task-scoped handles and
bind them to target, purpose, geo profile, deadline, and budget. Record every
observed exit change. Use strict-one-IP only where change would corrupt evidence;
otherwise fail over at the crawl scheduler with a new attempt record, never
silently rewrite one acquisition into a continuous observation.

## 4. Protocol and transport surface

**FACT (high):** documented modes are:

- ordinary HTTP proxy ingress at `pr.oxylabs.io:7777`;
- encrypted HTTPS proxy ingress by prefixing the entry with `https://`;
- SOCKS5/TCP using `socks5h`;
- HTTP/3 through a dedicated `socks.pr.oxylabs.io:7777` SOCKS5 endpoint with UDP;
- SOCKS5/UDP is beta and requires account enablement [S10].

**FACT (high):** standard destination ports are 80 and 443. Other destination
ports require compliance verification. SOCKS5 does not support country-specific
entry nodes or source-IP allowlisting [S10][S12].

**FACT (high):** Oxylabs publishes custom Go, C#, and Java examples for HTTP/3
over SOCKS5/UDP because common tools may not support it [S10]. Those repositories
were not inspected; no code or license is imported by this research.

**INFERENCE (medium):** HTTP/3 support describes transport through a UDP-capable
SOCKS path; it does not prove target protocol negotiation, parity with TCP modes,
or a portable crawler contract. Each mode can differ in DNS resolution, TLS
visibility, connection pooling, error ownership, and firewall behavior.

**Security finding (high):** a Ruby session example explicitly sets
`OpenSSL::SSL::VERIFY_NONE` [S4]. The general protocol contract does not state
that target TLS verification must be disabled, so this appears to be an unsafe
sample choice rather than a product requirement. **REJECT** it. Normal target
certificate and hostname verification must remain enabled; if HTTPS proxy
ingress uses a provider CA, trust only a separately reviewed narrow chain.

**UNKNOWN:** TLS interception policy, proxy certificate chain/rotation, target
HTTP versions, CONNECT behavior, DNS resolver and leakage model, IPv6 egress,
UDP destination controls, method/body/streaming limits, compression rewriting,
and whether the peer/device can observe plaintext non-TLS destination traffic.

**RECOMMENDATION (high):** permit HTTPS targets only by default; prohibit
credentials, client certificates, authenticated cookies, confidential POST
bodies, and private data. If HTTP is ever allowed, explicitly acknowledge that
the provider path and exit participant/supplier path may observe plaintext.

## 5. Sourcing and supply governance

### 5.1 What is actually represented

**FACT (medium; vendor representation):** the Mobile product page says exits are
from real phones/tablets connected through mobile data, are “ethically
procured,” and use an “A+ tier model” from legitimate trusted sources [S2]. The
trust page says the broader proxy pool consists of consenting, aware users who
are fairly rewarded [S19].

**FACT (high, but product-boundary caveat):** the public **Residential Proxy Pool
Handbook** defines:

- physical-user-device and ISP sourcing channels;
- Tier A+ as explicit consent, clear information, awareness, and monetary reward;
- Tier A as consent/awareness without required financial reward;
- a claim that most of the residential network is A+, with the remainder Tier A
  or ISP sourced;
- policies to collect only proxy-essential participant data, avoid degrading
  active devices, avoid request modification, and require supplier procedures
  for awareness and consent [S18].

**Critical scope limitation:** the handbook repeatedly identifies its subject as
the **Residential Proxy network**. Oxylabs' contract defines Residential and
Mobile proxies as separate services [S21]. Therefore the handbook explains what
Oxylabs means by A+/A, but it is not direct proof that every Mobile exit follows
the described residential acquisition process.

### 5.2 Missing mobile-specific evidence

**Negative result / UNKNOWN (high confidence):** no reviewed public source gives:

- mobile supplier identities, supplier count, or direct-versus-reseller share;
- participating applications/SDKs or versions;
- the exact mobile end-user disclosure and consent screens;
- opt-in granularity, age checks, re-consent, withdrawal, or revocation latency;
- compensation amount, basis, country coverage, or confirmation of payment;
- per-device bandwidth, battery, charging, foreground/background, time, content,
  port, or destination safeguards;
- malware/SDK scanning, supplier audit cadence, sample size, findings, remediation,
  termination, or independent assurance;
- whether all Mobile exits are physical user devices, carrier/ISP infrastructure,
  hotspots, routers, or a mixture;
- whether “20M+ IPs” is a monthly-observed, historical, daily, or simultaneous
  pool count, or how duplicates/CGNAT are counted.

**INFERENCE (high):** IP count is especially weak as a device count because
mobile networks rotate and share addresses. It must not be represented as 20M
simultaneously available, independently consenting people or devices.

**RECOMMENDATION (high):** require mobile-specific supplier standards, sample
consent notices, revocation SLA, compensation evidence, independent audit scope,
device-resource safeguards, supplier chain, and incident history before
procurement. Contract for immediate removal of disputed exits and a verifiable
abuse/participant complaint path. Vendor assertions remain medium confidence
until evidence is reviewed under NDA or made public.

## 6. Reliability, errors, and observability

### 6.1 Reliability claims versus contract

**FACT (medium; marketing):** Oxylabs advertises 99.9% average uptime, 1.1-second
average response time, “leading success rates,” and pool stability [S2].

**FACT (high):** General Conditions promise only reasonable efforts for 24x7
availability, excluding planned downtime and causes outside reasonable control.
Services are otherwise provided “as is,” without a result warranty [S21,
clauses 4.3.4 and 5.2]. The reviewed public Mobile pages contain no numeric SLA,
service credit, percentile latency, target mix, geography mix, or test method.

**INFERENCE (high):** a global average masks the exact dimensions an owned
crawler cares about: target, country/city/ASN, protocol, payload size, session
mode, time of day, and origin latency. Dynamic city/ASN scarcity and session exit
loss are normal documented conditions, not exceptional outages [S4-S6].

### 6.2 Error contract

**FACT (high):** provider-originated errors include an `X-Error-Description`
header; target-site errors do not. Documented provider codes include malformed
or unsupported request `400`, restricted target `403`, authentication or traffic
limit `407`, internal `500`, several invalid-response/session/exit/client-
disconnect variants under `502`, timeout/unreachable target `504`, and invalid
response `522` [S14].

**INFERENCE (high):** the extra header offers a partial provider-versus-origin
boundary, but status alone remains ambiguous: multiple failure classes share
`502`, and absence of the header could reflect target response or incomplete
provider behavior. Raw code, header, and bounded body must be preserved.

**UNKNOWN:** total timeout value, connect/read split, retry behavior inside the
gateway, automatic retries or lack thereof, redirect handling, rate-limit
headers, retry-after, attempt ID, exit IP in normal responses, circuit breaking,
maintenance notices, and body-size limits.

**RECOMMENDATION (high):** Curiosity—not the proxy—owns retry classification.
Apply an outer deadline, attempt cap, per-origin pacing, byte and spend budgets,
and exponential backoff. Retry only safe/idempotent work. Separate:

```text
client_to_gateway_transport
provider_routing_outcome
origin_http_outcome
content_validation_outcome
extraction_outcome
evidence_quality
```

### 6.3 Observability and provenance

**FACT (high):** Oxylabs provides `ip.oxylabs.io/location` for exit inspection.
The Public API exposes current-month account traffic, per-sub-user statistics,
and up to 30 days of target-grouped history; it can create/modify/delete
sub-users and set traffic limits [S1][S11].

**Negative result / UNKNOWN (high confidence):** no reviewed Mobile contract
guarantees per-request request ID, timestamps, selected exit IP/ASN/geo, device or
supplier ID, session replacement event, target IP, DNS result, redirect chain,
origin timing, TLS details, request/response byte counts, status ownership,
content digest, cache/origin-contact evidence, or downloadable audit log.

**RECOMMENDATION (high):** Curiosity must create its own evidence envelope:

```text
request_id, crawl_task_id, provider, adapter_version, egress_profile
requested_url, normalized_url, final_url?, redirect_chain?
requested_at, received_at, deadline, attempt_number
requested_geo/asn, provider_reported_exit_ip/asn/geo?, observed_at?
session_mode, internal_session_handle, exit_changed?, replacement_reason?
proxy_protocol, origin_protocol?, target_ip?, tls_verified
gateway_transport, provider_outcome, origin_status, content_outcome
media_type, byte_length, sha256, artifact_reference
robots_policy_id, rights_policy_id, retention_class, cost_bytes?
provenance_completeness, freshness_unknown=true, untrusted_external_data=true
```

Question marks are first-class unavailable values. Do not call an IP-check
observation proof that another request used the same exit unless the provider
supplies request-level binding evidence.

## 7. Limits, usage, and price snapshot

### 7.1 Published pricing on 2026-08-17

| Plan | Included traffic | Monthly price | Displayed unit rate | Top-up cap |
| --- | ---: | ---: | ---: | ---: |
| Starter | 4 GB | $30 | $7.50/GB | up to 100 GB |
| Basic | 15 GB | $100 | $6.67/GB | up to 100 GB |
| Advanced | 100 GB | $500 | $5.00/GB | up to 2 TB |
| Corporate | 715 GB | $2,500 | $3.50/GB | up to 2 TB |

**FACT (high, time-sensitive):** VAT may apply. Pricing includes 24/7 support and
a dedicated account manager. The product and quick-start pages mention a
sales/support-arranged free trial; the product FAQ says it can be used once but
does not publish trial traffic, duration, or eligibility [S2][S15]. Prices are a
snapshot, not a quote or durable TCO.

**FACT (high):** the pricing page advertises unlimited concurrent sessions and
free geo-targeting [S15].

**Negative result / UNKNOWN (high confidence):** public Mobile documentation
does not define the billable-byte formula (request, response, CONNECT/TLS,
headers, retransmission, failed requests, UDP, or provider overhead), overage
behavior, minimum billable increment, rounding, reset timezone, numeric request
rate, connection limit, per-target limit, maximum URL/header/body/response size,
or gateway timeout. “Unlimited concurrent sessions” is marketing language, not a
capacity or cost bound.

**FACT (high):** the Public API can enforce sub-user traffic limits and expose
aggregate traffic. Its login JWT lasts one hour. The documentation unusually
warns that after changing the main-user password, API login may require the
**original password** or support intervention [S11].

**Security concern (high):** requiring an original password after a password
change suggests an unclear credential lifecycle. This is not proof of plaintext
storage, but it is a procurement question. Do not assume dashboard password
rotation revokes every proxy/API credential; test revocation separately only if
later authorized.

**RECOMMENDATION (high):** budget worst case by calls, sent bytes, received
bytes, retries, wall time, and dollars—not just successful pages. Set provider
sub-user limits below the procurement ceiling and independent Curiosity circuit
breakers below those. Reconcile aggregate provider usage but retain local
request-level accounting.

## 8. Abuse, security, privacy, and legal boundaries

### 8.1 Customer-use governance

**FACT (high):** restricted Mobile target categories include streaming,
financial institutions, government, gaming, ticketing, mail, ads, and public IP
check sites; some may be unlocked after KYC [S16].

**FACT (high):** Oxylabs' AUP prohibits unlawful or infringing access, malicious
programs, security breaches, unauthorized account access, authentication or
security circumvention, denial of service, spam, ticket bots, and invalid ad
traffic. Automated gathering must comply with target legal terms, be limited to
public data absent permission, and exclude sensitive health and children's data
[S17].

**FACT (medium; vendor representation):** every customer answers a KYC
questionnaire; company/contact/use-case information can be requested; activity
is regularly reviewed with automated suspicious-behavior detection; access can
be refused or removed; and Oxylabs says at least one quarter of annual inquiries
are rejected [S20].

**RECOMMENDATION (high):** KYC approval or target reachability never grants
Curiosity permission. Keep purpose, robots, terms, copyright/database rights,
privacy, sensitive-category, and rate decisions in Curiosity's own gate. A KYC
exception at Oxylabs must never override an internal deny.

### 8.2 Network and application security

**INFERENCE (high):** a general-purpose proxy that accepts caller-selected URLs,
headers, cookies, methods, bodies, redirects, HTTP/SOCKS traffic, UDP, precise geo,
and long sessions can become an SSRF/confused-deputy, credential-exfiltration,
port-scanning, malware-download, replay, attribution, and spend-amplification
surface if agents control it directly.

**RECOMMENDATION (high):** enforce before the provider call and after every DNS
resolution/redirect:

- public HTTP(S)-only destinations and approved ports;
- rejection of loopback, private, link-local, metadata, multicast, reserved, and
  control-plane ranges for IPv4 and IPv6;
- origin/domain policy, DNS-rebinding protection, redirect and decompression caps;
- GET/HEAD only by default; no side-effecting or authenticated requests;
- origin-scoped cookies and headers, with secret scanning and no proxy credential
  reflection;
- bounded streaming to quarantine, media sniffing, artifact scanning, and no
  execution of retrieved scripts/content;
- destination-aware rate limits independent of exit rotation.

### 8.3 Customer traffic privacy and contract

**FACT (high):** the General Conditions permit subcontractors and monitoring of
customer use. They make the customer responsible for laws, target terms,
privacy/IP rights, credentials, and third-party claims; restrict resale and
competitive monitoring; disclaim results; limit many vendor liabilities; and
prohibit disassembly/reverse engineering [S21].

**FACT (high):** GC clause 4.3.9 expressly permits retention and sole-discretion
use of data gathered through **Web Scraper API and Web Unblocker**. It does not
name Mobile Proxies [S21]. This omission is not a promise that Mobile traffic is
not logged or reused.

**FACT (high):** GC clause 1.2 says the public DPA applies when Web Unblocker or
automated data-gathering services process personal data. The DPA defines its
subject as “SAPI Services”; Mobile Proxies are not named. The DPA provides
processor instructions, security/confidentiality, subprocessors on written
request, and end-of-term return/deletion, but cannot safely be presumed to cover
raw Mobile Proxy traffic [S21][S22].

**FACT (high):** the general privacy policy describes account/contact/usage data,
service-provider sharing, international transfers, purpose-based account
retention, and communications retention up to five years. It does not define
Mobile target-traffic/log retention [S23].

**Negative result / UNKNOWN (high confidence):** retention, access, and deletion
for destination URLs, DNS, headers, cookies, request bodies, responses, TLS/SNI,
session IDs, exit IDs, failed attempts, and per-target usage; payload inspection;
data residency; mobile suppliers/subprocessors; government-request practice;
training/secondary use; encryption/key boundaries; and whether source devices or
suppliers can observe/log traffic.

**RECOMMENDATION (high):** treat these as procurement blockers for personal,
confidential, authenticated, or sensitive traffic. Require a Mobile-specific
DPA/security addendum covering controller/processor roles, no secondary use or
training, exact telemetry/payload retention, deletion SLA and backups, regions,
supplier/subprocessor list and changes, encryption, incident deadline,
government requests, audit rights, and order-of-precedence. Until resolved,
limit any evaluation to non-sensitive public test pages.

### 8.4 Certifications

**FACT (medium; vendor representation):** Oxylabs says principal proxy areas are
ISO/IEC 27001:2022 certified. The Trust Center publicly lists ISO 27001 and a
Dashboard/Residential API penetration-test summary, while its explicit SOC 2
Type 2 statement names Web Scraper API and Web Unblocker—not Mobile Proxies
[S19][S24]. Certificate scope, exclusions, supplier controls, and reports were
not independently reviewed here.

**RECOMMENDATION (high):** obtain the current certificate, statement of
applicability, exact Mobile product and supplier boundary, pentest report,
exceptions, and remediation evidence. Do not transfer a certification claim from
another product to Mobile Proxies.

## 9. Clean-room architecture inference

The minimum logical roles consistent with the public behavior are:

```text
caller crawler/client
  -> authenticated backconnect ingress
       -> account / sub-user / traffic-limit / KYC / target-policy gate
       -> request option parser
            geo/ASN constraints
            rotating | sticky | strict-one-IP session mode
            protocol selection
       -> dynamic mobile-exit selector + short-lived affinity mapping
       -> selected third-party mobile/carrier exit
       -> public target
  <- target response or provider error + optional X-Error-Description

separate control plane:
  dashboard / Public API -> sub-users, caps, aggregate usage, target stats
```

**INFERENCE (high):** an affinity store is logically necessary to map session
IDs or sticky ports to exits; a dynamic inventory/index is necessary for geo/ASN
selection; accounting and policy gates are evidenced by limits, KYC restrictions,
target blocks, and statistics [S4-S6][S11][S14][S16].

**UNKNOWN:** physical topology, supplier interfaces, number or ownership of
gateways, routing algorithm, health checks, internal retries, session datastore,
regional processing, device agent/SDK, NAT path, caching, traffic inspection,
and audit systems. The diagram claims none of these.

**Clean-room boundary:** this report does not reproduce provider code, hidden
endpoints, supplier software, fingerprints, CAPTCHA or block-evasion methods, or
target bypass procedures. Public behavior is analyzed only for internal
architecture/procurement. Any future service test needs separate authority and
contract review.

## 10. Owned-crawler implications and verdict ledger

| Verdict | Pattern/capability | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPT** | Explicit rotating, best-effort sticky, and strict-one-IP semantics | Useful provider-neutral choices; expose continuity versus availability explicitly. |
| **ADOPT** | Per-sub-user traffic limits and aggregate reconciliation | Defense in depth; retain stricter local budgets and request-level accounting. |
| **ADOPT** | Provider-versus-target error hint | Preserve `X-Error-Description`, but normalize into typed outcomes and tolerate unknown codes. |
| **ADAPT** | Geo/ASN selection | Requested constraint only; keep reported/observed evidence separate and nullable. |
| **ADAPT** | Session identifiers in credentials | Replace with opaque policy-issued handles; adapter constructs provider credentials privately. |
| **ADAPT** | Shared backconnect gateway | One optional egress adapter behind crawler policy, scheduler, evidence, and cost controls—not the crawl API. |
| **REJECT** | Mobile exits as default owned-crawler egress | Higher cost and governance/provenance variance without general crawl value. |
| **REJECT** | “Mobile IP” as device/browser/person authenticity | No device, SIM, OS, browser, radio, or person attestation. |
| **REJECT** | IP rotation as politeness or permission | Per-origin rate limits and rights policy remain stable across exits. |
| **REJECT** | Direct agent control of URL, proxy options, credentials, precise geo, session ID, method, headers, or ports | Prevent SSRF, secret leakage, identity simulation, side effects, abuse, and spend amplification. |
| **REJECT** | TLS verification disabled | Maintain normal hostname/certificate validation; do not copy unsafe sample code. |
| **REJECT** | KYC/restricted-target exception as Curiosity authorization | Provider approval does not satisfy target, robots, privacy, or purpose policy. |
| **DEFER** | Oxylabs Mobile production adapter | Mobile-specific sourcing, DPA/retention, SLA, billing meter, controls, and empirical value remain unresolved. |
| **DEFER** | HTTP/3/SOCKS5 UDP | Beta/account-gated, expanded egress surface, and no demonstrated crawler requirement. |
| **DEFER** | 24-hour mobile affinity | Documentation conflicts and dynamic exits can still terminate early. |

### Recommended placement in an owned crawler

**RECOMMENDATION (high):** if adopted later, make Mobile a rare egress profile
selected only after a target-specific evidence review:

```text
frontier + robots/rights/purpose policy
  -> URL/DNS/redirect safety gate
  -> origin politeness + global budget
  -> egress decision
       owned/datacenter/ISP (default)
       mobile-carrier profile (explicit exception)
  -> bounded HTTP client
  -> immutable raw artifact + evidence envelope
  -> validation/extraction/indexing
```

The scheduler must key politeness by origin, not exit. Rotation must never reset
robots state, retry budget, rate limits, or target error history. Geo variants
should be modeled as explicit acquisition variants with deduplication and a
documented need, not as a way to multiply the frontier.

## 11. Unknowns and pre-adoption checks

### Supply and governance

1. Obtain a Mobile-specific acquisition standard and evidence that the A+ model
   applies to every physical-device exit, including supplier-chain boundaries.
2. Review sample participant consent/re-consent/revocation flows, compensation,
   device-resource limits, destination restrictions, and participant support.
3. Obtain independent supplier-audit scope, cadence, sampling, findings,
   remediation, termination criteria, disputed-exit removal SLA, and incident
   history.
4. Define “20M+ IPs,” pool measurement period, deduplication, CGNAT treatment,
   simultaneous availability, and mobile-device versus carrier-infrastructure
   composition.

### Contract, privacy, and security

5. Confirm the governing self-service/enterprise documents and precedence; have
   counsel review GC, AUP, SoW, and Mobile-specific terms.
6. Obtain a Mobile-specific DPA/addendum, target-traffic/log schema and retention,
   deletion/backup SLA, secondary-use/training prohibition, regions,
   subprocessors/suppliers, incident deadline, audit rights, and government-
   request terms.
7. Confirm TLS interception/non-interception, HTTPS proxy CA and rotation, DNS
   resolution, IPv6, SOCKS/UDP egress boundaries, and whether exits/suppliers can
   inspect or log plaintext.
8. Resolve the “original password” Public API behavior and document revocation
   across dashboard, proxy, API, JWT, sub-user, and allowlist credentials.

### Product contract

9. Resolve 30-minute versus 1,440-minute `sesstime`, GeoLite2 versus GeoIP2, and
   exact filter preservation during session replacement.
10. Obtain normative size, method, port, protocol, timeout, connection, rate,
    concurrency, redirect, retry, and error-ownership limits.
11. Define billable bytes, failed/partial requests, retransmissions, CONNECT/TLS,
    UDP, rounding, overage, top-ups, quota reset, and usage-report delay.
12. Obtain a written SLA or treat all 99.9%/1.1-second/success claims as
    non-contractual marketing; require measurement dimensions and service credits.
13. Clarify device/carrier semantics, actual-versus-requested geo/ASN evidence,
    fallback, IP reuse, exclusivity, and whether any request ID/audit export exists.

### Separately authorized evaluation only

14. If all prior gates pass, use only owned public test origins and a free,
    pre-approved budget to test credential revocation, private-address/redirect
    rejection, TLS verification, error-layer separation, time/size caps, session
    replacement versus strict failure, requested-versus-observed geo/ASN,
    concurrency/backpressure, and local/provider byte reconciliation.
15. Do not test CAPTCHA solving, access-control evasion, restricted targets,
    login flows, participant devices, supplier applications, or third-party
    target defenses. No such test is authorized by this dossier.

## 12. Contradictions and negative results retained

1. **Session maximum:** Making Requests says 30 minutes; Session Control,
   Endpoint Generator, product, and pricing pages say 1,440 minutes/24 hours
   [S2-S4][S13][S15].
2. **Country database:** product docs say MaxMind GeoIP2 updated weekly; General
   Conditions say GeoLite2 [S5][S21].
3. **Geo breadth:** Location overview says ZIP targeting, but the current Mobile
   docs index and product controls reviewed expose no Mobile ZIP/postal-code page
   or parameter; state is documented only for the US [S5][S25].
4. **SOCKS5 wording:** protocol page says Mobile SOCKS5 supports “only TCP at the
   moment” while immediately describing beta SOCKS5 UDP for HTTP/3. Read as TCP
   generally available and UDP beta, but obtain a normative mode matrix [S10].
5. **Sourcing scope:** Mobile says A+ ethically procured; the detailed public
   acquisition handbook is for Residential, a separately defined service
   [S2][S18][S21].
6. **Reliability:** 99.9% average uptime and 1.1-second average response are
   marketing claims; no public Mobile SLA or methodology was found [S2][S21].
7. **Device control:** “real mobile devices” and 3G/4G/5G do not come with
   device, OS, SIM, or radio-generation selection/attestation [S1-S10].
8. **Billing:** per-GB prices are public, but the Mobile billable-byte formula
   and failed-request treatment were not found [S11][S15].
9. **Privacy:** public policies do not state Mobile target-traffic/log retention,
   and the public DPA's stated scope does not clearly include Mobile [S21-S23].
10. **Provenance:** no request-level attempt/exit/geo/timing/redirect/digest audit
    contract was found [S1-S16].

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (**R**), decision
value (**V**), novelty (**N**), and reverse-scored cost (**Cheap**, where 5 is
cheapest). Only high-value public-source threads were pursued.

| Thread | R | V | N | Cheap | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Mobile-specific sourcing evidence versus Residential handbook | 5 | 5 | 5 | 4 | **Pursued:** product, trust page, contract, and handbook triangulated; scope gap retained. |
| Mobile DPA and target-traffic retention | 5 | 5 | 5 | 4 | **Pursued:** GC/DPA/privacy reviewed; Mobile coverage and retention remain unknown. |
| Session duration and replacement semantics | 5 | 4 | 4 | 5 | **Pursued:** found 30-minute/24-hour contradiction and strict-one-IP distinction. |
| Device/carrier/radio controls | 5 | 4 | 4 | 5 | **Pursued:** ASN only; no device/OS/SIM/radio selector or attestation found. |
| Geography evidence and database | 4 | 4 | 4 | 5 | **Pursued:** found GeoIP2/GeoLite2 conflict and ZIP documentation gap. |
| Billable-byte and numeric limit contract | 5 | 5 | 3 | 4 | **Pursued:** pricing, API, protocol, and error docs reviewed; meter/limits remain unpublished. |
| Independently verify participant consent and compensation | 4 | 5 | 5 | 1 | **CURIOSITY_NO_GO:** requires non-public supplier/participant/audit evidence; vendor claim remains medium confidence. |
| Inspect participant apps, SDKs, or mobile-device traffic | 2 | 3 | 5 | 1 | **CURIOSITY_NO_GO:** invasive, unnecessary, outside clean-room and caller authority. |
| Fingerprint exits or enumerate the pool | 2 | 2 | 3 | 1 | **CURIOSITY_NO_GO:** active service access and mapping are prohibited and unnecessary for the architecture decision. |
| Benchmark target blocking or bypass success | 1 | 1 | 2 | 1 | **CURIOSITY_NO_GO:** explicitly outside scope; no credentials, paid tests, or bypass. |
| Inspect public HTTP/3 sample repositories | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** no demonstrated crawler requirement; source/license review not authorized. |
| Broad litigation/case-law survey | 3 | 4 | 3 | 1 | **CURIOSITY_NO_GO:** product contract/architecture frame is complete; jurisdiction-specific advice belongs to counsel. |

**Stop reason:** requested categories are covered and public primary sources
saturated. The remaining material questions require vendor contract disclosure,
supplier/audit evidence, counsel, or a separately authorized controlled test—not
additional speculative reverse engineering.

## Sources

All sources were accessed **2026-08-17**. First-party material is authoritative
only for the published interface, policy text, or representation attributed to
Oxylabs; it is not independent proof of implementation, consent, performance,
security, compliance, or legality.

- **[S1]** Oxylabs, “Mobile Proxies” documentation. <https://developers.oxylabs.io/products/proxies/mobile-proxies.md>
- **[S2]** Oxylabs, “Mobile Proxies” product page. <https://oxylabs.io/products/mobile-proxies>
- **[S3]** Oxylabs, “Mobile Proxies — Making Requests.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/making-requests.md>
- **[S4]** Oxylabs, “Mobile Proxies — Session Control.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/session-control.md>
- **[S5]** Oxylabs, “Mobile Proxies — Location Settings,” including City and Coordinates. <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings.md>, <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/select-city.md>, <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/coordinates.md>
- **[S6]** Oxylabs, “Mobile Proxies — ASN Targeting.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/asn-targeting.md>
- **[S7]** Oxylabs, “Mobile Proxies — Continent.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/continent.md>
- **[S8]** Oxylabs, “Mobile Proxies — Country.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/country.md>
- **[S9]** Oxylabs, “Mobile Proxies — State.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/location-settings/select-state.md>
- **[S10]** Oxylabs, “Mobile Proxies — Protocols.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/protocols.md>
- **[S11]** Oxylabs, “Mobile Proxies — Public API.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/public-api.md>
- **[S12]** Oxylabs, “Mobile Proxies — Whitelisting IPs.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/whitelisting-ips.md>
- **[S13]** Oxylabs, “Mobile Proxies — Endpoint Generator.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/endpoint-generator.md>
- **[S14]** Oxylabs, “Mobile Proxies — Response Codes.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/response-codes.md>
- **[S15]** Oxylabs, “Mobile Proxies Pricing.” <https://oxylabs.io/products/mobile-proxies/pricing>
- **[S16]** Oxylabs, “Mobile Proxies — Restricted Targets.” <https://developers.oxylabs.io/products/proxies/mobile-proxies/restricted-targets.md>
- **[S17]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25. <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S18]** Oxylabs, “Residential Proxy Pool Handbook: Guide to Procurement Processes and Policies,” public PDF. <https://oxylabs.io/Oxylabs_Residential_Proxy_Acquisition_Handbook.pdf>
- **[S19]** Oxylabs, “Risk and Legal Compliance.” <https://oxylabs.io/risk-and-legal-compliance>
- **[S20]** Oxylabs, “Know Your Customer Policy.” <https://oxylabs.io/kyc-and-safety>
- **[S21]** Oxylabs, “General Conditions of oxylabs, UAB Services Agreement,” updated 2024-12-12. <https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement>
- **[S22]** Oxylabs, “Data Processing Agreement,” updated 2022-12-01. <https://oxylabs.io/legal/oxylabs-data-processing-agreement>
- **[S23]** Oxylabs, “Privacy Policy,” updated 2024-10-14. <https://oxylabs.io/legal/privacy>
- **[S24]** Oxylabs Trust Center. <https://trust.oxylabs.io/>
- **[S25]** Oxylabs documentation index. <https://developers.oxylabs.io/llms.txt>

## Confidence summary

- **High:** public gateway/auth shape; default rotation; documented session modes;
  geo/ASN syntax and precedence; protocol modes; error table; restricted targets;
  Public API surface; list prices; AUP/GC/DPA/privacy text; documentation
  contradictions and negative results.
- **Medium:** logical architecture; provider-versus-origin separation quality;
  product security scope; vendor claims about real devices, A+ sourcing, pool
  size, exclusivity, uptime, latency, KYC operation, and certification.
- **Low/unknown:** mobile supplier chain and consent evidence; actual available
  pool and quality; precise device/carrier/radio attributes; billable-byte formula;
  numeric capacity and timeout limits; traffic inspection/retention/deletion;
  DPA coverage; request-level provenance; cache/origin behavior; and comparative
  value for Curiosity's targets.

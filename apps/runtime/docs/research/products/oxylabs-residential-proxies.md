# Oxylabs Residential Proxies: clean-room reverse-engineering dossier

**Research and primary-source access date:** 2026-08-17  
**Subject:** Oxylabs Residential Proxies as a standalone network-egress
product. Other Oxylabs products appear only where terms, controls, or product
boundaries require comparison.  
**Status:** research evidence and recommendations; not implementation,
procurement approval, a performance benchmark, or legal advice.

## Executive decision

**VERDICT — ADAPT a few control-plane patterns; DEFER the provider; REJECT
Residential Proxies as the default owned-crawler egress or evidence foundation
(high confidence).**

**FACT (high):** the product is a metered backconnect proxy network rather than
a fetch, crawl, render, or extraction service. A client sends ordinary network
requests through `pr.oxylabs.io:7777`; a username grammar requests rotation,
session affinity, geography, ASN, operating system, and IP version. The client
owns HTTP behavior, redirects, retries, rendering, crawl scope, parsing, source
validation, and storage [S1-S10].

**FACT (medium; vendor representations):** Oxylabs markets a pool of **175M+**
residential IPs in 195 countries, “unlimited concurrent sessions,” average
99.95% success, and 0.41- or 0.6-second response time. Its sourcing handbook
says physical-device peers explicitly consent and are informed, a majority of
the network follows its financially rewarded “Tier A+” model, and the remainder
comes from a consent-without-financial-reward “Tier A” model and ISP providers
[S11-S13]. These are not independently audited capacity, consent, latency, or
service-level guarantees.

**INFERENCE (high):** Residential Proxies can diversify exit geography and IP
reputation, but they weaken reproducibility. The same logical request may leave
through a short-lived third-party device, and a sticky session can silently
change IP unless `sessid_oneip` is used. Public responses expose no request ID,
selected-exit metadata, attempt ledger, routing timestamp, or cryptographic
evidence. Pool reachability therefore does not establish source truth,
freshness, completeness, location, permission, or a single reproducible origin
observation.

**RECOMMENDATION (high):** an owned crawler should begin with identifiable,
stable, operator-controlled egress and publisher-respectful pacing. Residential
egress, if ever approved, should be an exceptional task capability for a narrow
public-web localization need—not an automatic anti-block escalation. Curiosity
must retain target policy, robots/terms/privacy review, per-origin identity and
pacing, SSRF controls, retries, evidence capture, cost limits, and semantic
quality checks. No agent should receive raw proxy credentials or choose
credential-string controls directly.

## 1. Decision frame, bounded questions, and method

The decision is:

> Does a dynamic, third-party-device residential egress network have a safe,
> observable, and governed role in an owned public-web crawler, and which of its
> external patterns are worth retaining without delegating permission or source
> evidence?

Bounded sub-questions:

1. How are residential exits sourced, consented, rewarded, reviewed, and
   removed, and what is only represented rather than independently shown?
2. What are the exact endpoint, authentication, protocol, rotation, session,
   geo, ASN, OS, and IP-version contracts?
3. What does the 175M+ scale claim measure, and which performance statements are
   marketing claims rather than an SLA?
4. What abuse, security, privacy, contractual, and peer-device risks follow from
   putting crawler traffic through this network?
5. Which errors, usage statistics, health signals, limits, and prices are
   observable, and what operational evidence is absent?
6. Which clean-room patterns should Curiosity adopt, adapt, reject, or defer?

### Method and labels

Public first-party documentation, product/pricing pages, the residential-pool
sourcing handbook, Trust Center, KYC page, AUP, privacy policy, DPA, General
Conditions, and self-service terms were reviewed. Search was used only for
discovery; substantive claims trace to originating sources below.

- **FACT** — directly stated or shown by a cited first-party source.
- **INFERENCE** — a bounded explanation from observable behavior; not a claim
  about private code, network topology, suppliers, or algorithms.
- **RECOMMENDATION** — a Curiosity design, safety, or diligence action.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

Vendor product, performance, sourcing, security, and compliance claims are
evidence that Oxylabs makes the representation, not independent proof that it is
true for every exit or request.

### Clean-room and access boundary

No account, free trial, credential, paid call, endpoint probe, target request,
IP mapping, traffic interception, SDK/source inspection, peer application
inspection, CAPTCHA exercise, or bypass attempt was used. Public examples were
read, not executed. The General Conditions and self-service terms prohibit
reverse engineering and competitive performance monitoring [S14][S15]. This
dossier reconstructs only the documented external contract for an internal
architecture/procurement decision; it does not reproduce a hidden endpoint,
supplier integration, selection algorithm, or anti-detection technique.

## 2. Product boundary and responsibility split

| Dimension | Published boundary | Consequence for an owned crawler |
| --- | --- | --- |
| Work unit | A network request through a backconnect or country entry node [S1-S3] | No durable job, result manifest, callback, cancellation, or provider result store. |
| Rotation | A new proxy by default for every request [S1][S2] | The crawler must own identity policy and record that actual exit may be unknown. |
| Affinity | Credential or port-based sticky sessions [S4] | Affinity is to an exit IP, not cookies, browser profile, or crawl transaction. |
| Geography | Continent, country, US state/ZIP, city, coordinates/radius, ASN [S5-S9] | Requested routing metadata, not proof of physical location or content locale. |
| Advanced filters | Peer OS and IPv4/IPv6, sometimes KYC-gated [S10] | Fingerprint-oriented controls have little default crawler value and can shrink availability. |
| Protocol | HTTP, HTTPS proxy transport, SOCKS5/TCP, and beta SOCKS5/UDP for HTTP/3 [S3] | Different trust, DNS, egress, and firewall semantics must remain adapter-private. |
| Managed access | Product copy mentions IP-quality filtering, “automated request management,” and CAPTCHA management [S11][S12] | Raw-proxy docs do not define managed target retries, browser fingerprints, CAPTCHA solving, or success classification; do not import Web Unblocker semantics. |
| Output | Target response through the proxy | Curiosity owns validation, content hashing, parsing, provenance, and storage. |
| Meter | Purchased traffic allowance, with dashboard/API usage statistics [S12][S16][S17] | Bytes, not useful documents, are the commercial unit. |

**FACT (high):** Oxylabs' sourcing handbook says destination servers receive
requests exactly as clients send them and that Oxylabs does not modify data as
it traverses its machines [S13, p.9].

**INFERENCE (medium):** the narrow published model is a routing primitive, not
an outcome-oriented unblocker. The gateway authenticates and selects an eligible
exit, but the crawler remains responsible for target headers, cookies, user
agent, request method, redirects, timeout, retry, and block-page detection.
Marketing references to CAPTCHA management do not establish a callable or
normative raw-proxy feature.

## 3. Sourcing and governance

### 3.1 Published supply model

**FACT (medium; vendor-claimed):** the handbook names two supply channels [S13]:

1. **Physical user devices.** Individuals voluntarily permit part of their
   device's internet traffic and hardware resources to support third-party
   business cases in return for financial compensation or other rewards.
2. **ISP-sourced residential routing.** Traffic is routed through an ISP network
   without end-user device participation; the handbook calls this less
   ethically sensitive.

The handbook grades non-ISP sourcing:

| Oxylabs tier | Published conditions | Published disposition |
| --- | --- | --- |
| A+ | explicit consent, clear information, awareness, monetary reward | Accepted; Oxylabs says this is the majority of its pool. |
| A | explicit consent, clear information, awareness, no financial reward | Accepted; part of the remainder. |
| B | misleading/confusing consent or concealed function; no true awareness | Described as a gray-area model, not part of the represented pool. |
| C | malware; no awareness or consent | Rejected model. |

**FACT (medium; vendor-claimed):** Oxylabs says intent to share traffic with
third parties must be explicit and repeated; proxying before consent violates
internal policy; participants should know what resources are used, who gets
access, and the purpose; only data essential for proxy functionality is
received; actively used device performance remains unaffected; and every party
in the Tier A+ data-management cycle is financially rewarded [S13, pp.5-9].

### 3.2 What the sourcing disclosure does and does not prove

**INFERENCE (high):** the handbook is a principles document, not a supply-chain
assurance report. It usefully states acceptance criteria and admits a mixed
physical-device/ISP pool, but it supplies no per-exit lineage or auditable
attestation that a particular request used an A+, A, or ISP source.

**NEGATIVE RESULT (high):** reviewed public material does not identify:

- supplier, SDK, application, or ISP names;
- current percentages of A+, A, and ISP exits;
- the handbook's publication/version date, change log, or control owner;
- exact consent text, interface, localization, renewal, withdrawal, or
  revocation latency;
- reward rate, minimum payout, device-resource cap, bandwidth cap, or who bears
  network charges;
- age verification, household/network-owner authority, employer/school-network
  exclusion, or shared-device consent;
- supplier audit frequency, sampling method, evidence retention, independent
  assessment, breach history, sanctions, or termination statistics;
- peer software security model, update signing, sandboxing, target/port policy,
  local-network isolation, or uninstall cleanup;
- whether an exit can determine which Oxylabs customer generated traffic, or
  whether the target can attribute abuse complaints to the residential user;
- a customer-visible field proving supply tier, consent state, supplier, or
  consent timestamp for an exit.

**RECOMMENDATION (high):** residential supply-chain approval requires more than
the handbook. Obtain the current procurement standard, supplier inventory,
contractual consent requirements, sample participant disclosures, independent
audit scope, withdrawal/deactivation SLA, reward and resource-cap rules,
security assessment, incident history, regional restrictions, and per-request
lineage capability. Preserve a supplier-control attestation version in
procurement records; do not place peer identity in ordinary crawl records.

### 3.3 Customer governance and abuse controls

**FACT (medium; vendor-claimed):** Oxylabs says every customer answers a KYC
questionnaire; company, contact, business model, methodology, and use case may
be reviewed; customer activity is regularly reviewed by compliance teams and
automated systems; access may be restricted; and at least one quarter of annual
inquiries are rejected [S18]. Advanced OS/IP filters and some ASNs may require
additional KYC [S9][S10].

**FACT (high):** target categories restricted by default include entertainment/
streaming, banking and finance, government, gaming, ticketing, mail, advertising,
and third-party IP-checking services; some may be enabled after KYC [S19].
HTTP/HTTPS destination ports 80/443 are the default; other ports require
compliance verification [S3].

**FACT (high):** the AUP prohibits illegal or rights-infringing access, security
breaches, unauthorized account access, authentication circumvention, denial of
service, spam, ticket bots, and invalid ad traffic. Automated gathering must
comply with target legal documents, remain public absent permission, and avoid
sensitive health and children's data [S20].

**INFERENCE (high):** KYC, restricted targets, port gating, and monitoring are
useful provider-side defense in depth. They neither establish participant
consent for a specific exit nor grant the customer permission from a target.
KYC-based unblocking of a provider restriction must never override a Curiosity
policy denial.

## 4. Endpoint, authentication, and protocol contract

### 4.1 Entry nodes and authentication

**FACT (high):** the principal rotating endpoint is
`pr.oxylabs.io:7777`. Proxy-user credentials are separate from dashboard login,
and the username begins `customer-`. With no routing flags, every request is
documented to receive a different random exit [S1][S2][S21].

**FACT (high):** country-specific entry nodes use host/port pairs such as
`us-pr.oxylabs.io:10000`. Their rotating port returns a new IP per request; port
ranges provide sticky country sessions. Country endpoints do not support city
targeting. Hong Kong and Beijing HTTPS entry nodes are published for clients
connecting from China, with documented third-party-tool compatibility caveats
[S2][S6].

**FACT (high):** two authentication modes are public [S22]:

- proxy-user username/password; or
- source-IP allowlisting, limited in self-service documentation to ten IPv4
  addresses. With allowlisting, routing flags move into a generated subdomain.

Oxylabs warns not to combine credentials and allowlisting and says allowlisting
can make per-proxy-user statistics indistinguishable when a public source IP is
shared [S22].

**RECOMMENDATION (high):** use dedicated, least-privilege proxy sub-users per
environment and capability, with hard traffic limits. Keep credentials in an
isolated egress adapter, never in target URLs, task payloads, agent context,
shell history, exception text, or ordinary logs. Source-IP allowlisting is not a
workload identity and should not authorize a shared NAT without a second local
authorization layer.

### 4.2 Protocol and trust semantics

**FACT (high):** the docs distinguish [S3]:

- ordinary HTTP proxy entry;
- an HTTPS-encrypted client-to-proxy connection using
  `https://pr.oxylabs.io:7777`;
- SOCKS5 with proxy-side DNS (`socks5h`) at the residential endpoint, currently
  described as TCP-only in the general section;
- beta SOCKS5 UDP at `socks.pr.oxylabs.io:7777` for HTTP/3/QUIC, requiring
  enablement and firewall support.

SOCKS5 country entry nodes are unsupported; location flags remain in the
username [S3].

**CHECK / CONTRADICTION:** the same protocol page says SOCKS5 UDP is available
in beta and later says Residential SOCKS5 supports “only TCP connection at the
moment” [S3]. The narrow interpretation is: ordinary endpoint support is TCP;
UDP exists only on a distinct beta endpoint after enablement. Obtain a normative
protocol matrix before use.

**SECURITY INFERENCE (high):** an ordinary unencrypted HTTP connection to the
proxy gateway exposes Basic proxy credentials and destination metadata on the
client-to-gateway path. An HTTPS proxy protects that first hop. For an HTTPS
target tunneled with CONNECT, normal target TLS can remain end-to-end through
the exit; the raw-proxy docs do not require provider TLS interception. Plain
HTTP target traffic can be read or modified by gateway/exit-path participants.

**FACT (high):** one official Ruby session example sets
`OpenSSL::SSL::VERIFY_NONE` for the target connection [S4]. This is an example,
not a stated product requirement. **RECOMMENDATION (high):** reject it. Preserve
normal target certificate and hostname verification, and use a separately
verified HTTPS proxy connection when supported. Do not infer the Web Unblocker
trust-all requirement for this distinct product.

## 5. Rotation and session semantics

### 5.1 Default rotation

**FACT (high):** no session flag means a new residential exit for each request
[S1][S2]. “New” describes gateway selection intent; public docs do not promise
global uniqueness, exclusion windows, or that the same IP cannot recur.

**UNKNOWN:** weighted selection, pool deduplication, reputation criteria,
per-customer sharing, retry at gateway level, simultaneous reuse, quarantine,
or how quickly a failed/abusive exit is removed.

### 5.2 Credential sessions

**FACT (high):** `sessid-<random>` binds requests to one exit while it remains
online. The default session ends after ten minutes or 60 seconds without a
request, whichever comes first. If the exit disappears, ordinary `sessid`
automatically assigns a replacement IP [S4].

**FACT (high):** `sesstime` can request up to **1,440 minutes (24 hours)**, but
the dynamic peer may disappear sooner; session expiry can occur while a request
is still in progress. `sessid_oneip` instead fails with HTTP `502` if the exact
exit disappears, requiring a new session ID [S4][S23].

**FACT (high):** country sticky entry-node ports keep one IP for up to ten
minutes without a credential flag. They cover country only, not city [S4].

**INFERENCE (high):** `sessid` is soft exit affinity; `sessid_oneip` is
fail-closed exit affinity. Neither promises a dedicated IP, TCP connection,
browser process, cookies, local storage, target account, or user identity. An
ordinary sticky crawl can cross exits without an explicit error, corrupting any
assumption that several pages share one network observation point.

**RECOMMENDATION (high):** if a separately approved localization task needs
affinity, mint an opaque, task-scoped adapter session bound to target, geo,
policy, and a short deadline. Use fail-closed semantics where exit continuity is
material, but never use residential stickiness to emulate a person, preserve a
login, or bypass publisher controls. Record requested affinity and
`exit_changed=unknown` unless independently observable.

### 5.3 Documentation drift

**CHECK / CONTRADICTION (high):** current Session Control and Endpoint Generator
pages document 1,440 minutes, while Making Requests and Whitelisting parameter
tables still say `sesstime` has a **30-minute** maximum [S2][S4][S22][S23]. The
product FAQ also says “up to 24 hours” [S11]. Treat the effective maximum as an
account/contract property, not a hard-coded portable guarantee.

## 6. Geography and advanced filters

### 6.1 Location controls

**FACT (high):** the published selector surface is [S5-S9]:

| Control | Syntax / boundary | Important qualification |
| --- | --- | --- |
| Continent | `cn-` plus AF/AN/AS/EU/NA/OC/SA | Availability is dynamic. |
| Country | `cc-` plus ISO 3166-1 alpha-2 | Can also use country-specific entry node. |
| City | `city-<English_name>`, preferably with country | Oxylabs says every city is supported but explicitly does not guarantee an exit at a given time. |
| US state | `st-us_<state>` | Documentation models only US state names. |
| ZIP | `postalcode-<five digits>` with `cc-US` | US only; matched via MaxMind. |
| Coordinates | `X-Oxylabs-Geolocation: lat:lon;radius_miles` | Minimum ten-mile radius; no exit yields `502`. |
| ASN | `ASN-<number>` | Some ASNs are KYC-restricted; no exit yields `502`; country wins if both country and ASN are supplied. |

**FACT (high):** country/state/city values are assigned from MaxMind GeoIP2 and
updated weekly. Oxylabs warns that target-site or other geolocation databases
can disagree. Its own `ip.oxylabs.io/location` test output combines MaxMind,
IP2Location, DB-IP, and IPinfo and can return IP, provider, country, city, ZIP,
ASN, organization, and timezone [S1][S5].

**INFERENCE (high):** these controls select exits according to provider/database
classification; they do not prove device location, legal jurisdiction, source
content locale, or what the target inferred. Precise coordinates identify a
search region, not a guaranteed observation point.

**RECOMMENDATION (high):** separate `requested_exit_geo`,
`provider_classified_geo`, `target_reported_locale`, and
`independently_observed_geo`. Keep nulls when unavailable. Default to country at
most; state/ZIP/coordinates/ASN require a documented need, privacy review, and
fallback policy. Never silently broaden a failed precise location.

### 6.2 OS and IP version

**FACT (high):** account-enabled `platform` values are Windows, macOS, Linux,
Android, and iOS. `ipversion-4` and `ipversion-6` select an address pool. Oxylabs
warns that combining either with a narrow location may have no available exits
[S10].

**FACT (high):** IP-version selection is not strict by default: if a target
cannot use the selected version, Oxylabs may resolve through a supported version.
Strict behavior requires account-manager configuration; strict IPv6 against an
IPv4-only target can yield `522` [S10].

**INFERENCE (high):** “platform” is provider-reported peer OS for the TCP
connection, not a browser/user-agent/device attestation. IP version may describe
the selected peer while target-side resolution/family is adapted. Neither field
should be used as source provenance.

**RECOMMENDATION (high):** an owned crawler should not manipulate peer OS to
make a browser fingerprint look human. If IPv6 coverage is operationally useful,
request it explicitly, record strictness, and fail visibly rather than permit an
undocumented family fallback.

## 7. Scale and performance claims

### 7.1 What 175M+ means

**FACT (medium; vendor-claimed):** current Residential product/pricing pages say
**175M+** residential IPs and 195 countries [S11][S12]. The corporate risk page
instead says **177M+ “ethically gathered proxies”**, a broader company-level
number [S24]. Country cards show millions of addresses for major locations
[S11].

**FACT (high about the published definition):** the product FAQ says Oxylabs
counts residential IPs by multiplying “Oxylabs Residential Proxy pool, unique
exit node number per day, and days in quarter” and notes that the result varies
monthly [S11]. The sentence is not a precise metric formula.

**INFERENCE (high):** 175M+ is a time-windowed marketing inventory measure, not
175M simultaneously online, dedicated, unique, consent-current, or reachable
exits. Daily addresses counted across a quarter can exceed concurrent supply;
the public explanation does not define deduplication across days or IPv4/IPv6,
and country cards do not state observation window or live availability.

### 7.2 Performance and availability

**FACT (medium; vendor-claimed):** pages advertise:

- “unlimited concurrent sessions”;
- average **99.95% success**;
- **0.41 seconds** in a “premium IP quality” section;
- average **0.6 seconds** in the plan feature list;
- filtering by latency, bandwidth, quality, and “IP scraping history” [S11][S12].

**FACT (high):** the General Conditions and self-service agreement promise only
reasonable efforts for 24x7 availability, excluding planned downtime and events
beyond reasonable control. Services are otherwise supplied “as is”; the reviewed
public plan does not attach an uptime, latency, success, capacity, or remedy SLA
[S14][S15].

**NEGATIVE RESULT (high):** no reviewed primary source defines the success-rate
denominator, target set, geography, protocol, time window, timeout, block-page
classifier, sample size, percentile latency, measurement point, or independent
methodology. “Unlimited” has no numeric admission rate, connection cap, queue,
fairness, per-origin bound, or capacity commitment.

**RECOMMENDATION (high):** treat all scale/performance numbers as discovery
signals, not sizing inputs. Require a written metric dictionary and SLA. A later
evaluation, only if separately authorized, should report success and latency by
target class, geo, protocol, rotation/session mode, HTTP outcome, and content
quality, with confidence intervals and provider-error separation.

## 8. Reliability, errors, and observability

### 8.1 Failure surface

**FACT (high):** provider-originated errors include an
`X-Error-Description` response header; target-originated errors do not [S25].
Published cases include:

| Status | Documented provider meanings [S25] | Operational interpretation |
| --- | --- | --- |
| `400` | malformed request, unsupported SOCKS version/parameter, invalid HTTP | Configuration failure; do not retry unchanged. |
| `403` | restricted target | Policy/account gate, not origin permission evidence. |
| `407` | bad credentials or traffic limit reached | Auth/quota failure; rotate/redact credentials only through operator workflow. |
| `500` | internal error | Provider failure. |
| `502` | invalid upstream response, session failure, exit not found, client disconnected, generic gateway error | Ambiguous routing/session/upstream class; description matters. |
| `504` | timeout or target unreachable | Provider path versus target reachability remains coarse. |
| `522` | invalid response; advanced-filter page also uses it for strict IP-family incompatibility | Preserve raw header/body and configuration context. |

**INFERENCE (high):** `X-Error-Description` is a useful ownership hint, but the
status space remains many-to-one. An origin can independently return the same
HTTP status without the header. Absence of the header does not cryptographically
prove origin authorship, and the public contract gives no structured error code
or request correlation ID.

**RECOMMENDATION (high):** preserve `proxy_transport_outcome`,
`provider_error_description`, `origin_http_outcome`, and
`content_validation_outcome` separately. Retry only typed transient classes,
within Curiosity's own attempt/deadline/byte/cost budget and per-origin pacing.

### 8.2 Usage visibility

**FACT (high):** the dashboard reports traffic, request count, and spending, and
supports separate proxy sub-users [S1][S11]. Residential Public API base path is
`https://residential-api.oxylabs.io/v2`; login uses main-user Basic auth to issue
a JWT valid for one hour. It can create/modify/delete sub-users, set traffic
limits, retrieve current/historical traffic, and retrieve per-target sub-user
statistics for the last 30 days [S16].

**FACT (high):** the public API's documented resources distinguish a main user
and sub-users. The login page warns that after a main-user password change, the
original password may still be required unless support intervenes [S16].

**SECURITY RECOMMENDATION (high):** treat that password-change behavior as a
material credential-lifecycle check. Do not automate the API until Oxylabs
explains credential derivation, revocation, rotation, MFA relationship, audit
events, and whether “original password” means a distinct immutable proxy secret.
Use separate sub-user traffic ceilings as a secondary kill switch, not the only
budget control.

### 8.3 Material observability gaps

**NEGATIVE RESULT (high):** reviewed public sources expose no guaranteed:

- per-request provider request ID, start/end timestamp, gateway region, or route;
- selected exit IP, supply tier, supplier, consent state, OS, geo source, or ASN
  in the proxied response;
- actual versus requested filter fields, fallback reason, or session IP-change
  event;
- DNS answers, connect/TLS timings, redirect chain, request/response byte split,
  or target certificate evidence;
- gateway retry count, attempt ledger, peer changes, block/CAPTCHA event, or
  semantic success classifier;
- cache behavior (a raw proxy should not be assumed to cache, but no normative
  no-cache/no-transform guarantee was found beyond the handbook's general
  request-non-modification statement);
- per-request billed bytes, immutable usage event, usage finalization lag, or
  hard-spend cutoff precision;
- public Residential network status history, incident feed contract, RTO/RPO,
  or plan-specific support/response SLA.

**RECOMMENDATION (high):** Curiosity must generate its own evidence envelope:

```text
request_id, crawl_job_id, adapter_version, proxy_profile_id
requested_url, normalized_url, final_url, redirect_chain
requested_at, first_byte_at?, received_at, deadline_ms
requested_geo, requested_asn?, requested_ip_version?, strictness
session_mode, provider_session_ref_hash?, exit_changed=unknown
proxy_transport_outcome, provider_error_description?
origin_status, content_type, byte_length, sha256, truncated
tls_verified, target_certificate_digest?, dns_evidence?
retry_index, total_attempts, retry_reason, per_origin_pacing_state
robots_policy_decision_id, rights_policy_decision_id, retention_class
provider_traffic_units?, estimated_cost, semantic_validation_outcome
provenance_completeness, untrusted_external_data=true
```

Question marks are first-class unavailable fields. Never store proxy passwords,
raw allowlist controls, precise peer location, or unhashed session IDs in crawl
records.

## 9. Security, privacy, and legal analysis

### 9.1 Network and peer risk

**INFERENCE (high):** a residential exit is a third-party network path. With
plain HTTP it can observe/alter target content. With properly verified HTTPS it
still participates in routing and can observe destination/timing/volume metadata
to the extent exposed by DNS and transport. The gateway necessarily sees enough
account, routing-filter, and destination context to authenticate and route.

**RECOMMENDATION (high):** permit HTTPS public-web GET/HEAD only by default;
never send origin `Authorization`, session cookies, API keys, client
certificates, confidential query parameters, request bodies, or unpublished
URLs. Enforce public destination and safe-port policy before proxying and after
every DNS answer/redirect; reject private, loopback, link-local, metadata,
service, multicast, and reserved destinations. Keep target TLS verification on,
cap decompression/body/redirect/time, quarantine bytes, and treat all returned
content as hostile.

**UNKNOWN:** peer-to-customer isolation, local LAN reachability from peer
software, DNS leak behavior by protocol, exit compromise detection, abuse
complaint routing, customer attribution to peers, traffic encryption inside the
Oxylabs-to-peer segment, and whether peers can inspect target TLS metadata.

### 9.2 Customer-data privacy and contract scope

**FACT (high):** enterprise General Conditions define Residential Proxy service
as access to and maintenance of a residential pool; permit subcontractors;
permit customer-use monitoring; assign compliance with laws, target terms, and
third-party rights to the customer; disclaim responsibility for transmitted
content; and contain customer indemnity and liability limitations [S14].

**FACT (high; consequential distinction):** GC clause 4.3.9 expressly permits
Oxylabs to retain and use data gathered through **Web Scraper API and Web
Unblocker**. It does **not** name Residential Proxies [S14]. This is favorable
relative to those products, but silence is not a no-log/no-secondary-use
commitment for residential traffic.

**FACT (high):** the public DPA defines covered “SAPI Services” as automatic
data-gathering tools and the GC says the DPA applies to Web Unblocker and Web
Scraper API personal-data processing. Residential Proxy is a separate GC service
category [S14][S26]. **INFERENCE (high):** the public documents do not clearly
make the DPA automatically applicable to standalone Residential Proxy traffic.
That scope must be resolved in writing before personal data is transmitted.

**FACT (high):** the self-service agreement meters Residential service by
monthly Traffic, makes dashboard usage data prevailing and “final and
undisputable” over customer records, permits monitoring, and does not incorporate
the public DPA into its document list [S15].

**FACT (high):** the general privacy policy covers account credentials, access
logs, activity history, preferences, service providers, transfers, and
purpose/legal-need retention; communications may be kept up to five years. It
does not define Residential target traffic or payload retention [S27].

**NEGATIVE RESULT (high):** public sources do not specify retention, deletion,
residency, encryption, support access, government-request handling, or model/
analytics use for target hosts, full URLs, DNS queries, headers, bodies,
responses, session IDs, exit mappings, failed attempts, or per-target usage
statistics. No public residential-specific subprocessor list was found; the DPA
says its list is available by written request, but its applicability is itself
unclear [S26].

**RECOMMENDATION (high):** require an order form/security addendum that covers
Residential Proxies explicitly: no payload/content retention or secondary use;
metadata categories and short periods; no model training; named suppliers and
subprocessors; processing/egress regions; encryption and access controls;
government requests; fixed incident notice; deletion and backup purge; audit
rights; and precedence over public terms. Require a DPA if any personal data may
transit. Until then, transmit only non-sensitive public-web requests.

### 9.3 Certifications and assurance

**FACT (medium; vendor-claimed):** the Trust Center identifies Residential
Proxies as within ISO/IEC 27001:2022 certification and lists a Dashboard &
Residential API penetration-test summary. It separately says SOC 2 Type 2
applies to Web Scraper API and Web Unblocker, not Residential Proxies [S24][S28].

**RECOMMENDATION (high):** do not generalize the scraper/unblocker SOC 2 claim to
Residential Proxies. Obtain the ISO certificate/scope and statement of
applicability, residential gateway/API pentest summary, supplier-control mapping,
exceptions, and current remediation status. An ISMS certificate is not proof of
per-peer consent, secure peer software, no traffic retention, or egress safety.

## 10. Limits, metering, and price snapshot

Public prices are volatile and sometimes internally inconsistent. They describe
metering shape, not a quote or total cost.

### 10.1 Plans observed 2026-08-17

**FACT (high, time-sensitive):** [S12] showed:

| Plan | Included traffic | Monthly fee | Listed unit rate | Top-up ceiling |
| --- | ---: | ---: | ---: | ---: |
| Starter | 5 GB | $30 | $6/GB | 100 GB |
| Basic | 20 GB | $100 | $5/GB | 100 GB |
| Advanced | 125 GB | $500 | $4/GB | 2 TB |
| Corporate | 1 TB | $2,500 | $2.50/GB | 2 TB |

VAT may apply. Plans list three proxy users, ten allowlisted IPs, geo targeting,
sticky sessions, IP-version/OS selection, and support/account management [S12].

**FACT (high):** monthly traffic expires rather than rolling over under both
enterprise and self-service terms. Self-service PAYG traffic is nominally
indefinite but may be expired without refund after more than three months of no
usage; PAYG is non-refundable. Monthly refund eligibility is tightly bounded by
time and used-traffic thresholds [S14][S15].

**CHECK / CONTRADICTION:** the same current product page FAQ says plans start at
**$99/month with 11 GB**, while its embedded current cards start at **$30 for 5
GB** [S11]. Use dashboard/order-form values, never scrape marketing prose into a
budget automatically.

### 10.2 Missing meter and capacity definitions

**UNKNOWN:** reviewed public sources do not normatively define whether “traffic”
includes request and response headers/bodies, CONNECT/TLS/UDP overhead, DNS,
failed connections, provider errors, retries, retransmission, or partial
responses; decimal versus binary GB; rounding/minimum charge; metering delay;
hard limit overshoot; or top-up price. They also publish no numeric connection,
request-rate, or bandwidth ceiling despite “unlimited concurrent sessions.”

**RECOMMENDATION (high):** budget each crawler task by attempts, request bytes,
response bytes, redirects, wall time, and dollars. Maintain independent counters
and reconcile them against provider sub-user/target totals, while recognizing
that self-service terms privilege dashboard measurements. A provider traffic
limit is a backstop, not a real-time circuit breaker.

## 11. Clean-room logical architecture

The smallest architecture consistent with public behavior is:

```text
customer crawler
  -> Curiosity egress/policy adapter
       -> target + DNS/redirect/port/robots/rights gate
       -> credential and task-budget broker
  -> global / China / country proxy entry node
       -> proxy auth or source-IP authorization
       -> parse routing flags and account/KYC/target/port policy
       -> eligible-exit selector
            geography/ASN + OS + IP-family + quality/availability
       -> optional session mapping
            sessid: replace vanished exit
            sessid_oneip: fail when vanished
            country port: short port-to-exit mapping
  -> physical-device or ISP-sourced residential exit
  -> public target

separate control/observation plane:
dashboard + Residential Public API
  -> sub-users, traffic limits, aggregate usage, per-target statistics
```

**Evidence:** common backconnect and regional/country entry nodes [S1-S3][S6];
credential-encoded selectors [S2][S5-S10]; session replacement/fail-closed modes
[S4]; policy gates and provider errors [S3][S19][S25]; mixed supply channels
[S13]; and a separate JWT management/statistics API [S16].

**INFERENCE (high):** an account/policy plane must resolve credentials, limits,
KYC, restricted target/port rules, and eligible filters before routing. A
short-lived mapping store is logically required for session IDs and sticky
ports. A pool health/selection function is consistent with quality-filtering
claims and exit-not-found failures.

**NOT ESTABLISHED:** process/service topology, clouds and regions, algorithms,
databases, supplier protocols, encryption between infrastructure and peers,
whether the gateway can see target plaintext, retry internals, peer-sharing
model, reputation feeds, or storage technology. Marketing references to
“advanced filtering algorithms” do not identify a model or architecture.

## 12. Owned-crawler implications

### 12.1 Why this should not be the default egress

1. **Publisher legibility:** rapidly rotating residential IPs make a crawler
   harder to identify, contact, and rate-limit coherently. That conflicts with an
   owned crawler's preference for honest identity and predictable pacing.
2. **Per-origin control:** “unlimited” network concurrency does not remove the
   crawler's duty to cap concurrency and request rate per origin.
3. **Reproducibility:** dynamic exits and soft session failover make repeated
   observations differ in path, location, and target treatment.
4. **Provenance:** the product returns bytes, not an acquisition ledger. The
   actual exit, supply tier, retry path, and consent evidence are absent.
5. **Supply-chain blast radius:** traffic depends on third-party devices or ISP
   routes outside Curiosity's operational boundary.
6. **Cost-quality mismatch:** bandwidth is billable regardless of whether a page
   is useful, duplicate, blocked, stale, or too large.
7. **Policy temptation:** high reach and fine geo controls can encourage bypass
   behavior. Reachability must remain subordinate to target rights and policy.

### 12.2 A narrowly acceptable future role

**RECOMMENDATION (high):** only consider Residential egress when all are true:

- the task is approved public-web collection with a documented localization or
  representative-access need;
- ordinary stable egress is unsuitable for a non-evasive reason;
- target terms, robots, privacy, copyright/database rights, and purpose review
  permit the collection;
- no login, paywall, personal account, access control, CAPTCHA bypass,
  side-effecting method, or confidential data is involved;
- country-level targeting is sufficient, or finer targeting has explicit human
  approval;
- the adapter enforces origin identity, pacing, task budget, and fail-closed
  target/redirect/DNS policy;
- provider supply-chain, DPA, retention, audit, and incident checks have passed;
  and
- the result records `residential_egress=true` and explicit provenance gaps.

Residential rotation must not be triggered automatically by `403`, `429`,
robots denial, CAPTCHA, login wall, or publisher block. Those are policy and
backoff signals, not instructions to acquire a new identity.

## 13. Verdict ledger

| Verdict | Pattern / choice | Rationale and required adaptation |
| --- | --- | --- |
| **ADOPTED** | Separate proxy users and per-user traffic limits | Map to narrow environment/capability identities; retain Curiosity hard budgets. |
| **ADOPTED** | Typed provider error description distinct from target response | Normalize into transport/provider/origin/content outcomes; preserve raw evidence. |
| **ADOPTED** | Explicit rotating, soft-affinity, and fail-closed-affinity modes | Model network identity honestly and keep lifetime finite. |
| **ADOPTED** | Requested geo separate from external geolocation databases | Preserve requested, provider-classified, target-reported, and observed values separately. |
| **ADAPTED** | Backconnect entry and credential-string selector grammar | Keep entirely inside provider adapter; core contracts use typed, validated fields. |
| **ADAPTED** | Public API aggregate target/traffic statistics | Use for reconciliation and anomaly detection, not request provenance or unquestioned billing truth. |
| **ADAPTED** | Supplier consent/awareness/reward criteria | Convert principles into audited procurement controls, versioned evidence, revocation SLA, and incident reporting. |
| **ADAPTED** | IPv4/IPv6 and ASN controls | Only for approved operational needs; require strictness and explicit fallback semantics. |
| **REJECTED** | Residential egress as crawler default | Weakens publisher legibility, reproducibility, provenance, and supply-chain control. |
| **REJECTED** | Automatic IP rotation after block/429/CAPTCHA/robots denial | Identity rotation must not defeat publisher or policy signals. |
| **REJECTED** | Direct agent access to proxy endpoint, credentials, geo/ASN/OS/session controls | Prevent secret leakage, confused-deputy egress, identity simulation, and spend abuse. |
| **REJECTED** | Target TLS verification disabled | The raw-proxy product does not require trust-all; retain normal certificate validation. |
| **REJECTED** | “175M+”, “unlimited,” or 99.95% as capacity/SLA facts | Metrics lack normative definitions and independent validation. |
| **REJECTED** | Provider KYC or target availability as legal authority | Curiosity remains responsible for purpose, target rights, robots, privacy, and sensitive data. |
| **DEFERRED** | Oxylabs Residential production adapter | Supply assurance, DPA scope, retention, protocol, metering, SLA, and controlled contract checks remain open. |
| **DEFERRED** | ZIP/coordinate/OS targeting | High identity/privacy/evasion sensitivity and no baseline crawler need. |
| **DEFERRED** | SOCKS5 UDP / HTTP/3 | Beta/ordinary support text conflicts; no owned-crawler requirement. |

## 14. Unknowns and pre-adoption checks

### Supply chain and governance

1. Obtain the versioned supplier procurement standard, supplier/channel
   inventory, A+/A/ISP percentages, independent audit evidence, consent samples,
   reward terms, resource caps, peer security requirements, withdrawal SLA,
   sanctions, and incident history.
2. Establish per-exit lineage and consent-control assurance without exposing
   participant personal data to Curiosity.
3. Clarify ISP-sourced routing authority and how it differs technically and
   contractually from device participation.

### Contract, privacy, and security

4. Confirm in writing whether the DPA covers Residential Proxy traffic; obtain
   named subprocessors/suppliers, regions, SCC mechanism, data categories,
   retention/deletion/backup periods, training and secondary-use prohibition,
   incident deadline, and audit rights.
5. Obtain a data-flow/threat model for gateway-to-peer encryption, peer
   isolation, DNS, HTTP versus CONNECT, SOCKS5/UDP, logs, abuse attribution, and
   compromise detection.
6. Confirm credential rotation/revocation, the Public API “original password”
   behavior, JWT audit logs, sub-user privileges, IP-allowlist auditability, and
   support-access controls.

### Contract surface and operations

7. Obtain a normative endpoint/protocol/parameter matrix, including strict
   filter behavior, precedence, unavailable-filter errors, session clocks,
   concurrency, TCP reuse, DNS, timeout, and maximum request/response sizes.
8. Resolve 30-minute versus 1,440-minute session documentation and TCP-only
   versus beta UDP wording.
9. Obtain a structured provider error code, request ID, rate/backpressure model,
   maintenance/status feed, incident history, support SLA, and exit-change event.
10. Define traffic billing precisely: included bytes/attempts/failures/overhead,
    GB base, rounding, finalization delay, limit overshoot, and dispute process.
11. Obtain metric definitions and SLA/remedies for availability, success,
    latency, pool size, geography, and “unlimited” concurrency.

### Separately authorized no-cost checks only

12. If legal, security, procurement, and caller authority all pass, use only an
    approved public test domain and no sensitive data to verify: target TLS;
    provider-versus-origin errors; DNS and redirects; filter strictness and
    fallback; session expiry/replacement; request IDs; byte reconciliation;
    quota cutoff; credential revocation; and content hashing. Paid, capacity,
    CAPTCHA, restricted-target, login, bypass, peer-mapping, and consent-forensic
    tests remain prohibited without new authority.

## 15. Contradictions and retained negative results

1. **Session maximum:** 30 minutes in Making Requests/Whitelisting tables versus
   1,440 minutes in Session Control, Endpoint Generator, and product FAQ
   [S2][S4][S11][S22][S23]. **UNKNOWN:** account/version rollout rules.
2. **SOCKS5 transport:** beta UDP is advertised, while the same page says only
   TCP is currently supported [S3]. Treat UDP as a separate gated beta.
3. **Response time:** 0.41 seconds in quality marketing versus 0.6 seconds in
   plan features [S11][S12]. No methodology makes them comparable.
4. **Pool count:** 175M+ residential IPs versus 177M+ company-wide “ethically
   gathered proxies” [S11][S24]. Neither is live concurrent supply.
5. **Starting plan:** product FAQ says $99/11 GB while current cards say $30/5
   GB [S11][S12]. Dashboard/order form must control.
6. **IP-version selection:** “IPv6 only” may still resolve an IPv4-only target
   unless strict mode is enabled [S10]. Selector name and target-path behavior
   must be modeled separately.
7. **CAPTCHA management:** pricing/product copy advertises it, but raw proxy docs
   define no CAPTCHA API, browser, retry, or success contract [S11][S12]. Do not
   treat it as Web Unblocker.
8. **Sourcing assurance:** the handbook describes strong principles but no
   named suppliers, dated audit, exact mix, or per-request attestation [S13].
9. **Observability:** aggregate traffic/target statistics exist, but no
   request-level route/evidence ledger was found [S16].
10. **DPA scope:** the public DPA/GC coupling names SAPI automatic-gathering
    services, not standalone Residential Proxy [S14][S26]. Written clarification
    is required; absence must not be filled by assumption.

## 16. Bounded curiosity pass

Scoring uses relevance (**R**), decision value (**V**), novelty (**N**), and
reverse-scored cost (**Cheap**, 5 means cheapest). Only public-source work inside
the declared frame was eligible.

| Thread | R | V | N | Cheap | Decision and result |
| --- | ---: | ---: | ---: | ---: | --- |
| Supplier sourcing composition and consent controls | 5 | 5 | 5 | 4 | **Pursued:** handbook found A+/A/ISP model and majority-A+ claim; no percentages, suppliers, independent audit, or per-exit evidence. |
| Does public DPA cover Residential Proxy traffic? | 5 | 5 | 5 | 5 | **Pursued:** GC/DPA scope points to SAPI/Web Unblocker/Web Scraper, not Residential; retained as procurement-critical unknown. |
| What does 175M+ count? | 5 | 4 | 4 | 5 | **Pursued:** FAQ exposes a quarterly/daily counting description; concluded it is not concurrent supply. |
| Session max and failover semantics | 5 | 5 | 4 | 5 | **Pursued:** found soft replacement, fail-closed one-IP mode, and 30/1,440-minute contradiction. |
| Request-level provenance and billing evidence | 5 | 5 | 4 | 4 | **Pursued:** Public API and error docs provide aggregate usage and error hint only; negative result retained. |
| Independently validate peer consent or reward | 4 | 5 | 5 | 1 | **CURIOSITY_NO_GO:** requires non-public supplier/participant evidence and invasive investigation; vendor claim remains medium confidence. |
| Enumerate or map residential exits | 2 | 2 | 4 | 1 | **CURIOSITY_NO_GO:** contrary to clean-room/terms boundary and unnecessary for the decision. |
| Inspect peer apps/SDKs or supplier binaries | 3 | 4 | 5 | 1 | **CURIOSITY_NO_GO:** access/license/safety boundary; require audit evidence instead. |
| Run paid success, latency, capacity, CAPTCHA, or bypass tests | 3 | 4 | 2 | 1 | **CURIOSITY_NO_GO:** caller prohibited paid tests, credentials, and bypass; marketing claims remain unverified. |
| Broad litigation/case-law survey | 3 | 4 | 3 | 1 | **CURIOSITY_NO_GO:** outside product-contract frame; defer to counsel for the approved use case. |
| Infer proprietary quality-selection algorithm | 1 | 1 | 3 | 2 | **CURIOSITY_NO_GO:** unnecessary and unsupported; logical selector role is sufficient. |

**Stop reason:** all requested dimensions have primary-source coverage or an
explicit negative result. Additional public pages repeated marketing claims.
The highest-value gaps now require contractual disclosure, audit evidence,
counsel, or separately authorized testing; further inference would reduce
confidence rather than improve the decision.

## Sources

All sources were accessed **2026-08-17**. First-party material is authoritative
for the published interface, policy text, or representation attributed to
Oxylabs—not independent proof of implementation, quality, consent, security,
compliance, or legal fitness.

- **[S1]** Oxylabs, “Residential Proxies.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies.md>
- **[S2]** Oxylabs, “Residential Proxies — Making Requests.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/making-requests.md>
- **[S3]** Oxylabs, “Residential Proxies — Protocols.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/protocols.md>
- **[S4]** Oxylabs, “Residential Proxies — Session Control.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/session-control.md>
- **[S5]** Oxylabs, “Residential Proxies — Location Settings.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings.md>
- **[S6]** Oxylabs, “Residential Proxies — Country.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/select-country.md>
- **[S7]** Oxylabs, “Residential Proxies — City, State, and Continent.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/select-city.md>,
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/select-state.md>,
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/continent.md>
- **[S8]** Oxylabs, “Residential Proxies — ZIP/Postal code” and “Coordinates.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/zip-postal-code.md>,
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/coordinates.md>
- **[S9]** Oxylabs, “Residential Proxies — ASN Targeting.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/location-settings/asn-targeting.md>
- **[S10]** Oxylabs, “Residential Proxies — Advanced Filters.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/advanced-filters.md>
- **[S11]** Oxylabs, “Residential Proxies” product page.
  <https://oxylabs.io/products/residential-proxy-pool>
- **[S12]** Oxylabs, “Residential Proxies Pricing.”
  <https://oxylabs.io/pricing/residential-proxy-pool>
- **[S13]** Oxylabs, “Oxylabs Residential Proxy Pool Handbook: Guide to
  Procurement Processes and Policies,” undated public PDF.
  <https://oxylabs.io/Oxylabs_Residential_Proxy_Acquisition_Handbook.pdf>
- **[S14]** Oxylabs, “General Conditions of oxylabs, UAB Services Agreement,”
  updated 2024-12-12.
  <https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement>
- **[S15]** Oxylabs, “Self-Service Subscription Agreement,” updated 2024-09-25.
  <https://oxylabs.io/legal/self-service-tos>
- **[S16]** Oxylabs, “Residential Proxies — Public API.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/public-api.md>
- **[S17]** Oxylabs, “Dashboard API” (product-boundary note for Residential
  statistics).
  <https://developers.oxylabs.io/dashboard/dashboard-api.md>
- **[S18]** Oxylabs, “Know Your Customer Policy.”
  <https://oxylabs.io/kyc-and-safety>
- **[S19]** Oxylabs, “Residential Proxies — Restricted Targets.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/restricted-targets.md>
- **[S20]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25.
  <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S21]** Oxylabs, “Quick Start: Proxies.”
  <https://developers.oxylabs.io/get-started/quick-start-proxies.md>
- **[S22]** Oxylabs, “Residential Proxies — Whitelisting IPs.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/whitelisting-ips.md>
- **[S23]** Oxylabs, “Residential Proxies — Endpoint Generator.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/endpoint-generator.md>
- **[S24]** Oxylabs, “Risk and Legal Compliance.”
  <https://oxylabs.io/risk-and-legal-compliance>
- **[S25]** Oxylabs, “Residential Proxies — Response Codes.”
  <https://developers.oxylabs.io/products/proxies/residential-proxies/additional-information.md>
- **[S26]** Oxylabs, “Data Processing Agreement,” updated 2022-12-01.
  <https://oxylabs.io/legal/oxylabs-data-processing-agreement>
- **[S27]** Oxylabs, “Privacy Policy,” updated 2024-10-14.
  <https://oxylabs.io/legal/privacy>
- **[S28]** Oxylabs Trust Center.
  <https://trust.oxylabs.io/>

## Confidence summary

- **High:** documented endpoint/auth shape; selector grammar; protocol pages;
  rotation and session replacement modes; geo database and filter semantics;
  response codes; Public API resources; plan cards; AUP and contract text.
- **Medium:** vendor sourcing/KYC/security/performance representations; logical
  gateway, selector, session-map, and control-plane reconstruction; DPA-scope
  interpretation pending contract confirmation.
- **Low / unknown:** actual concurrent pool and country supply; independent
  consent/reward verification; supplier mix; per-exit provenance; peer software
  security; exact traffic meter; gateway retries; request-level logs; payload
  retention; regions/subprocessors; capacity and service quality; success/latency
  methodology; operational session-limit rollout.

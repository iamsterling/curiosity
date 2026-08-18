# Oxylabs ISP Proxies: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Oxylabs' self-service **ISP Proxies** product: sourcing and sharing
model, fixed-IP and rotating routes, country controls, protocols,
authentication, reliability/observability, limits/pricing, abuse/security/
privacy/legal boundaries, and implications for a Curiosity-owned crawler.
Dedicated ISP Proxies are considered only to establish the product boundary.  
**Method and authority:** public first-party documentation, product/pricing,
trust, AUP, privacy, DPA, KYC, and General Conditions. No account, credentials,
free or paid trial, live proxy request, target probe, bypass, traffic inspection,
SDK/agent-skill inspection, implementation, or non-public material was used.

## Decision frame

The decision is not whether an ISP-addressed proxy can relay traffic. It is:

> Can semi-dedicated, static ISP-addressed exits be used as a tightly controlled
> egress option for an owned public-web crawler without outsourcing crawl policy,
> source identity, retry semantics, provenance, or legal authority?

Bounded sub-questions:

1. What is actually sourced, hosted, assigned, and shared?
2. Which fixed, rotating, country, protocol, and authentication controls exist?
3. What do “unlimited-duration sessions,” “unlimited bandwidth,” and advertised
   success mean—and what do they not guarantee?
4. Which failure, health, usage, and audit signals can an operator observe?
5. What abuse, privacy, security, and contractual risks survive provider KYC?
6. Which patterns should Curiosity adopt, adapt, reject, or defer?

Evidence labels:

- **FACT** — stated or shown in a cited first-party source.
- **INFERENCE** — a bounded clean-room explanation consistent with public
  behavior, not a claim about private implementation.
- **RECOMMENDATION** — a Curiosity architecture, safety, or procurement action.
- **UNKNOWN** — not established in the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Marketing scale, performance,
sourcing, compliance, and ethics statements remain vendor representations.

## Executive assessment

**FACT (high):** standard ISP Proxies are pay-per-IP, port-addressed proxy exits.
`isp.oxylabs.io:8001` maps to one assigned IP, subsequent ports map to subsequent
assigned IPs, and port `8000` selects a random IP from the purchased list for each
new request. Standard IPs are advertised as “semi-dedicated” and shared with up
to three users; exclusive addresses are a separate **Dedicated ISP Proxies**
product [S1-S6].

**INFERENCE (high):** this is a raw routing primitive, not Web Unblocker or a
managed crawler. Oxylabs provides an authenticated gateway, an allocation/mapping
layer, optional random selection, and an exit. The customer still owns request
headers, cookies, TLS behavior, redirects, retries, rendering, parsing, target
politeness, content validation, storage, and evidence. A fixed port gives stable
*exit affinity*, not a durable TCP connection, browser identity, exclusive IP,
or guarantee that the assignment never changes.

**RECOMMENDATION (high):** **ADAPT / DEFER.** Adapt fixed logical exit handles,
explicit rotation, country-bounded pools, configuration exports, and fair-usage
signals behind a provider-neutral egress policy. Defer a production adapter until
contractual traffic logging/retention, supplier authorization, SLA/support,
certificate trust, telemetry, and controlled tests are resolved. Reject direct
agent access to credentials or arbitrary proxy destinations, IP rotation as a
way around robots/rate/access policy, blanket TLS verification disabling, and
claims that an ISP ASN or returned `200` establishes authenticity or permission.

For a general owned crawler, ISP Proxies should be an exceptional, policy-bound
egress profile—not the discovery, fetch, or retry plane. Standard shared IPs are
particularly unsuitable where Curiosity needs exclusive source attribution,
reputation control, target allowlisting by source IP, or forensic accountability.

## 1. Product and network-sourcing boundary

### 1.1 What an “ISP proxy” is here

**FACT (high):** Oxylabs describes an ISP proxy as an IP hosted in a data center
but registered under an ISP. It calls these “static residential” addresses and
says they combine datacenter performance with residential-like treatment. The
product names premium ASN providers including AT&T, Comcast, Lumen, Frontier,
BT Group, Orange, and Cox [S1][S2][S7].

**FACT (high):** standard ISP Proxies are marketed as **semi-dedicated** and the
pricing page says an IP is shared with **up to three users**. Dedicated ISP
Proxies instead promise exclusive IPs and permit selection from premium ASNs;
they use a distinct `disp.oxylabs.io` product surface [S1-S3][S16-S17].

**INFERENCE (high):** “residential” describes registration/classification, not an
end-user household path. The documented hosting model is server/data-center
infrastructure using ISP-associated address space. Residential peer consent and
device-acquisition claims for Oxylabs' rotating residential network therefore do
not establish the supply chain for this product.

**FACT (medium, vendor representation):** Oxylabs says ISP addresses are
“procured” or “sourced” from premium ASN providers, calls the pool ethically
obtained, and publishes provider/country inventory. Its general trust page says
it has procurement standards for proxy suppliers [S1][S2][S19].

**UNKNOWN (high importance):** ownership versus lease structure; whether the
named ASN itself, an authorized reseller, or another upstream supplies each
block; hosting countries and operators; route-origin authorization; RPKI status;
supplier audit cadence; abuse-contact delegation; IP-history screening; and
whether the advertised inventory is simultaneously available, allocated, or
historical. No underlying supplier agreement, route authorization, or
product-specific sourcing audit was public in the reviewed material.

### 1.2 Allocation is a mutable mapping

**FACT (high):** the dashboard proxy list exposes gateway, port, country, and
assigned IP and can be exported as JSON or CSV. Customers connect through the
gateway and port, not directly to the assigned address. Oxylabs says this keeps a
port stable through IP replacement. It also warns that IP-to-port assignments may
change after plan changes; the dashboard separately supports replacing IPs or
changing country/quantity [S4][S15].

**INFERENCE (high):** the durable operational identifier is approximately
`account + product + port + mapping version`, not the public exit IP alone. A
port is static only within an allocation epoch. Configuration changes and manual
replacement intentionally mutate the observed network identity.

**RECOMMENDATION (high):** snapshot and hash every exported mapping, effective
time, and replacement event. Give crawler jobs a logical egress-profile ID; keep
raw IPs and ports in restricted operational evidence, not agent prompts or public
logs. Never claim continuity across an unrecorded mapping change.

## 2. Request, static, rotation, geography, and protocol controls

### 2.1 Authentication and ingress

**FACT (high):** requests use the common `isp.oxylabs.io` gateway with proxy-user
credentials in the exact case-sensitive form `user-USERNAME:PASSWORD`. The first
assigned exit is port `8001`; more exits use increasing ports. Alternatively, up
to ten customer-owned IPv4 addresses can be allowlisted in the dashboard for
password-free access. Oxylabs advises username/password rather than source-IP
authentication on infrastructure such as AWS [S3][S8].

**RECOMMENDATION (high):** use a dedicated proxy user per environment and
capability, secret-manager injection, short rotation procedures, and outbound
firewall rules limiting credentials to the Oxylabs gateway. Do not put credentials
in source, command history, process listings, URLs, ordinary traces, or agent
context. Prefer credentials over source-IP authentication on shared/NAT/cloud
egress; if allowlisting is required, bind only stable organization-controlled
egress and monitor changes.

### 2.2 Fixed and rotating routes

| Mode | Published control | Safe interpretation |
| --- | --- | --- |
| Fixed assignment | `isp.oxylabs.io:8001+`; each port always uses its currently assigned IP [S3-S4] | Exit affinity during a mapping epoch; shared IP, mutable on replacement/plan change. |
| Full-list rotation | `isp.oxylabs.io:8000`; a random purchased IP is selected for each new request [S5] | Per-request provider selection; no fairness, no-repeat, weighting, or health guarantee is documented. |
| Country rotation | Port `8000` plus `country-CC` in the proxy username selects from the indicated country pool [S5] | Requested country constraint; no cross-country fallback or actual-exit evidence guarantee. |

**FACT (high):** product copy calls fixed use “unlimited-duration sessions”: a
customer can retain an IP without a session timer, while port `8000` provides
dynamic rotation [S1-S2].

**INFERENCE (high):** “session” is marketing shorthand for continued use of a
fixed assigned port/IP. Standard ISP documentation exposes no `sessid`, idle
timer, cookies, browser state, or logical session object. It does not promise one
TCP connection can remain open indefinitely, nor that an unhealthy/replaced exit
will never interrupt work.

**UNKNOWN:** random-selection distribution and repeat behavior; whether retries
or redirects receive the same exit; health-aware exclusion; pool refresh delay;
connection reuse/multiplexing; DNS caching; effects of simultaneous fixed and
rotating use; behavior when a requested country has no healthy exit; and whether
the rotator can change an exit within one tunneled connection.

### 2.3 Geography and ASN evidence

**FACT (high):** a fixed port inherits the country of its assigned IP. Standard
ISP Proxies expose country selection, not the residential product's city, state,
ZIP, coordinate, carrier, OS, or IP-version filters. Oxylabs says it uses MaxMind
GeoIP2 for allocation location. Its own IP-check endpoint reports data from
MaxMind, IP2Location, DB-IP, and IPinfo; it recommends RIPEstat for current ASN/
route-announcement information because ownership databases may be stale [S3-S7].

**INFERENCE (high):** country, registered owner, and currently announcing ASN are
different claims. Database disagreement is expected, and target sites may use a
different geolocation/reputation feed. “Locally resolved” marketing is not proof
of physical server location or target-perceived locale.

**RECOMMENDATION (high):** store `requested_country`, provider-assigned country,
observed exit IP, current route origin, and independent target-visible country as
separate optional fields with timestamps. Geo-sensitive crawling needs periodic
sampling and a mismatch state; it must not silently fall back to another country.

### 2.4 Protocols and DNS

**FACT (high):** the product supports HTTP proxying; an HTTPS connection to the
proxy gateway for an encrypted client-to-gateway leg; and SOCKS5. The SOCKS5
example uses `socks5h://`, which asks the proxy side to resolve hostnames. Oxylabs
says SOCKS5 supports TCP and UDP and warns some sites may identify the proxy when
that protocol is used [S9].

**UNKNOWN:** target-side HTTP versions, CONNECT policy, allowed ports, UDP
destination/size/lifetime controls, DNS resolver location and logging, DNSSEC,
IPv6 exit support, certificate chain/rotation for the HTTPS gateway, whether the
gateway injects or strips headers, and normative end-to-end TLS guarantees.

**FACT (high):** an official Node example creates an HTTPS agent with
`rejectUnauthorized: false` [S3][S5]. **RECOMMENDATION (high):** reject this
trust-all pattern. Validate the gateway certificate and independently preserve
normal target TLS verification. Unlike Web Unblocker, the public ISP docs do not
establish TLS interception; do not assume either interception or end-to-end
properties without a written protocol contract and controlled certificate test.

## 3. Routing and architecture inference

The smallest architecture consistent with published behavior is:

```text
customer crawler
  -> destination/crawl-policy gate
  -> proxy client + account credential or source-IP authentication
  -> isp.oxylabs.io gateway
       -> account / target-restriction / concurrency gate
       -> port mapping (8001+) ---------> one currently assigned shared exit
       -> rotator (8000) + country? ----> one eligible purchased exit
  -> ISP-associated, data-center-hosted public exit
  -> target DNS / network / origin
```

**INFERENCE (high):** a control-plane allocation table must bind customer ports
to assigned IPs, and a rotator must select among eligible purchased assignments.
Concurrency and aggregate traffic accounting enforce fair usage. This does not
establish process topology, algorithms, storage, hosting vendor, routing protocol,
or that selection is random in a cryptographic/statistical sense.

**INFERENCE (high):** standard ISP Proxies appear to rotate *within the
customer's purchased list*, not a global residential pool. Consequently, buying
ten IPs yields at most those ten advertised exit identities in the rotator during
that allocation epoch; rotation is routing convenience, not supply expansion.

## 4. Reliability, errors, and observability

### 4.1 Reliability claims versus contract

**FACT (medium, vendor claim):** the product page advertises a **99.9% success
rate** and says interruptions are rare [S1]. No methodology, target set, sample
window, status/content success definition, percentile latency, or remedy is tied
to that number.

**FACT (high):** the General Conditions promise reasonable efforts for 24x7
availability, excluding planned downtime and causes beyond reasonable control;
they do not publish a numeric ISP Proxy SLA or service credit in the reviewed
public contract [S20].

**RECOMMENDATION (high):** treat 99.9% as marketing, not SLO input. Define owned
SLOs for gateway connect, proxy handshake, DNS, target connect, first byte,
complete bounded body, and semantic usability. Benchmark only under separate
authority on controlled public domains and never against the advertised figure's
unknown denominator.

### 4.2 Error surface and documentation drift

**FACT (high):** the product response table documents `400`, restricted-target
`403`, `404`, auth/allowlist `407`, concurrency `429`, provider `500`, upstream or
target `502`, DNS/connect `503`, and a roughly 60-second proxy `504` timeout [S10].

**FACT (high):** the help-center quick start instead lists `522` timeout and
custom `525` no-exit errors. More seriously, it describes `502` using a
“session ID,” city/ASN filters, and changing `sessid`—controls not documented for
standard ISP Proxies [S18].

**INFERENCE (high):** the help text likely mixes another rotating-proxy error
model into the ISP page. Therefore status-code ownership is not sufficiently
normative: a `502` can ambiguously implicate gateway, assigned exit, or target;
ordinary target status may also pass through the proxy.

**RECOMMENDATION (high):** preserve the raw status, headers, stage timestamps,
port/mapping epoch, and local exception. Classify failure only when supported by
stage evidence. Parse unknown/custom codes defensively; retry only idempotent GET/
HEAD inside per-origin, attempt, deadline, and byte budgets. Obtain a written
provider-versus-origin error contract before production.

### 4.3 Observable operations

**FACT (high):** operators can view/export the proxy allocation, query Oxylabs'
IP-information endpoint, replace IPs/change country and quantity in the dashboard,
and receive fair-usage emails at 80% and 100% of the traffic allowance [S3-S7]
[S12][S15]. The product page says the dashboard displays usage and spending
analytics [S1].

**Negative result / UNKNOWN (high confidence):** no reviewed standard ISP Proxy
contract exposes per-request IDs/logs, gateway/exit timings, target status
separation, bytes by request/port/target, active connections, rotation choice,
health state, replacement event API, audit-log API, or ISP-specific usage API.
The public Dashboard API explicitly supports Datacenter Proxies and Headless
Browser, not ISP Proxies [S14]. No ISP-specific public status page, uptime history,
numeric SLA, maintenance feed, or automated unhealthy-IP replacement contract
was found.

**RECOMMENDATION (high):** Curiosity must own request telemetry and synthetic
health checks. Record gateway DNS/connect/TLS, chosen logical port/profile,
observed exit, target DNS/connect/TLS, response timing/bytes, bounded failure
stage, and mapping/config version. Do not log proxy credentials or expose exit IP
inventory broadly. Reconcile local aggregate traffic and concurrency with the
dashboard; alert before the provider's 80% notification.

## 5. Limits and price snapshot

Public prices are volatile and sometimes internally inconsistent. They establish
meter shape, not a quote or total cost.

| Plan on 2026-08-17 | Included IPs | Monthly price | Unit price |
| --- | ---: | ---: | ---: |
| Starter | 10 | $16 | $1.60/IP |
| Advanced | 100 | $130 | $1.30/IP |
| Premium | 500 | $600 | $1.20/IP |
| Enterprise | 2,000+ | Custom | Custom |

**FACT (high):** VAT may apply. Standard plans are shared with up to three users,
include HTTP/HTTPS/SOCKS5, and are pay per IP with no additional bandwidth fee,
subject to fair usage [S2]. A single-use free trial is advertised through support,
but none was requested or used [S1-S2].

**FACT (high):** until monthly traffic reaches **50 GB per purchased IP**, the
account receives up to **100 concurrent sessions per purchased IP**. At that
threshold, the limit falls to **10 per IP for the remainder of the billing
cycle**. Oxylabs' examples scale both traffic and concurrency by IP count; 80%
and 100% notifications precede/mark enforcement [S12].

**INFERENCE (high):** “unlimited bandwidth” means no per-byte surcharge, not
unbounded throughput. The economically relevant constraints are fixed monthly IP
commitment, shared reputation/capacity, account concurrency, target pacing, and a
10x concurrency reduction after the aggregate fair-use threshold.

**FACT (high):** location claims drift. The pricing page says plans cover **22**
locations; the product FAQ says **25**; the same product page's visible inventory
contains additional countries and distinguishes shared from dedicated coverage
[S1-S2]. **RECOMMENDATION:** use only a dated dashboard quote/allocation as the
available-country contract; never hard-code marketing counts.

**UNKNOWN:** exact traffic accounting (wire versus payload, ingress plus egress,
UDP/DNS, failed traffic), concurrency definition (TCP connections, requests, or
threads), reset timezone, burst behavior, over-limit queueing versus rejection,
IP replacement allowance/cost/cooldown, refund/proration after setup changes,
maximum connection duration, and bandwidth/throughput caps.

## 6. Abuse, security, privacy, and legal analysis

### 6.1 Abuse controls and target restrictions

**FACT (high):** restricted categories include entertainment/streaming, banking
and finance, government, gaming, ticketing, and mail. Access may sometimes be
enabled after support review/KYC [S11]. The AUP prohibits unlawful or
IP-infringing access, malware, security breaches, authentication circumvention,
port scans, spoofing, denial of service, spam, ticket bots, and invalid ad
traffic. Automated gathering must respect target terms/legal documents, remain
public absent permission, and exclude sensitive health and children's data [S21].

**FACT (medium, vendor claim):** every customer answers KYC questions; use cases
and activity are reviewed; service can be refused/restricted; and Oxylabs says at
least one quarter of inquiries are rejected [S22].

**RECOMMENDATION (high):** provider target access and KYC are defense-in-depth,
not Curiosity authorization. Enforce purpose, public-web scope, target terms,
robots, copyright/database rights, privacy, sensitive-category, per-origin pace,
and deny lists *before* egress selection. Never rotate exits to evade an origin's
denial, rate limit, CAPTCHA, account restriction, or Curiosity policy.

### 6.2 Security consequences of a raw shared proxy

**INFERENCE (high):** a general HTTP/HTTPS/SOCKS5 gateway with TCP and UDP can
become an SSRF, scanning, exfiltration, spam, DNS-abuse, malware-download, or
denial-of-wallet primitive if exposed to agents or arbitrary tenants. A
semi-dedicated exit also creates reputation coupling: another allowed customer
can cause blocklisting or complaints attributed to the same public IP, while a
target cannot distinguish customers by source address.

**RECOMMENDATION (high):** place the proxy behind a non-agent-accessible egress
broker. Permit only approved public HTTP(S) destinations and ports; resolve and
check IPs before connection and after every redirect; reject private, loopback,
link-local, metadata, reserved, and control-plane ranges; disable UDP and generic
SOCKS5 by default; cap redirects, connections, time, decompression, and bytes;
scan artifacts; and treat all returned content as untrusted external data.

Do not send origin `Authorization`, logged-in cookies, client certificates,
private query strings, confidential POST bodies, or personal data through this
product by default. Restrict methods to GET/HEAD unless a separately reviewed,
idempotent public use requires more.

### 6.3 Provider visibility and data handling

**INFERENCE (high):** at minimum the gateway can observe account identity,
source IP, selected port/profile, destination network metadata, timing, bytes,
and plaintext HTTP. With HTTPS targets it may still observe destination and
traffic metadata; the reviewed contract does not prove whether target TLS is
strictly end-to-end or whether DNS is logged.

**FACT (high):** the General Conditions permit subcontractors and provider
monitoring of customer use. Their express sole-discretion data-retention clause
applies to **Web Scraper API and Web Unblocker**, not ISP Proxies [S20, clauses
2.2, 4.3.7, 4.3.9]. That narrower clause is not evidence that ISP traffic logs
are absent or promptly deleted.

**FACT (high):** the public DPA defines its covered service as SAPI automatic data
gathering services. The General Conditions say the DPA applies to Web Unblocker
and automatic data gathering, while ISP Proxies are a separate service category
[S20][S24]. **INFERENCE (medium):** the public DPA does not clearly cover raw ISP
Proxy use; written confirmation or a product-specific DPA is required if
personal data is processed.

**UNKNOWN (critical):** URL, DNS, destination, headers, payload, response,
connection, source-IP, and per-exit log fields; retention/deletion; lawful-access
process; regions; subprocessors/upstreams; encryption; employee/support access;
secondary use; breach notice; and customer deletion/export rights. The general
privacy policy describes account/contact/usage data and broad service-provider
categories but not ISP traffic-log handling [S23].

**RECOMMENDATION (high):** procurement must obtain a product-specific data-flow
diagram, DPA/SoW, subprocessor and region list, exact log schema and retention,
no secondary use/training, deletion/backup SLA, incident deadline, access audit,
and order-of-precedence terms. Until then, only non-sensitive public requests are
in bounds.

### 6.4 Contract allocation and assurance scope

**FACT (high):** the General Conditions place legal/target-terms/privacy/IP and
credential responsibility on the customer; prohibit resale, sharing service
access, interference, limit circumvention, competitive monitoring, and reverse
engineering; disclaim results and many warranties; limit liability; and impose
customer indemnity for many third-party claims [S20]. This report examines only
public behavior and does not access or reverse engineer the service.

**FACT (high):** the AUP says it may become binding through either the General
Conditions or an Oxylabs Self-Service Subscription Agreement [S21]. The latter
instrument was not located in the reviewed public sources. **UNKNOWN:** which
agreement/version the dashboard purchase flow incorporates and whether its
liability, renewal, data, and termination terms differ. The GC analysis above
must not be assumed to replace review of the actual click-through order.

**FACT (medium, vendor representation):** the trust material lists ISO/IEC
27001:2022 and various controls. Its public update specifically names Datacenter
Proxies, Residential Proxies, and Scraper APIs in ISO scope; SOC 2 Type 2 is
described for Web Scraper API and Web Unblocker [S19]. **UNKNOWN:** whether the
standard ISP Proxy control and data planes are in the current certificate/audit
scope, and what exceptions apply.

## 7. Owned-crawler implications

### 7.1 Appropriate role

**RECOMMENDATION (high):** model ISP Proxies as one optional
`EgressProfile`, never as a crawler. The owned crawler retains:

- URL frontier, scope, canonicalization, robots and rights decisions;
- per-origin global rate/concurrency policy independent of exit count;
- DNS/redirect/SSRF controls and method/body policy;
- retry ownership and idempotency;
- fetch timing, response limits, hashing, storage, parsing, and provenance;
- content/block-page validation and freshness decisions; and
- aggregate spend, traffic, and kill switches.

Static egress can be useful when a permitted public source behaves better with a
consistent country and source address, or when long transfers need stable
affinity. Rotation can distribute independent public requests across an already
approved purchased set. Neither is evidence that a target authorized collection.

### 7.2 Identity, politeness, and evidence

**RECOMMENDATION (high):** target pacing must key on origin and Curiosity task,
not proxy IP. Adding or rotating IPs must not increase the allowed origin request
rate. Send an honest crawler user agent/contact where policy requires; do not use
ISP classification to impersonate a household user.

Minimum provider-neutral evidence envelope:

```text
request_id, crawl_job_id, adapter_version, egress_profile_id
requested_url, final_url?, redirect_chain?
requested_at, received_at, requested_country?
provider_product=isp_proxy, allocation_version, logical_port_mode=fixed|rotate
assigned_exit_id?, observed_exit_ip?, observed_country?, observed_route_origin?
gateway_dns/connect/tls_outcome, target_dns/connect/tls_outcome
origin_status?, response_media_type?, byte_length, sha256
retry_attempt, deadline, policy_decision_id, robots_decision_id
provider_error_code?, failure_stage?, freshness_status
untrusted_external_data=true, retention_class, cost_ip_month_share
```

Question marks are first-class unavailable observations. Hashes and timestamps
are Curiosity evidence; provider country/ASN and target headers remain untrusted
claims.

### 7.3 Standard versus dedicated decision

**INFERENCE (high):** semi-dedicated standard IPs reduce Curiosity's control over
reputation and attribution. If a source contractually allowlists Curiosity's
egress, or incident response requires proving sole use, standard ISP Proxies are
the wrong abstraction. Dedicated ISP Proxies may address exclusivity but are a
separate product requiring its own report, contract, pricing, and test; this
dossier does not approve them.

## 8. Decision ledger

| Verdict | Pattern | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPT** | Stable logical port-to-exit mapping | Keep a versioned allocation epoch and explicit replacement history. |
| **ADOPT** | Explicit fixed versus rotating mode | Capability must be policy-selected and visible in evidence. |
| **ADOPT** | Exportable IP/port/country configuration | Ingest into restricted config inventory; hash and diff, never expose to agents. |
| **ADOPT** | Fair-use notifications and hard concurrency classes | Add earlier Curiosity traffic/concurrency alerts and admission control. |
| **ADAPT** | Country-bounded rotation | Treat as a requested constraint; verify observed country and fail closed on mismatch. |
| **ADAPT** | HTTP/HTTPS proxy support | Isolated adapter, strict gateway and target TLS, approved destinations only. |
| **ADAPT** | IP whitelisting | Only stable organization egress; credentials are preferable on cloud/NAT paths. |
| **ADAPT** | IP replacement | Human-approved health/reputation operation with mapping epoch and provenance break. |
| **REJECT** | Raw SOCKS5 TCP/UDP exposed to agents | Excessive destination/protocol and exfiltration surface; disable unless separately justified. |
| **REJECT** | `rejectUnauthorized: false` | Trust a reviewed gateway chain and preserve target verification. |
| **REJECT** | Rotation as rate-limit/access-control evasion | Keep per-origin policy invariant across exits. |
| **REJECT** | ISP ASN/country/provider `200` as truth or permission | These are routing and response observations, not source authenticity or authorization. |
| **REJECT** | Shared IP as exclusive Curiosity identity | Up to three users create reputation and attribution coupling. |
| **DEFER** | Production standard ISP adapter | Data handling, DPA scope, supplier evidence, SLA, telemetry, errors, and controlled tests remain unresolved. |
| **DEFER** | Dedicated ISP alternative | Different exclusivity/ASN contract; requires separate evaluation. |

## 9. Unknowns and pre-adoption checks

1. Obtain the applicable self-service/enterprise order, SoW, GC/AUP precedence,
   referenced Self-Service Subscription Agreement, ISP-specific DPA,
   subprocessors/upstreams, processing regions, and current security
   certificate/audit scope.
2. Obtain supplier authorization, route-origin/RPKI, hosting, abuse handling,
   screening, reassignment, and IP-history controls for the allocated blocks.
3. Define exact gateway/DNS/destination/header/payload/response/connection logs,
   retention, deletion, secondary use, government access, encryption, and breach
   notice.
4. Obtain normative protocol details: target and gateway TLS, certificate
   rotation, CONNECT/ports, DNS, IPv4/IPv6, SOCKS5 TCP/UDP limits, header
   mutation, compression, body, connection, and timeout ceilings.
5. Reconcile `502/504` with help-center `522/525` and unsupported `sessid`/
   city/ASN language; require provider-versus-origin error ownership.
6. Define port `8000` randomization, repeat/weighting, unhealthy-exit exclusion,
   country-empty behavior, connection reuse, and mapping-change propagation.
7. Define traffic accounting, concurrency unit/window, reset timezone, queue/
   rejection behavior, replacement allowance/cooldown, and plan-change proration.
8. Obtain an ISP-specific usage/audit API or approved export with bytes,
   connections, exits, replacements, and timestamps; clarify status/maintenance
   notification and contractual SLA/remedies.
9. Reconcile 22/25/current dashboard country coverage and obtain a dated quote
   that names standard-shared inventory and sharing ceiling by requested country.
10. Only after legal/security/procurement approval, run a separately authorized
    non-sensitive public sandbox test: certificate validation, fixed mapping,
    rotation distribution, country mismatch, DNS/redirect SSRF, status ownership,
    timeout/body caps, concurrency `429`, traffic reconciliation, mapping changes,
    shared-exit reputation, and kill switch. No bypass or paid test is authorized
    by this report.

## 10. Bounded curiosity pass

Gaps were scored 1–5 for relevance (**R**), decision value (**V**), novelty
(**N**), and reverse-scored cost (**Cheap**, where 5 is cheapest). Only public,
in-frame threads were pursued.

| Thread | R | V | N | Cheap | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Standard versus dedicated/shared identity | 5 | 5 | 4 | 5 | **Pursued:** standard is semi-dedicated/shared up to three; exclusive IPs are a separate product. |
| Static-port and rotator semantics | 5 | 5 | 4 | 5 | **Pursued:** fixed ports map to purchased assignments; `8000` randomly selects per request; no fairness/health/fallback contract found. |
| ISP telemetry and SLA | 5 | 5 | 4 | 4 | **Pursued:** dashboard/UI signals exist, but no ISP-specific public usage API, request evidence, or numeric SLA was found. |
| Error-code contradiction | 5 | 4 | 4 | 4 | **Pursued:** product docs use `504`; help center uses `522/525` and references undocumented session/city/ASN controls. Retained as drift. |
| ISP traffic data and DPA scope | 5 | 5 | 5 | 4 | **Pursued:** public DPA/SAPI language does not clearly cover raw ISP Proxy use; traffic-log handling remains unknown. |
| Verify ASN supplier contracts and route authorization | 4 | 5 | 5 | 1 | **CURIOSITY_NO_GO:** requires non-public supplier and routing evidence; vendor sourcing claim remains medium confidence. |
| Inspect Agent Skills/SDK for hidden controls | 2 | 2 | 3 | 3 | **CURIOSITY_NO_GO:** caller prohibited implementation/source inspection; public network contract is the integration boundary. |
| Fingerprint exits or benchmark target bypass/success | 2 | 2 | 3 | 1 | **CURIOSITY_NO_GO:** requires live access and bypass testing, explicitly outside authority. |
| Purchase/free trial and dashboard inspection | 3 | 4 | 2 | 1 | **CURIOSITY_NO_GO:** credentials and free/paid tests were prohibited. |
| Broader case-law survey | 3 | 4 | 3 | 2 | **CURIOSITY_NO_GO:** legal advice and jurisdiction-specific target analysis exceed the product-contract frame; counsel review is deferred. |

**Stop reason:** all requested categories are covered; high-value public-source
gaps saturated into explicit unknowns. Further resolution requires contracts,
audit/supplier evidence, counsel, or separately authorized testing.

## Sources

All sources were accessed **2026-08-17**. First-party material is authoritative
for the published interface or attributed representation, not independent proof
of implementation, inventory, quality, compliance, sourcing, or legality.

- **[S1]** Oxylabs, “ISP Proxies” product page. <https://oxylabs.io/products/isp-proxies>
- **[S2]** Oxylabs, “ISP Proxies Pricing.” <https://oxylabs.io/pricing/isp-proxies>
- **[S3]** Oxylabs, “ISP Proxies — Making Requests.” <https://developers.oxylabs.io/products/proxies/isp-proxies/making-requests.md>
- **[S4]** Oxylabs, “ISP Proxies — Proxy List.” <https://developers.oxylabs.io/products/proxies/isp-proxies/proxy-list.md>
- **[S5]** Oxylabs, “ISP Proxies — Proxy Rotation.” <https://developers.oxylabs.io/products/proxies/isp-proxies/proxy-rotation.md>
- **[S6]** Oxylabs, “ISP Proxies.” <https://developers.oxylabs.io/products/proxies/isp-proxies.md>
- **[S7]** Oxylabs, “ISP Proxies — Location & ISP Info.” <https://developers.oxylabs.io/products/proxies/isp-proxies/location-settings.md>
- **[S8]** Oxylabs, “ISP Proxies — Whitelisting IPs.” <https://developers.oxylabs.io/products/proxies/isp-proxies/whitelisting-ips.md>
- **[S9]** Oxylabs, “ISP Proxies — Protocols.” <https://developers.oxylabs.io/products/proxies/isp-proxies/protocols.md>
- **[S10]** Oxylabs, “ISP Proxies — Response Codes.” <https://developers.oxylabs.io/products/proxies/isp-proxies/response-codes.md>
- **[S11]** Oxylabs, “ISP Proxies — Restricted Targets.” <https://developers.oxylabs.io/products/proxies/isp-proxies/restricted-targets.md>
- **[S12]** Oxylabs, “ISP Proxies — Fair Usage Policy.” <https://developers.oxylabs.io/products/proxies/isp-proxies/fair-usage-policy.md>
- **[S13]** Oxylabs, “What countries do Oxylabs proxies cover?” <https://developers.oxylabs.io/help-center/products-and-features/what-countries-do-oxylabs-proxies-cover.md>
- **[S14]** Oxylabs, “Dashboard API.” <https://developers.oxylabs.io/dashboard/dashboard-api.md>
- **[S15]** Oxylabs, “IP Replacement.” <https://developers.oxylabs.io/products/proxies/ip-replacement.md>
- **[S16]** Oxylabs, “Dedicated ISP Proxies.” <https://developers.oxylabs.io/products/proxies/dedicated-isp-proxies.md>
- **[S17]** Oxylabs, “Dedicated ISP Proxies — Self-Service Proxy List.” <https://developers.oxylabs.io/products/proxies/dedicated-isp-proxies/self-service/proxy-list.md>
- **[S18]** Oxylabs Help Center, “Start using ISP Proxies.” <https://developers.oxylabs.io/help-center/getting-started/start-using-isp-proxies.md>
- **[S19]** Oxylabs Trust Center and “Risk and Legal Compliance.” <https://trust.oxylabs.io/>, <https://oxylabs.io/risk-and-legal-compliance>
- **[S20]** Oxylabs, “General Conditions of oxylabs, UAB Services Agreement,” updated 2024-12-12. <https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement>
- **[S21]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25. <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S22]** Oxylabs, “Know Your Customer Policy.” <https://oxylabs.io/kyc-and-safety>
- **[S23]** Oxylabs, “Privacy Policy,” updated 2024-10-14. <https://oxylabs.io/legal/privacy>
- **[S24]** Oxylabs, “Data Processing Agreement,” updated 2022-12-01. <https://oxylabs.io/legal/oxylabs-data-processing-agreement>

## Confidence summary

- **High:** gateway/port contract; fixed versus rotating modes; country filter;
  HTTP/HTTPS/SOCKS5 support; shared-up-to-three statement; authentication;
  fair-use thresholds; public prices; target restrictions; published legal text.
- **Medium:** gateway/allocation-plane reconstruction; data-center hosting and
  premium-ASN sourcing as vendor representations; security/compliance/KYC claims;
  interpretation that the public DPA excludes raw ISP Proxy use.
- **Low/unknown:** supplier authorization and routing chain; real inventory and
  99.9% performance; rotation algorithm and health behavior; exact protocol/TLS/
  DNS behavior; ISP telemetry/SLA; traffic logs, retention, regions, subprocessors,
  and secondary use; actual target-perceived geo/reputation; empirical latency,
  throughput, success, and shared-user interference.

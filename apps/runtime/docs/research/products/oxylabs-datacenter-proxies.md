# Oxylabs Datacenter Proxies: clean-room reverse-engineering dossier

**Research and primary-source access date:** 2026-08-17  
**Scope:** Oxylabs Datacenter Proxies as a standalone network-egress product:
shared pay-per-IP, shared pay-per-traffic/GB, self-service Dedicated Datacenter
Proxies, and the materially different enterprise dedicated interface.  
**Boundary:** public first-party documentation, product/pricing pages, dashboard
API documentation, trust/KYC pages, AUP, privacy policy, DPA, and General
Conditions. No account, free or paid trial, credentials, proxy request, target
probe, bypass attempt, packet inspection, SDK/source inspection, or
implementation. This is not a service benchmark, procurement approval, or legal
advice.

## Decision frame

The decision for Curiosity is:

> Can raw datacenter egress be placed behind an owned crawler's provider-neutral
> network boundary while Curiosity retains destination permission, crawl
> behavior, evidence, security, reliability, and spend control?

Bounded sub-questions:

1. What do “shared,” “dedicated,” pay-per-IP, and pay-per-traffic actually change?
2. How do endpoint, port, credential, rotation, static-IP, and country controls
   select an exit?
3. What remains entirely the crawler's responsibility?
4. Which limits, errors, observability, reliability claims, and prices govern
   operation?
5. What abuse, privacy, security, and contract constraints matter?
6. Which patterns should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — directly stated or shown in a cited first-party source.
- **INFERENCE** — the smallest clean-room explanation consistent with published
  behavior; not a claim about private implementation.
- **RECOMMENDATION** — a Curiosity design, operational, or procurement choice.
- **UNKNOWN** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Marketing scale, speed, success,
uptime, exclusivity, sourcing, and compliance statements remain vendor
representations unless the underlying evidence was publicly inspectable.

## Executive assessment

**FACT (high):** this is a raw proxy product, not Web Unblocker or Web Scraper
API. The caller sends ordinary HTTP(S) or SOCKS5 traffic through an authenticated
proxy and receives the target response. Public documentation exposes IP
selection but no managed browser, CAPTCHA, parser, job, callback, result store,
semantic-success classifier, or documented automatic retry contract [S1-S8].

**FACT (high):** the portfolio has three commercial allocation models and a
second enterprise integration surface:

- shared pay per IP: a purchased, non-exclusive static list plus rotation over
  that list;
- shared pay per traffic/GB: rotation or port-keyed affinity over the full shared
  pool;
- dedicated pay per IP: exits represented as exclusive to one customer, with
  static selection and rotation over the customer's list;
- enterprise dedicated: direct exit-IP access/list APIs and an optional rotator,
  rather than the standard self-service gateway-port mapping [S2-S7][S16-S19].

**INFERENCE (high):** Datacenter Proxies are best understood as a programmable
route selector. They may improve exit diversity, locality, and stable identity,
but they do not grant collection permission, make content fresh or true, or
provide crawl semantics. Shared exits introduce co-tenant reputation risk;
dedicated exits reduce that risk but concentrate target-visible identity and make
the customer responsible for its history.

**Overall verdict — ADAPT / DEFER (high confidence).** Adapt the explicit
rotation-versus-static route model, country-constrained pools, replaceable
port-to-exit indirection, offline-IP telemetry, and aggregate usage counters.
Defer an Oxylabs production adapter pending a written proxy-data DPA/retention
position, precise service/SLA and metering terms, safe authenticated proxy
transport, SSRF/port controls, and a separately authorized public-sandbox
contract test. Reject trust-all TLS samples, direct agent control of proxy
credentials or routing grammar, provider reachability as authorization, and
marketing “success” as content quality.

## 1. Product and allocation model

| Model | Allocation and meter | Exit selection | Published self-service footprint (snapshot) | Main trade-off |
| --- | --- | --- | --- | --- |
| Shared, pay per IP | Purchased IP count; each IP may be used by multiple customers | `dc.oxylabs.io:8001+` selects a purchased mapping; `:8000` rotates across that list | 10–3,000 IPs; 36K+ pool; 38 countries; $1.20/IP at the displayed minimum [S2][S3][S9] | Predictable flat IP cost and stable routes, but co-tenant behavior can affect reputation. |
| Shared, pay per traffic/GB | Included traffic from 20 GB–2 TB | `:8000` rotates over the full pool; any chosen port `8001..63000` keys a static session | 56K+ pool; 44 countries; $0.59/GB at the displayed minimum [S2][S3][S9] | Broader rotation and low entry price; traffic cost and opaque co-tenancy. |
| Dedicated, self-service | Purchased exclusive IP count; “unlimited” bandwidth subject to fair use | `ddc.oxylabs.io:8001+` maps to assigned exits; `:8000` rotates over only that list | 3–3,000 IPs; 1.9M+ pool; 188 countries; $2.25/IP [S9-S14] | Stable customer-controlled reputation; higher fixed cost and concentrated attribution. |
| Dedicated, enterprise | SoW-defined, sales-assisted allocation | Direct exit IP on `60000`/`65432`; optional assigned rotator endpoint | Up to enterprise terms; proxy-list and subnet-management APIs [S16-S21] | Most control/telemetry, but separate contract and integration behavior. |

**FACT (high):** Oxylabs defines datacenter IPs as remote-server addresses not
affiliated with an ISP. “Dedicated” means vendor-represented sole customer use;
shared addresses are available to multiple users. These are not residential
devices or ISP-addressed static residential exits [S10][S15].

**FACT (high):** in self-service gateway modes, the list contains entry point,
port, country, and assigned IP. Customers connect to the gateway and port rather
than directly to the assigned IP. Oxylabs says this lets an exit be replaced
without changing the port. Plan changes may reassign IPs to ports [S2][S11].

**INFERENCE (high):** a port is a replaceable route handle, not an immutable
proxy identity. Persisting only `gateway:port` would lose provenance after plan
or replacement changes. A crawler must record the observed exit IP and mapping
observation time for every acquisition.

**Unknown:** whether “exclusive” reserves only the public IP or also compute and
bandwidth resources; maximum customers per shared exit (the product comparison
says “max 3 users per IP,” but this is not in the normative docs); IP age and
prior-use history; subnet/ASN concentration by plan; allocation duration; and
replacement quotas, lead time, or fees.

## 2. Endpoint, authentication, and protocol contract

### 2.1 Self-service shared and dedicated

**FACT (high):** proxy-user credentials are separate from dashboard credentials.
For shared, the endpoint is `dc.oxylabs.io`; for self-service dedicated it is
`ddc.oxylabs.io`. Both use username prefix `user-`, rotating port `8000`, and
static ports beginning at `8001`. Credentials are case-sensitive [S1][S8][S12].

**FACT (high):** both products document:

- HTTP proxy transport;
- HTTPS proxy transport by explicitly using an `https://` proxy URL;
- SOCKS5 through `socks5h://`, which delegates hostname resolution through the
  proxy; and
- SOCKS5 TCP and UDP support [S5][S14].

**FACT (high):** self-service IP allowlisting accepts up to ten customer-owned
IPv4 addresses. Oxylabs recommends username/password instead for cloud systems
such as AWS and says allowlisted addresses must not be VPN/proxy addresses. With
shared proxies, an allowlisted caller may still put `country-XX` in the username;
the empty-password cURL form requires a trailing colon [S6][S13].

**Security inference (high):** HTTP Basic proxy credentials sent to an ordinary
`http://` proxy endpoint are not protected from the client-to-proxy network path
by Basic itself. HTTPS target tunneling protects target traffic after CONNECT,
but it does not retroactively secure a plaintext proxy-auth hop. SOCKS5 is not an
encryption protocol. Prefer an authenticated **HTTPS proxy transport** with
normal certificate and hostname verification, or a separately protected network
path.

**FACT (high):** multiple official Node examples instantiate an HTTPS agent with
`rejectUnauthorized: false` [S1][S3][S12]. **RECOMMENDATION (high):** reject this
sample pattern. The docs describe HTTPS as encryption to the proxy; they do not
state that Datacenter Proxies require target TLS interception. Disabling all
verification is therefore unnecessary on the published contract and exposes
both proxy and target trust to machine-in-the-middle attack.

### 2.2 Enterprise dedicated

**FACT (high):** enterprise customers receive Basic-authenticated proxy-list URLs
and can retrieve all or named lists. A REST API returns list UUID, update time,
IP count, and per-IP `ip`, `port`, `country`, `city`, and `created_at`. Customers
normally connect directly to an assigned IP on port `60000` with credentials or
`65432` from a whitelisted source IP [S16-S18].

**FACT (high):** the optional enterprise rotator exposes one account-specific
domain on port `60000`, selects a different assigned IP on each request, and can
pin a numbered exit with proxy header `Proxy-Server: sN` [S19]. Enterprise HTTP
is enabled by default; SOCKS5 must be activated by support and is shown on port
`1180`. Target ports 80 and 443 are allowed by default; other ports require
compliance verification [S20].

**RECOMMENDATION (high):** never expose `Proxy-Server`, country username tokens,
raw list UUIDs, or ports as an agent-facing interface. Map an opaque,
policy-issued route handle to adapter-private provider controls. Separate proxy
list API credentials from traffic credentials if contractually possible.

**Unknown:** supported HTTP versions, CONNECT behavior and target-port policy for
self-service, proxy authentication challenge details, credential rotation and
scope, connection pooling, keep-alive and multiplexing behavior, maximum
URL/header/body/response sizes, streaming and compression transformations, UDP
restrictions, IPv6 support, and whether source-IP allowlisting can be scoped per
product user.

## 3. Rotation, session, geography, and routing semantics

### 3.1 Rotation and static identity

**FACT (high):** on port `8000`, each **new request** receives a random IP. For
shared pay per IP and self-service dedicated, selection is limited to the
customer's assigned list. For shared pay per traffic, it is from the full
Datacenter pool [S3][S12].

**FACT (high):** static behavior differs:

- pay per IP / self-service dedicated: a documented list port selects the exit
  assigned to that port;
- pay per traffic: the customer chooses any port in `8001..63000`; a random exit
  is assigned and remains consistent “for the duration of the session”;
- enterprise direct: the customer addresses the exit IP itself;
- enterprise rotator: `Proxy-Server: sN` selects a numbered exit [S2-S3][S17-S19].

**Unknown (high relevance):** “new request” under persistent HTTP connections;
pay-per-traffic session lifetime, idle timeout, and invalidation; whether a port
maps consistently across protocols, processes, products, users, or concurrent
connections; behavior when an exit is offline; failover versus hard failure;
random-selection distribution; and whether retries occur below the caller-visible
request.

**INFERENCE (high):** call the primitive **exit affinity**, not a user/browser
session. The proxy carries no documented cookie jar, browser storage,
fingerprint, authentication state, or transaction isolation.

### 3.2 Country controls

**FACT (high):** shared products encode a two-letter `country-XX` token in the
proxy username. On rotating port `8000`, pay-per-IP chooses from that country's
assigned customer list, while pay-per-traffic chooses from the full country pool.
The documentation lists 38 pay-per-IP and 44 pay-per-traffic countries and says
locations are determined with MaxMind GeoIP2 [S4].

**FACT (high):** dedicated static selection normally uses the port assigned to an
IP already purchased in a location. Self-service dedicated rotation can also add
`country-XX` to restrict rotation over its assigned country pool. Enterprise
list records can expose country and city; marketing advertises state/city
targeting at enterprise scale [S8][S12][S18][S9].

**INFERENCE (high):** country is a requested/provider-classified routing
constraint, not proof of physical observation. Geo databases can disagree; the
vendor's diagnostic endpoint itself returns four databases (MaxMind,
IP2Location, DB-IP, IPinfo) [S1].

**RECOMMENDATION (high):** model `requested_exit_country`,
`provider_assigned_country`, and `observed_exit_geo[]` separately. Do not infer
city/state support from the enterprise marketing claim for a self-service plan,
and do not call geo-localized content factually representative of all users in a
region.

**Unknown:** no-match/fallback behavior, location accuracy SLA, mid-session geo
changes, city/state syntax for enterprise plans, ASN selection, subnet diversity
guarantees, or whether the same exit appears in multiple named pools.

## 4. What the product does not own

**Negative result / FACT boundary (high confidence):** reviewed Datacenter Proxy
documentation publishes no native crawl frontier, robots policy, sitemap use,
canonicalization, deduplication, per-origin pacing, redirect policy, conditional
fetch, cache, render/browser, CAPTCHA handling, cookie/header management, parser,
artifact storage, job ID, callback, or semantic validation. These are crawler
responsibilities, not hidden benefits that should be assumed [S1-S8].

**INFERENCE (high):** unlike Web Unblocker, a returned target response is the
result of caller-controlled HTTP behavior through an exit, not a provider claim
that content is usable. That is more transparent but less managed: Curiosity
must own DNS/destination policy, timeouts, retries, headers, cookies, rendering,
target politeness, content validation, and evidence storage.

**RECOMMENDATION (high):** keep route choice below the crawler policy layer:

```text
bounded crawl frontier + rights/robots/purpose decision
  -> per-origin scheduler and rate budget
  -> fetch request (public HTTP(S), method/body/header policy)
  -> route policy (direct | shared-static | shared-rotating | dedicated-static)
  -> Oxylabs adapter (credentials + gateway/port/country mapping)
  -> bounded response quarantine and validation
  -> immutable artifact + provenance envelope
  -> parsing/indexing as separate derivations
```

No route escalation may override a deny decision. Rotating an exit after a target
rate-limit or access-control response must not be used to evade that target's
policy.

## 5. Errors, limits, and economics

### 5.1 Response and retry ownership

**FACT (high):** common documented proxy codes are `400` malformed request;
`403` restricted target; `404` domain/resource unavailable; `407` credentials or
allowlist failure; `429` thread/concurrent-session limit; `500` provider server
problem; `502` invalid upstream/target response; `503` target connection or DNS
failure; and `504` proxy timeout, usually around 60 seconds [S7][S15][S21].

**INFERENCE (high):** this table mixes provider, routing, DNS, and target causes.
For example, `502` expressly allows upstream **or target** responsibility, and
`404` combines DNS/resource conditions. It does not provide a typed error
envelope or origin-status provenance. A crawler cannot determine retry ownership
from status alone.

**RECOMMENDATION (high):** preserve proxy status/body, target status/body when
distinguishable, route handle, timestamps, and local exception. Retry only under
Curiosity's per-origin and total attempt/deadline/byte/cost budgets. Never rotate
automatically on a target `401`, `403`, `404`, `409`, or `429` without an explicit
policy that distinguishes access denial from transient infrastructure failure.

### 5.2 Fair usage and concurrency

**FACT (high):** shared pay-per-IP permits up to 100 concurrent sessions per
purchased IP until aggregate monthly usage reaches 50 GB per purchased IP, then
reduces to 10 per IP for the rest of the billing cycle. Dedicated self-service
uses the same 100-to-10 reduction but at 100 GB per purchased IP. Email alerts
are sent at 80% and 100% of the fair-use allowance [S22-S23].

**FACT (high):** free Datacenter IPs last one month, provide five fixed US IPs,
have one non-renewing 5 GB collective allowance, permit 20 concurrent sessions
per user, and cannot be replaced [S24]. No trial or account was used here.

**Documentation contradiction:** shared product copy repeatedly says “unlimited
concurrent sessions,” while the normative fair-use page and `429` definition
impose concurrency limits. Dedicated product copy likewise says “unlimited
bandwidth and concurrent sessions” while its fair-use policy reduces sessions
after a traffic threshold [S10][S15][S22-S23]. Treat the numeric fair-use pages
as safer planning bounds and require the SoW to resolve precedence.

**Unknown:** concurrency for pay-per-traffic, connection versus request counting,
HTTP multiplexing treatment, exact traffic meter (request/response headers,
bodies, retransmission, CONNECT, SOCKS UDP), overage/top-up behavior, account
aggregation, and whether fair-use consumption resets by calendar or subscription
billing date.

### 5.3 Public price snapshot

**FACT (high, time-sensitive):** the unified pricing page displayed on the access
date:

| Plan | Displayed entry quantity and price | Included representation |
| --- | --- | --- |
| Dedicated pay per IP | 3 IPs at $2.25/IP, $6.75 monthly | 1.9M+ pool, 188 countries, country targeting, unlimited bandwidth subject to fair use |
| Shared pay per IP | 10 IPs at $1.20/IP, $12 monthly | 36K+ pool, 38 countries, country targeting, unlimited bandwidth subject to fair use |
| Shared pay per GB | 20 GB at $0.59/GB, $11.80 monthly | 56K+ pool, 44 countries, 20 GB–2 TB plan traffic |
| Enterprise | Custom | 2M+ pool, up to 188 countries, country/state/city, unlimited bandwidth |

[S9]. VAT may apply. These are list-page observations, not a quote or TCO.

**Documentation drift (high confidence):** the same top-level product page says
“starts from” $1.20 dedicated, $0.70 shared/IP, and $0.44/GB while its embedded
checkout cards show $2.25, $1.20, and $0.59 respectively. The dedicated page says
$2.25; the older shared page shows different traffic tiers ($0.65–$0.50/GB) and a
42K+ pool. Pool totals also vary among 36K, 42K, 56K, 1.9M, and 2M+ depending on
model/page [S9-S10][S25]. Use a dated order form, not marketing minima.

**RECOMMENDATION (high):** cost models must include fixed IP-months, measured
traffic, replacement/top-up costs, crawler attempts (including failures),
storage, browser/render cost outside this product, and engineering/operations.
Set Curiosity-side hard per-task and per-origin ceilings even when bandwidth is
called unlimited.

## 6. Reliability and observability

### 6.1 Published signals

**FACT (high):** the Dashboard API supports Datacenter Proxies instance discovery
and aggregated usage. It uses a support-issued bearer key and exposes request
count and `traffic_bytes`, grouped by day, target, and/or product instance. One
query spans at most 31 days; pages max at 100 records. Published limits say “10
requests per API key” and “100 requests across all API keys” but omit the time
window [S26].

**FACT (high):** dashboard product copy advertises traffic, successful requests,
success rates, spending limits, and product/user/IP management. Fair-use usage is
automatically tracked with threshold emails [S9][S22-S23].

**FACT (high):** enterprise proxy-list metadata includes update time, count,
country/city, and IP creation time. The Datacenter Proxy API can list currently
offline IPs and supports subnet add/replace operations plus process status and
history, allowing a customer to exclude or replace offline exits [S18][S27].

**RECOMMENDATION (high):** scrape-time telemetry remains Curiosity-owned. Sample
provider usage asynchronously for reconciliation; never put a statistics API in
the request path. Alert on discrepancy among local bytes/requests, provider
aggregates, exit health, fair-use thresholds, and billing.

### 6.2 Claims versus commitments

**FACT (medium, vendor representation):** marketing claims 0.222-second average
response time, 99.9% success, and both 99.9% and 99.99% uptime in different
sections. The dedicated and shared pages generally say 99.9% uptime [S9-S10].

**FACT (high):** the General Conditions promise only reasonable efforts to make
services available 24/7, excluding planned downtime and events outside reasonable
control, unless an SoW says otherwise. Services are otherwise “as is,” with no
promise about results [S28].

**INFERENCE (high):** the public percentages are not an evidenced SLA. Their
denominator, target set, protocol, geography, percentile/window, failure
classification, and remedy are unpublished. `0.222s` may measure only a network
segment rather than full origin response.

**Negative result / UNKNOWN (high confidence):** no reviewed public source defines
a Datacenter Proxy uptime SLA, service credits, maintenance notice period,
regional failover, latency percentiles, health endpoint for self-service exits,
status-history export, per-request ID, selected-exit response header, trace,
target-connect timing, or success-rate formula.

## 7. Security, privacy, abuse, and legal boundary

### 7.1 Egress and credential security

**INFERENCE (high):** a general-purpose HTTP/SOCKS proxy is a high-impact egress
capability. If agents can choose arbitrary destinations, ports, methods, headers,
or bodies, it can become an SSRF/confused-deputy path to metadata services,
private networks, credential-bearing URLs, unauthorized scanners, side-effecting
endpoints, malware, and spend amplification.

**RECOMMENDATION (high):** allow only resolved public HTTP(S) destinations and
approved ports; reject loopback, private, link-local, multicast, reserved,
metadata, and control-plane addresses before connection and after every redirect
or DNS change. Default to GET/HEAD. Bind routes to task, origin, purpose, geo, and
expiry; strip proxy credentials from URLs, logs, traces, and exceptions; use
secret storage and short rotation; quarantine and size-bound all responses.
Disable SOCKS5 UDP unless a separately approved use requires it.

**FACT (high):** Oxylabs restricts streaming, financial, government, gaming,
ticketing, and mail targets, among others, and may ask customers to contact
support. `403` denotes a restricted target [S7][S15]. These restrictions are
defense in depth, not a complete destination allowlist.

### 7.2 AUP, monitoring, and customer obligations

**FACT (high):** the AUP prohibits unlawful/IP-infringing access, malicious code,
security breaches, unauthorized login, authentication circumvention, DoS, port
scans, spoofing, spam, ticket bots, and invalid ad traffic. Automated gathering
must comply with relevant target terms/legal documents, stay on public data
absent permission, and avoid sensitive health and children's data [S29].

**FACT (high):** the General Conditions make the customer responsible for laws,
target terms, privacy/IP rights, credential security, third-party claims, and
usage limits; prohibit resale absent agreement and reverse engineering; allow
subcontractors and vendor monitoring; disclaim content/result responsibility;
and limit many vendor liabilities [S28].

**Applicability caveat (high):** the AUP expressly contemplates two contracting
paths: the General Conditions/SoW and a separate Self-Service Subscription
Agreement. The reviewed public pages did not expose the latter's text. Therefore
the GC findings are directly relevant to the sales/SoW path and a procurement
warning for the portfolio, but must not be represented as the complete
self-service contract without the checkout terms [S28-S29].

**FACT (medium, vendor representation):** Oxylabs says every customer answers a
KYC questionnaire, customer activity is regularly reviewed and automatically
monitored, service can be restricted, and at least one quarter of annual
inquiries are rejected [S30]. KYC approval does not authorize a Curiosity task.

### 7.3 Proxy traffic privacy and contracts

**Important distinction (high confidence):** GC clause 4.3.9 expressly permits
retention/use of data gathered through **Web Scraper API and Web Unblocker**; it
does not name Datacenter Proxies. That avoids importing the separate products'
express reuse clause into this dossier, but it is not a no-logging or no-retention
promise for proxy traffic, nor does it establish the missing self-service terms
[S28-S29].

**FACT (high):** the public DPA is scoped to “SAPI Services.” The current GC says
it applies when Web Unblocker and/or automated data-gathering services process
personal data; it does not list DC proxy service in that DPA applicability clause.
The DPA's processor instructions, subprocessors-on-written-request, and
delete-or-return terms therefore cannot safely be assumed to cover Datacenter
Proxy traffic [S28][S31].

**FACT (high):** the general privacy policy covers account/contact/payment/usage
data, service-provider categories and transfers. Self-service data includes
access logs and activity history and is retained as necessary; communications may
be retained up to five years [S32].

**UNKNOWN (procurement blocker):** proxy DNS/query, destination URL/host/IP/port,
headers, credentials, request/response bodies, traffic metadata, assigned exits,
and failed-attempt logging; operational and backup retention; inspection under
HTTP versus CONNECT/SOCKS; content-access boundaries; regions; subprocessors;
government-request handling; customer deletion; breach timing; and whether any
proxy traffic is used for security analytics or other secondary purposes.

**RECOMMENDATION (high):** require a DC-proxy-specific DPA/security addendum and
SoW that defines controller/processor roles, telemetry and content visibility,
no payload storage/secondary use/model training, metadata retention and deletion,
subprocessors/regions, encryption, incident deadline, audit scope, and order of
precedence. Until then, send only non-sensitive public-web traffic—no target
Authorization, personal-account cookies, confidential URLs/query strings,
client certificates, or personal data.

**FACT (medium):** Oxylabs represents Datacenter Proxies as within its ISO/IEC
27001:2022 certification. Its public risk page reserves the named SOC 2 Type 2
claim for Web Scraper API and Web Unblocker; the Trust Center lists reports and
controls, some access-controlled [S33-S34]. Do not imply a Datacenter Proxy SOC 2
product scope without inspecting the report.

## 8. Clean-room architecture reconstruction

The smallest architecture consistent with public behavior is:

```text
customer crawler
  -> proxy transport ingress
       shared: dc.oxylabs.io
       dedicated self-service: ddc.oxylabs.io
       dedicated enterprise: assigned IP | optional rotator domain
  -> auth/account/compliance/concurrency gate
       Basic credentials | source-IP whitelist
  -> route selector
       port 8000 = rotate
       port 8001+ = mapped/affinity exit
       username country token = constrain pool
       enterprise Proxy-Server sN = select assigned exit
  -> datacenter exit -> target network

control/operations plane
  dashboard users, plans, lists, limits, replacement
  -> usage aggregates and fair-use alerts
  -> enterprise list/subnet/offline-IP APIs
```

**INFERENCE (high):** stable self-service ports require a mapping store; country
tokens require pool metadata; aggregate usage and fair-use reductions require
account/IP counters; enterprise offline-IP reporting requires a health inventory.
These are logical roles, not claims about processes, databases, cloud providers,
or network topology.

**UNKNOWN:** ingress regions/anycast, routing algorithm, health-check frequency,
exit substitution, capacity isolation, internal DNS/cache, NAT behavior,
connection logging, packet filtering, DDoS controls, and whether a “random” route
is weighted by load, health, geography, subnet, or reputation.

## 9. Owned-crawler implications and verdict ledger

| Verdict | Pattern | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPT** | Explicit rotating versus static exit mode | Make identity stability intentional and task/origin bound; never rotate to evade target policy. |
| **ADOPT** | Replaceable route handle separate from current exit IP | Supports maintenance without changing config; always record observed exit and mapping time. |
| **ADOPT** | Provider offline-IP and usage reconciliation plane | Keep it asynchronous and advisory; Curiosity's own request ledger remains authoritative. |
| **ADOPT** | Hard concurrency degradation thresholds | Model fair use as a state transition and backpressure before `429`. |
| **ADAPT** | Country-constrained pools | Record requested, provider-assigned, and independently observed geo separately. |
| **ADAPT** | Shared pay-per-GB rotation | Candidate low-cost route for low/medium-difficulty public pages; cap bytes and account for co-tenant reputation variance. |
| **ADAPT** | Dedicated static exits | Useful for stable identity, target allowlisting, and attributable health; rotate/reassign only through audited operations. |
| **ADAPT** | Basic auth and IP allowlisting | Prefer verified HTTPS proxy transport and scoped credentials; allowlisting is supplemental, not identity on elastic shared egress. |
| **REJECT** | `rejectUnauthorized: false` / trust-all TLS | Preserve proxy and target certificate/hostname verification. |
| **REJECT** | Raw proxy controls exposed to agents | Prevent credential disclosure, SSRF, unsafe ports/protocols, and ungoverned rotation. |
| **REJECT** | “99.9% success” as retrieval or evidence quality | Independently classify transport, origin response, block page, extraction, and provenance. |
| **REJECT** | Provider/KYC/restricted-target pass as permission | Curiosity owns purpose, terms, robots, privacy, IP, and sensitive-data policy. |
| **REJECT** | Datacenter exit as anonymity guarantee | Dedicated IPs concentrate attribution; provider/account telemetry and target logs still exist. |
| **DEFER** | Production Oxylabs adapter | Requires DC-specific privacy terms, SLA/meter resolution, secure transport, and controlled test evidence. |
| **DEFER** | SOCKS5/UDP | No ordinary owned-crawler need; larger egress and observability surface. |
| **DEFER** | Enterprise direct-IP/rotator APIs | Consider only if fixed identity, offline-IP telemetry, and SoW guarantees justify separate complexity. |

### Provider-neutral acquisition envelope

**RECOMMENDATION (high):** retain at least:

```text
request_id, crawl_task_id, provider, adapter_version, policy_decision_id
requested_url, normalized_url, final_url, redirect_chain
requested_at, connected_at?, first_byte_at?, completed_at
proxy_transport=http|https|socks5, route_mode=rotating|static
provider_instance, opaque_route_handle, requested_exit_country?
provider_assigned_country?, observed_exit_ip?, observed_exit_geo[]?
transport_outcome, proxy_status?, origin_status?, validation_outcome
attempt_index, total_attempt_budget, per_origin_budget
response_media_type, encoded_bytes, decoded_bytes, sha256, artifact_reference
origin_date?, etag?, last_modified?, age?, freshness_status
robots_policy_id, target_rate_policy_id, retention_class, cost_units?
provenance_completeness, untrusted_external_data=true
```

Question marks are first-class unavailable values. Do not log provider
credentials, raw proxy URLs, cookies, or sensitive query strings. Provider
traffic totals are billing reconciliation, not per-document provenance.

## 10. Unknowns and pre-adoption checks

1. Obtain the exact self-service or enterprise agreement/SoW and resolve the
   marketing/pricing/fair-use contradictions, SLA, credits, support, termination,
   refunds, replacement, price-change terms, and document precedence.
2. Obtain a Datacenter Proxy DPA/security addendum covering traffic visibility,
   logs/payloads/DNS, retention, deletion, regions, subprocessors, government
   requests, incident timing, secondary use, and audit evidence.
3. Confirm verified HTTPS proxy transport, certificate chain/rotation, target TLS
   pass-through, credential rotation/scope, and absence of any requirement for
   trust-all behavior.
4. Obtain normative protocol/method/target-port, CONNECT, SOCKS UDP, DNS, size,
   timeout, streaming, compression, connection-reuse, and IPv4/IPv6 semantics.
5. Define rotation per new request versus connection; static-session lifetime and
   scope; failure/failover behavior; observed-exit evidence; and country no-match
   behavior.
6. Define metered bytes, concurrency counting/window, pay-per-traffic limits,
   billing-cycle reset, alerts/top-ups, and the Dashboard API rate-limit window.
7. Obtain typed separation of proxy, DNS/connect, and target errors; retry
   behavior below the visible request; and maintenance/health/status history.
8. Review the ISO certificate, SoA, applicable control scope, current pentest
   evidence, BCP/DR, and whether any SOC report covers DC proxies.
9. If legal/security/procurement gates pass, run only a separately authorized
   public sandbox test: exit/mapping stability, rotation distribution, geo
   evidence, TLS verification, redirect/DNS/SSRF controls, timeout/status
   ownership, byte reconciliation, concurrency backpressure, credential redaction,
   replacement behavior, and kill switches. No paid use or target bypass is
   authorized by this dossier.

## 11. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (**R**), decision
value (**V**), novelty (**N**), and reverse-scored cost (**Cheap**, 5 is cheapest).

| Thread | R | V | N | Cheap | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Does the public DPA cover DC proxy traffic? | 5 | 5 | 5 | 5 | **Pursued:** GC applicability language limits the standard DPA to SAPI/Web Unblocker/automated gathering, not DC; procurement blocker retained [S28][S31]. |
| Are unlimited-concurrency claims compatible with fair use? | 5 | 5 | 4 | 5 | **Pursued:** no; numeric policies reduce 100 sessions/IP to 10 after 50 GB shared or 100 GB dedicated [S22-S23]. |
| Can a self-service route handle be treated as an IP identity? | 5 | 5 | 4 | 5 | **Pursued:** no; plan changes/replacement can change the assigned IP without changing the port [S2][S11]. |
| Are uptime/success/latency claims contractual and defined? | 5 | 5 | 3 | 4 | **Pursued:** marketing values conflict and no public SLA/denominator/remedy was found; negative result retained. |
| Resolve exact pay-per-traffic affinity lifetime | 4 | 4 | 3 | 2 | **DEFER:** docs say only “duration of the session”; requires vendor clarification or authorized test. |
| Inspect OpenAPI implementation or SDKs for hidden behavior | 2 | 2 | 3 | 2 | **CURIOSITY_NO_GO:** public contract is the decision boundary; code/license inspection was not authorized. |
| Fingerprint exits, map subnets, or infer other customers | 1 | 1 | 4 | 1 | **CURIOSITY_NO_GO:** unnecessary, invasive, potentially contrary to terms, and outside clean-room scope. |
| Test blocked targets, rotate around rate limits, or measure bypass | 1 | 1 | 2 | 1 | **CURIOSITY_NO_GO:** caller forbade bypass/testing and Curiosity must not use rotation to evade policy. |
| Open the five-IP free plan | 3 | 3 | 2 | 1 | **CURIOSITY_NO_GO:** credentials/service access were explicitly prohibited; published free-plan bounds were sufficient [S24]. |
| Survey third-party benchmarks and reviews | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** lower evidentiary value than primary contracts/docs after saturation. |

**Stop reason:** coverage and saturation. Every requested category is covered;
remaining high-value questions require contractual disclosure, audit access, or a
separately authorized controlled test—not further speculative reverse
engineering.

## Sources

All sources are first-party Oxylabs materials accessed **2026-08-17**. They are
authoritative for the published interface or representation attributed to them,
not independent proof of implementation, quality, legality, or performance.

- **[S1]** Oxylabs, “Datacenter Proxies.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies.md>
- **[S2]** Oxylabs, “Datacenter Proxies — Proxy List.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/proxy-list.md>
- **[S3]** Oxylabs, “Datacenter Proxies — IP Control.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/ip-control.md>
- **[S4]** Oxylabs, “Datacenter Proxies — Select Country.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/select-country.md>
- **[S5]** Oxylabs, “Datacenter Proxies — Protocols.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/protocols.md>
- **[S6]** Oxylabs, “Datacenter Proxies — Whitelisting IPs.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/whitelisting.md>
- **[S7]** Oxylabs, “Datacenter Proxies — Response Codes” and “Restricted Targets.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/response-codes.md>, <https://developers.oxylabs.io/products/proxies/datacenter-proxies/restricted-targets.md>
- **[S8]** Oxylabs, “Quick Start: Proxies.” <https://developers.oxylabs.io/get-started/quick-start-proxies.md>
- **[S9]** Oxylabs, “Datacenter Proxies Pricing” and product comparison. <https://oxylabs.io/pricing/datacenter-proxies>, <https://oxylabs.io/products/datacenter-proxies>
- **[S10]** Oxylabs, “Shared Datacenter Proxies.” <https://oxylabs.io/products/datacenter-proxies/shared>
- **[S11]** Oxylabs, “Dedicated Datacenter Proxies — Self-Service Proxy List.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/proxy-list.md>
- **[S12]** Oxylabs, “Dedicated Datacenter Proxies — Making Requests” and “Proxy Rotation.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/making-requests.md>, <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/proxy-rotation.md>
- **[S13]** Oxylabs, “Dedicated Datacenter Proxies — Whitelisting IPs.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/whitelisting-ips.md>
- **[S14]** Oxylabs, “Dedicated Datacenter Proxies — Protocols.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/protocols.md>
- **[S15]** Oxylabs, “Dedicated Datacenter Proxies — Response Codes” and “Restricted Targets.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/response-codes.md>, <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/restricted-targets.md>
- **[S16]** Oxylabs, “Dedicated Datacenter Proxies — Enterprise.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise.md>
- **[S17]** Oxylabs, “Enterprise Dedicated Datacenter Proxies — Making Requests.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/making-requests.md>
- **[S18]** Oxylabs, “Enterprise Dedicated Datacenter Proxies — Proxy List.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/proxy-lists.md>
- **[S19]** Oxylabs, “Enterprise Dedicated Datacenter Proxies — Proxy Rotator.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/proxy-rotator-optional.md>
- **[S20]** Oxylabs, “Enterprise Dedicated Datacenter Proxies — Protocols.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/protocols.md>
- **[S21]** Oxylabs, “Enterprise Dedicated Datacenter Proxies — Response Codes.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/response-codes.md>
- **[S22]** Oxylabs, “Datacenter Proxies — Fair Usage Policy.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/fair-usage-policy.md>
- **[S23]** Oxylabs, “Dedicated Datacenter Proxies — Fair Usage Policy.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/self-service/fair-usage-policy.md>
- **[S24]** Oxylabs, “Free Datacenter IPs.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies/free-datacenter-ips.md>
- **[S25]** Oxylabs, “Buy Private Dedicated Proxies.” <https://oxylabs.io/products/datacenter-proxies/dedicated>
- **[S26]** Oxylabs, “Dashboard API.” <https://developers.oxylabs.io/dashboard/dashboard-api.md>
- **[S27]** Oxylabs, “Datacenter Proxy API” and “IP Replacement.” <https://developers.oxylabs.io/products/proxies/dedicated-datacenter-proxies/enterprise/datacenter-proxy-api.md>, <https://developers.oxylabs.io/products/proxies/ip-replacement.md>
- **[S28]** Oxylabs, “General Conditions of oxylabs, UAB Services Agreement,” updated 2024-12-12. <https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement>
- **[S29]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25. <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S30]** Oxylabs, “Know Your Customer Policy.” <https://oxylabs.io/kyc-and-safety>
- **[S31]** Oxylabs, “Data Processing Agreement,” updated 2022-12-01. <https://oxylabs.io/legal/oxylabs-data-processing-agreement>
- **[S32]** Oxylabs, “Privacy Policy,” updated 2024-10-14. <https://oxylabs.io/legal/privacy>
- **[S33]** Oxylabs, “Risk and Legal Compliance.” <https://oxylabs.io/risk-and-legal-compliance>
- **[S34]** Oxylabs Trust Center. <https://trust.oxylabs.io/>

## Confidence summary

- **High:** published endpoints, ports, credential grammar, protocol options,
  list/rotation/country behavior, response-code text, fair-use thresholds,
  dashboard fields, dated prices, AUP and contract language.
- **Medium:** control/data-plane reconstruction; shared reputation and dedicated
  attribution implications; transport-security analysis; vendor uptime, success,
  exclusivity, sourcing, KYC, and certification representations.
- **Low/unknown:** internal retries/failover and randomization; affinity lifetime;
  exact metering; SLA and performance; proxy traffic logging/retention/content
  visibility; DPA coverage under a negotiated SoW; subprocessors/regions; actual
  exit inventory, health, and geo accuracy.

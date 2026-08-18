# Whoogle Search: clean-room product and failure analysis

**Access date:** 2026-08-17  
**Inspected upstream:** `benbusby/whoogle-search` at archived `main` commit
`0543f86528678ab60a20b3049483975add6b6e40` (version 1.2.4) [S1]  
**Decision:** what Curiosity should learn from, reject from, or defer after
Whoogle as a privacy front end to Google Search.  
**Status:** research only. No source, fixture, dependency, image, or result data
was copied into Curiosity.

## Executive conclusion

**REJECT as a foundation or transition provider (high confidence).** Whoogle is
not an owned crawler, index, ranker, or true multi-engine metasearch system. Its
normal path asked one upstream—Google Search—for a JavaScript-free result page,
then rewrote that page. Its optional CSE path still asked Google and converted
Google JSON back into synthetic HTML before reusing the HTML filter. Google
controlled discovery, corpus, ranking, snippets, availability, and blocking in
both paths. The maintainer declared on 2026-07-24 that both paths were no longer
workable, ended maintenance, and archived the repository on 2026-08-14 [S1,
S2].

**ADAPT selected lessons, not code (high confidence):** minimize the browser's
direct contact with result-page third parties; remove tracking redirects;
separate user preferences from upstream request headers; expose an explicit
blocked state; make proxy/Tor routing opt-in; and treat upstream layouts as
versioned, adversarial inputs. Whoogle's terminal failure is especially useful:
an uncontracted HTML endpoint plus user-agent evasion is not a durable search
interface. Parser repair cannot restore an upstream that withholds the source
representation entirely.

**REJECT its crawler lessons where categories differ (high confidence).**
Whoogle did not crawl destination pages to build a corpus. Its fetching,
result-page filtering, anonymous-view proxy, and favicon/image proxy should not
be mistaken for frontier scheduling, robots compliance, immutable capture,
document identity, deduplication, indexing, or ranking.

## 1. Frame, bounded questions, and method

Questions in frame:

1. What upstream service and representations did Whoogle depend on?
2. How were queries, Google HTML/JSON, links, snippets, and failures transformed?
3. What privacy was gained, and which parties and attack surfaces remained?
4. How was it deployed, blocked, and ultimately broken?
5. What was its machine-facing output contract?
6. What license, access, and clean-room boundaries apply?
7. What should an owned Curiosity crawler/search plane learn or explicitly reject?

**Depth boundary:** static clean-room inspection of the archived official source,
official project notices/releases/issues, and relevant Google/Flask primary
documentation. No live Google queries, public-instance probing, CAPTCHA bypass,
traffic interception, code execution against a service, or reproduction of
Google's private ranking was attempted.

Labels:

- **FACT** — directly supported by cited source or inspected code.
- **INFERENCE** — reasoned consequence, not directly measured here.
- **RECOMMENDATION** — Curiosity design choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product identity and terminal status

**FACT (high):** despite its package description calling it a “metasearch
engine,” current code has two Google-only search providers: an HTML request to
`www.google.com/search`, or the Google Custom Search JSON API. DuckDuckGo-style
bangs redirect the browser to other sites; they do not aggregate engines. There
is no owned index or cross-engine merger [S3, S4, S5]. A precise description is
**single-upstream privacy proxy/search front end**.

**FACT (high):** the archived README says Whoogle no longer returns results,
Google killed the last working user agent for JavaScript-free search, CSE was no
longer a practical fallback, and no further fixes, releases, reviews, or support
would occur. GitHub marks the repository archived on 2026-08-14 [S1]. The final
release describes the preceding year as a user-agent cat-and-mouse game and the
remaining agents as temporary [S2].

**INFERENCE (high):** this is not merely an unmaintained-project risk. The
maintainer recorded loss of the product's required upstream representation.
Operating the archived code cannot be made dependable by conventional patching
or infrastructure hardening alone.

## 3. Reconstructed architecture

### 3.1 Search path

```text
browser/client
  -> Whoogle Flask/Waitress route
  -> session preferences + query preprocessing
  -> [normal] Google no-JS HTML request with fixed consent cookies
     OR [BYOK] Google Custom Search JSON API
  -> BeautifulSoup HTML transformation
  -> HTML page
     OR a second heuristic extraction into Whoogle JSON
```

The normal path in detail [S3–S7]:

1. The browser submits `q` by POST by default, or GET when configured.
2. POST is redirected to GET after Fernet-encrypting `q`; later internal search
   links similarly carry encrypted query text.
3. Query generation URL-quotes the text, adds Google parameters for result type,
   pagination, locality, language, country, safe search, and freshness, and
   appends configured `-site:` exclusions.
4. Whoogle chooses a generated/custom user agent and sends the plaintext query
   to Google's search endpoint. It supplies two fixed consent cookies, but not
   the browser's Google cookies.
5. The returned body is parsed as HTML and destructively filtered/relinked.
6. HTML clients receive the transformed document. JSON clients trigger another
   heuristic pass over that transformed HTML.

**FACT (high):** autocomplete is a separate request to Google's suggestion
service and therefore discloses partial queries to Google before a search. It is
disabled under Tor and can be disabled globally [S3].

### 3.2 CSE path

**FACT (high):** CSE used a caller/operator API key and search-engine ID, sent up
to ten web or image results to `www.googleapis.com/customsearch/v1`, then mapped
fields such as title, link, snippet, display link, totals, and timing into local
objects [S5]. Instead of maintaining a provider-neutral document model, it
rendered those objects into HTML shaped like Google's older result markup and
fed that HTML to the existing filter [S5, S6]. Videos and news were unsupported.

**INFERENCE (high):** the CSE adapter reduced immediate parser duplication but
made HTML an internal integration bus. Provider data was escaped, rendered,
parsed, rewritten, and then possibly parsed yet again for JSON. This loses type
information and couples ostensibly structured input to historical CSS selectors.

**FACT (high):** Google now says Custom Search JSON API is closed to new
customers and existing customers must transition by 2027-01-01 [S16]. That
independently corroborates provider lifecycle risk, although Whoogle's own July
notice says the fallback had already ceased to be practical.

## 4. Parsing and normalization

### 4.1 Structural and lexical dependencies

**FACT (high):** the filter depended on all of the following [S6–S9]:

- a top-level `div#main` for ordinary results;
- Google obfuscated class names and a small old-to-new class mapping;
- wrapper links containing `/url?q=` and Google internal `/search?q=` links;
- exact or translated words used to identify ads, AI Overviews, unsupported
  Google pages, and collapsible sections;
- hard-coded result/snippet classes for JSON extraction;
- for modern image search, card attributes plus a regular expression over
  serialized script data, with a legacy HTML parser as fallback.

The source itself says obfuscated class names can change at any moment and should
be a last resort [S8]. Structural cues reduced but did not remove this exposure.

**INFERENCE (high):** breakage is multi-dimensional. A Google change can preserve
HTTP 200 while altering the DOM, labels, wrapper URL, locale, image serialization,
or anti-bot interstitial. Outcomes include empty results, wrong title/snippet
boundaries, ads escaping filters, legitimate blocks being removed, and arbitrary
absolute links being misclassified as results.

### 4.2 What “normalization” actually did

**FACT (high):** Whoogle's result-page transformation:

- removed script tags from search results, Google headers, sign-in/preferences
  links, detected ads, detected AI Overview blocks, and selected rich sections;
- unwrapped Google redirect URLs, removed only the exact `ref_src` and `utm`
  query keys, rewrote Google pagination to local encrypted queries, and set
  `nofollow noopener noreferrer`;
- optionally blocked configured sites, title regexes, or URL regexes;
- optionally rewrote selected domains to privacy front ends;
- rewrote image/audio/CSS resources through an encrypted local proxy URL; and
- exact-deduplicated JSON results by final `href` [S6, S7, S9].

**Unknown:** removal of only `utm`, rather than the wider `utm_*` family, means
the source does not support a claim that all tracking parameters were removed.
No audited tracker taxonomy or correctness benchmark was found.

**FACT (high):** JSON extraction looked first for result containers with two
known classes, selected the first absolute HTTP link, tried an `h3`, one alternate
title class, and four snippet classes, then fell back to container text. If no
containers were found, every unique absolute link with text could become a
result [S7].

**INFERENCE (high):** this is display cleanup, not canonical document
normalization. There is no safe URI normalization ladder, redirect-terminal
identity, canonical relation, document/capture ID, content hash, near-duplicate
cluster, publisher identity, or stable passage anchor.

## 5. Privacy architecture—and its limits

### 5.1 What it usefully changed

**FACT (high):** in normal use Google saw the Whoogle egress rather than the
browser's personal IP, did not receive the browser's Google cookies, and did not
receive a referrer from result clicks because response headers set
`Referrer-Policy: no-referrer`. Search result scripts were removed, external
images/resources were proxied, a restrictive CSP was set by default, and browser
permissions for geolocation, microphone, and camera were disabled [S3, S6, S7].

**FACT (high):** outbound routing could be direct, through an operator-configured
HTTP/SOCKS proxy, or through local Tor. Under Tor, Whoogle checked the Tor Project
site, requested a new identity after a CAPTCHA, and retried at most ten times
[S3]. Query and element-path encryption was intended to keep plaintext out of
URLs/logs after initial submission [S6, S7].

### 5.2 Trust did not disappear; it moved

| Observer | What remains visible or controllable |
| --- | --- |
| Google | Plaintext query/autocomplete text, egress IP, chosen UA/headers, locale/country/safe-search parameters, timing, and aggregate behavior; all ranking/snippets/coverage. |
| Whoogle operator | Incoming user network metadata and plaintext POST body or GET query at request handling; configuration and service secrets; ability to alter returned content. Logging suppression is an operator deployment choice, not a protocol guarantee. |
| Reverse proxy/hosting platform | Depending on TLS termination and configuration, user IP, request path/body metadata, and service traffic. |
| Tor/proxy | Network linkage shifts to the chosen route; endpoint payload remains protected by TLS when verification is enabled. |
| Destination publisher | The user's IP and browser become visible on a normal result click; “anonymous view” instead makes Whoogle the fetcher but creates separate security/privacy risks below. |

**FACT (high):** “no IP tracking” in the historical README was conditional on a
remote deployment or Tor/proxy [S1]. A local direct deployment naturally sends
the user's household/server egress IP to Google.

**FACT (high):** the README says settings used “server side cookies,” but the
inspected application configures ordinary Flask sessions and no server-side
session extension. Flask's official documentation says its default session is a
signed, readable client-side cookie [S10, S17]. The cookie can therefore contain
session configuration even though it cannot be modified without the secret.
This is a documentation/implementation mismatch, not evidence that search
queries themselves were stored in the cookie.

**FACT (high):** POST query encryption protects the redirected URL, not the
browser-to-Whoogle request body, Whoogle process memory, or the plaintext
Whoogle-to-Google request. GET-only mode and the JSON examples place plaintext
queries in the incoming URL [S7]. Internal encryption uses one instance-wide
Fernet key in the current route despite a comment contemplating per-session
keys [S7].

### 5.3 Proxy and active-content limits

**FACT (high):** `/element` and optional `/window` accept a user-influenced URL,
validate only that the parsed hostname looks like a domain, and fetch it through
an HTTP client that follows redirects. The code shown has no private-address/DNS
rebinding check, redirect ceiling under application control, response-byte cap,
or MIME verification [S7, S11].

**INFERENCE (high):** exposing these routes to untrusted users creates SSRF and
denial-of-wallet/resource-exhaustion risk. Syntactic domain validation does not
prove the resolved address is public, and automatic redirects can cross trust
boundaries. This finding is static; no exploit was attempted.

**FACT (high):** anonymous view removes iframes; in `nojs` mode it removes
externally sourced scripts. Outside `nojs`, it proxies external scripts through
the Whoogle origin and does not explicitly remove all inline scripts [S7].

**INFERENCE (medium-high):** serving destination-controlled active code from the
Whoogle origin weakens origin isolation. CSP `script-src 'self'` can permit a
proxied script because its browser-visible URL is same-origin. Anonymous view is
therefore not a safe substitute for an isolated renderer or a text-only fetch.

### 5.4 Other operational privacy caveats

- **FACT (high):** basic authentication is optional and absent unless both
  environment variables are set [S7]. A public instance concentrates users
  behind one operator and egress identity.
- **FACT (high):** authenticated `/config` GET returns the entire in-memory
  configuration dictionary. That dictionary includes CSE API key and engine ID;
  because `auth_required` deliberately permits access when instance credentials
  are unset, a publicly reachable BYOK instance without basic auth can disclose
  those values to any visitor [S7, S10]. This is a static source finding; no
  instance was tested.
- **FACT (high):** optional fallback-engine redirects append the query to another
  engine URL, deliberately transferring the query to that provider [S1, S7].
- **FACT (high):** the global response hook assigns `Cache-Control:
  max-age=86400` to every response, including search/config/error responses; it
  does not add `private`, `no-store`, or a cookie-dependent `Vary` there [S7].
  **INFERENCE (medium):** this can encourage intermediary/browser retention of
  sensitive responses and requires effective-header verification; Flask may add
  its own cookie-related `Vary`, and actual exposure depends on the reverse proxy
  and cache policy.
- **FACT (high):** certificate verification can be disabled by environment
  configuration, and an explicit insecure fallback can be enabled [S11].
- **INFERENCE (high):** rotating artificial user agents reduces direct browser
  fingerprint linkage but creates a recognizable service fingerprint and does
  not provide anonymity by itself.

## 6. Rate limiting, blocking, and breakage modes

### 6.1 Runtime behavior

**FACT (high):** the HTTP wrapper uses a 15-second timeout, follows redirects,
and retries exceptions twice with exponential delays. It does not generally
retry or back off on upstream HTTP 403/429/5xx status codes [S11]. Non-Tor
CAPTCHA handling occurs later and recognizes one literal marker. A detected
CAPTCHA returns Whoogle HTTP 503 with a localized error, or redirects to a
configured fallback engine. Under Tor only, a separate literal marker triggers
identity rotation up to ten attempts [S3, S7].

**INFERENCE (high):** Whoogle had no service-side per-user or aggregate query
rate limiter, upstream quota scheduler, circuit breaker, `Retry-After` model, or
shared-host fairness policy in inspected code. Public-instance traffic therefore
collapsed onto a shared Google-visible IP and could cause one user's activity to
degrade everyone.

### 6.2 Recorded chronology

1. **Long-running IP/CAPTCHA sensitivity.** Project issue reports and maintainer
   comments from 2020 onward identify VPN, Tor exit, hosting range, request shape,
   and shared-IP behavior as likely block factors; a Google CAPTCHA could not be
   solved through the different Whoogle hostname [S13]. Reports are operational
   observations, not controlled causal experiments.
2. **January 2025 representation loss.** Issue 1211 records Google replacing the
   long-used JavaScript-free result path with JavaScript/redirect or block pages.
   The maintainer said the whole backend assumed no-JS HTML and warned that
   user-agent-dependent markup could let ads or other content escape filtering
   [S14].
3. **Stopgaps.** The project cycled working user agents, introduced generation,
   added custom lists/testing, adjusted image handling, and added CSE BYOK. The
   final release retained only legacy Opera/HTC patterns and described them as
   lasting only while Google permitted [S2, S12].
4. **Terminal failure.** On 2026-07-24 the maintainer stated the last working UA
   and CSE fallback were gone and ended the project [S1].

### 6.3 Failure taxonomy

| Failure | Observable Whoogle effect | Root control |
| --- | --- | --- |
| IP/reputation/rate block | CAPTCHA, 403/429, empty/error page, HTTP 503 only if marker recognized | Google and egress reputation |
| JavaScript requirement | no result representation to parse | Google |
| UA invalidation | working pool decays; cached stale UAs persist | Google plus local cache lifecycle |
| DOM/class/locale drift | missing/misclassified results, ads, snippets, navigation | Google markup |
| Image serialization drift | empty images or partial extraction; no modern pagination | Google markup |
| CSE quota/lifecycle | 100/day free quota, API error, new-customer closure, 2027 shutdown | Google account/API policy [S16] |
| Parser exception | generic HTML 500 or optional redirect; traceback to stderr | Whoogle/operator |
| Shared public egress | one user's volume can block the instance | deployment architecture |

**RECOMMENDATION (high):** Curiosity must model `blocked`, `upstream_changed`,
`quota_exhausted`, `partial_parse`, and `no_results` as distinct states. Empty
hits are not evidence that the web has no results.

## 7. Deployment and operating envelope

**FACT (high):** historical deployment options included pip/pipx, source plus
Waitress, Docker/Compose, a Helm chart, and several hosted platforms. The
official Docker image targeted amd64 and arm64, included Tor, ran the app as an
unprivileged `whoogle` user, and exposed port 5000 [S1, S18]. Compose added a
256 MiB memory limit, 50-process limit, dropped capabilities, `no-new-privileges`,
and tmpfs state [S18].

**FACT (high):** the application has a liveness endpoint that returns an empty
success and does not test Google search, parsing, CSE quota, Tor, or result
quality. The Helm defaults had no resource requests/limits, ingress disabled,
and `runAsUser: 0`; probes hit the home page. Configuration—including possible
credentials—was rendered as environment values rather than Kubernetes Secret
references [S18].

**INFERENCE (high):** process liveness could remain green throughout total
search failure. A useful search health check must use safe synthetic fixtures or
controlled canaries and separately report transport, source-shape, parser,
freshness, and quality health.

**FACT (high):** persistent state includes a Flask secret, UA cache, default
config, bangs, and a session directory. The current app also performs a daily
release check unless disabled [S10]. Destruction/redeployment can change keys,
cached UAs, egress IP, and behavior.

**RECOMMENDATION (high):** do not deploy Whoogle for Curiosity. If retained only
as an offline study artifact, pin the commit, do not install or ship its
dependencies, do not call Google, and do not expose its proxy routes.

## 8. Output contract

### 8.1 Actual JSON surface at archived HEAD

**FACT (high):** JSON is requested with `format=json` or an appropriate Accept
header. Success returns:

- top level: `query`, `search_type`, `results`;
- each result: `href`, `text`, `title`, `content` [S7].

URLs are exact-deduplicated. There is no declared schema or schema version; no
maximum result count at the Whoogle boundary; and no fields for provider,
upstream rank, score, language, publication/fetch time, document/capture ID,
passage, hash, canonical relation, license, trust, or parse confidence.

**FACT (high):** the README's sample shows only `href` and `text`, while source
and tests require the additional `title` and `content` fields [S1, S19]. That is
contract drift even in the final snapshot.

Special shapes are inconsistent [S7]:

- “feeling lucky”: HTTP 303 with `redirect`;
- recognized CAPTCHA: HTTP 503 with `blocked`, `error_message`, and `query`;
- CSE error: `error`, `error_message`, and `query` with upstream-derived status;
- configured fallback: HTTP redirect rather than a search response;
- generic exception: HTML 500 even for a JSON-preferring caller.

**INFERENCE (high):** this is unsuitable as Curiosity's provider-neutral ABI.
It cannot distinguish no hits from parse failure, preserve evidence lineage, or
anchor citations. The result text remains untrusted Google/publisher-derived
content but carries no trust marker.

### 8.2 Contract lessons for Curiosity

**ADAPT:** content negotiation, explicit blocked status, stable bounded result
objects, and a human-readable HTML adapter can coexist.  
**REJECT:** deriving machine JSON from presentation HTML, silent fallback to all
absolute links, mixed redirect/error/success shapes, and undocumented field
growth.  
**ADOPT:** one versioned domain response first; HTML, HTTP, OpenCode, and MCP are
adapters over it. Include provenance, capture/passage identity, partial-failure
reasons, coverage warnings, and `trust=untrusted-external-evidence`.

## 9. License, access, and clean-room boundary

This is an engineering risk assessment, not legal advice.

### 9.1 OSS license

**FACT (high):** Whoogle's repository code is MIT-licensed, copyright 2020 Ben
Busby; redistribution of copies or substantial portions must retain the
copyright and permission notice [S15]. MIT permits use and modification, but
does not make copied code wholly owned by Curiosity.

**FACT (high):** the package depends on numerous separately licensed Python and
system components, including Flask, Beautiful Soup, httpx, cryptography,
cssutils, Stem/Tor, and Waitress [S4, S18]. The repository's MIT file does not
relicense those dependencies, Google result content, Google marks, public
instance data, or destination-page content.

**RECOMMENDATION (high):** under Curiosity's strict owned-core decision, do not
copy, translate, vendor, install, or derive fixtures from Whoogle source. Learn
behavioral categories from this report and independently specify tests. If a
future decision permits MIT components, complete exact-version dependency,
notice, trademark, and supply-chain review first.

### 9.2 Access and upstream content

**FACT (high):** Google's current US terms prohibit bypassing protective
measures, hiding identity to violate the terms, and automated content access in
violation of machine-readable instructions; they also reserve suspension for
harmful conduct including scraping content that does not belong to the user
[S20]. The current terms became effective 2026-07-30, after Whoogle's end notice.

**INFERENCE (high):** UA rotation expressly developed to continue receiving a
representation Google was blocking presents access/contract risk independent of
Whoogle's MIT copyright license. This report does not adjudicate past legality.

**RECOMMENDATION (high):** Curiosity must not seed a corpus from Whoogle/Google
results, reproduce UA-evasion behavior, bypass CAPTCHA/JS gates, or treat search
snippets as licensed source text. Crawl only under an approved publisher and
robots/policy regime, preserving source rights and takedown metadata.

### 9.3 Clean-room controls

1. Keep this behavior-level report available to designers; keep Whoogle source
   out of implementation workspaces and generated prompts.
2. Specify neutral requirements without Whoogle naming, class strings, marker
   lists, selector logic, or code structure.
3. Use project-authored/permissioned HTML fixtures and normative web standards.
4. Record independent authorship and test provenance.
5. Do not probe Google or public Whoogle instances to infer hidden controls.
6. Re-review trademarks and notices before using the Whoogle name or screenshots.

## 10. What an owned crawler/search plane should reject and learn

| Whoogle observation | Verdict | Curiosity implication |
| --- | --- | --- |
| Google HTML as sole discovery source | **REJECTED** | Own frontier, captures, corpus, index, and ranking. |
| User-agent hopping to preserve access | **REJECTED** | Identify the crawler; obey policy; back off and stop on blocks. |
| CAPTCHA/Tor identity rotation | **REJECTED** | Never interpret denial as a puzzle to evade. Record policy block. |
| Search snippets as result content | **REJECTED** for evidence | Generate snippets from stored, versioned passages. |
| HTML as internal adapter bus | **REJECTED** | Maintain typed provider-neutral document/search records. |
| Exact-URL dedupe | **ADAPTED as first layer only** | Add standards-safe normalization, capture hashes, canonical candidates, near-duplicate and syndication clusters. |
| Remove tracking redirects/parameters | **ADAPTED** | Preserve original and normalized URLs plus reversible reason codes. |
| Proxy third-party resources by default | **REJECTED** | Return inert evidence; fetch destination content only in isolated crawl lanes. |
| Explicit CAPTCHA HTTP 503 | **ADAPTED** | Use typed blocked/quota/upstream-shape failures, not one literal marker. |
| Small configurable Flask app | **LEARN** | Small boundaries help auditability, but cannot compensate for an uncontrolled substrate. |
| Tor/proxy option | **DEFERRED** | Egress policy is operational configuration; it is not crawler permission or privacy proof. |
| Domain/title block filters | **ADAPTED** | Policy filters need typed reasons, auditability, and appeal/takedown workflows. |
| HTML script stripping/CSP | **ADAPTED** | Serve no active upstream HTML to agents; treat all extracted text as untrusted. |
| Health endpoint independent of search | **REJECTED** | Separate process health from capture/parser/index/query/evidence health. |

## 11. Curiosity-specific implications

Whoogle protected a person from some direct browser-to-Google tracking, but its
search knowledge remained entirely upstream-defined. For Curiosity, that has
four consequences:

1. **Novelty cannot be inferred from top-ten upstream results.** Whoogle exposed
   neither corpus coverage nor branch overlap. An owned system should return
   source/owner clusters, first/last-seen time, and coverage warnings.
2. **Contradiction requires stable evidence.** A parsed snippet cannot support a
   durable contradiction record. Return capture and passage IDs with hashes and
   extractor version.
3. **Blocked is epistemic state.** A JS wall, parser drift, or shared-IP block
   must stop the branch or trigger an authorized alternative corpus—not become
   “no evidence found.”
4. **Privacy and authority are separate.** Hiding the caller IP does not authorize
   access, validate content, or allow result text to initiate more tools.

**RECOMMENDATION (high):** preserve Curiosity's caller-declared frame, hard query
and result bounds, researcher-only authority, untrusted-evidence labels, and one
scored post-synthesis pass. Search should report branch coverage and failure; it
must not autonomously switch providers, rotate identities, or continue after a
policy block.

## 12. Verification, confidence, and unknowns

### 12.1 Verification performed

- Cloned the public official repository into approved temporary storage, checked
  out archived HEAD, and recorded commit, version, tree, tags, and recent log.
- Inspected request, provider, CSE, query, filter, result, route, configuration,
  session, deployment, dependency, license, and relevant test files.
- Cross-checked terminal status against the final official release and GitHub's
  archive banner [S1, S2].
- Cross-checked CSE lifecycle against Google's official API page [S16].
- Cross-checked Flask session semantics against official Flask 3.1 documentation
  [S17].
- Attempted the upstream unit suite without installing dependencies; it did not
  run because `pytest` was absent. No dependencies were installed. This is a
  retained negative verification result, not a test failure in Whoogle.

### 12.2 Material unknowns

- **Unknown:** exact date/mechanism by which CSE became impractical specifically
  for Whoogle beyond the maintainer's statement. Google's general closure notice
  corroborates lifecycle risk but not that product-specific mechanism.
- **Unknown:** empirical false-positive/false-negative rates for ad, AI Overview,
  title/snippet, CAPTCHA, or image extraction. No maintained benchmark was found.
- **Unknown:** actual public-instance logs, retention, TLS termination, or
  operator behavior. Source defaults cannot prove operator privacy.
- **Unknown:** whether every archived dependency's obligations and CVEs were
  satisfied in every distributed image; no SBOM/license audit was performed.
- **Unknown:** exploitability of the statically identified proxy/origin risks in
  a particular hardened deployment; no active security test was authorized.
- **Unknown:** historical Google terms applicable to each past release. Current
  terms are cited only for present clean-room/access posture.

## 13. Verdict ledger

| Item | Verdict | Confidence |
| --- | --- | --- |
| Whoogle as Curiosity search provider | **REJECTED** | High: terminally nonfunctional and archived. |
| Whoogle as owned-search foundation | **REJECTED** | High: no owned crawl/index/rank and total Google dependence. |
| Whoogle source/dependencies in owned core | **REJECTED** | High under current strict ownership; MIT does not mean project-owned. |
| Result-page UA/CAPTCHA evasion | **REJECTED** | High: fragile and access-policy risk. |
| Privacy-proxy UI concepts | **ADAPTED** | Medium-high: useful only with explicit trust/egress limits. |
| Tracking-link cleanup and inert output | **ADAPTED** | High: preserve reversibility and provenance. |
| Typed blocked/partial-failure states | **ADOPTED concept** | High, but make broader and provider-neutral. |
| Anonymous active-page proxy | **REJECTED** | High: wrong trust boundary for agents and unsafe origin/fetch surface. |
| Tor as crawler strategy | **REJECTED** | High: anonymity route is not permission and worsens blocking. |
| Whoogle as offline comparative oracle | **DEFERRED** | Low value after terminal upstream loss; authorized fixtures would still be required. |

## 14. Bounded curiosity pass

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify whether terminal notice is stronger than the April release | 5 | 5 | 4 | 1 | **Pursued:** July README says both no-JS and CSE paths are gone; repo archived August [S1]. |
| Verify CSE lifecycle independently | 5 | 5 | 3 | 1 | **Pursued:** official Google page confirms closure to new customers and 2027 shutdown [S16]. |
| Resolve README “server-side cookies” claim | 4 | 4 | 4 | 1 | **Pursued:** source uses default Flask sessions; official Flask docs say signed client-side cookie [S10, S17]. |
| Live-query Google with archived UAs | 4 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: access/evasion risk, no decision value, maintainer already records terminal failure. |
| Probe public Whoogle proxy routes | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: would target third-party systems; static finding is sufficient for design rejection. |
| Reproduce Google DOM variants from historical traffic | 3 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: no authorized corpus; selectors are not a target design. |
| Full transitive license/CVE audit | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: no adoption is proposed; mandatory only if that verdict changes. |
| Determine historical legality release by release | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: requires counsel and historical terms; not needed for current clean-room rejection. |

**Stop:** requested categories are covered; the highest-value contradictions were
resolved; additional issue reports repeated IP, UA, CAPTCHA, DOM, and shared
egress failure classes. Coverage and saturation reached.

## 15. Sources

All accessed 2026-08-17. Commit-pinned source links are primary implementation
evidence; line ranges refer to the inspected archived snapshot.

1. **[S1] Whoogle README and archived repository, commit `0543f865...`.**
   https://github.com/benbusby/whoogle-search/tree/0543f86528678ab60a20b3049483975add6b6e40 — terminal notice (`README.md:1-20`),
   historical features/deployment (`:72-116,195-258,366-560,628-654`), and
   archived status.
2. **[S2] Whoogle final release, v1.2.4.**
   https://github.com/benbusby/whoogle-search/releases/tag/v1.2.4 — maintainer
   account of no-JS blocking, temporary UA pool, and end of maintenance.
3. **[S3] `app/request.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/request.py — Google endpoints,
   query parameters, UA/proxy/Tor selection, headers/cookies, requests and retry
   behavior (`:14-19,71-205,218-277,282-321,323-443`).
4. **[S4] Packaging and requirements, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/setup.cfg and
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/requirements.txt — package identity and dependencies.
5. **[S5] `app/services/cse_client.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/services/cse_client.py — CSE
   request/response model, ten-result limit, errors, and conversion back to HTML.
6. **[S6] `app/filter.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/filter.py — destructive HTML filtering,
   URL/resource rewrites, CSS/classes, site alternatives, and image parsing.
7. **[S7] `app/routes.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/routes.py — auth/session hooks,
   headers, search and JSON shapes, CAPTCHA handling, proxy routes, and server.
8. **[S8] `app/models/g_classes.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/models/g_classes.py — explicit warning
   and mapping for volatile Google CSS classes.
9. **[S9] `app/utils/results.py` and `app/utils/search.py`, commit-pinned.**
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/utils/results.py and
   https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/utils/search.py — ad terms, tracking-key
   removal, alternative links, query decryption and scrape/CSE orchestration.
10. **[S10] `app/__init__.py`, config and session, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/__init__.py,
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/models/config.py, and
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/utils/session.py — keys, cookie/session
    configuration, CSP, preferences, and mutable settings.
11. **[S11] `app/services/http_client.py`, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/services/http_client.py — timeout,
    redirects, retries, proxy handling, cache, and TLS controls.
12. **[S12] UA generator and tester, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/app/utils/ua_generator.py and
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/misc/check_google_user_agents.py — UA pool,
    block markers, test strategy, and 429 stop behavior.
13. **[S13] Whoogle issue 42, unusual traffic.**
    https://github.com/benbusby/whoogle-search/issues/42 — maintainer and user
    observations on IP reputation, VPN/Tor/public hosting and CAPTCHA limits.
14. **[S14] Whoogle issue 1211, Google no longer supports JavaScript-free search.**
    https://github.com/benbusby/whoogle-search/issues/1211 — initial 2025 break,
    maintainer architecture explanation, UA workaround and filter-drift warning.
15. **[S15] Whoogle MIT license, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/LICENSE
16. **[S16] Google, Custom Search JSON API overview.**
    https://developers.google.com/custom-search/v1/overview — official closure,
    2027 discontinuation, result types, key requirement, quota and pricing.
17. **[S17] Flask 3.1 Quickstart, Sessions.**
    https://flask.palletsprojects.com/en/stable/quickstart/#sessions — official
    default signed, readable, client-side cookie semantics.
18. **[S18] Whoogle deployment files, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/Dockerfile,
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/docker-compose.yml, and
    https://github.com/benbusby/whoogle-search/tree/0543f86528678ab60a20b3049483975add6b6e40/charts/whoogle — image,
    container and Helm operating defaults.
19. **[S19] Whoogle JSON tests, commit-pinned.**
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/test/test_json.py and
    https://github.com/benbusby/whoogle-search/blob/0543f86528678ab60a20b3049483975add6b6e40/test/test_routes_json.py — expected
    result fields and CAPTCHA JSON behavior.
20. **[S20] Google Terms of Service, US, effective 2026-07-30.**
    https://policies.google.com/terms — current access, automated means,
    protective-measure, identity, content-rights and suspension terms.

### Negative results retained

- No evidence was found that Whoogle ever owned a web corpus, crawler frontier,
  index, ranking model, or multi-engine result merge.
- No stable upstream Google HTML contract, SLA, quota, or permission grant for
  the scrape path was found.
- No independent relevance, freshness, completeness, privacy, or parser-quality
  benchmark was found; historical feature claims are not comparative evidence.
- No schema/version specification for the JSON API was found.
- No response-byte cap, private-network egress guard, or application-level
  redirect policy was found for proxy fetches in inspected source.
- No redaction layer was found on `/config` GET; CSE credentials are members of
  the returned configuration object.
- No evidence was found that Tor or UA rotation reliably prevented blocks; the
  terminal notice says the opposite.
- No live verification was performed, and the local unit suite could not start
  without installing the absent `pytest` dependency.

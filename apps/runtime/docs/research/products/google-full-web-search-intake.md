# Google contact-only full-web search intake

**Research date / primary-source access date:** 2026-08-17  
**Decision frame:** whether Google's publicly referenced, contact-only “full web
search solution” is a sufficiently defined standalone product/program surface
to consider for Curiosity, and what can be learned without contacting Google,
submitting data, using credentials, testing results, or inferring private
capabilities.  
**Status:** clean-room public-document research, not procurement, legal advice,
an access attempt, or an implementation. No form was submitted.

## Executive verdict

**Publicly verified surface, privately undefined product (high confidence).**
Google publicly says a full-web solution is “available” for partners requiring
its “entire index,” directs use cases above 50 domains and retiring Custom Search
JSON API users to an interest form, and describes the form as seeking partners
interested in the future of **web search syndication** [S1-S3]. This establishes
a real Google-controlled intake/program surface. It does **not** establish
general availability, acceptance, an API, a product name, a launch date, a
service entity, or a public technical or commercial contract.

**DEFER as a candidate; REJECT as Curiosity's architectural foundation (high
confidence).** The public record contains no schema, authentication model,
result contract, quotas, price, SLA, support commitment, provenance, safety
controls, privacy/retention terms for search traffic, result-use rights, index
coverage guarantee, portability mechanism, or deprecation policy. The form says
replies are on a best-effort basis [S3]. Curiosity therefore cannot plan a
migration, capacity model, privacy review, or evidence contract around this
surface. Any later evaluation requires separately authorized procurement/legal
work and the complete written offer.

**Core clean-room lesson:** a vendor statement that a solution uses its “entire
index” proves neither the extent of the web covered nor customer ownership of
the corpus. Treat the provider index, serving interface, terms, and lifecycle as
four separately replaceable dependencies. No Google result, suggestion, private
document, or inferred ranking behavior should seed Curiosity.

## 1. Bounded questions, labels, and method

### 1.1 Questions

1. What exactly has Google publicly announced, and under what name?
2. Who is publicly invited to contact Google, what does the form request, and
   what outcome is promised?
3. Which product boundaries follow directly from official wording, and which
   capabilities remain unknown?
4. Is this a documented replacement for Programmable Search Engine (PSE),
   Custom Search JSON API, Vertex AI Search, or Gemini grounding?
5. What lifecycle, lock-in, privacy, terms, and evidence risks are decision
   relevant?
6. What may Curiosity adopt, adapt, reject, or defer clean-room?

### 1.2 Evidence rules

- **FACT** — stated or directly observable in a cited Google public source.
- **INFERENCE** — a bounded conclusion from facts; not a hidden-product claim.
- **RECOMMENDATION** — a Curiosity decision or diligence requirement.
- **UNKNOWN** — not established by the reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

Primary evidence was limited to the official announcement, current Custom
Search overview, live interest form, and public Google privacy/terms catalogs.
The form was read only. There was no sign-in, submission, correspondence,
credential use, billing, live query, endpoint discovery, traffic inspection, or
reverse engineering. Vendor statements establish positioning, not measured
quality or contractual entitlement.

## 2. Public identity and current status

### 2.1 What Google calls it

**FACT (high):** the 2026-01-20 PSE announcement uses the generic phrase **“our
full web search solution”**. It says the solution is “available for those
requiring our entire index” and links an interest form [S1]. The current Custom
Search JSON API overview similarly says to contact Google “to express your
interest in and get more information about our full web search solution” [S2].

**FACT (high):** the linked Google Form is titled **“Web Search Products
Interest Form.”** Its introduction says Google wants to hear from partners
interested in “the future of web search syndication” and invites them to help
Google “shape this space” [S3].

**INFERENCE (high):** the most accurate public identity is therefore a
**contact-only full-web-search syndication intake**, not a named generally
available API. “Solution” is Google's announcement term; “syndication” is the
form's program framing. Neither term reveals the delivery interface.

**UNKNOWN:** public brand/product name, SKU, legal service name, GA/preview
stage, launch date, contracting entity, product organization, and whether every
accepted participant receives the same service.

### 2.2 Availability language is qualified by the intake

**FACT (high):** the announcement says the solution “is available,” but access
is not self-service: the linked action is to **register interest**, obtain more
information about capabilities and pricing, and await a response [S1-S3]. The
form explicitly says replies are **“on a best effort basis”** [S3].

**INFERENCE (high):** “available” cannot safely be read as generally available,
orderable, or guaranteed. The observable offer is an intake and possible
follow-up. It is not a public acceptance commitment, trial entitlement, SLA, or
migration reservation.

**CONTRADICTION / tension retained:** “available” in the announcement sits beside
future-shaping and best-effort language in the form. These can coexist if the
solution is selective, evolving, or individually contracted, but the public
record does not resolve which. Do not promote either possibility to fact.

### 2.3 What it is not publicly shown to be

The announcement separates three categories [S1]:

| Need | Google public path | Established distinction |
| --- | --- | --- |
| Site-specific search, up to 50 domains | PSE Search Element | Free, focused website-search path; not full-web intake. |
| AI conversational search / enterprise grounding | Vertex AI Search | Separately named enterprise-grade path. |
| Beyond a designated subset / entire Google index | Full-web solution interest form | Contact-only path studied here. |

**FACT (high):** for retiring Custom Search JSON API users, Google names Vertex
AI Search as an alternative for up to 50 domains and the contact path when the
use case requires full-web search [S1, S2].

**INFERENCE (high):** the full-web intake is not documented as Vertex AI Search,
Gemini Grounding with Google Search, PSE Search Element, or a continuation of the
Custom Search JSON API. Shared Google infrastructure or private integration is
possible but **UNKNOWN** and immaterial to the present decision.

**RECOMMENDATION (high):** do not transfer schemas, quotas, terms, security
claims, privacy assurances, pricing, or output-use permissions from any adjacent
Google product. A replacement relationship is not contract equivalence.

## 3. Eligibility and contact process

### 3.1 Publicly stated use-case fit

**FACT (high):** Google directs these cases to the form [S1, S2]:

- partners needing to query beyond a designated subset of domains;
- Search Element use cases querying more than 50 domains or configured for
  “Search the entire web”;
- Custom Search JSON API users whose use case needs full-web search; and
- more generally, those requiring Google's “entire index.”

**FACT (high):** the announcement calls the audience “partners” and “developer
partners.” It does not publish geography, organization type, minimum volume,
revenue, existing-customer, account, or compliance prerequisites [S1].

**INFERENCE (high):** use-case fit is a reason to express interest, not an
eligibility rule or approval criterion. The wording does not establish that
individual consumers are accepted, but it also does not publish a formal
enterprise-only threshold.

### 3.2 Form data and sequence

The publicly readable form requests [S3]:

| Field | Required in the rendered form | Decision significance |
| --- | --- | --- |
| Name or company name | Yes | Identifies the prospect. |
| Email address | Yes | Enables follow-up. |
| Engine ID (CXID) or AdSense ID | No | Accommodates legacy PSE/ads identity, but does not make either a prerequisite. |
| Website | No | Gives deployment/business context. |
| Estimated daily search queries | No | Supplies a capacity/commercial signal. No units or range taxonomy is prescribed. |
| Most important web-search features | Yes | Collects requirements/feedback; no feature checklist or commitment is offered. |

**FACT (high):** the form can be viewed without signing in. It offers Google
sign-in to save progress, labels only the fields above as required/optional, and
provides no published selection rubric, response time, review stages, NDA step,
trial path, or escalation channel. It warns never to submit passwords [S3].

**FACT (high):** the only promised process is best-effort reply. The announcement
says the form registers interest and is how to obtain capabilities and pricing
information [S1-S3].

**UNKNOWN:** whether Google acknowledges every submission; decision time;
approval authority; waitlist; account, credit, volume, jurisdiction, content, or
publisher requirements; existing-customer preference; contracting process;
proof of site ownership; and whether a proof of concept is offered.

**RECOMMENDATION (high):** no Curiosity team member should submit the form
without explicit caller authority, procurement ownership, privacy review, and a
minimal-data plan. Do not include credentials, confidential queries, user data,
traffic logs, unpublished architecture, or unsupported volume commitments.

## 4. Capability boundary: verified versus unknown

### 4.1 Narrow positive facts

1. **FACT (high):** Google positions the solution for full-web needs and says it
   can use Google's “entire index” [S1].
2. **FACT (high):** it is positioned for use beyond 50 domains and as a possible
   transition direction for whole-web Search Element and Custom Search JSON API
   use cases [S1, S2].
3. **FACT (high):** capabilities and pricing are information obtained after
   contact, not published on the intake surface [S1-S3].
4. **FACT (high):** “web search syndication” is the form's market/program frame
   [S3].

### 4.2 Safe interpretation of “entire index”

**INFERENCE (high):** “entire index” means the search corpus is provider-owned
and broader than a customer-designated domain set. It does **not** mean every
public page, an index export, unrestricted access to all indexed documents, raw
crawl data, Google.com parity, complete result depth, or permission to retain
results. An index is a selected and changing representation of the web.

**RECOMMENDATION (high):** requirements and evaluation must say “coverage of
declared corpus cells” rather than “the full web.” Any future Google offer must
define eligible document classes, geography/language, freshness, policy
exclusions, result depth, and measurable omission/failure states.

### 4.3 Material capability unknowns

No reviewed public source establishes:

- delivery as REST/RPC API, feed, widget, hosted page, batch export, or another
  syndication mechanism;
- raw ranked links/snippets versus answers, grounding, images, news, shopping,
  ads, promotions, or other verticals;
- request fields, query length, pagination/cursors, result depth, localization,
  language, freshness, domain, safety, or license filters;
- executed-query traces, relevance scores, rank reasons, deduplication, host
  crowding, personalization, or deterministic replay;
- crawl/index scope, update latency, canonicalization, robots/publisher-control
  handling, coverage guarantees, or Google.com parity;
- result schema, content/snippet rights, attribution, display rules, caching,
  retention, database construction, model training, or evaluation permissions;
- authentication, tenant isolation, regions, encryption, audit logs,
  certifications, subprocessors, data residency, DPA availability, or deletion;
- quotas, QPS/burst behavior, payload bounds, latency/error semantics, uptime,
  support, incident notice, abuse controls, or service credits;
- list/custom pricing, minimum spend, term, renewal, taxes, overage, or price
  protection; or
- roadmap, GA commitment, versioning, backward compatibility, deprecation
  notice, export, termination assistance, or post-termination handling.

**RECOMMENDATION (high):** all are diligence questions, not blanks to fill from
PSE, Custom Search, Google APIs, Vertex AI Search, Gemini, ordinary Google
Search, or industry convention.

## 5. Lifecycle and lock-in

### 5.1 Origin as a transition path

**FACT (high):** Google announced this intake while changing PSE: all new
engines became sites-only on 2026-01-20; existing whole-web Search Element users
could continue through 2027-01-01; and Custom Search JSON API customers were
directed to transition by that date [S1, S2].

**FACT (high):** neither the announcement nor form promises acceptance or a
full-web service start before 2027-01-01. The form promises only best-effort
replies [S1-S3].

**INFERENCE (high):** the intake is a migration lead, not a migration plan. The
retirement deadline creates urgency while the successor's public contract is
absent. Existing users must maintain an independent fallback rather than assume
form submission preserves service continuity.

### 5.2 Structural dependency

**INFERENCE (high):** if adopted as described, corpus coverage necessarily
depends on Google's changing index. Unless a private contract says otherwise,
customers cannot independently rebuild its contents, crawl schedule, canonical
state, policy removals, or ranking state. That creates corpus and ranker lock-in
even if a future wire API is simple.

**UNKNOWN:** whether customer configurations, logs, result sets, relevance data,
or contracts are exportable; whether multiple providers may be commingled; and
whether termination requires deletion or transition assistance.

**RECOMMENDATION (high):** before even a pilot, require:

1. a provider-neutral adapter and no Google fields in Curiosity's public ABI;
2. a second serving path and tested provider-removal drill;
3. independently acquired, rights-reviewed evidence captures rather than vendor
   snippets as durable records;
4. explicit exit rights, notice period, export/deletion terms, and transition
   support;
5. workload replay against an owned frozen evaluation set; and
6. cost/quality accounting that can compare providers without Google output as
   ground truth.

## 6. Privacy, terms, and rights

### 6.1 Intake privacy

**FACT (high):** the form is created inside `Google.com`, links Google's Privacy
Policy and Terms, and asks for identity/contact, optional legacy IDs/site/volume,
and product requirements [S3-S5]. Google's current Privacy Policy says Google
collects information users provide, device/request data, and activity; uses data
to provide, maintain, improve, develop, measure, communicate, and protect
services; retains different categories for different periods; and keeps a record
when a person contacts Google [S4].

**FACT (high):** the form itself publishes no intake-specific retention period,
deletion mechanism, access roster, geographic storage promise, purpose limit,
confidentiality promise, or response SLA [S3].

**INFERENCE (high):** even an interest submission is a data disclosure, not a
neutral lookup. Estimated volume and feature priorities may reveal business
plans. Generic privacy language does not establish enterprise confidentiality
or treatment under a future service DPA.

### 6.2 Service terms are not public

**FACT (high):** public PSE terms govern PSE, and Custom Search additional terms
expressly incorporate PSE and Google APIs terms for the **Custom Search JSON
API** [S6-S8]. None of those pages identifies the contact-only full-web solution
as its subject. Exact-name checks also found no “full web search solution” or
“web search syndication” entry in the reviewed Google Cloud service-specific
terms or Google's public service-specific list [S9, S10].

**INFERENCE (high):** adjacent public terms are useful warnings but cannot be
declared governing terms for an unnamed, potentially individually contracted
solution. Applying Google Cloud commitments, API caching rules, PSE automation
rules, or consumer Search rights by analogy would be legally and technically
unsound.

**UNKNOWN / legal review required:** governing agreement and entity; order-form
precedence; confidentiality; DPA/controller/processor roles; query/result use;
human review; advertising; attribution; third-party publisher rights;
indemnities/liability; audit; suspension; termination; and dispute terms.

### 6.3 Conservative Curiosity boundary

Until a written offer is reviewed:

- do not send personal, confidential, regulated, tenant, credential, or end-user
  query data;
- do not retain, crawl, train on, benchmark against, or build a database from
  any Google result or snippet;
- do not represent publisher content as licensed by Google;
- do not infer permission from “syndication,” “entire index,” or form access;
- do not bypass selection, authentication, quota, display, attribution, or
  access controls; and
- do not publish private commercial/technical material received under contact.

## 7. Clean-room lessons and Curiosity implications

| Observation | Label / confidence | Curiosity verdict |
| --- | --- | --- |
| Full-web access is represented by an intake, not a public contract [S1-S3]. | FACT / high | **ADOPTED:** availability requires a contract-and-runtime evidence gate, not a marketing-link check. |
| Google's “entire index” remains provider-owned [S1]. | FACT + INFERENCE / high | **REJECTED foundation:** own discovery, captures, corpus state, and rank policy. |
| More-than-50-domain and full-web cases share the same intake [S1]. | FACT / high | **ADAPTED:** model corpus scale and scope separately; do not collapse “51 domains” into “the web.” |
| The form solicits feature priorities [S3]. | FACT / high | **ADOPTED:** use an independently authored RFI checklist; do not infer the requested feature exists. |
| Optional CXID/AdSense ID accommodates prior relationships [S3]. | FACT / high | **REJECTED inference:** no promised compatibility, preferred eligibility, ad model, or config migration. |
| Best-effort response accompanies a hard legacy transition date [S1-S3]. | FACT / high | **ADOPTED risk control:** parallel fallback and dated exit drills; never make intake response a critical path. |
| No public result/evidence contract was found. | NEGATIVE RESULT / high for reviewed sources | **REJECTED as evidence plane:** require captures, hashes, offsets, versions, rights, and policy lineage. |
| Adjacent Google products have public terms, but this surface is unnamed there [S6-S10]. | FACT / medium-high | **DEFERRED:** obtain and review the exact written agreement; do not borrow assurances or restrictions selectively. |

### 7.1 If caller authority later permits contact

The minimum written-answer gate should cover:

1. legal product/SKU, stage, eligibility, contracting entity, and availability;
2. complete request/result schemas, authentication, bounds, errors, versions;
3. exact corpus/vertical scope, policy exclusions, freshness, pagination, and
   whether “entire index” differs from Google Search;
4. provenance, citation, ranking, deduplication, safety, locale, ads/promotions;
5. query/result collection, retention, training/improvement use, human access,
   residency, subprocessors, DPA, deletion, audit, and incident handling;
6. result display, attribution, caching, logging, evaluation, database, model,
   and publisher-rights restrictions;
7. quota, concurrency, SLO/SLA, support, abuse limits, capacity reservation;
8. price, minimums, overage, renewal, price changes, pilot cost;
9. configuration/data export, provider combination, termination, transition;
10. deprecation/version notice and whether continuity is committed beyond
    2027-01-01.

Answers must be retained in the approved procurement/legal system, not copied
into this repository if confidential.

## 8. Unknowns, negative results, and verification checks

### 8.1 Material unknowns

The capability, operational, commercial, privacy, rights, and lifecycle unknowns
in Sections 4-6 are decision-blocking. In particular, **UNKNOWN** does not mean
absent: it means the public evidence cannot support the claim.

### 8.2 Negative results retained

- No public product page dedicated to the solution was linked; both official
  lifecycle pages terminate at the same Google Form [S1-S3].
- No public API/reference, schema, quickstart, console flow, pricing table,
  release notes, status page, quota page, SLA, security page, DPA, or
  product-specific terms were linked from the intake.
- No eligibility rubric, response deadline, acceptance guarantee, trial, or
  procurement sequence appears on the form.
- No public claim of Google.com parity, complete-web coverage, exportable index,
  ranking transparency, or result-retention right was found.
- No exact-name entry was found in the reviewed Google Cloud service-specific
  terms, Google public service list, Google APIs terms, or PSE terms [S6-S10].
  This is a bounded textual check, not proof about private agreements.
- No live search, result comparison, contact, account, or private contract was
  used; quality, latency, and runtime behavior remain unmeasured.

### 8.3 Checks performed

| Check | Sources | Outcome |
| --- | --- | --- |
| Is the intake first-party? | Announcement, developer overview, `docs.google.com` form [S1-S3] | Yes; official pages converge on the same form. |
| What corpus claim is made? | Original announcement [S1] | “Entire index,” not “every web page” or index export. |
| Who is directed there? | Announcement and API overview [S1, S2] | Beyond-50/full-web and retiring JSON API use cases; no formal selection rules. |
| What data/process does intake expose? | Live form [S3] | Six fields, three required; best-effort reply only. |
| Is it Vertex AI Search? | Announcement category split [S1] | Not established; paths are separately described. |
| Are capabilities/pricing public? | Announcement, overview, form [S1-S3] | No; contact is required to obtain them. |
| Are governing service terms identified? | Form plus terms catalogs [S3, S5-S10] | No product-specific governing terms identified publicly. |
| Was external state changed? | Research procedure | No form submission, sign-in, credentials, billing, or query. |

## 9. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); lower cost is cheaper. The frame authorized
public-document research only.

| Thread | Rel. | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Inspect the exact intake fields and promise | 5 | 5 | 5 | 1 | **Pursued:** established requested data, optional legacy IDs, feature solicitation, and best-effort response [S3]. |
| Resolve “available” versus “future syndication” | 5 | 5 | 4 | 1 | **Pursued:** retained as public-language tension; no unsupported stage inference. |
| Distinguish adjacent Google products | 5 | 5 | 3 | 1 | **Pursued:** announcement expressly separates PSE, Vertex AI Search, and full-web path [S1]. |
| Find product-specific terms in public catalogs | 5 | 5 | 4 | 2 | **Pursued:** bounded exact-name check was negative [S6-S10]. |
| Submit form to learn eligibility/capabilities | 5 | 4 | 5 | 5 | `CURIOSITY_NO_GO`: unauthorized external contact, disclosure, and procurement activity. |
| Guess interface from CXID/AdSense field | 3 | 2 | 3 | 1 | `CURIOSITY_NO_GO`: identifier is optional and proves neither compatibility nor ads. |
| Apply PSE/API/Cloud terms by analogy | 5 | 2 | 2 | 2 | `CURIOSITY_NO_GO`: could materially misstate rights, privacy, and obligations. |
| Probe endpoints or ordinary Google Search | 1 | 1 | 3 | 5 | `CURIOSITY_NO_GO`: no documented endpoint or authorized access; no clean-room decision value. |
| Reconstruct ranking/index from outputs | 1 | 1 | 4 | 5 | `CURIOSITY_NO_GO`: no outputs, prohibited scope, low identifiability, unnecessary for owned architecture. |

**Coverage:** identity, status, audience, form process, bounded product scope,
lifecycle, lock-in, privacy/terms, clean-room transfer, decision gates, unknowns,
and negative checks are covered.  
**Saturation:** the two lifecycle pages converge on the same sparse form;
adjacent public catalogs do not add a product contract.  
**Stop:** coverage, saturation, and caller-authority limits reached. Further
resolution requires authorized contact and private-document review, not more
public inference.

## 10. Primary sources and confidence ledger

All sources are Google primary sources accessed 2026-08-17.

1. **[S1] Google Programmable Search Engine Blog, “Updates to our Web Search
   Products & Programmable Search Engine Capabilities,” 2026-01-20.**  
   https://programmablesearchengine.googleblog.com/2026/01/updates-to-our-web-search-products.html  
   Entire-index claim; separate PSE/Vertex/full-web categories; >50-domain and
   JSON API transition paths; 2027-01-01 deadline. **High:** original product
   announcement; marketing language is not a service contract.
2. **[S2] Google, Custom Search JSON API overview, updated 2026-02-18.**  
   https://developers.google.com/custom-search/v1/overview  
   Current closure notice, full-web contact path, and 2027 transition date.
   **High:** product-specific current documentation.
3. **[S3] Google, Web Search Products Interest Form.**  
   https://docs.google.com/forms/d/e/1FAIpQLSfYcIpOzj57MoetWyeFpJf9Cf4yezG5HDq3VsqbJhlngp5pXw/viewform  
   Syndication framing, fields, required status, best-effort response, and form
   privacy/terms links. **High** for the public intake as rendered; no submission
   or response was tested.
4. **[S4] Google Privacy Policy, effective 2026-05-26.**  
   https://policies.google.com/privacy  
   General collection, purposes, communication records, retention, sharing, and
   controls. **High** as public policy; not a substitute for missing
   service-specific enterprise terms.
5. **[S5] Google Terms of Service, U.S., effective 2026-07-30.**  
   https://policies.google.com/terms  
   General Google-service and form-linked terms context. **High** as public
   general terms; exact intake/future-service application requires counsel.
6. **[S6] Google, Programmable Search Engine Terms of Service.**  
   https://support.google.com/programmable-search/answer/1714300  
   PSE-specific service boundary, result restrictions, privacy, modification,
   and termination. **High for PSE; not attributed to the full-web successor.**
7. **[S7] Google, Custom Search JSON API Additional Terms, modified
   2020-01-11.**  
   https://developers.google.com/custom-search/terms  
   Explicit incorporation and API-specific scope. **High for the retiring JSON
   API; not evidence of successor terms.**
8. **[S8] Google APIs Terms of Service, modified 2021-11-09.**  
   https://developers.google.com/terms  
   Generic API obligations and content/termination warnings. **High as public
   API terms; applicability to an undocumented delivery model is unknown.**
9. **[S9] Google Cloud, Service Specific Terms.**  
   https://cloud.google.com/terms/service-terms  
   Bounded check for a named full-web product entry. **Medium-high negative
   evidence:** large evolving catalog; absence of exact phrase is not proof that
   private Cloud contracting is impossible.
10. **[S10] Google, list of services and service-specific additional terms.**  
    https://policies.google.com/terms/service-specific  
    Bounded public-service-name check. **Medium-high negative evidence** with
    the same qualification.

### Overall confidence

- **High:** existence of the first-party intake; Google wording; audience/use
  cases; form fields; best-effort reply; separation from named adjacent paths;
  and absence of a contract on the linked public surface.
- **Medium-high:** conclusion that the public surface is a selective/evolving
  intake rather than generally available self-service product. The precise
  commercial stage remains unknown.
- **Low/unknown:** every runtime capability, quality property, price, eligibility
  criterion, privacy/security commitment, term, and lifecycle promise not
  quoted above. The Curiosity verdict does not depend on guessing them.

## Final decision record

- **ADOPTED:** explicit intake-to-contract gate; provider-removal drills;
  independent corpus/evidence ownership; minimal-data contact policy; written
  RFI across schema, rights, privacy, economics, and exit.
- **ADAPTED:** broad-corpus syndication only as a replaceable discovery channel
  after full diligence, never as “the web” or authoritative evidence.
- **REJECTED:** current use as Curiosity's foundation, migration assumption,
  Google-index output as corpus/evaluation oracle, adjacent-product term
  borrowing, capability inference from form fields, and unauthorized contact or
  probing.
- **DEFERRED:** procurement, form submission, private-document review, pilot,
  quality/capacity testing, and any adapter decision pending a separately
  declared frame and caller authority.

# OpenCode search-pipeline baseline evidence manifest

- **Inspection date:** 2026-08-17
- **External workspace:** `/Volumes/dev/opencode2-config`
- **Workspace HEAD:** `8ff93f27bd8a19cf548a562a6c684c87a9e37004`
- **Digest:** SHA-256 over each file's exact bytes at inspection time
- **Purpose:** identify every external file cited to map the current search,
  agent-permission, and bounded-research pipeline in the linked dossier

| Exact external path | Worktree status at inspection | SHA-256 |
| --- | --- | --- |
| `/Volumes/dev/opencode2-config/assets/skills/deep-research/SKILL.md` | clean at HEAD | `8979c8521cdb8ad1496dafc6c8a9c81623c4bdf4e8b267d31d74e88534bdce8a` |
| `/Volumes/dev/opencode2-config/docs/research/README.md` | clean at HEAD | `72c3a6204f8243cbd03ba00bf691f9f410fce40aac39b4d68ba8e595851e3739` |
| `/Volumes/dev/opencode2-config/src/features/config/agents.ts` | modified tracked file | `620e72f299ff43c06d39c8cf5293c8f994e236c88cb907835a04a4fe76b7cf1b` |
| `/Volumes/dev/opencode2-config/src/features/config/index.ts` | modified tracked file | `2342f5f1e6461a6eb0e55138c06b2ebf0e62e5e56368081cfa0ad02ad9bd404e` |
| `/Volumes/dev/opencode2-config/src/features/search/index.ts` | modified tracked file | `0668e455d3115729b82d2e2b73a87f9135ab4d54f370a3f82a2cbe959c58cb2a` |
| `/Volumes/dev/opencode2-config/src/features/search/core.ts` | untracked file | `2ac6545a0502c4242125db276c0f892b9fe9af20ce70f4c8219495230c241594` |
| `/Volumes/dev/opencode2-config/src/features/search/searxng-adapter.ts` | untracked file | `d65a9020b28ab101eba42f0a565520be5637b5cca22900675c04edafe9d47325` |
| `/Volumes/dev/opencode2-config/src/features/tools/index.ts` | modified tracked file | `5fe7a594f8416cc24b25ac84fdf0a5bd04d6800e6d7cea4b9fb2888b8005f02a` |
| `/Volumes/dev/opencode2-config/tests/unit/web-search.test.mjs` | untracked file | `27c7544f2ac4e72fc64bead46b6c76a4fa0249f026d3239c30b72f1170857efd` |

## Limitation

The external workspace was mutable and had unrelated uncommitted work. HEAD
therefore identifies only the repository base; it does not contain or reproduce
the modified and untracked bytes listed above. These hashes make the inspected
baseline verifiable if those exact bytes remain available, but they do not make
the external files immutable, preserve copies, or prove later workspace state.
No source file was copied into this repository.

Used by the [owned public-web search research dossier](../docs/research/owned-public-web-search-architecture-2026-08-17.md).

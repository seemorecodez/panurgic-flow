# Panurgic Flow - OpenAI Build Week submission checklist

Verified against the official OpenAI Build Week rules and live Devpost submission fields on July 18, 2026. The official rules and Devpost page remain the source of truth.

Submission deadline: **July 21, 2026 at 5:00 PM Pacific Time**.

## Project and repository

- [x] Working project built with Codex and a meaningful GPT-5.6 integration.
- [x] Single category selected: **Developer Tools**.
- [x] English project description drafted in `DEVPOST_SUBMISSION.md`.
- [x] README includes setup, sample-data, run, and test instructions.
- [x] README explains Codex acceleration, human decisions, and GPT-5.6 integration.
- [x] Developer-tool installation instructions and supported platforms are documented.
- [x] Complete browser-local path lets judges test without an account, key, or quota.
- [x] Trusted Codex SDK companion is pinned to `gpt-5.6-sol` with structured output, read-only sandboxing, denied approvals, and disabled network/web search.
- [x] No hosted Codex executor, model API route, or runtime credential is exposed.
- [x] Successful local `gpt-5.6-sol` forge completed through the authenticated Codex SDK session and returned the validated packet shape.
- [x] MIT license included with copyright attribution to GitHub owner `seemorecodez`.
- [x] New work is timestamped during the submission period in commit history.
- [ ] Publish the source to a judge-accessible repository URL.
  - Public option: keep `LICENSE` and make the repository public.
  - Private option: share it with `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] Make the hosted demo judge-accessible or provide another no-rebuild sandbox/test path.
- [ ] Import the validated `codex-sdk · gpt-5.6-sol` packet while recording the demo.

## Demo video

- [ ] Record a video under three minutes.
- [ ] Include a clear working-product demo.
- [ ] Include audible narration explaining what Panurgic Flow does.
- [ ] Explain specifically how Codex accelerated the build and where human decisions were made.
- [ ] Explain and show what GPT-5.6 does in the local Codex companion.
- [ ] Show that the hosted judge path works without account, key, or quota.
- [ ] Use only original or authorized media; do not use copyrighted music or unauthorized third-party trademarks.
- [ ] Upload it as a public YouTube video and verify the link.

Use the timed script in `DEVPOST_SUBMISSION.md`; it ends before the three-minute ceiling.

## Required Devpost fields

- [x] Submitter type selected: **Individual**.
- [x] Country of residence selected: **United States**; entrant must retain responsibility for the remaining personal eligibility attestations.
- [x] Category: Developer Tools.
- [ ] Public or properly shared private code-repository URL.
- [ ] Judge demo URL and any private testing instructions.
- [ ] `/feedback` Session ID from the primary Codex task where most core functionality was built.
- [x] Developer-tool installation, supported-platform, and testing text drafted.
- [x] No team invitations required for an Individual submission.
- [ ] Submit the project; verify it is **Submitted**, not saved as Draft.

## Final integrity check

- [ ] All claims match the actual code, commits, tests, and demo.
- [ ] No API keys, tokens, private data, or credentials are committed or shown in the video.
- [ ] All third-party SDKs, libraries, data, and media are authorized and disclosed where relevant.
- [ ] Product name is **Panurgic Flow** everywhere.
- [ ] Re-check the official rules and announcements immediately before submission because organizers may update them.

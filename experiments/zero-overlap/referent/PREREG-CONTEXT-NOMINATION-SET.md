# The set for PREREG-CONTEXT-NOMINATION (filed 2026-11-19, BEFORE it is fetched; ledger row when scored)
The Janus session's registration (janus repo, PREREG-CONTEXT-NOMINATION.md, sha256 prefix 60432a15020910ad, pushed to janus main 18ee97c) needs a NEVER-READ set for its primary stratum ZERO-CLEAN. This file declares that set's rule and nothing else; it does not change that registration.
RULE (by count only, no look at any article): English Wikipedia, Category:Featured articles in API order (the member list cached in data/featured-members.json by the earlier fetches), 0-based positions p with p mod 50 = 11, the first 60. Named `fresh4`. DISJOINT from every set already used by construction: referent-dev is p mod 50 = 7, referent-fresh 23, the foresight set 31, the reserved end-to-end set 41.
Fetched by `fetch_docs.py fresh4` (a mod-11 rule added at this filing), source en.wikipedia.org/w/api.php with the script's declared user agent, through the owner's yes of 2026-11-19. Read ONCE: its first scoring is FRESH; a second is REUSED. Nothing is scored on it until the arms are built and tested on DEV (referent-dev) only and the code is frozen with its sha256 prefixes in an addendum here.
Stamp: sha256 prefix of this file at filing, in PREREG-CONTEXT-NOMINATION-SET.md.sha256short.
## Addenda
(none yet)

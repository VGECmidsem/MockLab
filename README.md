# MockLab — GitHub Pages–ready mock-test app

## Features

- Multi-page PDF upload and manual crop editor using PDF.js; layout-specific assisted header detection for the provided 3-page Test 6 report (25 proposals).
- Question review: trim images, mask answer indications, remove solution strips, reorder, add notes, approve only after visual inspection.
- Saved test library with IndexedDB, portable JSON backups, dark mode on all main screens.
- Timed multiple-choice exam, 2–6 answer buttons, navigation palette, answer persistence, marking for review, automatic submission on timeout.
- **Optional scoring**: Answer Keys page lets you manually enter a verified A–F key, set correct/wrong mark values, then score upon submission. Blank/partial key => unscored. No unverified answer key was fabricated.
- GitHub Pages compatible: no build step or backend required.

## Run locally

From the extracted directory run `python -m http.server 8000` and visit `http://localhost:8000/library.html`.

## Publish to GitHub Pages

Create a GitHub repository, upload the contents of this folder to the repository root (including `exam_cards/` and `mocklab-storage.js`), then go to **Settings → Pages → Build and deployment → Deploy from a branch**. Select branch `main`, folder `/ (root)`, and Save. Your URL will resemble `https://USERNAME.github.io/REPOSITORY/index.html`. The repository can be public. GitHub Pages publishes the application; it does *not* store question libraries or submitted exam data on a server.

**Privacy**: PDFs, question images and answers are processed locally inside the browser except the PDF.js library, which is currently downloaded from CDN. Export saved test JSON backups before clearing browser storage or changing devices. Browser storage may run out of space for large image-based PDFs.

## Workflow

1. `cropper.html`: load `sample_test.pdf` or your own PDF. Click automatic detection only for compatible report layouts, inspect every proposal and adjust crops as needed. Export detection report if desired.
2. `review.html`: remove revealed answers/explanations while preserving all options and diagrams. Review every crop. Approve only when it is safe for an exam; save.
3. `library.html`: export a full test backup (includes images, review metadata, and entered answers).
4. `answer-key.html`: optionally enter a manually checked correct-answer key and mark scheme.
5. `index.html`: select saved test, choose duration, and begin. Reviewed/approved status required by default; explicit preview mode for unreviewed samples.
6. After submission, view results; scores appear only for a fully keyed saved set. Export responses JSON.

## Limits and warnings

- The sample 25 question images are preliminary and **not approved**. Some source screenshots contain answer feedback. They are for demonstrating the app and require manual review before serious use.
- Automatic crop detection is **report-template-specific**, not general OCR or universal question understanding. Page headers detected do not mean every diagram and choice was captured correctly.
- Key editing is intentionally manual to avoid false marks. Sample not scored unless an independently checked key is entered.
- Avoid editing/reordering a saved test during an in-progress attempt; finish or discard the attempt first.
- No user accounts, backend syncing, anti-cheat, proctoring, or server-side privacy guarantees. Do not consider client-side scoring tamper-proof.
- PDF.js is CDN-loaded and therefore requires internet connectivity initially; the rest of the app can be hosted statically.

## File overview

- `index.html`: timed exam/results
- `cropper.html`: PDF question proposal/crop editor
- `review.html`: image cleanup & approval
- `library.html`: manage tests/backup
- `answer-key.html`: answer-key manager
- `mocklab-storage.js`: IndexedDB implementation
- `mocklab-scoring.js`: deterministic scoring helper
- `sample_test.pdf`: user-provided three-page sample
- `exam_cards/`: 25 provisional image crops

See `PROJECT_HANDOFF.md` for test record and maintenance instructions.

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

## Question images with separate option text

The exam keeps its larger question area and original white/blue answer colors. New PDF crops can show a question image followed by full-width text choices (`A. Red`, `B. Green`, etc.). Existing image-only sets still work as before.

1. Open **PDF Crop Studio**. Leave **Question image + separate text options** checked. Select the question statement and any diagrams, excluding the options, and click **Add selected crop**.
2. Select only the option area on the PDF. Under **Extract and check options**, choose the saved question, set its option count (2–6), and click **Read selected options**. OCR runs only on that selection; it does not read or rewrite the question crop.
3. Compare the editable option fields with the PDF, correct recognition errors, and confirm their wording and order. If labels cannot be separated, select one option's text at a time and use **Only option A/B/etc.**, or type the exact text manually. OCR does not infer missing choices or correct answers.
4. Use **Review crops before exam**, inspect the question image and option text, approve and save the reviewed set. The exam shows the original wording as separate selectable rows. An edit to option text clears its confirmation and question approval.

The option text, confirmation and available source preview are included in portable JSON backups. Image/PNG downloads alone do not contain separate text options. The original full-image workflow remains available by unchecking the new checkbox; assisted full-question proposals also remain image-only. Existing sets are not automatically split or rewritten.

English OCR uses Tesseract.js 6.0.1 in the browser. The script, worker, engine and English language data need a network connection to download; the selected PDF image is processed locally. OCR is suitable for clear printed text but is not guaranteed to preserve formulas, unusual fonts or low-resolution scans. Confirm every result before use. Question cropping remains manual so required diagrams are retained.

### Development checks

No build step is required for GitHub Pages. With Node.js 22+ installed, run `npm ci` followed by `npm test` for parser, storage/backup, review and exam interaction checks. Tests use a simulated DOM and stub the OCR worker; they do not replace real-browser visual checks or OCR accuracy checks on your PDFs.

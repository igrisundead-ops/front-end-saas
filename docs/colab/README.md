# Render Factory (Google Colab)

This setup is render-only. It does not run transcription and does not require API keys.

## Files
- `docs/colab/Render_Factory.ipynb`: Colab notebook to run all renders remotely.
- `docs/colab/job.example.json`: Minimal job contract for `npm run render:job`.

## Usage
1. Open `Render_Factory.ipynb` in Google Colab.
2. Switch runtime to GPU.
3. Run cells top to bottom.
4. Provide your repo URL and job JSON path/upload.
5. Notebook always syncs latest code:
   - if `/content/repo` exists: `git fetch origin`, `git checkout main`, `git reset --hard origin/main`, `git clean -fd`
   - else: `git clone`
6. Render runs with:
   - `npm run render:job -- --job <job.json>`
7. Output is expected at `/content/out.mp4` unless overridden in job.

## Notes
- Node modules cache is stored on Drive at:
  - `/content/drive/MyDrive/render_factory/<repo_name>/cache/node_modules`
- Temporary files should go under one of:
  - `/artifacts/` (gitignored)
  - `/outputs/` (gitignored)
- Debug dump (optional) writes:
  - `/content/debug_dump.zip`
- No secrets are stored in repo or notebook by default.

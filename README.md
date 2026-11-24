# CreatorFlow Studio / YouTube Automation Studio

A static, mobile-friendly YouTube production workspace that can be deployed free on Cloudflare Pages.

## Included modules
- Dashboard
- AI niche research
- Video idea generation
- Script writing
- Script-to-storyboard planning
- Thumbnail concept and image prompt brief
- SEO and publishing package
- Local Content Bank with JSON export/import
- Cloudflare Worker endpoint settings and connection test

## Deploy to Cloudflare Pages
1. Upload the contents of this folder to the root of your GitHub repository.
2. In Cloudflare Dashboard, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select your GitHub repository.
4. Framework preset: **None**.
5. Build command: leave blank.
6. Build output directory: `/` (or `.` if the dashboard requires it).
7. Deploy.

You can also use Cloudflare Pages direct upload by uploading this folder's files.

## Connect the AI Worker
1. Open the deployed website.
2. Go to **Settings**.
3. Paste your Cloudflare Worker URL and save.
4. Tap **Test AI connection**.

The frontend currently sends:
```json
{
  "task": "video_ideas",
  "input": {"niche": "example", "format": "Mix of Shorts and long-form", "count": "10"},
  "language": "English",
  "audience": "Global English-speaking audience"
}
```
It expects the Worker to accept a JSON POST and return JSON. Supported response text fields are `result`, `output`, `response`, or `content`; if none exist, the response object is displayed as JSON.

### Important integration note
The Worker URL used in the earlier project was:
`https://youtube-ai-engine.donisulaeman4.workers.dev`

This URL is prefilled only if you enter it in Settings. The UI's task names are:
- `connection_test`
- `niche_research`
- `video_ideas`
- `script_writer`
- `storyboard`
- `thumbnail_brief`
- `seo_package`

The earlier connection test confirmed that the Worker responded to `connection_test`. It does **not** prove that all content-generation task names are already implemented. If the Worker currently supports a different schema or task names, update its handler to map these task names and allow CORS from your Pages domain. Never put provider API keys in frontend code; store them as Cloudflare Worker secrets.

## Storage and limitations
- Saved assets use this browser's localStorage on this device. They do not automatically sync across devices.
- Export a JSON backup from Content Bank before clearing browser data.
- The thumbnail module creates a visual brief/prompt, not an image.
- Generated content needs human fact-checking, originality review, and rights checks before publication.
- This is a static frontend; it does not upload to YouTube or schedule videos automatically.

# Smart Health District Ops

AI-driven health centre and supply chain management platform for PHCs/CHCs.

## Live Links
- [Project site](https://sites.google.com/view/smart-health-districtops/home?authuser=1)
- [Live dashboard (Looker Studio)](https://datastudio.google.com/reporting/882a62e6-1432-4e93-ad99-1bca37a37299)
- [Mobile data-entry app (AppSheet)](https://www.appsheet.com/newshortcut/33e691a7-3bb0-4698-b9ca-8099f127b94c)

## Demo Video
[![Watch the demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)]https://youtu.be/53WsbikIbPI?feature=shared)

## Tech Stack
- Google Sheets — database
- Google AppSheet — mobile field data-entry app
- Google Apps Script — automation and AI orchestration (see Code.gs)
- Looker Studio — live admin dashboard
- AI agent for multilingual parsing and stock-risk analysis
- Gemini Nano Banana — logo generation

## How it works
1. Field staff log stock via mobile app, or send a message in their own language
2. AI agent parses multilingual input into structured stock data
3. AI agent scans stock across all centres, flags shortages, recommends redistribution
4. District admins see everything on one live dashboard

## Core AI logic
See `Code.gs` for the full Apps Script implementation, including:
- `callGemini()` — AI API call wrapper
- `parseRawInput()` — multilingual stock message parser
- `runStockAnalysis()` — stock-out prediction and redistribution recommender

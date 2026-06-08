# SubMagic Avatar POC

AI-powered talking avatar video generator. Enter a script, pick an avatar and caption style — the pipeline produces a lip-synced, captioned MP4 in minutes.

---

## System Architecture

The pipeline supports three interchangeable **lip-sync backends**. Everything else (script enhancement, transcription, captions, final render) stays the same.

---

## Architecture 1 — Tavus (Cloud API) ✅ Current

```mermaid
flowchart TD
    A([User]) -->|script + avatar + style| B[Frontend\nVite + React]
    B -->|POST /api/generate-video\nSSE stream| C[Koa Backend]

    subgraph PIPELINE["⚙️ Pipeline (server-side)"]
        C --> D[Step 1\nGemini 2.5 Flash\nScript Enhancement]
        D -->|enhanced script| E[Step 2\nTavus API\nPOST /v2/videos]
        E -->|video_id| F[Step 3\nPoll Tavus\nGET /v2/videos/:id\nevery 6s]
        F -->|status: ready\ndownload_url| G[Download MP4\nfrom Tavus CDN]
        G -->|avatar.mp4| H[Step 4\nFFmpeg\nextract audio]
        H -->|audio.wav| I[Groq Whisper\nword-level timestamps]
        I -->|TranscriptionResult| J[Generate .ass\ncaption file]
        J -->|captions.ass| K[Step 5\nFFmpeg\nburn captions]
        K --> L([final.mp4])
    end

    L -->|/api/video/:sessionId| B

    subgraph TAVUS_CLOUD["☁️ Tavus Cloud"]
        E2[Tavus Server\nphoenix-4 model]
        E2 -->|voice synthesis\n+ face animation| E3[Rendered MP4]
    end

    E <-->|replica_id + script| TAVUS_CLOUD

    style PIPELINE fill:#1e293b,stroke:#334155,color:#f1f5f9
    style TAVUS_CLOUD fill:#0f172a,stroke:#6366f1,color:#f1f5f9
```

### Tavus Data Flow

| Step | Service | Input | Output | Time |
|------|---------|-------|--------|------|
| 1 | Gemini 2.5 Flash | Raw script + emotion | Enhanced script | ~2s |
| 2–3 | Tavus API | Replica ID + script | Talking head MP4 | ~1–3 min |
| 4 | FFmpeg + Groq Whisper | MP4 | Word timestamps | ~10s |
| 5 | FFmpeg | Video + .ass | Captioned MP4 | ~15s |

**Tavus handles both voice synthesis and face animation in one API call.** No local GPU required.

---

## Architecture 2 — SadTalker (Local, Free)

```mermaid
flowchart TD
    A([User]) -->|script + avatar + style| B[Frontend\nVite + React]
    B -->|POST /api/generate-video\nSSE stream| C[Koa Backend]

    subgraph PIPELINE["⚙️ Pipeline (server-side)"]
        C --> D[Step 1\nGemini 2.5 Flash\nScript Enhancement]
        D -->|enhanced script| E[Step 2\nmacOS say command\nNeural TTS]
        E -->|.aiff| EE[FFmpeg\nconvert to .mp3]
        EE -->|speech.mp3| F[Step 3\nSadTalker\nPython inference]
        F -->|avatar.mp4\nno audio| G[Step 4\nFFmpeg\nmerge audio + video]
        G -->|avatar_with_audio.mp4| H[Groq Whisper\nword-level timestamps]
        H -->|TranscriptionResult| I[Generate .ass\ncaption file]
        I -->|captions.ass| J[Step 5\nFFmpeg\nburn captions]
        J --> K([final.mp4])
    end

    K -->|/api/video/:sessionId| B

    subgraph SADTALKER_LOCAL["🖥️ Local Machine"]
        F2[SadTalker Model\n3DMM + Face Renderer]
        F2 -->|audio-driven\nmouth movement| F3[Silent MP4]
        F4[Avatar Image\n.png portrait]
        F4 --> F2
    end

    EE -->|speech.mp3| SADTALKER_LOCAL
    B2[Avatar Image] -->|imagePath| SADTALKER_LOCAL

    style PIPELINE fill:#1e293b,stroke:#334155,color:#f1f5f9
    style SADTALKER_LOCAL fill:#0f172a,stroke:#f59e0b,color:#f1f5f9
```

### SadTalker Data Flow

| Step | Service | Input | Output | Time |
|------|---------|-------|--------|------|
| 1 | Gemini 2.5 Flash | Raw script + emotion | Enhanced script | ~2s |
| 2 | macOS TTS (`say`) + FFmpeg | Script text | speech.mp3 | ~3s |
| 3 | SadTalker (Python/MPS) | Portrait image + audio | Silent MP4 | ~3–5 min |
| 4 | FFmpeg mux | MP4 + MP3 | MP4 with audio | ~2s |
| 5 | FFmpeg + Groq Whisper | MP4 | Word timestamps | ~10s |
| 6 | FFmpeg | Video + .ass | Captioned MP4 | ~15s |

**Runs entirely on-device.** No API costs — requires local Python venv + model weights (~4 GB).

---

## Architecture 3 — LivePortrait (Local, Free)

```mermaid
flowchart TD
    A([User]) -->|script + avatar + style| B[Frontend\nVite + React]
    B -->|POST /api/generate-video\nSSE stream| C[Koa Backend]

    subgraph PIPELINE["⚙️ Pipeline (server-side)"]
        C --> D[Step 1\nGemini 2.5 Flash\nScript Enhancement]
        D -->|enhanced script| E[Step 2\nmacOS say command\nNeural TTS]
        E -->|.aiff| EE[FFmpeg\nconvert to .mp3]
        EE -->|speech.mp3| F[Step 3\nLivePortrait\nPython inference]
        F -->|animated_avatar.mp4\nno audio| G[Step 4\nFFmpeg\nmerge audio + video]
        G -->|avatar_with_audio.mp4| H[Groq Whisper\nword-level timestamps]
        H -->|TranscriptionResult| I[Generate .ass\ncaption file]
        I -->|captions.ass| J[Step 5\nFFmpeg\nburn captions]
        J --> K([final.mp4])
    end

    K -->|/api/video/:sessionId| B

    subgraph LP_LOCAL["🖥️ Local Machine"]
        F2[LivePortrait Model\nstitching + retargeting]
        F2 -->|expression-driven\nfull face animation| F3[Animated MP4]
        F4[Driving Video\nexpression source]
        F4 --> F2
        F5[Avatar Image\n.png portrait]
        F5 --> F2
    end

    EE -->|speech.mp3 → driving video| LP_LOCAL

    style PIPELINE fill:#1e293b,stroke:#334155,color:#f1f5f9
    style LP_LOCAL fill:#0f172a,stroke:#10b981,color:#f1f5f9
```

### LivePortrait Data Flow

| Step | Service | Input | Output | Time |
|------|---------|-------|--------|------|
| 1 | Gemini 2.5 Flash | Raw script + emotion | Enhanced script | ~2s |
| 2 | macOS TTS + FFmpeg | Script text | speech.mp3 | ~3s |
| 3 | LivePortrait (Python/MPS) | Portrait image + driving video | Animated MP4 | ~2–4 min |
| 4 | FFmpeg mux | MP4 + MP3 | MP4 with audio | ~2s |
| 5 | FFmpeg + Groq Whisper | MP4 | Word timestamps | ~10s |
| 6 | FFmpeg | Video + .ass | Captioned MP4 | ~15s |

**More natural head motion than SadTalker** (full face stitching), but requires a reference driving video for expressions.

---

## Side-by-Side Comparison

```mermaid
flowchart LR
    subgraph COMMON["Common to all approaches"]
        A1[User Input] --> A2[Gemini\nScript Enhancement]
        A3[Groq Whisper\nTranscription] --> A4[ASS Caption\nGeneration]
        A4 --> A5[FFmpeg\nCaption Burn]
        A5 --> A6[Final MP4]
    end

    subgraph BACKENDS["Lip-Sync Backend"]
        B1["☁️ Tavus\nCloud API\n━━━━━━━━\n✅ No GPU needed\n✅ Best quality\n⏱ 1–3 min\n💲 Paid API\n━━━━━━━━\nscript → MP4\n(voice + face)"]
        B2["🖥️ SadTalker\nLocal Python\n━━━━━━━━\n✅ Free\n⚠️  GPU/MPS needed\n⏱ 3–5 min\n💲 No cost\n━━━━━━━━\nimage + audio → MP4\n(mouth only)"]
        B3["🖥️ LivePortrait\nLocal Python\n━━━━━━━━\n✅ Free\n⚠️  GPU/MPS needed\n⏱ 2–4 min\n💲 No cost\n━━━━━━━━\nimage + driving video → MP4\n(full face)"]
    end

    A2 --> BACKENDS
    BACKENDS --> A3

    style COMMON fill:#1e293b,stroke:#334155,color:#f1f5f9
    style BACKENDS fill:#0f172a,stroke:#475569,color:#f1f5f9
    style B1 fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style B2 fill:#1c1917,stroke:#f59e0b,color:#fef3c7
    style B3 fill:#052e16,stroke:#10b981,color:#d1fae5
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + Tailwind CSS |
| Backend | Koa (Node.js) + TypeScript |
| Script AI | Google Gemini 2.5 Flash |
| Lip-sync | **Tavus API** (current) / SadTalker / LivePortrait |
| Transcription | Groq Whisper large-v3 |
| Video processing | FFmpeg + fluent-ffmpeg |
| Captions | ASS subtitles (viral / professional / creator) |

## Environment Variables

```env
GEMINI_API_KEY=          # Google AI Studio
TAVUS_API_KEY=           # Tavus (if using Tavus backend)
TAVUS_REPLICA_ID_AVATAR1=  # phoenix-4 replica for Sophia
TAVUS_REPLICA_ID_AVATAR2=  # phoenix-4 replica for James
TAVUS_REPLICA_ID_AVATAR3=  # phoenix-4 replica for Mia
TAVUS_REPLICA_ID_AVATAR4=  # phoenix-4 replica for Alex
GROQ_API_KEY=            # Groq (Whisper transcription)
```

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your API keys
npm run dev
```

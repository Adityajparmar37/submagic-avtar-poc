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

---

## Platform Comparison — Avatar Video Generation

A full survey of every viable platform for generating talking-avatar videos, from cloud APIs to open-source local models.

---

### Category Map

```mermaid
mindmap
  root((Avatar Video\nGeneration))
    Cloud APIs
      Tavus
      D-ID
      HeyGen
      Synthesia
      DeepBrain AI
      Hour One
      Colossyan
      Elai.io
      Hedra
    Open Source Local
      SadTalker
      LivePortrait
      Wav2Lip
      MuseTalk
      VideoReTalking
      DiffTalk
      GeneFace++
      AniPortrait
    General Video AI
      Runway ML Gen-3
      Pika Labs
      Kling AI
      Luma Dream Machine
      Stable Video Diffusion
    SaaS No-Code
      Wondershare Virbo
      Captions.ai
      InVideo AI
      Fliki
```

---

### 1. Cloud API Platforms

#### Quick Comparison Table

| Platform | Avatar Type | Voice Included | API | Lip Sync | Head Motion | Render Time | Free Tier | Pricing |
|----------|------------|---------------|-----|----------|-------------|-------------|-----------|---------|
| **Tavus** ✅ | Stock + Custom replica | ✅ Replica voice | ✅ REST | ⭐⭐⭐⭐⭐ | Head + shoulders | 1–3 min | ❌ | ~$0.05/min |
| **D-ID** | Stock + Photo | ✅ TTS or custom | ✅ REST | ⭐⭐⭐⭐ | Head only | 30–90s | ✅ 5 videos/mo | $5.9/mo |
| **HeyGen** | Stock + Instant + Photo | ✅ Voice clone | ✅ REST | ⭐⭐⭐⭐⭐ | Head + gestures | 1–2 min | ✅ 1 min/mo | $29/mo |
| **Synthesia** | 230+ stock + Personal | ✅ 140 voices | ✅ REST | ⭐⭐⭐⭐⭐ | Head + upper body | 2–5 min | ❌ | $29/mo |
| **DeepBrain AI** | Stock + Custom | ✅ TTS | ✅ REST | ⭐⭐⭐⭐ | Head + body | 2–4 min | ❌ | $30/mo |
| **Hour One** | 100+ stock + Custom | ✅ TTS | ✅ REST | ⭐⭐⭐⭐ | Head + upper body | 3–5 min | ❌ | $25/mo |
| **Colossyan** | 150+ stock + Custom | ✅ TTS + clone | ✅ REST | ⭐⭐⭐⭐ | Head + body | 2–4 min | ✅ 5 min/mo | $28/mo |
| **Elai.io** | 80+ stock + Photo | ✅ TTS + clone | ✅ REST | ⭐⭐⭐⭐ | Head | 1–3 min | ✅ 1 min/mo | $29/mo |
| **Hedra** | Photo | ✅ Upload audio | ✅ REST | ⭐⭐⭐⭐ | Head | 30–90s | ✅ 3 min/mo | $8/mo |

---

#### Tavus

```mermaid
flowchart LR
    A[Script text] -->|POST /v2/videos\nreplica_id + script| B[Tavus Cloud\nphoenix-4]
    B -->|Poll /v2/videos/:id| C{status?}
    C -->|generating| C
    C -->|ready| D[download_url\nMP4]

    style B fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
```

| Property | Detail |
|----------|--------|
| **Model** | Phoenix 2 / 3 / 4 |
| **Input** | `replica_id` (pre-trained from video) + script text |
| **Output** | Full MP4 with replica's voice + animated face |
| **Voice** | Cloned from replica training video — no separate TTS needed |
| **Head motion** | Realistic head/shoulder movement, natural blinks |
| **Lip sync accuracy** | Excellent — trained end-to-end on the person |
| **Resolution** | Up to 1080p |
| **API auth** | `x-api-key` header |
| **Async** | Yes — submit job, poll for completion |
| **Replica creation** | One-time upload of a 2-min consent video |
| **Best for** | Consistent brand avatars, high-quality personalization |
| **Limitation** | Replica creation takes ~24h; paid only |

---

#### D-ID

```mermaid
flowchart LR
    A[Image URL\n+ Audio URL\nor TTS text] -->|POST /talks| B[D-ID Cloud]
    B -->|id| C[Poll GET /talks/:id]
    C -->|done| D[result_url MP4]

    style B fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
```

| Property | Detail |
|----------|--------|
| **Model** | Latent Diffusion + GAN-based |
| **Input** | Portrait image + audio file OR text (built-in TTS) |
| **Output** | Talking head MP4 |
| **Voice** | 50+ built-in TTS voices or upload custom audio |
| **Head motion** | Subtle head nod + mouth sync only |
| **Lip sync accuracy** | Good — audio-driven |
| **Resolution** | Up to 1080p |
| **API auth** | Basic auth (email:key) |
| **Async** | Yes — poll for result |
| **Best for** | Quick prototypes from any portrait photo |
| **Limitation** | Head motion less natural than Tavus/HeyGen; body stays still |

---

#### HeyGen

```mermaid
flowchart LR
    A[Script text\n+ avatar_id\n+ voice_id] -->|POST /v2/video/generate| B[HeyGen Cloud]
    B -->|video_id| C[Poll GET /v1/video_status/:id]
    C -->|completed| D[video_url MP4]

    style B fill:#1e1b4b,stroke:#a78bfa,color:#e0e7ff
```

| Property | Detail |
|----------|--------|
| **Model** | Proprietary (best-in-class quality) |
| **Input** | Avatar ID + voice ID + script |
| **Output** | Full video with gestures |
| **Voice** | Voice clone (30s sample) or 300+ built-in voices |
| **Head motion** | Head, shoulders, hand gestures |
| **Lip sync accuracy** | Excellent |
| **Resolution** | Up to 4K |
| **API auth** | Bearer token |
| **Async** | Yes |
| **Instant Avatar** | Upload 2-min video → usable in minutes |
| **Best for** | Marketing/sales videos, highest production quality |
| **Limitation** | Most expensive; rate limits on free tier |

---

#### Synthesia

| Property | Detail |
|----------|--------|
| **Model** | Proprietary enterprise |
| **Input** | Script text + avatar selection |
| **Output** | Video with full upper-body presenter |
| **Voice** | 140+ languages, voice clone available |
| **Head motion** | Full upper-body with natural gestures |
| **Lip sync accuracy** | Excellent |
| **Resolution** | 1080p |
| **API** | REST API (Enterprise plan only) |
| **Best for** | Corporate training, e-learning, localization |
| **Limitation** | API only on Enterprise ($$$); no custom audio upload on lower tiers |

---

#### Hedra

| Property | Detail |
|----------|--------|
| **Model** | Character-1 (audio-reactive) |
| **Input** | Portrait image + audio file |
| **Output** | Talking head MP4 |
| **Voice** | Upload your own audio — no built-in TTS |
| **Head motion** | Head nod + expression changes |
| **Lip sync accuracy** | Very good |
| **Resolution** | Up to 1080p |
| **API** | REST API (Beta) |
| **Best for** | Custom voice + photo combo; budget option |
| **Limitation** | Audio must be pre-generated; newer/less stable API |

---

### 2. Open-Source Local Models

#### Quick Comparison Table

| Model | Input | Head Motion | Quality | GPU RAM | Speed (CPU/MPS) | Speed (CUDA) | Voices Included |
|-------|-------|-------------|---------|---------|-----------------|--------------|----------------|
| **SadTalker** | Portrait + audio | Mouth + head | ⭐⭐⭐⭐ | 4 GB | 3–5 min | 30–60s | ❌ |
| **LivePortrait** | Portrait + driving video | Full face | ⭐⭐⭐⭐⭐ | 6 GB | 2–4 min | 20–40s | ❌ |
| **Wav2Lip** | Face video + audio | Mouth only | ⭐⭐⭐ | 2 GB | 1–2 min | 15–30s | ❌ |
| **MuseTalk** | Portrait + audio | Mouth + head | ⭐⭐⭐⭐ | 8 GB | 2–3 min | 10–20s | ❌ |
| **VideoReTalking** | Face video + audio | Mouth only | ⭐⭐⭐⭐ | 4 GB | 2–4 min | 20–40s | ❌ |
| **DiffTalk** | Portrait + audio | Mouth + head | ⭐⭐⭐⭐ | 8 GB | 5–10 min | 1–2 min | ❌ |
| **GeneFace++** | Portrait + audio | Full head | ⭐⭐⭐⭐⭐ | 8 GB | ❌ (CUDA only) | 1–2 min | ❌ |
| **AniPortrait** | Portrait + audio | Full head | ⭐⭐⭐⭐ | 16 GB | ❌ (CUDA only) | 2–4 min | ❌ |

---

#### SadTalker

```mermaid
flowchart TD
    A[Portrait Image] --> C[3DMM Extraction\ncoeff prediction]
    B[Audio .wav/.mp3] --> D[Audio2Exp\nexpression coefficients]
    C --> E[Face Renderer\nneural rendering]
    D --> E
    E --> F[Silent MP4]
    F --> G[FFmpeg mux audio]
    G --> H[Final MP4]

    style E fill:#1c1917,stroke:#f59e0b,color:#fef3c7
```

| Property | Detail |
|----------|--------|
| **Technique** | 3D Morphable Model (3DMM) + neural renderer |
| **Input** | Single portrait PNG + audio file |
| **Motion** | Mouth sync + subtle head pose |
| **Model size** | ~4 GB weights |
| **MPS (Apple Silicon)** | ✅ Supported |
| **Repo** | [OpenTalker/SadTalker](https://github.com/OpenTalker/SadTalker) |
| **Best for** | Simple talking head from any photo, well-documented |
| **Limitation** | Head motion less natural than newer models; imageio recursion bug on some envs |

---

#### LivePortrait

```mermaid
flowchart TD
    A[Portrait Image\nsource] --> C[Feature Extraction\nappearance + motion]
    B[Driving Video\nexpression reference] --> D[Motion Field\nestimation]
    C --> E[Stitching Module\n+ Retargeting]
    D --> E
    E --> F[Animated MP4]

    style E fill:#052e16,stroke:#10b981,color:#d1fae5
```

| Property | Detail |
|----------|--------|
| **Technique** | Implicit keypoint + stitching/retargeting |
| **Input** | Portrait image + driving video (expression reference) |
| **Motion** | Full face — eyes, brows, cheeks, mouth, head rotation |
| **Model size** | ~6 GB weights |
| **MPS (Apple Silicon)** | ✅ Supported |
| **Repo** | [KwaiVGI/LivePortrait](https://github.com/KwaiVGI/LivePortrait) |
| **Best for** | Highest quality local animation; realistic expressions |
| **Limitation** | Needs driving video — must pre-record or find a reference |

---

#### Wav2Lip

```mermaid
flowchart TD
    A[Face Video\nor portrait loop] --> C[Face Detection\nS3FD detector]
    B[Audio .wav] --> D[Wav2Lip Model\naudio-visual sync]
    C --> D
    D --> E[Lip-synced Video]

    style D fill:#0f172a,stroke:#0ea5e9,color:#e0f2fe
```

| Property | Detail |
|----------|--------|
| **Technique** | GAN-based audio-visual synchronisation |
| **Input** | Face video (or looped image) + audio |
| **Motion** | Mouth only — rest of face/head unchanged |
| **Model size** | ~300 MB |
| **MPS (Apple Silicon)** | ⚠️ Partial (CPU fallback common) |
| **Repo** | [Rudrabha/Wav2Lip](https://github.com/Rudrabha/Wav2Lip) |
| **Best for** | Lip-syncing an existing video; fastest + smallest model |
| **Limitation** | Lower resolution mouth region; blurry around lips at times |

---

#### MuseTalk

| Property | Detail |
|----------|--------|
| **Technique** | Latent diffusion, audio-conditioned |
| **Input** | Portrait image + audio |
| **Motion** | Mouth + head movement |
| **Model size** | ~8 GB weights |
| **MPS (Apple Silicon)** | ❌ CUDA recommended |
| **Repo** | [TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk) |
| **Best for** | Higher quality than SadTalker; near real-time on good GPU |
| **Limitation** | Heavier GPU requirement; less macOS support |

---

#### VideoReTalking

| Property | Detail |
|----------|--------|
| **Technique** | Sequential editing network |
| **Input** | Face video + audio |
| **Motion** | Mouth only |
| **Model size** | ~1 GB |
| **Best for** | Re-dubbing existing talking-head videos with new audio |
| **Limitation** | Requires a face video, not just a still image |

---

#### GeneFace++

| Property | Detail |
|----------|--------|
| **Technique** | NeRF (Neural Radiance Field) |
| **Input** | 1–2 min training video of the person + audio |
| **Motion** | Full head rotation, natural expressions |
| **Model size** | Trained per-person (~500 MB per identity) |
| **GPU** | CUDA only — no MPS |
| **Best for** | Highest quality personalized avatar with training data |
| **Limitation** | Requires per-identity training (~30 min on A100); CUDA only |

---

### 3. General Video AI (Not Avatar-Specific)

These generate video from text/image prompts but can produce talking-head style content with the right prompt.

| Platform | Type | Avatar Support | API | Quality | Time | Cost |
|----------|------|----------------|-----|---------|------|------|
| **Runway ML Gen-3** | Text/image → video | ❌ Indirect (prompt-based) | ✅ REST | ⭐⭐⭐⭐⭐ | 30–90s | $0.05/s |
| **Pika Labs** | Text/image → video | ❌ Indirect | ✅ REST | ⭐⭐⭐⭐ | 20–60s | $8/mo |
| **Kling AI** | Text/image → video | ❌ Indirect | ✅ REST | ⭐⭐⭐⭐⭐ | 1–3 min | $10/mo |
| **Luma Dream Machine** | Text/image → video | ❌ Indirect | ✅ REST | ⭐⭐⭐⭐ | 1–2 min | $8/mo |
| **Stable Video Diffusion** | Image → video | ❌ No lip sync | ❌ Local only | ⭐⭐⭐ | 5–15 min local | Free |
| **Sora (OpenAI)** | Text → video | ❌ Indirect | ❌ No API | ⭐⭐⭐⭐⭐ | 2–5 min | $20/mo (ChatGPT Pro) |

> ⚠️ General video AI does not synchronise lips to audio — not suitable as a drop-in replacement for a talking-avatar pipeline without additional post-processing.

---

### 4. SaaS / No-Code Platforms

These are web apps with no programmatic API — useful for manual content creation but cannot be integrated into an automated pipeline.

| Platform | Avatar Types | Voice Clone | Max Video | Free Tier | Price |
|----------|-------------|-------------|-----------|-----------|-------|
| **Wondershare Virbo** | 150+ stock | ✅ | 5 min | ✅ 1 min | $19/mo |
| **Captions.ai** | Photo avatar | ✅ | 10 min | ✅ Limited | $13/mo |
| **Fliki** | Stock + photo | ✅ | Unlimited | ✅ 5 min/mo | $28/mo |
| **InVideo AI** | Stock | ❌ | 15 min | ✅ 4 exports | $25/mo |
| **Steve.ai** | Stock | ❌ | 5 min | ✅ 5 videos | $20/mo |

---

### 5. Full Decision Matrix

```mermaid
quadrantChart
    title Avatar Platform Selection
    x-axis Low Quality --> High Quality
    y-axis High Cost/Complexity --> Low Cost/Complexity
    quadrant-1 Best Value
    quadrant-2 Premium
    quadrant-3 Avoid
    quadrant-4 Hidden Gems
    Wav2Lip: [0.35, 0.80]
    SadTalker: [0.50, 0.75]
    LivePortrait: [0.65, 0.70]
    MuseTalk: [0.60, 0.55]
    GeneFace++: [0.80, 0.30]
    D-ID: [0.60, 0.60]
    Hedra: [0.65, 0.65]
    Elai.io: [0.65, 0.55]
    Colossyan: [0.70, 0.45]
    Tavus: [0.85, 0.50]
    HeyGen: [0.90, 0.40]
    Synthesia: [0.88, 0.35]
```

---

### 6. Integration Complexity vs Output Quality

```mermaid
xychart-beta
    title "Integration Effort (1=easy, 5=hard) vs Lip Sync Quality (1-5)"
    x-axis ["Wav2Lip", "SadTalker", "LivePortrait", "MuseTalk", "GeneFace++", "D-ID", "Hedra", "Elai", "Tavus", "HeyGen", "Synthesia"]
    y-axis "Score" 1 --> 5
    bar [2, 2.5, 3, 3.5, 5, 1.5, 1.5, 2, 1.5, 2, 2.5]
    line [3, 4, 4.5, 4, 4.5, 4, 4, 4, 5, 5, 4.5]
```

> **Bar = Integration effort** (lower = easier to integrate)
> **Line = Lip sync quality** (higher = better)

---

### 7. Choosing the Right Backend

```mermaid
flowchart TD
    START([What matters most?]) --> Q1{Need API\nintegration?}

    Q1 -->|No — manual tool OK| SaaS[SaaS Platforms\nFliki · Virbo · Captions.ai]
    Q1 -->|Yes — programmatic| Q2{Budget?}

    Q2 -->|Zero cost| Q3{Have a GPU?}
    Q2 -->|Some budget| Q4{Quality priority?}

    Q3 -->|Yes — CUDA| Q5{Need custom identity?}
    Q3 -->|Apple Silicon / CPU| LOCAL_FREE[SadTalker\nor LivePortrait]

    Q5 -->|Yes — train on person| GENEF[GeneFace++\nNeRF per-identity]
    Q5 -->|No — any portrait| Q6{Motion quality?}

    Q6 -->|Mouth sync enough| MUSETALK[Wav2Lip\nor MuseTalk]
    Q6 -->|Full face needed| LIVE[LivePortrait]

    Q4 -->|Speed over quality| DID[D-ID\nor Hedra]
    Q4 -->|Best quality| Q7{Custom brand avatar?}

    Q7 -->|Yes — clone my face/voice| TAVUS[Tavus ✅ Current]
    Q7 -->|Stock avatars OK| HEYGEN[HeyGen\nor Synthesia]

    style TAVUS fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style LOCAL_FREE fill:#052e16,stroke:#10b981,color:#d1fae5
    style HEYGEN fill:#1e1b4b,stroke:#a78bfa,color:#e0e7ff
    style SaaS fill:#1c1917,stroke:#78716c,color:#f5f5f4
```

---

### 8. Summary Scorecard

| Platform | Quality | Speed | Cost | API | Custom Avatar | Recommended For |
|----------|---------|-------|------|-----|---------------|-----------------|
| **Tavus** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 💲💲 | ✅ | ✅ Replica | Brand avatars, highest personalization |
| **HeyGen** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💲💲💲 | ✅ | ✅ Instant | Marketing, best overall quality |
| **Synthesia** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 💲💲💲 | ✅ Enterprise | ✅ Personal | Enterprise e-learning |
| **D-ID** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💲 | ✅ | ✅ Photo | Fast prototyping, budget |
| **Hedra** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💲 | ✅ Beta | ✅ Photo | Custom voice + photo |
| **Elai.io** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 💲💲 | ✅ | ✅ Photo | Mid-market, good API |
| **LivePortrait** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Free | ✅ Local | ✅ Any photo | Local, best OSS quality |
| **SadTalker** | ⭐⭐⭐⭐ | ⭐⭐⭐ | Free | ✅ Local | ✅ Any photo | Local, easiest OSS setup |
| **MuseTalk** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | ✅ Local | ✅ Any photo | Local + near real-time (CUDA) |
| **Wav2Lip** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free | ✅ Local | ✅ Any photo | Lightest model, re-dubbing |
| **GeneFace++** | ⭐⭐⭐⭐⭐ | ⭐⭐ | Free | ✅ Local | ✅ Trained | Highest local quality with training |
| **Runway Gen-3** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💲💲 | ✅ | ❌ No lip sync | Creative/cinematic, not avatar-specific |

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

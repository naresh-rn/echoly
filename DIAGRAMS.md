# Echoly — System Design Documentation

> All diagrams are rendered using Mermaid and are compatible with GitHub, Notion, and most modern markdown viewers.

---

## 1. Entity Relationship (ER) Diagram

Describes the database schema and relationships stored in MongoDB.

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string email
        string password
        boolean isAdmin
        Date createdAt
    }

    PROJECT {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string status
        Date createdAt
    }

    SOURCE {
        string type
        string url
        string publicId
        string rawTranscript
    }

    CONFIGURATION {
        string tone
        string language
        boolean useHashtags
    }

    ASSET {
        ObjectId _id PK
        string platform
        string content
        string status
        Date generatedAt
    }

    USER ||--o{ PROJECT : "owns"
    PROJECT ||--|| SOURCE : "has"
    PROJECT ||--|| CONFIGURATION : "configured by"
    PROJECT ||--o{ ASSET : "generates"
```

---

## 2. UML Class Diagram

Represents the relationship between backend models, services, controllers, and routes.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +Boolean isAdmin
        +Date createdAt
    }

    class Project {
        +ObjectId _id
        +ObjectId userId
        +String title
        +String status
        +Date createdAt
    }

    class Source {
        +String type
        +String url
        +String publicId
        +String rawTranscript
    }

    class Configuration {
        +String tone
        +String language
        +Boolean useHashtags
    }

    class Asset {
        +String platform
        +String content
        +String status
        +Date generatedAt
    }

    class AuthController {
        +registerUser(req, res)
        +loginUser(req, res)
    }

    class EngineController {
        +repurposeAll(req, res)
        +makeImage(req, res)
    }

    Project "1" -- "1" Source : contains
    Project "1" -- "1" Configuration : has
    Project "1" -- "*" Asset : produces
    User "1" -- "*" Project : owns
```

---

## 3. UML Sequence Diagram — Content Generation Flow

Illustrates the end-to-end interaction when a user generates content.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant Eng as Engine Controller
    participant AI as AI Service (Groq)
    participant Media as Media Service
    participant DB as MongoDB

    User->>FE: Enter title, paste content, select tone
    User->>FE: Click "Initialize Engine"
    FE->>BE: POST /api/repurpose-all [FormData + JWT]
    BE->>Eng: repurposeAll(req, res)
    Eng-->>FE: SSE: "Initializing Engine... 5%"

    alt Type = YouTube
        Eng->>Media: processYoutubeLink(url)
        Media-->>Eng: Transcript text
    else Type = Blog
        Eng->>Media: processBlogLink(url)
        Media-->>Eng: Scraped text
    else Type = Text
        Eng->>Eng: Use raw input directly
    end

    Eng-->>FE: SSE: "Content Secured. Starting AI Synthesis... 20%"

    loop For each platform
        Eng->>AI: generatePlatformText(platform, text, tone, useHashtags)
        AI-->>Eng: Generated post
        Eng-->>FE: SSE: partialResult[platform] = content
    end

    Eng-->>FE: SSE: "Archiving to Vault... 98%"
    Eng->>DB: project.save()
    DB-->>Eng: Project saved
    Eng-->>FE: SSE: { success: true, progress: 100 }
```

---

## 4. Data Flow Diagram (DFD) — Level 0 (Context Diagram)

Shows the top-level system interactions with external entities.

```mermaid
flowchart TB
    U[User]
    A[Admin]
    G[Groq API]
    C[Cloudinary]
    CF[Cloudflare Workers AI]
    M[MongoDB Atlas]
    YT[YouTube]
    W[Web Pages]

    U -- "Content + Settings" --> ECHOLY[ECHOLY System]
    ECHOLY -- "Generated Posts + AI Image" --> U

    A -- "Dashboard Requests" --> ECHOLY
    ECHOLY -- "User + Project Stats" --> A

    ECHOLY -- "Text Prompts" --> G
    G -- "AI-Generated Posts" --> ECHOLY

    ECHOLY -- "Media Files" --> C
    C -- "Secure CDN URLs" --> ECHOLY

    ECHOLY -- "Image Prompts" --> CF
    CF -- "Generated PNG" --> ECHOLY

    ECHOLY -- "CRUD Operations" --> M
    M -- "Documents + History" --> ECHOLY

    YT -- "Video Metadata/Transcript" --> ECHOLY
    W -- "Scraped HTML Content" --> ECHOLY
```

---

## 5. Data Flow Diagram (DFD) — Level 1 (System Internals)

Breaks down the internal processes within the Echoly backend.

```mermaid
flowchart LR
    subgraph Input_Sources
        D1[YouTube Link]
        D2[Blog URL]
        D4[Raw Text]
    end

    subgraph Content_Extraction
        P1A[yt-dlp Downloader]
        P1B[Cheerio Web Scraper]
        P1D[text reader]
    end

    subgraph AI_Synthesis_Engine
        P2[Groq Llama3 Generator]
        P2A[Platform Prompt Builder]
        P2B[Platform Posts]
    end

    subgraph Persistence_Layer
        P4[Mongoose Project Model]
        DB1[(MongoDB Projects)]
    end

    D1 --> P1A --> P2
    D2 --> P1B --> P2
    D4 -->        P2

    P2 --> P2A --> P2B --> P4 --> DB1
```

---

## 6. UML Use Case Diagram

Describes the functional capabilities by user role.

```mermaid
flowchart LR
    User[Regular User]
    Admin[Admin]

    subgraph Echoly_Platform
        UC1[Register / Login]
        UC2[Enter Content Source]
        UC3[Select Tone]
        UC6[Generate Content Bundle]
        UC11[View Asset History]
        UC15[View All Users]
        UC16[Monitor All Projects]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC6
    User --> UC11
    Admin --> UC1
    Admin --> UC15
    Admin --> UC16
```

---

## 7. System Architecture Diagram

Illustrates the deployment and layered architecture.

```mermaid
flowchart TB
    subgraph Client_Frontend ["Frontend Layer (React)"]
        A1[Dashboard]
        A2[Engine Workspace]
        A3[Vault Archive]
    end

    subgraph Server_Backend ["Backend Layer (Express)"]
        B1[API Router]
        B2[Auth Controller]
        B3[Engine Controller]
        B4[AI Service]
    end

    subgraph External_APIs ["External Services"]
        E1[Groq API]
        E2[Cloudinary]
        E3[Cloudflare AI]
    end

    subgraph Database_Layer ["Data Layer (MongoDB)"]
        F1[(Atlas Cluster)]
    end

    A1 --> B1
    B1 --> B2
    B1 --> B3
    B3 --> B4
    B4 --> E1
    B4 --> E3
    B3 --> F1
```

---

*Documentation updated for Echoly v1.0 — March 2026*

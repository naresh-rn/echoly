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
        +comparePassword(candidate) Boolean
    }

    class Project {
        +ObjectId _id
        +ObjectId userId
        +String title
        +Source source
        +Configuration configuration
        +Asset[] assets
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
        +getMe(req, res)
    }

    class EngineController {
        +repurposeAll(req, res)
        +repurposeSingle(req, res)
        +getImagePrompt(req, res)
        +makeImage(req, res)
    }

    class ProjectController {
        +getHistory(req, res)
        +updateAsset(req, res)
        +deleteProject(req, res)
        +deleteAsset(req, res)
        +deleteAllHistory(req, res)
    }

    class AdminController {
        +getAllUsers(req, res)
        +getAllProjects(req, res)
    }

    class AIService {
        +generatePlatformText(platformId, text, tone, useHashtags) String
        +generateImagePrompt(content) String
        +generateImage(prompt) Object
    }

    class MediaService {
        +processYoutubeLink(url, dir, sendUpdate) String
        +processBlogLink(url, sendUpdate) String
        +uploadToCloudinary(filePath) Object
        +parsePdf(filePath) Object
    }

    class AuthMiddleware {
        +auth(req, res, next)
        +adminAuth(req, res, next)
    }

    Project "1" --> "1" Source : contains
    Project "1" --> "1" Configuration : has
    Project "1" --> "*" Asset : produces
    User "1" --> "*" Project : owns

    EngineController ..> AIService : uses
    EngineController ..> MediaService : uses
    EngineController ..> Project : creates
    ProjectController ..> Project : manages
    AdminController ..> User : reads
    AdminController ..> Project : reads
    AuthController ..> User : manages
    AuthMiddleware ..> User : validates
```

---

## 3. UML Sequence Diagram — Content Generation Flow

Illustrates the end-to-end interaction when a user generates content.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant Auth as Auth Middleware
    participant Eng as Engine Controller
    participant AI as AI Service (Groq)
    participant Media as Media Service
    participant CF as Cloudflare AI
    participant DB as MongoDB

    User->>FE: Enter title, paste content, select tone
    User->>FE: Click "Initialize Engine"
    FE->>BE: POST /api/repurpose-all [FormData + JWT]
    BE->>Auth: Verify JWT token
    Auth-->>BE: User verified (req.user)
    BE->>Eng: repurposeAll(req, res)
    Eng-->>FE: SSE: "Initializing Engine... 5%"

    alt Type = YouTube
        Eng->>Media: processYoutubeLink(url)
        Media-->>Eng: Transcript text
    else Type = Blog
        Eng->>Media: processBlogLink(url)
        Media-->>Eng: Scraped text
    else Type = File (Audio/Video)
        Eng->>Media: uploadToCloudinary(filePath)
        Eng->>AI: groq.audio.transcriptions(file)
        AI-->>Eng: Transcript text
    else Type = PDF
        Eng->>Media: parsePdf(filePath)
        Media-->>Eng: Parsed text
    else Type = Text
        Eng->>Eng: Use raw input directly
    end

    Eng-->>FE: SSE: "Content Secured. Starting AI Synthesis... 20%"

    loop For each of 12 platforms
        Eng->>AI: generatePlatformText(platform, text, tone, useHashtags)
        AI-->>Eng: Generated post
        Eng-->>FE: SSE: partialResult[platform] = content
    end

    Eng-->>FE: SSE: "Archiving to Vault... 98%"
    Eng->>DB: project.save() → MongoDB 'projects' collection
    DB-->>Eng: Project saved with _id

    Eng-->>FE: SSE: { success, bundle, projectId, progress: 100 }
    FE->>CF: POST /generate-image (using mission title)
    CF-->>FE: base64 image
    FE->>FE: Display all ResultCards + AI Image
```

---

## 4. Data Flow Diagram (DFD) — Level 0 (Context Diagram)

Shows the top-level system interactions with external entities.

```mermaid
flowchart TB
    User(["👤 User"])
    Admin(["🛡️ Admin"])
    Groq(["🤖 Groq API"])
    Cloudinary(["☁️ Cloudinary"])
    Cloudflare(["🌩️ Cloudflare Workers AI"])
    MongoDB(["🍃 MongoDB Atlas"])
    YouTube(["▶️ YouTube"])
    Web(["🌐 Web Pages"])

    User -- "Content + Settings" --> ECHOLY["⚡ ECHOLY System"]
    ECHOLY -- "Generated Posts + AI Image" --> User

    Admin -- "Dashboard Requests" --> ECHOLY
    ECHOLY -- "User + Project Stats" --> Admin

    ECHOLY -- "Text Prompts" --> Groq
    Groq -- "AI-Generated Posts" --> ECHOLY

    ECHOLY -- "Media Files" --> Cloudinary
    Cloudinary -- "Secure CDN URLs" --> ECHOLY

    ECHOLY -- "Image Prompts" --> Cloudflare
    Cloudflare -- "Generated PNG" --> ECHOLY

    ECHOLY -- "CRUD Operations" --> MongoDB
    MongoDB -- "Documents + History" --> ECHOLY

    YouTube -- "Video Metadata/Transcript" --> ECHOLY
    Web -- "Scraped HTML Content" --> ECHOLY
```

---

## 5. Data Flow Diagram (DFD) — Level 1 (System Internals)

Breaks down the internal processes within the Echoly backend.

```mermaid
flowchart LR
    subgraph Input Sources
        D1[(YouTube Link)]
        D2[(Blog URL)]
        D3[(File Upload)]
        D4[(Raw Text)]
    end

    subgraph Process 1: Content Extraction
        P1A[yt-dlp Downloader]
        P1B[Cheerio Web Scraper]
        P1C[Multer + Groq Whisper]
        P1D[pdf-parse / text reader]
    end

    subgraph Process 2: AI Synthesis Engine
        P2[Groq Llama3 Generator]
        P2A[Platform Prompt Builder]
        P2B[12x Platform Posts]
    end

    subgraph Process 3: Visual Engine
        P3A[Groq Image Prompt Creator]
        P3B[Cloudflare SDXL Lightning]
        P3C[Base64 PNG Output]
    end

    subgraph Process 4: Persistence Layer
        P4[Mongoose Project Model]
        DB1[(MongoDB Projects)]
    end

    subgraph Process 5: Auth & Security
        P5A[JWT Verifier]
        P5B[bcrypt Password Hasher]
        DB2[(MongoDB Users)]
    end

    D1 --> P1A --> P2
    D2 --> P1B --> P2
    D3 --> P1C --> P2
    D4 -->        P2

    P2 --> P2A --> P2B --> P4 --> DB1
    P2B --> P3A --> P3B --> P3C

    P5A --> P2
    DB2 --> P5A
    P5B --> DB2
```

---

## 6. UML Use Case Diagram

Describes the functional capabilities by user role.

```mermaid
flowchart LR
    User(["👤 Regular User"])
    Admin(["🛡️ Admin"])

    subgraph Echoly Platform
        UC1["Register / Login"]
        UC2["Enter Content Source"]
        UC3["Select Tone & Settings"]
        UC4["Toggle Hashtags"]
        UC5["Name Mission (Title)"]
        UC6["Generate Content Bundle"]
        UC7["View Real-time Progress"]
        UC8["Edit / Copy / Share Posts"]
        UC9["Regenerate Single Platform"]
        UC10["Generate AI Visual Image"]
        UC11["View Asset History"]
        UC12["Restore Past Project"]
        UC13["Delete Project / Asset"]
        UC14["Download Export Report"]
        UC15["View All Users (Admin)"]
        UC16["Monitor All Projects (Admin)"]
        UC17["Manage User Roles (Admin)"]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    Admin --> UC1
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
```

---

## 7. System Architecture Diagram

Illustrates the deployment and layered architecture.

```mermaid
flowchart TB
    subgraph Client ["🖥️ Frontend Layer (React)"]
        A1[Dashboard.js] --> A2[EngineWorkspace.js]
        A1 --> A3[VaultArchive.js]
        A1 --> A4[AdminDashboard.js]
        A1 --> A5[ResultCard.js]
    end

    subgraph Server ["🗄️ Backend Layer (Express / Node.js)"]
        B1[index.js - Server Entry] --> B2[authRoute.js]
        B1 --> B3[engineRoute.js]
        B1 --> B4[projectRoute.js]
        B1 --> B5[adminRoute.js]

        B2 --> C1[authController.js]
        B3 --> C2[engineController.js]
        B4 --> C3[projectController.js]
        B5 --> C4[adminController.js]

        C2 --> D1[aiService.js]
        C2 --> D2[mediaService.js]
    end

    subgraph External ["☁️ External APIs"]
        E1[Groq LLM API]
        E2[Groq Whisper API]
        E3[Cloudinary CDN]
        E4[Cloudflare Workers AI]
        E5[YouTube / yt-dlp]
    end

    subgraph Database ["🍃 Data Layer (MongoDB Atlas)"]
        F1[(users collection)]
        F2[(projects collection)]
    end

    Client -- "HTTP / SSE" --> Server
    D1 <--> E1
    D1 <--> E2
    D2 <--> E3
    D1 <--> E4
    D2 <--> E5
    C1 <--> F1
    C2 <--> F2
    C3 <--> F2
    C4 <--> F1
    C4 <--> F2
```

---

## 8. Authentication Flow Diagram

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant Auth as Auth Controller
    participant DB as MongoDB

    User->>FE: Input email + password
    FE->>Auth: POST /api/auth/login
    Auth->>DB: Find user by email
    DB-->>Auth: User document
    Auth->>Auth: bcrypt.compare(password, hash)

    alt Password matches
        Auth->>Auth: jwt.sign({ id, isAdmin }, secret)
        Auth-->>FE: { token, user: { name, isAdmin } }
        FE->>FE: localStorage.setItem("token", token)
        FE->>FE: Redirect to /dashboard
    else Password mismatch
        Auth-->>FE: 401 - Invalid credentials
        FE->>FE: Show error notification
    end

    Note over FE,Auth: Subsequent API requests use<br/>"x-auth-token: Bearer {token}" header

    FE->>Auth: GET /api/auth/me [x-auth-token]
    Auth->>Auth: jwt.verify(token, secret)
    Auth->>DB: findById(decoded.id)
    DB-->>Auth: User document
    Auth-->>FE: User data { name, email, isAdmin }
```

---

*Diagrams generated for Echoly v1.0 — March 2026*

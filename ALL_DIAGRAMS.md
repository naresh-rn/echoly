# Echoly — Master Architectural & Design Documentation

This document contains a comprehensive set of UML, Behavioral, and Architectural diagrams representing the Echoly system in its entirety.

---

## 🏗️ 1. Structural Diagrams

### 1.1 Class Diagram
Describes the static structure showing classes, attributes, operations, and relationships.

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

    Project "1" -- "1" Source : contains
    Project "1" -- "1" Configuration : has
    Project "1" -- "*" Asset : produces
    User "1" -- "*" Project : owns
```

### 1.2 Component Diagram
Shows how the system is divided into physical components and their dependencies.

```mermaid
componentDiagram
    component [Frontend App (React)] as FE
    component [Auth Service] as Auth
    component [Generation Engine] as Engine
    component [Media Processor] as Media
    component [Database (MongoDB)] as DB
    component [Groq API] as AI
    component [Cloudinary] as CDN
    component [Cloudflare AI] as Visual

    FE ..> Auth : JWT Request
    FE ..> Engine : SSE Request
    Engine ..> Media : Extract Content
    Engine ..> AI : Llama 3.1
    Engine ..> DB : Persist Project
    Media ..> CDN : Upload
    FE ..> Visual : Image Gen
```

### 1.3 Deployment Diagram
Illustrates the physical deployment of artifacts on nodes.

```mermaid
deploymentDiagram
    node "User Browser" {
        artifact "React SPA"
    }
    node "Vercel / Hosting" {
        node "Server Container" {
            artifact "Node.js Express API"
        }
    }
    node "MongoDB Atlas Cluster" {
        database "Echoly_DB"
    }
    node "Third Party Edge" {
        node "Groq Inference"
        node "Cloudflare Workers AI"
        node "Cloudinary"
    }

    "React SPA" -- "HTTPS/WSS" : "Node.js Express API"
    "Node.js Express API" -- "Mongoose" : "Echoly_DB"
```

### 1.4 Object Diagram
A snapshot of instances and their relationships at a specific point in time.

```mermaid
objectDiagram
    object "UserInstance : User" as U1 {
        id: "usr_101"
        name: "Admin"
    }
    object "ProjectInstance : Project" as P1 {
        id: "prj_202"
        title: "Q3 Marketing"
        status: "COMPLETED"
    }
    object "LinkedinAsset : Asset" as A1 {
        platform: "LINKEDIN"
        content: "Thrilled to share..."
    }

    U1 .. P1 : owns
    P1 .. A1 : contains
```

### 1.5 Package Diagram
Organizes system elements into packages and shows dependencies.

```mermaid
packageDiagram
    package "Client-Side" {
        [Components]
        [Hooks]
        [Services]
    }
    package "Server-Side" {
        [Routes]
        [Controllers]
        [Middleware]
        [Services]
        [Models]
    }
    package "External-Infrastructure" {
        [Database]
        [AI-Providers]
    }

    "Client-Side" ..> "Server-Side" : REST / SSE
    "Server-Side" ..> "External-Infrastructure" : API Calls
```

### 1.6 Composite Structure Diagram
Shows the internal structure of the AI Engine component and its ports.

```mermaid
flowchart TB
    subgraph AIEngine ["Engine Component"]
        Port1[Input Port]
        Port2[Output Port]
        subgraph Internal ["Internal Parts"]
            L1[Data Extractor]
            L2[Content Synthesizer]
            L3[Asset Bundler]
        end
    end
    Source --> Port1
    Port1 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> Port2
    Port2 --> Storage
```

### 1.7 Profile Diagram
Illustrates extensions of UML elements for AI-specific stereotypes.

```mermaid
classDiagram
    class Prototype {
        <<Stereotype>>
    }
    class AI_Agent {
        <<LLM_Powered>>
        +Temperature
        +Top_P
    }
    class Media_Asset {
        <<Cloud_Stored>>
        +CDN_URL
    }
    AI_Agent --|> Prototype
    Media_Asset --|> Prototype
```

---

## 🎬 2. Behavioral Diagrams

### 2.1 Use Case Diagram
Functional requirements from the perspective of user roles.

```mermaid
flowchart LR
    User(["User"])
    Admin(["Admin"])

    subgraph Platform
        UC1[Create Mission]
        UC2[Paste YT/Blog/Media]
        UC3[Select AI Tone]
        UC4[View Progress]
        UC5[Edit Assets]
        UC6[Manage Users]
        UC7[View Global Feed]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    Admin --> UC6
    Admin --> UC7
```

### 2.2 Activity Diagram
The step-by-step workflow of a generation mission.

```mermaid
stateDiagram-v2
    [*] --> InputReceived
    InputReceived --> ContentExtraction : Source Type Detected
    state ContentExtraction {
        [*] --> DownloadYT
        [*] --> ScrapeBlog
        [*] --> ParsePDF
        [*] --> TranscribeAudio
    }
    ContentExtraction --> AISynthesis : Clean Text Ready
    AISynthesis --> GeneratingAssets : Iterate 12 Platforms
    GeneratingAssets --> SavingToDB : Bundling Ready
    SavingToDB --> Completed
    Completed --> [*]
```

### 2.3 Sequence Diagram
Timed interaction between objects for the "Repurpose All" flow.

```mermaid
sequenceDiagram
    actor User
    participant App as React UI
    participant Svr as Express Server
    participant AI as Llama 3.1
    participant DB as MongoDB

    User->>App: Clicks "Initialize"
    App->>Svr: POST /api/repurpose-all
    Note right of Svr: SSE Connection Open
    Svr-->>App: SSE: Starting (5%)
    Svr->>AI: Generate Social Posts
    AI-->>Svr: Content Received
    Svr-->>App: SSE: Platform Ready (50%)
    Svr->>DB: Save Project
    DB-->>Svr: OK
    Svr-->>App: SSE: Completed (100%)
```

### 2.4 State Machine Diagram
Tracks the lifecycle of a Project document.

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> INITIALIZING : User clicks generate
    INITIALIZING --> EXTRACTING : Source processing
    EXTRACTING --> SYNTHESIZING : AI engine working
    SYNTHESIZING --> COMPLETED : Success
    SYNTHESIZING --> FAILED : Error detected
    FAILED --> DRAFT : Retry
    COMPLETED --> ARCHIVED : User deletes
    ARCHIVED --> [*]
```

### 2.5 Communication Diagram
Focuses on object relationships and message exchange.

```mermaid
graph LR
    User -- "1. Initialize" --> UI[React UI]
    UI -- "2. POST Request" --> Svr[Express Server]
    Svr -- "3. Transcribe" --> Media[Media Service]
    Media -- "4. Transcription" --> Svr
    Svr -- "5. Synthesis" --> AI[Groq AI]
    AI -- "6. Social Assets" --> Svr
    Svr -- "7. Persist" --> DB[(MongoDB)]
```

### 2.6 Interaction Overview Diagram
Combines activity and sequence elements for high-level control.

```mermaid
flowchart TD
    Start --> Auth{Is Authenticated?}
    Auth -- No --> Login[Login Flow]
    Auth -- Yes --> Input[Input Content]
    Input --> Process[Ref: Sequence Diagram - Generation]
    Process --> Result{Success?}
    Result -- Yes --> Display[Show Results]
    Result -- No --> Error[Show Error]
    Display --> End
    Login --> Auth
```

### 2.7 Timing Diagram
Visualizes state changes over a time window.

```mermaid
timeline
    title Generation Timing Window (60s)
    0-15s : Extraction State : Processing input media
    15-55s : Synthesis State : AI generating social bundles
    55-60s : Persisting State : Saving to Mongo and final SSE
```

---

## 🗺️ 3. Architectural & Data Diagrams

### 3.1 Entity Relationship Diagram (ERD)
Logical data model for the application.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ ASSET : generates
    PROJECT {
        string title
        string status
        object source
        object configuration
    }
    ASSET {
        string platform
        string content
        date generatedAt
    }
```

### 3.2 Data Flow Diagram (DFD) — Level 1
Data movements through internal processes.

```mermaid
flowchart LR
    Input([Raw Source]) --> P1[Extraction Process]
    P1 -->|Clean Text| P2[LLM Synthesis]
    P2 -->|Draft Assets| P3[Visual Engine]
    P2 -->|Draft Assets| P4[Storage Engine]
    P4 <--> DB[(MongoDB)]
    P3 --> UI([Frontend View])
    P4 --> UI
```

### 3.3 C4 System Context Diagram
High-level system abstraction.

```mermaid
C4Context
    title System Context Diagram for Echoly
    
    Person(user, "Content Creator", "Wants to repurpose long content.")
    System(echoly, "Echoly AI Platform", "Processes media and generates social posts.")
    
    System_Ext(groq, "Groq AI", "LLM Inference Engine.")
    System_Ext(cloudflare, "Cloudflare AI", "Image Generation.")
    System_Ext(db, "MongoDB Atlas", "Data Persistence.")

    Rel(user, echoly, "Uses", "HTTPS")
    Rel(echoly, groq, "Requests Text", "JSON/API")
    Rel(echoly, cloudflare, "Requests Visuals", "JSON/API")
    Rel(echoly, db, "Saves History", "Mongoose")
```

### 3.4 C4 Container Diagram
Technical containers in the system.

```mermaid
C4Container
    title Container Diagram for Echoly System
    
    Person(user, "User", "Content Creator.")
    
    System_Boundary(c1, "Echoly AI Platform") {
        Container(web_app, "Web Application", "React", "Provides UI.")
        Container(api, "API Application", "Node.js, Express", "Handles business logic.")
        ContainerDb(db, "Database", "MongoDB Atlas", "Stores history.")
    }
    
    Rel(user, web_app, "Uses", "HTTPS")
    Rel(web_app, api, "API Calls", "JSON")
    Rel(api, db, "Read/Write", "Mongoose")
```

### 3.5 C4 Component Diagram
Components within the API container.

```mermaid
C4Component
    title Component Diagram for API Application
    
    Container(web_app, "Web Application", "React", "User Interface.")
    
    Container_Boundary(api, "API Application") {
        Component(auth_ctrl, "Auth Controller", "Express", "Handles login.")
        Component(eng_ctrl, "Engine Controller", "Express", "Manages logic.")
        Component(ai_svc, "AI Service", "Groq SDK", "LLM interface.")
    }
    
    ContainerDb(db, "Database", "MongoDB", "Data Storage.")
    
    Rel(web_app, eng_ctrl, "Starts Mission", "SSE")
    Rel(eng_ctrl, ai_svc, "Requests Synthesis")
    Rel(eng_ctrl, db, "Persists Project")
```

### 3.6 Flowchart: Generation Logic
Detailed conditional flow of the backend engine.

```mermaid
flowchart TD
    Start([Start Generation]) --> CheckSource{Source Type?}
    CheckSource -->|File| Upload[Cloudinary Upload]
    CheckSource -->|URL| Scrape[Scrape/Download]
    Upload --> Transcript[Groq Whisper]
    Scrape --> Text[Clean Text]
    Transcript --> AI[AI Synthesis Loop]
    Text --> AI
    AI --> Save[Save to MongoDB]
    Save --> End([End Mission])
```

---
*Generated for Echoly v1.0 — Architecture Dossier*

# S3-Karo System Architecture

## High-Level Design

![System Architecture Diagram](public/system-architecture.png)

## User Flow Diagram

![User Flow Diagram](public/system-flow.png)

## How it Works (Simple)

### 🔵 Private S3 Mode (Your Keys, Your Data)
*   **Direct Sync**: Your browser talks directly to AWS S3.
*   **No Middlemen**: We don't see your files. No database is used.
*   **Secure**: Keys stay on your device (Encrypted).

### 🔴 Managed Storage Mode (Our Cloud)
*   **Full Service**: We handle the storage and database for you.
*   **Easy**: Just upload and go. We manage the complexity.

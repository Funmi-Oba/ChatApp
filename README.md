# ChatApp — End-to-End Encrypted Messaging

## Live Demo
[]

## Architecture
- Frontend: React + Vite + Tailwind CSS
- Backend: WhisperBox API (https://whisperbox.koyeb.app)
- Encryption: Web Crypto API

## Encryption Flow
1. On register: RSA-OAEP keypair generated on client
2. Private key wrapped with AES-GCM derived from password via PBKDF2
3. Only wrapped private key + public key sent to server
4. On send: message encrypted with random AES-GCM key
5. AES key encrypted with recipient RSA public key
6. Server stores only ciphertext — never sees plaintext

## Key Management
- Private key: Never leaves the device, stored in IndexedDB
- Public key: Stored on server for key exchange
- Wrapping key: Derived from password using PBKDF2 (100,000 iterations)
- Salt: Randomly generated, stored on server

## Architecture Diagram
Client                          Server
──────                          ──────
Generate RSA keypair
Wrap private key (AES-GCM)  →  Store wrapped key + public key
Store encrypted messages
Encrypt message (AES-GCM)   →  Forward ciphertext only
Decrypt with private key    ←  Return ciphertext

## Security Trade-offs
- Private key in IndexedDB: Cleared on logout, never in localStorage
- Password-based wrapping: Security depends on password strength
- No perfect forward secrecy (bonus feature)

## Known Limitations
- Login requires username (not email)
- Private keys lost if browser storage cleared
- No multi-device support

## Tech Stack
- React + Vite
- Tailwind CSS
- Web Crypto API (native browser)
- IndexedDB for key storage
- WebSocket for real-time messaging
- RSA-OAEP + AES-GCM hybrid encryption
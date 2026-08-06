# Dersim - Ders Çalışma Paneli

## Original Problem
Turkish student wanted an app to upload PDFs per course, view them in tabs, save links, auto-save everything, and drag-and-drop lesson ordering to decide what to study next.

## Architecture
- Backend: FastAPI + MongoDB (Motor), JWT auth via httpOnly cookies, bcrypt password hashing
- Frontend: React (Router v7), sonner toasts, @dnd-kit for drag-and-drop, @phosphor-icons/react
- Storage: Emergent object storage (`INTEGRATION_PROXY_URL` + `EMERGENT_LLM_KEY`) for PDFs
- Design: Neo-brutalist pastel light theme (Bricolage Grotesque + DM Sans)

## Users
- Single-tenant multi-user: each authenticated user has their own courses/PDFs/links/notes.

## Core Requirements (static)
1. Email/password auth (register + login + logout)
2. Add / rename / delete courses ("dersler")
3. Manual drag-and-drop ordering of courses = study queue
4. Per-course tabbed view: PDFler, Linkler, Notlar
5. PDF upload (up to 25MB) with drop zone + list, open + delete
6. Save link (title + URL + description) with auto-http prefix
7. Notes textarea with debounced auto-save + "Otomatik Kaydedildi" indicator

## Implemented (Feb 2026)
- Auth: register/login/logout/me with httpOnly cookies, seeded admin (admin@dersim.app / Admin123!)
- MongoDB indexes: users.email unique, courses (user_id, position), links, pdfs
- Courses CRUD + reorder endpoint
- Links CRUD scoped per course
- PDFs: upload to Emergent object storage, download via backend proxy, soft delete
- Frontend: brutalist UI in Turkish, drag-drop sidebar queue, tabbed detail view, debounced notes autosave
- Auth-gated routes, protected + public-only route wrappers

## Backlog (P1/P2)
- P1: PDF thumbnails / inline preview modal
- P1: Search across courses/links/PDFs
- P1: Study session timer + streak stats
- P2: Reminders / study schedule with calendar
- P2: Sharing a course pack (read-only) via link
- P2: Mobile app polish + PWA install
- P2: OCR / AI summary of uploaded PDF chapters

## Test Credentials
See `/app/memory/test_credentials.md`

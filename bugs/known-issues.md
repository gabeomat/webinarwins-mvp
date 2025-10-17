# Known Issues & Limitations

**Last Updated:** October 16, 2025

This document tracks known issues, limitations, and their workarounds for WebinarWins MVP.

## Current Version: MVP Development

### Planned Limitations (By Design)

These are intentional limitations for the MVP:

#### Authentication
- **Issue:** No authentication system in place
- **Impact:** Anyone with the URL can access the application
- **Workaround:** Run locally only for now
- **Future:** Implement Google OAuth in Phase 1 (post-vertical slice)
- **Status:** Planned feature

#### Database
- **Issue:** Using SQLite instead of PostgreSQL
- **Impact:** Not suitable for production with multiple concurrent users
- **Workaround:** Single-user development environment
- **Future:** Migrate to PostgreSQL before production deployment
- **Status:** Planned migration

#### Email Sending
- **Issue:** No automatic email sending
- **Impact:** Emails must be manually copied or exported
- **Workaround:** Export to CSV and import to email service provider
- **Future:** Integrate with SendGrid for direct sending
- **Status:** Planned feature

#### File Size Limits
- **Issue:** Large CSV files (>10MB) not tested
- **Impact:** May cause timeouts or memory issues
- **Workaround:** Process smaller webinars first (<100 attendees)
- **Future:** Implement chunked processing for large files
- **Status:** To be addressed if needed

### Known Bugs

None yet. Bugs will be documented here as they are discovered.

---

## Resolved Issues

Issues that have been fixed will be listed here with their resolution date and summary.

### Example Entry (Template)
**[Date]** - Brief description of issue
- **Solution:** How it was fixed
- **Files Changed:** List of modified files
- **See:** `bugs/resolved/YYYY-MM-DD-description.md` for details

---

## Feature Requests

Features requested by team but not in current scope:

*None yet*

---

## Update History

- 2025-10-16: Initial document created


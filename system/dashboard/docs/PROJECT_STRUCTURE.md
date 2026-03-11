# Dashboard Project Structure Pattern

**For all future projects in OliverRepo, follow this structure:**

```
system/[project-name]/
├── docs/
│   ├── PRD.md                 (Product requirements)
│   ├── ROADMAP.md             (Phased delivery plan)
│   └── PHASE[N]_COMPLETE.md   (Implementation summary for each phase)
├── src/
│   ├── components/
│   ├── styles/
│   └── main.jsx
├── README.md                   (Dev guide, quick start)
├── package.json
├── [project-specific config files]
└── dist/                       (Build output, in .gitignore)
```

**Key Rule:**
- **NO `system/docs/` directory for shared docs**
- **Each project owns its own `/docs` folder**
- This makes projects portable and self-contained

**Why:**
- When you copy a project elsewhere, all docs travel with it
- Clear ownership — no confusion about which docs belong to which project
- Easy to scale — add new projects without cluttering system-level directories

---

*Pattern established: 2026-03-10 (Dashboard Phase 1)*
*Apply to all future projects.*

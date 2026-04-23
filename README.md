# attendance

考勤管理系統

## Quick Start

1. **Read CLAUDE.md first** - Contains essential rules for Claude Code
2. Follow the pre-task compliance checklist before starting any work
3. Use proper module structure under `src/main/ts/`
4. Commit after every completed task

## Project Structure

```
attendance/
├── CLAUDE.md              # Essential rules for Claude Code
├── README.md              # Project documentation
├── .gitignore             # Git ignore patterns
├── src/
│   ├── main/
│   │   └── ts/
│   │       ├── core/      # Core business logic
│   │       ├── utils/     # Utility functions
│   │       ├── models/    # Data models/entities
│   │       ├── services/  # Service layer
│   │       └── api/       # API endpoints/interfaces
│   └── test/
│       ├── unit/          # Unit tests
│       └── integration/   # Integration tests
├── docs/                  # Documentation
├── tools/                 # Development tools and scripts
├── examples/              # Usage examples
├── output/                # Generated output files
├── openspec/              # OpenSpec specifications
└── .openspec/             # OpenSpec configuration
```

## Development Guidelines

- **Always search first** before creating new files
- **Extend existing** functionality rather than duplicating
- **Use Task agents** for operations >30 seconds
- **Single source of truth** for all functionality
- **Commit after each feature**

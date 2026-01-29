# Session Management

Browser session management features for the `agent-browser` CLI tool.

## Named Sessions

Use `--session` flag to run isolated browser contexts:

```bash
agent-browser --session agent1 open site-a.com
agent-browser --session agent2 open site-b.com

# Via environment variable
AGENT_BROWSER_SESSION=agent1 agent-browser click "#btn"

# List active sessions
agent-browser session list

# Show current session
agent-browser session
```

## Session Isolation

Each session maintains independent:
- Cookies
- localStorage
- sessionStorage
- IndexedDB
- Cache
- Browsing history
- Tabs

## State Persistence

Sessions can be saved to JSON files and restored later:

```bash
# Save current session state
agent-browser state save ./session-state.json

# Load saved state
agent-browser state load ./session-state.json
```

State file contains:
```json
{
  "cookies": [...],
  "localStorage": {...},
  "sessionStorage": {...},
  "origins": [...]
}
```

## Common Use Cases

### Authenticated Session Reuse

```bash
# First run: login and save state
agent-browser --session myapp open https://app.example.com/login
agent-browser --session myapp snapshot -i
agent-browser --session myapp fill @e1 "user@example.com"
agent-browser --session myapp fill @e2 "password"
agent-browser --session myapp click @e3
agent-browser --session myapp wait --url "**/dashboard"
agent-browser --session myapp state save ./myapp-auth.json

# Later runs: restore state
agent-browser --session myapp state load ./myapp-auth.json
agent-browser --session myapp open https://app.example.com/dashboard
```

### Concurrent Scraping

```bash
# Run multiple sessions in parallel
agent-browser --session scraper1 open https://site.com/page1 &
agent-browser --session scraper2 open https://site.com/page2 &
agent-browser --session scraper3 open https://site.com/page3 &
wait

# Process each session
for i in 1 2 3; do
    agent-browser --session "scraper$i" snapshot -i
    agent-browser --session "scraper$i" get text body > "output$i.txt"
done
```

### A/B Testing

```bash
# Test variant A
agent-browser --session variant-a open https://site.com?variant=a
agent-browser --session variant-a screenshot ./variant-a.png

# Test variant B
agent-browser --session variant-b open https://site.com?variant=b
agent-browser --session variant-b screenshot ./variant-b.png
```

## Default Session

Commands without `--session` flag use a default session:

```bash
# These use the same default session
agent-browser open https://example.com
agent-browser snapshot -i
agent-browser click @e1
```

## Best Practices

1. **Use semantic session names** (e.g., `github-auth` rather than `s1`)
2. **Always close sessions when finished** to free resources
3. **Handle state files securely** - don't commit them as they contain auth tokens
4. **Set timeouts for automated scripts** to prevent hanging sessions

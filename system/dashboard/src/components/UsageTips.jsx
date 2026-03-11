export default function UsageTips() {
  return (
    <div className="panel card">
      <h2>Claude Code vs OpenClaw Guide</h2>
      <p className="panel-subtitle">Quick cheat sheet for when to use each agent</p>

      <div className="tips-grid">
        <div className="tip-card claude">
          <h3>Claude Code</h3>
          <p className="tip-subtitle">Local execution & logic</p>
          <ul>
            <li>Write and refactor code</li>
            <li>Run tests and catch bugs</li>
            <li>Architecture & design decisions</li>
            <li>Local file processing</li>
            <li>Git operations</li>
          </ul>
          <p className="tip-fallback">
            Falls back to: <strong>OpenClaw</strong> (real-time data, APIs, research)
          </p>
        </div>

        <div className="tip-card openclaw">
          <h3>OpenClaw</h3>
          <p className="tip-subtitle">Real-time data & APIs</p>
          <ul>
            <li>Fetch web data & current info</li>
            <li>Call external APIs</li>
            <li>Market research & analysis</li>
            <li>Integration planning</li>
            <li>Platform knowledge</li>
          </ul>
          <p className="tip-fallback">
            Falls back to: <strong>Claude Code</strong> (logic, testing, review)
          </p>
        </div>
      </div>

      <div className="model-guide card model-guide-card">
        <h3>Model Selection Guide</h3>
        <div className="model-table">
          <div className="model-row">
            <div className="model-col model-default">
              <strong>Haiku</strong>
              <p>Default for everything — cheap, fast, sufficient</p>
            </div>
            <div className="model-col">
              <div className="task-badge">Code implementation</div>
              <div className="task-badge">File reads</div>
              <div className="task-badge">Testing</div>
            </div>
          </div>

          <div className="model-row">
            <div className="model-col">
              <strong>Sonnet</strong>
              <p>Upgrade only for complex reasoning</p>
            </div>
            <div className="model-col">
              <div className="task-badge sonnet">Architecture design</div>
              <div className="task-badge sonnet">Complex refactor</div>
              <div className="task-badge sonnet">Design reasoning</div>
            </div>
          </div>

          <div className="model-row">
            <div className="model-col">
              <strong>Opus</strong>
              <p>Never — too expensive</p>
            </div>
            <div className="model-col">
              <p className="warn">Use Sonnet instead</p>
            </div>
          </div>
        </div>
      </div>

      <div className="token-rules card">
        <h3>Token Optimization Rules</h3>
        <ul>
          <li>Every response reports: <code>[Model: haiku-4-5 | Tokens: ~XXX]</code></li>
          <li>Max 3 files read per startup (unless task requires more)</li>
          <li>Never read all MDs in a directory</li>
          <li>Before creating file, check if duplicate exists</li>
          <li>Suggest downgrade after complex task: "Can switch to Haiku for follow-up"</li>
        </ul>
      </div>
    </div>
  )
}

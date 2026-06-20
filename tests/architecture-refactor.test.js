const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");

const root = path.join(__dirname, "..");

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

test("primary navigation contains the four war-room routes", () => {
  const config = readProjectFile("_config.yml");
  const links = [...config.matchAll(/^\s+- title:\s+(.+)\n\s+url:\s+(.+)$/gm)];

  assert.deepEqual(
    links.map((match) => [match[1], match[2]]),
    [
      ["Home", "/"],
      ["Manifesto", "/manifesto/"],
      ["Architecture", "/architecture/"],
      ["Proof", "/proof/"],
    ],
  );
});

test("posts use the architecture permalink namespace", () => {
  const config = readProjectFile("_config.yml");

  assert.match(config, /^permalink:\s+\/architecture\/:year\/:month\/:day\/:title\/$/m);
});

test("default shell does not load Bootstrap, jQuery, or site animation scripts", () => {
  const base = readProjectFile("_layouts/base.html");
  const head = readProjectFile("_includes/head.html");

  assert.doesNotMatch(base, /bootstrap|jquery|main\.js|nav-enhancements/i);
  assert.doesNotMatch(head, /theme-init/);
  assert.match(base, /\/css\/terminal\.css/);
});

test("architecture archive renders a command archive without noisy entry metadata", () => {
  const archive = readProjectFile("architecture/index.html");
  const css = readProjectFile("css/terminal.css");

  assert.match(archive, /class="architecture-page architecture-command"/);
  assert.match(archive, /COMMAND ARCHIVE \/ SYSTEM NOTES/);
  assert.match(archive, /data-text="ARCHITECTURE"/);
  assert.match(archive, /CURRENT TRANSMISSION/);
  assert.match(archive, /RESEARCH LOG/);
  assert.match(archive, /date:\s+"%Y-%m-%d"/);
  assert.match(archive, /post\.title/);
  assert.match(archive, /architecture-console-core/);
  assert.match(css, /\.architecture-console-core/);
  assert.match(css, /\.architecture-console/);
  assert.match(css, /\.architecture-command h1::before/);
  assert.match(css, /@keyframes architecture-scan/);
  assert.doesNotMatch(archive, /excerpt|author|image|thumbnail|tags/);
});

test("terminal stylesheet preserves the core monochrome palette", () => {
  const css = readProjectFile("css/terminal.css");

  assert.match(css, /--background:\s+#0a0a0a/);
  assert.match(css, /--text:\s+#e0e0e0/);
  assert.match(css, /--accent:\s+#00ff41/);
});

test("manifesto renders five interactive pillars with accessible motion", () => {
  const manifesto = readProjectFile("manifesto.md");
  const css = readProjectFile("css/terminal.css");
  const script = readProjectFile("js/manifesto.js");
  const base = readProjectFile("_layouts/base.html");

  assert.match(manifesto, /data-manifesto/);
  assert.equal((manifesto.match(/<article class="manifesto-card/g) || []).length, 5);
  assert.match(manifesto, /Reality Before Narrative/);
  assert.match(manifesto, /Think In Systems/);
  assert.match(manifesto, /Bound Power By Design/);
  assert.match(manifesto, /Turn Knowledge Into Sovereign Capability/);
  assert.match(manifesto, /Technology Must Enlarge Human Agency/);
  assert.match(manifesto, /FIELD DIRECTIVES/);
  assert.match(manifesto, /href="\{\{ '\/proof\/' \| relative_url \}\}"/);
  assert.match(manifesto, /script: \/js\/manifesto\.js/);
  assert.match(base, /page\.script/);
  assert.match(css, /\.manifesto-grid/);
  assert.match(css, /@keyframes manifesto-sweep/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@keyframes manifesto-card-reveal/);
  assert.doesNotMatch(css, /^ manifesto-card-reveal/m);
  assert.match(css, /@media \(max-width: 1060px\)/);
  assert.match(css, /container-type: inline-size/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /pointermove/);
});

test("research terminal shell exposes static node instrumentation", () => {
  const nav = readProjectFile("_includes/nav.html");
  const css = readProjectFile("css/terminal.css");

  assert.match(nav, /class="research-readout"/);
  assert.match(nav, /NODE MS-R01/);
  assert.match(nav, /CONTROL MODEL LEAST AGENCY/);
  assert.match(css, /background-size:\s+56px 56px/);
  assert.match(css, /class=\"viewport-frame\"|\.viewport-frame/);
  assert.match(css, /Interaction color normalization/);
  assert.match(css, /\.site-nav a:not\(\.site-mark\):hover,[\s\S]*background: var\(--accent-faint\)/);
  assert.match(css, /\.home-command-actions a:hover,[\s\S]*background: var\(--accent-faint\)/);
  assert.match(css, /@media \(min-width: 1200px\)[\s\S]*\.toc-sidebar[\s\S]*position: fixed/);
});

test("homepage presents the sovereign AI command deck with concrete controls", () => {
  const home = readProjectFile("index.html");
  const css = readProjectFile("css/terminal.css");
  const script = readProjectFile("js/home.js");

  assert.match(home, /data-home-command/);
  assert.match(home, /Principal Security Architect/);
  assert.match(home, /Sovereign AI Security \/ Agent Runtime Control \/ Adversarial Systems Engineering/);
  assert.match(home, /observable, interruptible, and unable to exceed its delegated authority/);
  assert.match(home, /My long-term direction is to turn this research into sovereign control infrastructure for AI execution/);
  assert.match(home, /15[+] YEARS/);
  assert.match(home, /First security hire, security function builder, team lead, hands-on architect/);
  assert.equal((home.match(/class="home-program-card/g) || []).length, 3);
  assert.match(home, /MCP VISOR/);
  assert.match(home, /RESEARCH SIGNALS/);
  assert.match(home, /script: \/js\/home\.js/);
  assert.match(css, /\.home-control-plane/);
  assert.match(css, /@keyframes home-orbit/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(script, /IntersectionObserver/);
  assert.match(css, /\.home-transmissions li \{ opacity: 1;/);
  assert.doesNotMatch(css, /\.home-enhanced \.home-system-list a,[\s\S]{0,160}opacity: 0/);
  assert.match(script, /pointermove/);
  assert.doesNotMatch(home, /deep-tech founder|deep-tech company/i);
  assert.doesNotMatch(home, /Transitioning|Wanzleben|Location:/);
});

test("proof page renders an evidence vault with real systems and research", () => {
  const proof = readProjectFile("proof.md");
  const css = readProjectFile("css/terminal.css");

  assert.match(proof, /site\.data\.projects/);
  assert.match(proof, /class="proof-page proof-vault"/);
  assert.match(proof, /PUBLIC EVIDENCE VAULT/);
  assert.match(proof, /data-text="PROOF"/);
  assert.match(proof, /RELEASED SYSTEMS/);
  assert.match(proof, /PUBLISHED RESEARCH/);
  assert.match(proof, /proof-verification-panel/);
  assert.match(proof, /proof-system-card/);
  assert.match(proof, /proof-research-ledger/);
  assert.match(css, /\.proof-verification-panel/);
  assert.match(css, /\.proof-vault h1::before/);
  assert.match(css, /@keyframes proof-core-pulse/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(proof, /Add whitepaper|add link|Add deployed/);
});

test("production typography uses Space Grotesk and IBM Plex Mono", () => {
  const base = readProjectFile("_layouts/base.html");
  const css = readProjectFile("css/terminal.css");

  assert.match(base, /Space\+Grotesk:500,600,700\|IBM\+Plex\+Mono:400,500,600/);
  assert.match(css, /--font-heading:\s+"Space Grotesk"/);
  assert.match(css, /--font-mono:\s+"IBM Plex Mono"/);
  assert.doesNotMatch(css, /DEEP-TECH FOUNDER/i);
});

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const failures = []
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const manifestPaths = []
const competingLockfiles = []
const ignoredDirectories = new Set(['.git', '.venv', 'build', 'dist', 'dist-electron', 'node_modules', 'out', 'server-dist'])
const walk = (relative = '') => {
  for (const entry of readdirSync(resolve(root, relative), { withFileTypes: true })) {
    const path = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(path)
    } else if (entry.name === 'package.json') manifestPaths.push(path)
    else if (['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock'].includes(entry.name)) competingLockfiles.push(path)
  }
}
walk()

for (const path of manifestPaths) {
  const packageManifest = JSON.parse(read(path))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'overrides']) {
    for (const [name, version] of Object.entries(packageManifest[section] ?? {})) {
      if (!exactVersion.test(version)) failures.push(`${path}: ${section}.${name} must be exact, found ${version}`)
    }
  }
  for (const lifecycle of ['preinstall', 'install', 'postinstall']) {
    if (packageManifest.scripts?.[lifecycle]) failures.push(`${path}: project lifecycle script ${lifecycle} is not allowed`)
  }
}
const manifest = JSON.parse(read('package.json'))
if (manifest.packageManager !== 'pnpm@11.15.1') failures.push('package.json: packageManager must pin pnpm@11.15.1')
for (const script of ['security:check', 'security:signatures', 'security:vulnerabilities', 'security:sbom']) {
  if (!manifest.scripts?.[script]) failures.push(`package.json: missing ${script}`)
}

for (const path of competingLockfiles) failures.push(`${path}: competing lockfiles are not allowed`)
for (const path of [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  'renovate.json',
  'SECURITY.md',
  'SUPPLY-CHAIN.md',
  '.github/CODEOWNERS',
  '.github/workflows/osv-scanner.yml'
]) {
  if (!existsSync(resolve(root, path))) failures.push(`${path}: required supply-chain control is missing`)
}

const npmrc = read('.npmrc')
if (!/^ignore-scripts=true$/m.test(npmrc)) failures.push('.npmrc must block ambient lifecycle scripts')
if (!/^save-exact=true$/m.test(npmrc)) failures.push('.npmrc must save exact versions')

const workspace = read('pnpm-workspace.yaml')
const lockfile = read('pnpm-lock.yaml')
for (const policy of [
  'minimumReleaseAge: 20160',
  'minimumReleaseAgeIgnoreMissingTime: false',
  'minimumReleaseAgeStrict: true',
  'trustLockfile: false',
  'blockExoticSubdeps: true',
  'saveExact: true',
  'strictDepBuilds: true',
  'verifyDepsBeforeRun: error'
]) {
  if (!workspace.includes(policy)) failures.push(`pnpm-workspace.yaml must contain ${policy}`)
}

const exactSelector = (selector) => {
  const separator = selector.startsWith('@') ? selector.indexOf('@', 1) : selector.indexOf('@')
  return separator > 0 && exactVersion.test(selector.slice(separator + 1))
}
const overrides = workspace.match(/^overrides:\s*$([\s\S]*?)(?=^\S|(?![\s\S]))/m)?.[1] ?? ''
for (const line of overrides.split(/\r?\n/)) {
  if (!line.trim() || line.trimStart().startsWith('#')) continue
  const match = /^  (?:'[^']+'|[^:\s]+):\s*(?:'([^']+)'|([^\s]+))$/.exec(line)
  const target = match?.[1] ?? match?.[2]
  if (!target || !exactVersion.test(target)) failures.push(`pnpm-workspace.yaml: override target must be exact, found ${line.trim()}`)
}
const allowBuilds = workspace.match(/^allowBuilds:\s*$([\s\S]*?)(?=^\S|(?![\s\S]))/m)?.[1] ?? ''
for (const line of allowBuilds.split(/\r?\n/)) {
  if (!line.trim() || line.trimStart().startsWith('#')) continue
  const match = /^  (.+): (true|false)$/.exec(line)
  if (!match) failures.push(`pnpm-workspace.yaml: malformed build decision ${line.trim()}`)
  else for (const selector of match[1].split(/\s+\|\|\s+/)) {
    if (!exactSelector(selector)) failures.push(`pnpm-workspace.yaml: build approval must be exact, found ${selector}`)
  }
}
const exclusions = workspace.match(/^minimumReleaseAgeExclude:\s*$([\s\S]*?)(?=^\S|(?![\s\S]))/m)?.[1] ?? ''
for (const line of exclusions.split(/\r?\n/)) {
  if (!line.trim() || line.trimStart().startsWith('#')) continue
  const match = /^  - '([^']+)'$/.exec(line)
  if (!match || !exactSelector(match[1])) failures.push(`pnpm-workspace.yaml: release-age exception must be exact, found ${line.trim()}`)
  else if (!lockfile.includes(`  '${match[1]}':`) && !lockfile.includes(`  ${match[1]}:`)) failures.push(`pnpm-workspace.yaml: stale release-age exception ${match[1]}`)
}

for (const filename of readdirSync(resolve(root, '.github', 'workflows'))) {
  if (!/\.ya?ml$/.test(filename)) continue
  const path = `.github/workflows/${filename}`
  const workflow = read(path)
  if (/\bnpm\s+(?:ci|install)\b/.test(workflow)) failures.push(`${path}: npm installs are not allowed`)
  for (const line of workflow.split(/\r?\n/)) {
    if (/\bpnpm install\b/.test(line) && !line.includes('--frozen-lockfile')) failures.push(`${path}: pnpm installs must be frozen`)
    const action = /^\s*uses:\s*[^#\s]+@([^\s#]+)/.exec(line)
    if (action && !/^[0-9a-f]{40}$/.test(action[1])) failures.push(`${path}: actions must use full commit SHAs`)
  }
}
const osv = read('.github/workflows/osv-scanner.yml')
if (!/\bschedule:\s*[\r\n]+\s*-\s*cron:/m.test(osv)) failures.push('OSV must run on a schedule')
if (!osv.includes('fail-on-vuln: true')) failures.push('OSV must fail closed')

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('ntanis.dev pnpm supply-chain policy is enforced.')

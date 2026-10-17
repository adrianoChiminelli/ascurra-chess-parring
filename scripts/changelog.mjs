// Release helper for CHANGELOG.md (Keep a Changelog format).
//
//   node scripts/changelog.mjs --check        fails if [Unreleased] is empty
//   node scripts/changelog.mjs                turns [Unreleased] into [<package.json version>]
//   node scripts/changelog.mjs --notes 1.2.0  prints the section of a version (release notes)
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'CHANGELOG.md'
const REPO = 'https://github.com/adrianoChiminelli/ascurra-chess-parring'

const changelog = readFileSync(FILE, 'utf8')
const [, , flag, arg] = process.argv

function section(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = changelog.match(new RegExp(`^## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|^\\[[^\\]]+\\]: )`, 'm'))
  return match ? match[1].trim() : null
}

function fail(message) {
  console.error(`changelog: ${message}`)
  process.exit(1)
}

if (flag === '--check') {
  if (!section('Unreleased')) fail('a seção [Unreleased] está vazia; descreva as mudanças antes de liberar a versão')
  process.exit(0)
}

if (flag === '--notes') {
  const version = (arg ?? '').replace(/^v/, '')
  const notes = section(version)
  if (notes === null) fail(`versão ${version} não encontrada`)
  console.log(notes)
  process.exit(0)
}

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
if (section(version) !== null) fail(`a versão ${version} já existe`)
if (!section('Unreleased')) fail('a seção [Unreleased] está vazia')

const previous = changelog.match(/^## \[(\d+\.\d+\.\d+[^\]]*)\]/m)?.[1]
const now = new Date()
const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-')

const updated = changelog
  .replace(/^## \[Unreleased\][^\n]*\n/m, `## [Unreleased]\n\n## [${version}] - ${date}\n`)
  .replace(
    /^\[Unreleased\]: .*$/m,
    [
      `[Unreleased]: ${REPO}/compare/v${version}...HEAD`,
      previous ? `[${version}]: ${REPO}/compare/v${previous}...v${version}` : `[${version}]: ${REPO}/releases/tag/v${version}`,
    ].join('\n'),
  )

writeFileSync(FILE, updated)
console.log(`changelog: [Unreleased] -> [${version}] - ${date}`)

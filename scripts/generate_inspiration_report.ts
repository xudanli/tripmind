/*
 Minimal CLI to generate Inspiration mode coverage reports.
 - Reads seed/local data via _getDbSnapshot from src/utils/inspirationDb
 - Writes JSON and Markdown to public/reports/
*/

import fs from 'node:fs'
import path from 'node:path'

// Import using runtime transpilation-friendly path
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing TS with vite/ts-node pipelines if available
import { _getDbSnapshot } from '../src/utils/inspirationDb'

type Destination = {
  id: string
  name: string
  country: string
  lat?: number
  lng?: number
}

type Snapshot = {
  destinations: Destination[]
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function generate(): void {
  const db = _getDbSnapshot() as Snapshot
  const destinations = db.destinations

  const countries = new Map<string, number>()
  for (const d of destinations) {
    countries.set(d.country, (countries.get(d.country) ?? 0) + 1)
  }

  const sortedCountries = Array.from(countries.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const reportDir = path.resolve(process.cwd(), 'public', 'reports')
  ensureDir(reportDir)

  // 1) JSON list of destinations (name + country)
  const jsonOut = destinations
    .map(d => ({ name: d.name, country: d.country, lat: d.lat, lng: d.lng }))
    .sort((a, b) => a.country.localeCompare(b.country, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'))

  fs.writeFileSync(path.join(reportDir, 'inspiration-cities.json'), JSON.stringify(jsonOut, null, 2), 'utf8')

  // 2) Markdown coverage summary
  const total = destinations.length
  const countryCount = sortedCountries.length
  const mdLines: string[] = []
  mdLines.push('# 灵感模式目的地覆盖统计')
  mdLines.push('')
  mdLines.push(`- 总目的地数：${total}`)
  mdLines.push(`- 覆盖国家/地区数：${countryCount}`)
  mdLines.push('')
  mdLines.push('## 按国家/地区计数（降序）')
  mdLines.push('')
  for (const [c, n] of sortedCountries) {
    mdLines.push(`- ${c}: ${n}`)
  }
  mdLines.push('')
  mdLines.push('## 明细（国家 / 名称）')
  mdLines.push('')
  for (const row of jsonOut) {
    mdLines.push(`- ${row.country} / ${row.name}`)
  }

  fs.writeFileSync(path.join(reportDir, 'inspiration-coverage.md'), mdLines.join('\n'), 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Generated ${jsonOut.length} destinations across ${countryCount} countries to ${reportDir}`)
}

generate()



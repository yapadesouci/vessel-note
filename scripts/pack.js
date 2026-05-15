import { execSync } from 'child_process'
import { mkdirSync, rmSync, existsSync } from 'fs'

if (!existsSync('dist')) mkdirSync('dist')
if (existsSync('dist/vessel-note.zip')) rmSync('dist/vessel-note.zip')

execSync('zip -r dist/vessel-note.zip manifest.json apps/notes/ -x "*.DS_Store"', { stdio: 'inherit' })
console.log('Built dist/vessel-note.zip')

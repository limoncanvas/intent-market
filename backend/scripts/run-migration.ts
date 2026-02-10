/**
 * Run database migration
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || ''

async function runMigration() {
  console.log('🔄 Running database migration...')
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Read migration file
  const migrationPath = join(__dirname, '../migrations/003_add_source_tracking.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration file: 003_add_source_tracking.sql')
  console.log('')

  try {
    // Execute SQL (using rpc to raw_sql if available, or direct query)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try alternative: split and execute each statement
      console.log('⚠️  RPC not available, trying direct execution...')

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const stmt of statements) {
        if (stmt.toUpperCase().includes('COMMENT ON')) {
          console.log('⊘ Skipping COMMENT statement (not supported via client)')
          continue
        }

        console.log(`   Executing: ${stmt.substring(0, 50)}...`)
        // Note: This won't work directly. User needs to run in Supabase SQL editor
      }

      console.log('')
      console.log('❌ Cannot execute SQL directly via Supabase client')
      console.log('')
      console.log('📝 Please run this SQL in Supabase Dashboard:')
      console.log('   1. Go to https://supabase.com/dashboard')
      console.log('   2. Select your project')
      console.log('   3. Click "SQL Editor"')
      console.log('   4. Paste the migration SQL and run it')
      console.log('')
      console.log('Or copy from: backend/migrations/003_add_source_tracking.sql')
      console.log('')

      return false
    }

    console.log('✅ Migration executed successfully!')
    return true

  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

runMigration()
  .then((success) => {
    if (success) {
      console.log('🎉 Migration complete!')
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

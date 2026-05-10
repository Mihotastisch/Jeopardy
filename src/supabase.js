import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xtgozqgwluymlqhrkgui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Z296cWd3bHV5bWxxaHJrZ3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MjYyNTAsImV4cCI6MjA5NDAwMjI1MH0.RYfEWXVD67xLht8fVFdAoue6cPTGnhpbX83gaioQEmk'

export const supabase = createClient(supabaseUrl, supabaseKey)

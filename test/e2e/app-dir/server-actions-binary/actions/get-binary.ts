'use server'

import fs from 'fs'
import path from 'path'

// const dirname = path.resolve();

export const getBinary = async (): Promise<Buffer> => {
  const filePath = path.join(
    process.env.__NEXT_RELATIVE_PROJECT_DIR!,
    'actions',
    'binary'
  )
  const file = fs.readFileSync(filePath)
  return file
}

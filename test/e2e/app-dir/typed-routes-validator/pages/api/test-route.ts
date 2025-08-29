import type { NextApiRequest, NextApiResponse } from 'next/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}

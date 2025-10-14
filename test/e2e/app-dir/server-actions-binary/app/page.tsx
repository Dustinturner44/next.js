'use client'

import { getBinary } from '@/actions/get-binary'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    getBinary().then((file) => {
      console.log(file)
    })
  }, [])

  return null
}

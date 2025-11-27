'use server'

import { redirect } from 'next/navigation'

export async function redirectToServerAction() {
  redirect('/server')
}



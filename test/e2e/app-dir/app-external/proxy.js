import { respond } from 'compat-next-server-module'

export async function proxy(request) {
  return await respond()
}

let isSuspenseInspected = true
const suspenseInspectedListeners = new Set<() => void>()

export function getIsSuspenseInspected() {
  return isSuspenseInspected
}

export function setIsSuspenseInspected(value: boolean) {
  if (isSuspenseInspected === value) {
    return
  }
  isSuspenseInspected = value
  suspenseInspectedListeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  suspenseInspectedListeners.add(listener)
  return () => {
    suspenseInspectedListeners.delete(listener)
  }
}

let foo = 'foo'

function setFoo(n) {
  foo = n
}
// biome-ignore lint/style/useConst: proving we track assignments, not declkinds
let neverMutated = 'neverMutated'
const obviouslyneverMutated = 'obviouslyneverMutated'
export { foo, setFoo, neverMutated, obviouslyneverMutated }

// biome-ignore lint/suspicious/noFunctionAssign: testing crimes
export function bar() {
  return 'bar'
}

export function setBar(b) {
  bar = b
}

// wild stuff
export { globalThis as g }

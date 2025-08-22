function get(name) {
  return require(`./deps/${name}`)
}

console.log(get('cake').cake)

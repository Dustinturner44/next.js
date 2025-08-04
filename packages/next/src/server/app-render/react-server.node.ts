// This file should be opted into the react-server layer

if (process.env.TURBOPACK) {
  module.exports =
    // eslint-disable-next-line import/no-extraneous-dependencies
    require('react-server-dom-turbopack/server.node') as typeof import('react-server-dom-turbopack/server.node')
} else {
  module.exports =
    // eslint-disable-next-line import/no-extraneous-dependencies
    require('react-server-dom-webpack/server.node') as typeof import('react-server-dom-webpack/server.node')
}

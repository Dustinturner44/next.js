const privateCpuProfileName = process.env.__NEXT_PRIVATE_CPU_PROFILE
const isCpuProfileEnabled = process.env.NEXT_CPU_PROF || privateCpuProfileName

if (isCpuProfileEnabled) {
  const { Session } = require('inspector') as typeof import('inspector')
  const fs = require('fs') as typeof import('fs')

  const session = new Session()
  session.connect()

  session.post('Profiler.enable', (enableErr) => {
    if (enableErr) {
      console.error('Cannot generate CPU profiling:', enableErr)
      return
    }
    session.post('Profiler.start', (startErr) => {
      if (startErr) {
        console.error('Cannot generate CPU profiling:', startErr)
        return
      }
      console.log(`CPU profiling started for process ${process.pid}`)

      let profileSaved = false
      function saveProfile() {
        if (profileSaved) {
          return
        }
        profileSaved = true

        session.post('Profiler.stop', (error, param) => {
          if (error) {
            console.error('Cannot generate CPU profiling:', error)
            return
          }
          // Write profile to disk
          const filename = `${
            privateCpuProfileName || 'CPU.main'
          }.${Date.now()}.cpuprofile`
          fs.writeFileSync(`./${filename}`, JSON.stringify(param.profile))
          console.log(
            `CPU profile for process ${process.pid} saved to ${filename}`
          )
        })
      }

      process.on('SIGINT', saveProfile)
      process.on('SIGTERM', saveProfile)
      process.on('exit', saveProfile)
    })
  })
}

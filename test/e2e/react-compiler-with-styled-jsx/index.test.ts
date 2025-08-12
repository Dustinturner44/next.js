import { nextTestSetup, isNextDev, FileRef } from 'e2e-utils'
import { retry } from 'next-test-utils'
import { join } from 'path'
import stripAnsi from 'strip-ansi'

function nextConfigFromJson(config) {
  return `module.exports = ${JSON.stringify(config)}`
}

describe('react-compiler-with-styled-jsx', () => {
  if (isNextDev) {
    describe('config validation', () => {
      const baseConfig = {
        compiler: {
          styledJsx: {
            useLightningCss: true,
          },
        },
      }

      const { next } = nextTestSetup({
        files: {
          app: new FileRef(join(__dirname, 'app')),
          lib: new FileRef(join(__dirname, 'lib')),
          'next.config.js': nextConfigFromJson(baseConfig),
        },
        dependencies: {
          'babel-plugin-react-compiler': '19.1.0-rc.2',
        },
      })

      it('warns about combining `reactCompiler` with `styledJsx`', async () => {
        const warningSnippet =
          'cannot safely use both the built-in `styledJsx` and `reactCompiler`'

        expect(stripAnsi(next.cliOutput)).not.toContain(warningSnippet)
        const outputIndex = next.cliOutput.length

        const configWithReactCompiler = {
          ...baseConfig,
          experimental: {
            reactCompiler: true,
          },
        }

        await next.patchFile(
          'next.config.js',
          nextConfigFromJson(configWithReactCompiler),
          async () => {
            await retry(async () => {
              expect(stripAnsi(next.cliOutput.slice(outputIndex))).toContain(
                warningSnippet
              )
            })
          }
        )
      })
    })
  }

  // this demonstrates the bug caused if you configure babel with the wrong plugin ordering
  describe('incorrectly ordered manual babel config', () => {
    const babelConfig = {
      presets: ['next/babel'],
      plugins: ['babel-plugin-react-compiler', 'styled-jsx/babel'],
    }
    const { next } = nextTestSetup({
      files: {
        app: new FileRef(join(__dirname, 'app')),
        lib: new FileRef(join(__dirname, 'lib')),
        'next.config.js': nextConfigFromJson({}),
        '.babelrc': JSON.stringify(babelConfig),
      },
      dependencies: {
        'babel-plugin-react-compiler': '19.1.0-rc.2',
        'styled-jsx': '5.1.7',
        'babel-loader': '10.0.0',
      },
    })

    it('fails to update style on button click', async () => {
      const session = await next.browser('/')
      const button = await session.elementByCss('.hello')
      for (let i = 0; i < 5; i++) {
        await button.click()
        // the style never changes from the original value (blue)
        expect(await button.getComputedCss('background-color')).toBe(
          'rgb(0, 0, 255)'
        )
      }
    })
  })

  describe.each([
    ['without react compiler', false, false],
    ['with styled-jsx in babelrc, but without react compiler', true, false],
    ['with babelrc and react compiler', true, true],
  ])('%s', (_name, hasBabelrc, hasReactCompiler) => {
    const babelFiles = hasBabelrc
      ? {
          '.babelrc': JSON.stringify({
            presets: ['next/babel'],
            plugins: [
              'styled-jsx/babel',
              // react compiler must run after the styled-jsx plugin
              ...(hasReactCompiler ? ['babel-plugin-react-compiler'] : []),
            ],
          }),
        }
      : {}

    const { next } = nextTestSetup({
      files: {
        app: new FileRef(join(__dirname, 'app')),
        lib: new FileRef(join(__dirname, 'lib')),
        'next.config.js': nextConfigFromJson(
          hasBabelrc
            ? {} // the babelrc will configure styled-jsx
            : {
                compiler: {
                  styledJsx: {
                    useLightningCss: true,
                  },
                },
              }
        ),
        ...babelFiles,
      },
      dependencies: {
        'babel-plugin-react-compiler': '19.1.0-rc.2',
        'styled-jsx': '5.1.7',
        'babel-loader': '10.0.0',
      },
    })

    if (hasReactCompiler) {
      it('applies the react compiler transform', async () => {
        const session = await next.browser('/')
        await retry(async () => {
          const text = session
            .elementByCss('#react-compiler-enabled-message')
            .text()
          expect(text).toMatch(/React compiler is enabled/)
        })
      })
    }

    it('updates style on state updates', async () => {
      const session = await next.browser('/')
      const button = await session.elementByCss('.hello')

      // clicking on the button should change it from blue to red
      expect(await button.getComputedCss('background-color')).toBe(
        'rgb(0, 0, 255)'
      )
      await button.click()
      expect(await button.getComputedCss('background-color')).toBe(
        'rgb(255, 0, 0)'
      )
    })
  })
})

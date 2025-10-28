import { LinkAccordion } from '../../components/link-accordion'

export default async function Page({ searchParams }) {
  const timeout = (await searchParams).timeout
  const randomNumber = await new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(Math.random())
      },
      timeout !== undefined ? Number.parseInt(timeout, 10) : 0
    )
  })

  return (
    <>
      <div>
        <LinkAccordion href="/without-loading">Back to Home</LinkAccordion>
      </div>
      <div id="random-number">{randomNumber}</div>
    </>
  )
}

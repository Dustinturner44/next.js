import { LinkAccordion } from './components/link-accordion'

export default function HomePage() {
  return (
    <>
      <div id="home-page">
        <LinkAccordion href="/0?timeout=0" prefetch={true}>
          To Random Number - prefetch: true
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/0?timeout=1000" prefetch={true}>
          To Random Number - prefetch: true, slow
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/1">
          To Random Number - prefetch: auto
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/2" prefetch={false}>
          To Random Number 2 - prefetch: false
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/2?timeout=1000" prefetch={false}>
          To Random Number 2 - prefetch: false, slow
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/1?timeout=1000">
          To Random Number - prefetch: auto, slow
        </LinkAccordion>
      </div>
      <div>
        <LinkAccordion href="/null-loading">
          To Null Loading - prefetch: auto
        </LinkAccordion>
      </div>
    </>
  )
}

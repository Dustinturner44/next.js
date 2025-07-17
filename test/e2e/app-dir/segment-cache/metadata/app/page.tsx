import { LinkAccordion } from './link-accordion'

export default function Page() {
  return (
    <>
      <ul>
        <li>
          <LinkAccordion
            prefetch="unstable_forceStale"
            href="/page-with-dynamic-head"
          >
            Page with dynamic head (prefetch=unstable_forceStale)
          </LinkAccordion>
        </li>
        <li>
          <LinkAccordion
            prefetch="unstable_forceStale"
            href="/rewrite-to-page-with-dynamic-head"
          >
            Rewrite to page with dynamic head (prefetch=unstable_forceStale)
          </LinkAccordion>
        </li>
      </ul>
    </>
  )
}

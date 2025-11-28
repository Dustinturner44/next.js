'use client'

import type { FlightSegmentPath } from '../../shared/lib/app-router-types'
import type { FocusAndScrollRef } from './router-reducer/router-reducer-types'
import React from 'react'
import ReactDOM from 'react-dom'
import { matchSegment } from './match-segments'
import { disableSmoothScrollDuringRouteTransition } from '../../shared/lib/router/utils/disable-smooth-scroll'

const rectProperties = [
  'bottom',
  'height',
  'left',
  'right',
  'top',
  'width',
  'x',
  'y',
] as const

/**
 * Check if a HTMLElement is hidden or fixed/sticky position
 */
function shouldSkipElement(element: HTMLElement) {
  // we ignore fixed or sticky positioned elements since they'll likely pass the "in-viewport" check
  // and will result in a situation we bail on scroll because of something like a fixed nav,
  // even though the actual page content is offscreen
  if (['sticky', 'fixed'].includes(getComputedStyle(element).position)) {
    return true
  }

  // Uses `getBoundingClientRect` to check if the element is hidden instead of `offsetParent`
  // because `offsetParent` doesn't consider document/body
  const rect = element.getBoundingClientRect()
  return rectProperties.every((item) => rect[item] === 0)
}

/**
 * Check if the top corner of the HTMLElement is in the viewport.
 */
function topOfElementInViewport(element: HTMLElement, viewportHeight: number) {
  const rect = element.getBoundingClientRect()
  return rect.top >= 0 && rect.top <= viewportHeight
}

/**
 * Find the DOM node for a hash fragment.
 * If `top` the page has to scroll to the top of the page. This mirrors the browser's behavior.
 * If the hash fragment is an id, the page has to scroll to the element with that id.
 * If the hash fragment is a name, the page has to scroll to the first element with that name.
 */
function getHashFragmentDomNode(hashFragment: string) {
  // If the hash fragment is `top` the page has to scroll to the top of the page.
  if (hashFragment === 'top') {
    return document.body
  }

  // If the hash fragment is an id, the page has to scroll to the element with that id.
  return (
    document.getElementById(hashFragment) ??
    // If the hash fragment is a name, the page has to scroll to the first element with that name.
    document.getElementsByName(hashFragment)[0]
  )
}

function findDOMNode(
  instance: React.ReactInstance | null | undefined
): Element | Text | null {
  // Tree-shake for server bundle
  if (typeof window === 'undefined') return null

  // __DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.findDOMNode is null during module init.
  // We need to lazily reference it.
  const internal_reactDOMfindDOMNode =
    __DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.findDOMNode
  return internal_reactDOMfindDOMNode(instance)
}

const __DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  // @ts-expect-error This is an internal property that is not exposed in the types
  ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE

/**
 * Check if the current segment should handle the scroll based on segmentPaths.
 * Returns false if segmentPaths is non-empty and current segment is not in the list.
 */
function shouldScrollForSegment(
  segmentPaths: FlightSegmentPath[],
  segmentPath: FlightSegmentPath
): boolean {
  // segmentPaths is an array of segment paths that should be scrolled to
  // if the current segment path is not in the array, the scroll is not applied
  // unless the array is empty, in which case the scroll is always applied
  if (
    segmentPaths.length !== 0 &&
    !segmentPaths.some((scrollRefSegmentPath) =>
      segmentPath.every((segment, index) =>
        matchSegment(segment, scrollRefSegmentPath[index])
      )
    )
  ) {
    return false
  }
  return true
}

/**
 * Get the DOM node to scroll to based on hash fragment or component instance.
 * Returns null if no valid node is found or if the node should be skipped.
 */
function getScrollTargetNode(
  hashFragment: string | null,
  componentInstance: React.Component
): HTMLElement | null {
  let domNode:
    | ReturnType<typeof getHashFragmentDomNode>
    | ReturnType<typeof findDOMNode> = null

  if (hashFragment) {
    domNode = getHashFragmentDomNode(hashFragment)
  }

  // `findDOMNode` is tricky because it returns just the first child if the component is a fragment.
  // This already caused a bug where the first child was a <link/> in head.
  if (!domNode) {
    domNode = findDOMNode(componentInstance)
  }

  // If there is no DOM node this layout-router level is skipped. It'll be handled higher-up in the tree.
  if (!(domNode instanceof Element)) {
    return null
  }

  // Verify if the element is a HTMLElement and if we want to consider it for scroll behavior.
  // If the element is skipped, try to select the next sibling and try again.
  while (!(domNode instanceof HTMLElement) || shouldSkipElement(domNode)) {
    if (process.env.NODE_ENV !== 'production') {
      if (domNode.parentElement?.localName === 'head') {
        // TODO: We enter this state when metadata was rendered as part of the page or via Next.js.
        // This is always a bug in Next.js and caused by React hoisting metadata.
        // We need to replace `findDOMNode` in favor of Fragment Refs (when available) so that we can skip over metadata.
      }
    }

    // No siblings found that match the criteria are found, so handle scroll higher up in the tree instead.
    if (domNode.nextElementSibling === null) {
      return null
    }
    domNode = domNode.nextElementSibling
  }

  return domNode
}

/**
 * Perform the scroll operation to the target element.
 * Handles both hash scrolls and regular page scrolls.
 */
function scrollToTarget(
  targetElement: HTMLElement,
  hashFragment: string | null,
  onlyHashChange: boolean
): void {
  disableSmoothScrollDuringRouteTransition(
    () => {
      // In case of hash scroll, we only need to scroll the element into view
      if (hashFragment) {
        targetElement.scrollIntoView()
        return
      }

      // Store the current viewport height because reading `clientHeight` causes a reflow,
      // and it won't change during this function.
      const htmlElement = document.documentElement
      const viewportHeight = htmlElement.clientHeight

      // If the element's top edge is already in the viewport, exit early.
      if (topOfElementInViewport(targetElement, viewportHeight)) {
        return
      }

      // Otherwise, try scrolling to the top of the document to be backward compatible with pages
      // scrollIntoView() called on `<html/>` element scrolls horizontally on chrome and firefox (that shouldn't happen)
      // We could use it to scroll horizontally following RTL but that also seems to be broken - it will always scroll left
      // scrollLeft = 0 also seems to ignore RTL and manually checking for RTL is too much hassle so we will scroll just vertically
      htmlElement.scrollTop = 0

      // Scroll to domNode if domNode is not in viewport when scrolled to top of document
      if (!topOfElementInViewport(targetElement, viewportHeight)) {
        // Scroll into view doesn't scroll horizontally by default when not needed
        targetElement.scrollIntoView()
      }
    },
    {
      // We will force layout by querying domNode position
      dontForceLayout: true,
      onlyHashChange: onlyHashChange,
    }
  )
}

/**
 * Manages scroll restoration state for navigation.
 * Stores rAF IDs that need to persist across component unmounts.
 */
class ScrollRestorationState {
  private rafId1: number | null = null
  private rafId2: number | null = null

  cancelPendingScroll() {
    if (this.rafId1 !== null) {
      cancelAnimationFrame(this.rafId1)
      this.rafId1 = null
    }
    if (this.rafId2 !== null) {
      cancelAnimationFrame(this.rafId2)
      this.rafId2 = null
    }
  }

  scheduleScroll(callback: () => void) {
    // Use double requestAnimationFrame to guarantee scroll happens after browser paint.
    // First rAF runs after React commit, second rAF runs after browser paint.
    // This ensures the scroll never blocks React's rendering work and doesn't cause layout thrashing.
    this.rafId1 = requestAnimationFrame(() => {
      this.rafId1 = null // Clear after first rAF completes
      this.rafId2 = requestAnimationFrame(() => {
        this.rafId2 = null // Clear after second rAF completes
        callback()
      })
    })
  }
}

// Singleton instance that persists across component unmounts
const scrollRestorationState = new ScrollRestorationState()

interface ScrollAndFocusHandlerProps {
  focusAndScrollRef: FocusAndScrollRef
  children: React.ReactNode
  segmentPath: FlightSegmentPath
}

/**
 * Handles scroll restoration after navigation.
 * Uses double rAF to defer scroll until after browser paint.
 */
export class InnerScrollAndFocusHandler extends React.Component<ScrollAndFocusHandlerProps> {
  handlePotentialScroll = () => {
    const { focusAndScrollRef, segmentPath } = this.props

    if (focusAndScrollRef.apply) {
      // Cancel any pending scroll from a previous navigation
      scrollRestorationState.cancelPendingScroll()

      // Immediately clear apply flag to prevent duplicate scroll attempts.
      // This is the only state cleared synchronously - it acts as a lock to ensure
      // only the first component that sees apply=true will handle the scroll.
      focusAndScrollRef.apply = false

      // Capture values synchronously before async work to avoid race conditions
      // with subsequent navigations that might mutate focusAndScrollRef.
      const hashFragment = focusAndScrollRef.hashFragment
      const segmentPaths = focusAndScrollRef.segmentPaths
      const onlyHashChange = focusAndScrollRef.onlyHashChange

      scrollRestorationState.scheduleScroll(() => {
        // Check if this segment should handle the scroll
        if (!shouldScrollForSegment(segmentPaths, segmentPath)) {
          return
        }

        // Find the DOM node to scroll to
        const targetNode = getScrollTargetNode(hashFragment, this)
        if (!targetNode) {
          return
        }

        // Clear state only after successfully finding the target.
        // We don't clear these synchronously because if the callback bails out early,
        // a higher-level component might need these values to handle the scroll instead.
        focusAndScrollRef.hashFragment = null
        focusAndScrollRef.segmentPaths = []

        // Perform the actual scroll
        scrollToTarget(targetNode, hashFragment, onlyHashChange)

        // Update state after scroll
        focusAndScrollRef.onlyHashChange = false
        targetNode.focus()
      })
    }
  }

  componentDidMount() {
    this.handlePotentialScroll()
  }

  componentDidUpdate() {
    // Because this property is overwritten in handlePotentialScroll it's fine to always run it when true as it'll be set to false for subsequent renders.
    if (this.props.focusAndScrollRef.apply) {
      this.handlePotentialScroll()
    }
  }

  render() {
    return this.props.children
  }
}

import type { PathnameNormalizer } from './pathname-normalizer'

import { RSC_NOT_FOUND_SUFFIX } from '../../../lib/constants'
import { SuffixPathnameNormalizer } from './suffix'

export class NotFoundRSCPathnameNormalizer
  extends SuffixPathnameNormalizer
  implements PathnameNormalizer
{
  constructor() {
    super(RSC_NOT_FOUND_SUFFIX)
  }
}

import type { NextConfig } from 'next'
import { object as jsonObjNamed } from './object.json'
import jsonObjDefault from './object.json'
import jsonArray from './array.json'

export default {
  env: {
    jsonObjDefault: jsonObjDefault.object,
    jsonObjDefault123: String(jsonObjDefault['123number']),
    jsonObjDefaultWithSpace: jsonObjDefault['with space'],
    jsonObjDefaultWithHyphen: jsonObjDefault['with-hyphen'],
    jsonObjNamed,
    jsonArray: jsonArray[0].array,
  },
} satisfies NextConfig

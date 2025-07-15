// import {removeBackground} from "@imgly/background-removal"
import sharp from "sharp"

export default async function imageMiddleware(buffer) {
  let transformedBuffer = buffer

  // transformedBuffer = await removeBackground(buffer).then(blob => blob.arrayBuffer())
  transformedBuffer = await sharp(transformedBuffer).grayscale().toBuffer()
  transformedBuffer = await sharp(transformedBuffer).sharpen({ sigma: 10 }).toBuffer()
  transformedBuffer = await sharp(transformedBuffer).blur(2.5).toBuffer()

  console.log("transformedBuffer", transformedBuffer)

  return transformedBuffer
}
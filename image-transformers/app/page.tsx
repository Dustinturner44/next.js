import Image from 'next/image'

export default async function HomePage() {
  return (
    <div>
      <h1>Original</h1>
      <img src="https://assets.vercel.com/image/upload/q_auto/front/about/individual-investors/matiaswoloski.png" alt="image" width={100} height={100} />
      <h1>Grayscale + blur</h1>
      <Image src="https://assets.vercel.com/image/upload/q_auto/front/about/individual-investors/matiaswoloski.png" alt="image" width={100} height={100} />
    </div>
  )
}
'use client'

export default function ClientComp({ data }: { data: { title: string } }) {
  return (
    <pre>
      <div>Hello World</div>
      {data.title}
    </pre>
  )
}

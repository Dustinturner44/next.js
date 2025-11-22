import ClientComp from './client'

export default async function Page() {
  const topic = { title: 'Topic', fields: { featured: [] } }
  const guide = { title: 'Guide', fields: { topic: [topic] } }
  const featured = {
    title: 'Featured',
    fields: {
      content: [guide],
      topic, // points back to the same topic
    },
  }

  // Circular reference: topic -> featured[] -> content[] -> topic
  topic.fields.featured.push(featured)

  return (
    <div>
      <ClientComp data={topic} />
      Other
    </div>
  )
}

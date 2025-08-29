export default function Page() {
  return (
    <p>
      {JSON.stringify([
        process.env.jsonObjDefault,
        process.env.jsonObjNamed,
        process.env.jsonArray,
      ])}
    </p>
  )
}

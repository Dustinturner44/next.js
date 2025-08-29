export default function Page() {
  return (
    <p>
      {JSON.stringify([
        process.env.jsonObjDefault,
        process.env.jsonObjDefault123,
        process.env.jsonObjDefaultWithSpace,
        process.env.jsonObjDefaultWithHyphen,
        process.env.jsonObjNamed,
        process.env.jsonArray,
      ])}
    </p>
  )
}

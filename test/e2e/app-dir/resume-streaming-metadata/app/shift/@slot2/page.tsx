export default async function Slot2() {
  await new Promise((resolve) => setTimeout(resolve, 20))
  return <div>Slot 2</div>
}

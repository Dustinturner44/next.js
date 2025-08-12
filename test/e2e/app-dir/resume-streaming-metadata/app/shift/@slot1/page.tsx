export default async function Slot1() {
  await new Promise((resolve) => setTimeout(resolve, 10))
  return <div>Slot 1</div>
}

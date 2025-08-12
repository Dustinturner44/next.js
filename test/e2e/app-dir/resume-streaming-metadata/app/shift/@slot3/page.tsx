export default async function Slot3() {
  await new Promise((resolve) => setTimeout(resolve, 30))
  return <div>Slot 3</div>
}

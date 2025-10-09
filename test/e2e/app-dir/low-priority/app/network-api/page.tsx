import { network } from 'next/server'

export default function NetworkApiPage() {
  const net = network()

  return (
    <div>
      <h1>Network API</h1>
      <div id="ect">ECT: {net.ect ?? 'unknown'}</div>
      <div id="rtt">RTT: {net.rtt ?? 'unknown'}</div>
      <div id="downlink">Downlink: {net.downlink ?? 'unknown'}</div>
      <div id="save-data">Save Data: {String(net.saveData ?? false)}</div>
      <div id="slow">Slow: {String(net.slow)}</div>
    </div>
  )
}

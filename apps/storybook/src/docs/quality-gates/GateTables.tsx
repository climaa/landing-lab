import { GATES, MEASURES } from './gates';

/** Backticked spans in a fact become `<code>`; nothing else is parsed. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split('`')
        .map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part))}
    </>
  );
}

/** One row per pr.yml job or `checks` leg, from `gates.ts`. */
export function GateTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Check</th>
          <th>Runs</th>
          <th>What a green result proves</th>
          <th>Gate waits on it</th>
        </tr>
      </thead>
      <tbody>
        {GATES.map((gate) => (
          <tr key={gate.name}>
            <td>
              <code>{gate.name}</code>
              <br />
              {gate.kind}
            </td>
            <td>
              <code>{gate.runs}</code>
            </td>
            <td>
              <Inline text={gate.proves} />
            </td>
            <td>{gate.blocking ? 'yes' : 'no, report only'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One row per README measurement, with the check that holds it. */
export function ImpactTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Measured</th>
          <th>/before</th>
          <th>/after</th>
          <th>Risk if it comes back</th>
          <th>Held by</th>
        </tr>
      </thead>
      <tbody>
        {MEASURES.map((measure) => (
          <tr key={measure.label}>
            <td>
              <Inline text={measure.label} />
            </td>
            <td>
              <Inline text={measure.before} />
            </td>
            <td>
              <strong>{measure.after}</strong>
            </td>
            <td>{measure.risk}</td>
            <td>
              <Inline text={measure.heldBy} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { For, Show } from 'solid-js'

export default function NotesTable(
  { showNotes, setShowNotes, currIndex, setCurrIndex, emojis, columns },
) {
  <>
    <div style='text-align:center;'>
      <a
        style='cursor: pointer; text-decoration: underline;'
        onClick={() => setShowNotes(!showNotes())}
      >
        {showNotes() ? 'Hide' : 'Show All Cards'}
      </a>
    </div>

    <Show when={showNotes()}>
      <table>
        <Row>
          <For each={columns()}>
            {(col) => <th>{col}</th>}
          </For>
        </Row>
        {emojis().map(([emoji, ...other], index) => (
          <tr
            class={'emoji-row' + (index === currIndex() ? ' selected' : '')}
            onClick={() => setCurrIndex(index)}
          >
            <td>{emoji}</td>
            {other.map((item) => <td>{item}</td>)}
          </tr>
        ))}
      </table>
    </Show>
  </>
}

function Row({ children }) {
  return <tr>{children}</tr>
}

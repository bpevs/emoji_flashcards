import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { useEffect } from "preact/hooks";
import { useComputed, useSignal } from "@preact/signals";

interface DemoProps {
  count: Signal<number>;
}

const languages = {
  "en": "English 💊💸",
  "zh": "Chinese 🐼",
  "es": "Spanish 💃"
}

export default function Demo(props: DemoProps) {
  const currLang = useSignal("en");
  const currSet = useSignal([]);

  useEffect(async () => {
    const charSetResp = await fetch(`/data/${currLang.value}.json`);
    const charSet = (await charSetResp.json()).cards;
    console.log(charSet)
    const cards = [];
    Object.keys(charSet).forEach((category) => {
      Object.keys(charSet[category]).forEach((emojis) => {
        cards.push({
          emojis,
          back: charSet[category][emojis],
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: (new Date()).toISOString(),
        });
      });
    });
    currSet.value = cards;
  }, [currLang.value]);

  const isFlipped = useSignal(false);
  const currCardIndex = useSignal(0);
  const currCard = useComputed(() => currSet.value[currCardIndex.value]);
  const emoji = useComputed(() => currCard.value?.back[0]);
  const hints = useComputed(() => currCard.value?.back.slice(1).join(" "));

  const flipButton = isFlipped.value
    ? (
      <Button
        onClick={() => {
          currCardIndex.value = currCardIndex.value + 1;
          isFlipped.value = false;
        }}
      >
        next
      </Button>
    )
    : <Button onClick={() => isFlipped.value = true}>flip</Button>;
  return (
    <div style={{ padding: "10px", textAlign: "center" }}>
      <div style={{ marginBottom: "10px", height: "20px" }}>
        <select
          style={{ float: "left" }}
          value={currLang.value}
          onChange={(e) => {
            currLang.value = e.target.value;
          }}
        >
          {
            Object.keys(languages).map(lang => (
              <option value={lang}>{languages[lang]}</option>
            ))
          }
        </select>
      </div>
      <div
        style={{
          margin: "10px 0 10px 0",
          width: "300px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "3px solid black",
          borderRadius: "10px",
          backgroundColor: "rgba(256,256,256, 0.5)",
        }}
      >
        <div>
          <h1>{currCard.value?.emojis}</h1>
          <h1>{isFlipped.value ? emoji.value : " "}</h1>
          <h3>{isFlipped.value ? hints.value : " "}</h3>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            width: "100%",
            textAlign: "center",
          }}
        >
          {flipButton}
        </div>
      </div>
      <button>
        Download the {languages[currLang.value]} Anki deck!
        </button>

      <table>
        <tr>
          <th></th>
          <th>Emoji</th>
          <th>Translation</th>
        </tr>
        {currSet.value.map(({ emojis, back }, index) => {
          return (
            <tr
              class="emoji-row"
              onClick={() => { currCardIndex.value = index }}
            >
              <td>{index}</td>
              <td>{emojis}</td>
              <td dir="auto">{back.join(" ")}</td>
            </tr>
          );
        })}
      </table>
    </div>
  );
}

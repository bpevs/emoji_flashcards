import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { supermemo, SuperMemoGrade, SuperMemoItem } from "supermemo";
import { useComputed, useSignal } from "@preact/signals";

const en_us = (await import("@/data/en_us.json", {
  assert: { type: "json" },
})).default;

const cards = [];
Object.keys(en_us).forEach((category) => {
  Object.keys(en_us[category]).forEach((emojis) => {
    cards.push({
      emojis,
      back: en_us[category][emojis].join("\t"),
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: (new Date()).toISOString(),
    });
  });
});

function practice(flashcard: Flashcard, grade: SuperMemoGrade): Flashcard {
  const { interval, repetition, efactor } = supermemo(flashcard, grade);
  const now = new Date();

  const dueDate = now.setDate(now.getDate() + interval).toISOString();
  return { ...flashcard, interval, repetition, efactor, dueDate };
}

interface DemoProps {
  count: Signal<number>;
}

export default function Demo(props: DemoProps) {
  const currLang = useSignal("en_us");
  const isFlipped = useSignal(false);
  const currCardIndex = useSignal(0);
  const currCard = useComputed(() => cards[currCardIndex.value]);

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
        <select style={{ float: "left" }} value={currLang.value}>
          <option>en_us</option>
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
        }}
      >
        <h1>
          {isFlipped.value ? currCard.value.back : currCard.value.emojis}
        </h1>
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
      <button>Download the {currLang.value} Anki deck!</button>
    </div>
  );
}

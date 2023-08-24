import Demo from "../islands/Demo.tsx";
import { useComputed, useSignal } from "@preact/signals";

export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold">Emoji Language Flashcards</h1>
        <p class="my-4">
          Downloadable emoji flashcards to learn many languages
        </p>
        <Demo />
      </div>
    </div>
  );
}

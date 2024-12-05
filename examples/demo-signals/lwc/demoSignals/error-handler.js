import { $signal, $computed, $effect } from "c/signals";

const anySignal = $signal(0);

$computed(
  () => {
    anySignal.value;
    throw new Error("An error occurred during a computation");
  },
  {
    errorHandler: (error) => {
      console.error("error thrown from computed", error);
      // Allows for a fallback value to be returned when an error occurs.
      return 0;
    }
  }
);

$effect(
  () => {
    throw new Error("An error occurred during an effect");
  },
  {
    errorHandler: (error) => {
      console.error("error thrown from effect", error);
    }
  }
);

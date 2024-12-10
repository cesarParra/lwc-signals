import { $signal, $computed, $effect } from "c/signals";

const anySignal = $signal(0);

$computed(
  () => {
    anySignal.value;
    throw new Error("An error occurred during a computation");
  },
  {
    onError: (error /*_previousValue*/) => {
      console.error("error thrown from computed", error);
      // Allows for a fallback value to be returned when an error occurs.
      return 0;

      // The previous value can also be returned to keep the last known value.
      // return previousValue;
    }
  }
);

$effect(
  () => {
    throw new Error("An error occurred during an effect");
  },
  {
    onError: (error) => {
      console.error("error thrown from effect", error);
    }
  }
);

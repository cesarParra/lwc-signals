import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { fetchHelloWorld } from "c/demoStores";

export default class ServerFetcher extends LightningElement {
  helloWorld = $computed(() => (this.helloWorld = fetchHelloWorld.value)).value;
}

import { LightningElement } from "lwc";
import blocksuite from "@salesforce/resourceUrl/blocksuite";

export default class Blocksuite extends LightningElement {
  containerUrl = blocksuite + "/dist/index.html";
}

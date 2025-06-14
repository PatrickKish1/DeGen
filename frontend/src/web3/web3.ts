import { Web3 } from "web3";
import entryABI from "./api/entry.json";

const web3 = new Web3("https://sepolia.base.org");
const contractAddress = "0x518382220a0C9e474242Ec261019658E907776aE";

const entry = new web3.eth.Contract(entryABI, contractAddress);

export { entryABI, contractAddress }
export default entry;

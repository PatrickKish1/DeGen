import Web3 from "web3";
const provider = new Web3.providers.HttpProvider("https://sepolia.base.org");
const web3 = new Web3(provider);
const contractAddress = "0x518382220a0C9e474242Ec261019658E907776aE";
const contractABI: any[] = [];

const entry = new web3.eth.Contract(contractABI, contractAddress);

export default entry;

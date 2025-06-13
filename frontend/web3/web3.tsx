import Web3 from "web3";
import entryABI from "./api/entry.json";

const provider = new Web3.providers.HttpProvider("https://sepolia.base.org");
const web3 = new Web3(provider);
const contractAddress = "0x518382220a0C9e474242Ec261019658E907776aE";

const entry = new web3.eth.Contract(entryABI, contractAddress);

const registerUser = async () => {
    const accounts = await web3.eth.getAccounts();
    const result = await entry.methods.registerUser().send({ from: "0x525d7CD035a76BCA5Ad7f9B1EB534fB565974ee6" });
    console.log(result);
}

const getUserInfo = async () => {
    const result = await entry.methods.getUserInfo().send({ from: "0x525d7CD035a76BCA5Ad7f9B1EB534fB565974ee6" });
    console.log(result);
}


registerUser();
getUserInfo();

export default entry;

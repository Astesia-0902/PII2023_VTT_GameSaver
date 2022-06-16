const chatHistory = document.getElementById("chatHistory");
const textField = document.getElementById("textField");
const sendText = document.getElementById("sendText");
sendText.addEventListener("click", () => {
    let text = textField.value;
    let regex = /^\/[dD][1-9]\d*( [\+-\-] \d+)*$/;
    let pack;
    if (text !== "") {
        pack = ["text", text];
        ws.send(pack);
        if (!regex.test(text)) {


        } else {
            let sliced = text.toString().slice(2).split(" ");
            pack = ["diceRoll", sliced];
            ws.send(pack);
        }
        textField.value = "";
    }
})
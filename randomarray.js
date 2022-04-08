const fs = require("fs");
function createRandomArray(_number) {
  let outputArray = [];
  for (i = 0; i < _number; i++) {
    outputArray[i] = i + 1;
  }
  outputArray.sort(() => Math.random() - 0.5);

  const text = String(outputArray).replace(/,/gi, "\n");
  fs.writeFileSync("randomArray.txt", text, { encoding: "utf8" });
}

createRandomArray(1000);

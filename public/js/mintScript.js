let account;
let mintIndexForSale = 0;
let maxSaleAmount = 0;
let mintPrice = 0;
let mintStartBlockNumber = 0;
let mintLimitPerBlock = 0;
let mintLimitPerSale = 0;
let round = 4;

let blockNumber = 0;
let blockCnt = false;

async function isWhitelist() {
  let booldata;
  $.ajax({
    url: "/checkwhitelist",
    dataType: "json",
    type: "POST",
    data: { data: account },
    success: function (result) {
      if (String(result.result) == "true") {
        booldata = true;
        window.alert("화리 인증 완료!");
        return booldata;
      } else {
        booldata = false;
        window.alert("화리 미등록 계정입니다!!");
        return booldata;
      }
    },
  });
  return booldata;
}

async function isSpecial() {
  let booldata;
  $.ajax({
    url: "/checkspecial",
    dataType: "json",
    type: "POST",
    data: { data: account },
    success: function (result) {
      if (String(result.result) == "true") {
        booldata = true;
        window.alert("스페셜리스트 인증 완료!");
        return booldata;
      } else {
        booldata = false;
        window.alert("스페셜리스트 미등록 계정입니다!!");
        return booldata;
      }
    },
  });
}

function cntBlockNumber() {
  if (!blockCnt) {
    setInterval(function () {
      blockNumber += 1;
      document.getElementById("blockNubmer").innerHTML =
        "현재 블록: #" + blockNumber;
    }, 1000);
    blockCnt = true;
  }
}

async function connect() {
  const accounts = await klaytn.enable();
  if (klaytn.networkVersion === 8217) {
    console.log("메인넷");
  } else if (klaytn.networkVersion === 1001) {
    console.log("테스트넷");
  } else {
    alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
    return;
  }
  account = accounts[0];
  caver.klay.getBalance(account).then(function (balance) {
    document.getElementById("myWallet").innerHTML = `지갑주소: ${account}`;
    document.getElementById("myKlay").innerHTML = `잔액: ${caver.utils.fromPeb(
      balance,
      "KLAY"
    )} KLAY`;
  });
  await check_status();
}

async function check_status() {
  const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
  await myContract.methods
    .mintingInformation()
    .call()
    .then(function (result) {
      console.log(result);
      mintIndexForSale = parseInt(result[1]);
      mintLimitPerBlock = parseInt(result[2]);
      mintLimitPerSale = parseInt(result[3]);
      mintStartBlockNumber = parseInt(result[4]);
      maxSaleAmount = parseInt(result[5]);
      mintPrice = parseInt(result[6]);
      round = parseInt(result[7]);

      document.getElementById("mintCnt").innerHTML = `${
        mintIndexForSale - 1
      } / ${maxSaleAmount}`;
      document.getElementById(
        "mintLimitPerBlock"
      ).innerHTML = `트랜잭션당 최대 수량: ${mintLimitPerBlock}개`;
      document.getElementById("amount").max = mintLimitPerBlock;
      document.getElementById(
        "mintStartBlockNumber"
      ).innerHTML = `민팅 시작 블록: #${mintStartBlockNumber}`;
      document.getElementById(
        "mintPrice"
      ).innerHTML = `민팅 가격: ${caver.utils.fromPeb(mintPrice, "KLAY")} KLAY`;
    })
    .catch(function (error) {
      console.log(error);
    });
  caver.klay.getBalance(account).then(function (balance) {
    document.getElementById("myWallet").innerHTML = `지갑주소: ${account}`;
    document.getElementById("myKlay").innerHTML = `잔액: ${caver.utils.fromPeb(
      balance,
      "KLAY"
    )} KLAY`;
  });
  blockNumber = await caver.klay.getBlockNumber();
  document.getElementById("blockNubmer").innerHTML =
    "현재 블록: #" + blockNumber;
  cntBlockNumber();
}
async function allMint() {
  await check_status();
  if (round == 0) {
    await specialMint(account);
  } else if (round == 1) {
    await whitelistMint(account);
  } else if (round == 2) {
    await publicMint();
  } else {
    alert("민팅 진행 중이 아닙니다!");
  }
  await check_status();
}
const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);

async function publicMint() {
  if (klaytn.networkVersion === 8217) {
    console.log("메인넷");
  } else if (klaytn.networkVersion === 1001) {
    console.log("테스트넷");
  } else {
    alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
    return;
  }
  if (!account) {
    alert("ERROR: 지갑을 연결해주세요!");
    return;
  }
  const amount = document.getElementById("amount").value;
  await check_status();
  if (maxSaleAmount + 1 <= mintIndexForSale) {
    alert("모든 물량이 소진되었습니다.");
    return;
  } else if (blockNumber <= mintStartBlockNumber) {
    alert("아직 민팅이 시작되지 않았습니다.");
    return;
  }
  const total_value = amount * mintPrice;

  let estmated_gas;

  await myContract.methods
    .publicMint(amount)
    .estimateGas({
      from: account,
      gas: 6000000,
      value: total_value,
    })
    .then(function (gasAmount) {
      estmated_gas = gasAmount;
      console.log("gas :" + estmated_gas);
      myContract.methods
        .publicMint(amount)
        .send({
          from: account,
          gas: estmated_gas,
          value: total_value,
        })
        .on("transactionHash", (txid) => {
          console.log(txid);
        })
        .once("allEvents", (allEvents) => {
          console.log(allEvents);
        })
        .once("Transfer", (transferEvent) => {
          console.log(transferEvent);
        })
        .once("receipt", (receipt) => {
          check_status();
          alert("민팅에 성공하였습니다.");
        })
        .on("error", (error) => {
          alert("민팅에 실패하였습니다.");
          console.log(error);
        });
    })
    .catch(function (error) {
      console.log(error);
      alert("민팅에 실패하였습니다.");
    });
  await check_status();
}

async function whitelistMint(_inputAddress) {
  if (isWhitelist()) {
    if (klaytn.networkVersion === 8217) {
      console.log("메인넷");
    } else if (klaytn.networkVersion === 1001) {
      console.log("테스트넷");
    } else {
      alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
      return;
    }
    if (!account) {
      alert("ERROR: 지갑을 연결해주세요!");
      return;
    }
    const amount = document.getElementById("amount").value;
    await check_status();
    if (maxSaleAmount + 1 <= mintIndexForSale) {
      alert("모든 물량이 소진되었습니다.");
      return;
    } else if (blockNumber <= mintStartBlockNumber) {
      alert("아직 민팅이 시작되지 않았습니다.");
      return;
    }
    const total_value = amount * mintPrice;

    let estmated_gas;

    await myContract.methods
      .whitelistMint(amount)
      .estimateGas({
        from: account,
        gas: 6000000,
        value: total_value,
      })
      .then(function (gasAmount) {
        estmated_gas = gasAmount;
        console.log("gas :" + estmated_gas);
        myContract.methods
          .whitelistMint(amount)
          .send({
            from: account,
            gas: estmated_gas,
            value: total_value,
          })
          .on("transactionHash", (txid) => {
            console.log(txid);
          })
          .once("allEvents", (allEvents) => {
            console.log(allEvents);
          })
          .once("Transfer", (transferEvent) => {
            console.log(transferEvent);
          })
          .once("receipt", (receipt) => {
            check_status();
            alert("민팅에 성공하였습니다.");
          })
          .on("error", (error) => {
            alert("민팅에 실패하였습니다.");
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
        alert("민팅에 실패하였습니다.");
      });
  } else {
    alert("화리 유저만 가능합니다!");
  }
  await check_status();
}

async function specialMint(_inputAddress) {
  if (isSpecial()) {
    if (klaytn.networkVersion === 8217) {
      console.log("메인넷");
    } else if (klaytn.networkVersion === 1001) {
      console.log("테스트넷");
    } else {
      alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
      return;
    }
    if (!account) {
      alert("ERROR: 지갑을 연결해주세요!");
      return;
    }
    const amount = document.getElementById("amount").value;
    await check_status();
    if (maxSaleAmount + 1 <= mintIndexForSale) {
      alert("모든 물량이 소진되었습니다.");
      return;
    } else if (blockNumber <= mintStartBlockNumber) {
      alert("아직 민팅이 시작되지 않았습니다.");
      return;
    }
    const total_value = amount * mintPrice;

    let estmated_gas;

    await myContract.methods
      .whitelistMint(amount)
      .estimateGas({
        from: account,
        gas: 6000000,
        value: total_value,
      })
      .then(function (gasAmount) {
        estmated_gas = gasAmount;
        console.log("gas :" + estmated_gas);
        myContract.methods
          .whitelistMint(amount)
          .send({
            from: account,
            gas: estmated_gas,
            value: total_value,
          })
          .on("transactionHash", (txid) => {
            console.log(txid);
          })
          .once("allEvents", (allEvents) => {
            console.log(allEvents);
          })
          .once("Transfer", (transferEvent) => {
            console.log(transferEvent);
          })
          .once("receipt", (receipt) => {
            check_status();
            alert("민팅에 성공하였습니다.");
          })
          .on("error", (error) => {
            alert("민팅에 실패하였습니다.");
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
        alert("민팅에 실패하였습니다.");
      });
  } else {
    alert("스페셜 유저만 가능합니다!");
  }
  await check_status();
}
/*
async function airDrop() {
  if (klaytn.networkVersion === 8217) {
    console.log("메인넷");
  } else if (klaytn.networkVersion === 1001) {
    console.log("테스트넷");
  } else {
    alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
    return;
  }
  if (!account) {
    alert("ERROR: 지갑을 연결해주세요!");
    return;
  }

  const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
  const airAddress = document.getElementById("airAddress").value;
  const airAmount = document.getElementById("airAmount").value;
  await check_status();
  if (maxSaleAmount + 1 <= mintIndexForSale) {
    alert("모든 물량이 소진되었습니다.");
    return;
  } else if (blockNumber <= mintStartBlockNumber) {
    alert("아직 민팅이 시작되지 않았습니다.");
    return;
  }

  let estmated_gas;

  await myContract.methods
    .airDropMint(airAddress, airAmount)
    .estimateGas({
      from: account,
      gas: 600000000000000,
    })
    .then(function (gasAmount) {
      estmated_gas = gasAmount;
      console.log("gas :" + estmated_gas);
      myContract.methods
        .airDropMint(airAddress, airAmount)
        .send({
          from: account,
          gas: estmated_gas,
        })
        .on("transactionHash", (txid) => {
          console.log(txid);
        })
        .once("allEvents", (allEvents) => {
          console.log(allEvents);
        })
        .once("Transfer", (transferEvent) => {
          console.log(transferEvent);
        })
        .once("receipt", (receipt) => {
          alert("민팅에 성공하였습니다.");
        })
        .on("error", (error) => {
          alert("민팅에 실패하였습니다.");
          console.log(error);
        });
    })
    .catch(function (error) {
      console.log(error);
      alert("민팅에 실패하였습니다.");
    });
}
*/
/*
  const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
  await myContract.methods
    .addWhiteList(_address)
    .send({
      from: account,
      gas: 6000000,
    })
    .then(function (result) {
      console.log(result);
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function bootstrap() {
  const caver = new Caver(klaytn);
  const [address] = await klaytn.enable();
  const signedMessage = await caver.rpc.klay.sign(address, "my message");

  const payload = await fetch("http://localhost:8080/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      signedMessage,
    }),
  });

  console.log(getRLPEncodingAccountKey(address));
}
*/

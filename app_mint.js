//require 모음
const express = require("express");
const { append } = require("express/lib/response");
const app = express();
const router = express.Router();
const fs = require("fs");
//const helmet = require("helmet");
const limit = require("express-rate-limit");
const Caver = require("caver-js");
const CONTRACT = require("./build/wgContract.json");
const { pkey, addr } = require("./dataset/secret.js");
const bodyParser = require("body-parser");
const { stringify } = require("querystring");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

const rpcURL = "https://api.baobab.klaytn.net:8651/";
const caver = new Caver(rpcURL);

const temp = caver.klay.accounts.createWithAccountKey(addr, pkey);
caver.klay.accounts.wallet.add(temp);
const acc = caver.klay.accounts.wallet.getAccount(0);

const networkID = "1001";
const contract = new caver.klay.Contract(CONTRACT.abi, CONTRACT.address);

//hide backend engine
app.disable("x-powered-by");

//ddos simple protaction
app.use(
  limit({
    windowMs: 1 * 60 * 1000,
    max: 5000,
  })
);

//포트 설정
const port = process.env.PORT || 8888;

//테스트 서버 포트
//const port = process.env.PORT || 800;
let round = 0;
//동적 폴더(CSS,JS 로딩 용이)
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index.html");
});

app.post("/checkwhitelist", (req, res) => {
  var data = req.body.data;
  res.send({ result: isWhiteList(String(data)) });
});

app.post("/checkspecial", (req, res) => {
  var data = req.body.data;

  console.log(data);
  res.send({ result: isSpecial(String(data)) });
});

//라우터에서 설정되어 있지 않은 주소로 접속하
app.all("*", (req, res) => {
  res.send(
    "<script>alert('존재하지 않는 주소입니다.'); window.location = 'http://' + window.location.hostname;</script>"
  );
  //res.status(404).send("PAGE NOT FOUND")
});

app.listen(port, (err) => {
  if (err) return console.log(err);
  console.log("The Test server is listening on " + port);
});

//-------------------------------------------------------------------//
//----------------------Function part--------------------------------//
//-------------------------------------------------------------------//

function isWhiteList(_inputAddress) {
  const article = fs.readFileSync("./dataset/whitelist.txt");
  let wlDB = String(article).split("\n");

  for (i = 0; i <= wlDB.length; i++) {
    let data = wlDB[i];
    let dataST = String(data).substr(0, 42);
    if (String(dataST).toUpperCase() == _inputAddress.toUpperCase()) {
      return true;
    }
    return false;
  }
}

function isSpecial(_inputAddress) {
  const article = fs.readFileSync("./dataset/special.txt");
  let spDB = String(article).split("\n");

  for (i = 0; i <= spDB.length; i++) {
    let data = spDB[i];
    let dataST = String(data).substr(0, 42);
    console.log(String(dataST).toUpperCase() == _inputAddress.toUpperCase());
    if (String(dataST).toUpperCase() == _inputAddress.toUpperCase()) {
      return true;
    } else return false;
  }
}

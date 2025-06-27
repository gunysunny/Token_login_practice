const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const users = [
  {
    user_id: "test",
    user_password: "1234",
    user_name: "테스트 유저",
    user_info: "테스트 유저입니다",
  },
];

const app = express();

app.use(
  cors({
    origin: [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://localhost:5502",   // ★ 추가!
      "http://127.0.0.1:5502",
    ],
    methods: ["OPTIONS", "POST", "GET", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

const secretKey = "ozcodingschool";

// 1,2. 로그인 요청 처리 (POST /)
app.post("/", (req, res) => {
  const { userId, userPassword } = req.body;
  const userInfo = users.find(
    (el) => el.user_id === userId && el.user_password === userPassword
  );
  if (!userInfo) {
    res.status(401).send("로그인 실패");
  } else {
    // 1. accessToken 발급
    const payload = {
      user_id: userInfo.user_id,
      user_name: userInfo.user_name,
    };
    const accessToken = jwt.sign(payload, secretKey, { expiresIn: "1h" });

    // 2. 토큰을 응답으로 전송
    res.send({ accessToken }); // (프론트는 response.data.accessToken으로 받음)
  }
});

// 3,4. 토큰 검증 및 유저정보 반환 (GET /)
app.get("/", (req, res) => {
  // 헤더에서 accessToken 추출
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("토큰 없음");
  }

  const token = authHeader.replace("Bearer ", "");
  // 3. accessToken 검증
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send("토큰이 유효하지 않습니다.");
    }
    // 4. 검증 완료 → 유저정보 반환
    const userInfo = users.find((el) => el.user_id === decoded.user_id);
    if (!userInfo) {
      return res.status(404).send("유저를 찾을 수 없습니다.");
    }
    // 민감정보(비번)는 제외하고 전송
    const { user_password, ...rest } = userInfo;
    res.send(rest);
  });
});

app.listen(3000, () => console.log("서버 실행!"));

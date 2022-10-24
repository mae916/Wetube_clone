//필요한 모든 것 들을 초기화, import 시키는 역할을 하는 파일
import dotenv from "dotenv/config";
import "./db";
import "./models/Video";
import "./models/User";
import app from "./server";

const PORT = 4000;

const handleListening = () => {
  console.log(`✅ Server listening on port http://locallhost:${PORT}🎉`);
};

app.listen(PORT, handleListening);

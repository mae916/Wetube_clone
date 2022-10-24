import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
  return res.render("join", { pageTitle: "join" });
};

export const postJoin = async (req, res) => {
  const { email, username, password, password2, name, location } = req.body;
  const pageTitle = "Join";

  // 비밀번호 일치 여부
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "비밀번호가 서로 일치하지 않습니다.",
    });
  }

  // username / email 중복 확인
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "이미 사용중인 username / email 입니다.",
    });
  }
  try {
    await User.create({
      email,
      username,
      password,
      name,
      location,
    });
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: error._message,
    });
  }

  return res.redirect("/login");
};

export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "Login" });
};

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username });

  // username 확인
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "username이 일치하지 않습니다.",
    });
  }

  //password 확인
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "password가 일치하지 않습니다.",
    });
  }
  req.session.loggedIn = true; // 로그인 완료
  req.session.user = user; // 유저가 로그인 하면 그 유저에 대한 정보를 세션에 담기

  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json", //json으로 return 받기 위해 필요, 이걸 보내지 않으면 github이 text로 응답함.
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    //변수 in 객체
    const { access_token } = tokenRequest; //json에서 access_token를 뽑아오고,
    const userRequest = await (
      await fetch("https://api.github.com/user", {
        //토큰으로 API 접근해서
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json(); //json 형식으로 user 정보 가져오기
    console.log(userRequest);
  } else {
    return res.redirect("/login");
  }
};

export const edit = (req, res) => {
  res.send("Edit User");
};

export const remove = (req, res) => {
  res.send("Delete User");
};

export const logout = (req, res) => {
  res.send("LOGOUT");
};

export const see = (req, res) => {
  res.send("SEE USER");
};

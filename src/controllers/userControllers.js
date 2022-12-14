import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
  return res.render("users/join", { pageTitle: "join" });
};

export const postJoin = async (req, res) => {
  const { email, username, password, password2, name, location } = req.body;
  const pageTitle = "Join";

  // 비밀번호 일치 여부
  if (password !== password2) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: "비밀번호가 서로 일치하지 않습니다.",
    });
  }

  // username / email 중복 확인
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: "이미 사용중인 username / email 입니다.",
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: error._message,
    });
  }

  return res.redirect("/login");
};

export const getLogin = (req, res) => {
  return res.render("users/login", { pageTitle: "Login" });
};

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username, socialOnly: false });

  // username 확인
  if (!user) {
    return res.status(400).render("users/login", {
      pageTitle,
      errorMessage: "username이 일치하지 않습니다.",
    });
  }

  //password 확인
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("users/login", {
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
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        //토큰으로 API 접근해서
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json(); //json 형식으로 user 정보 가져오기

    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      //알림
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      // db에 저장된 email과 github에서 받아온 email이 같지 않은 유저가 없으면
      //github에서 받아온 user 정보로 계정 생성
      user = await User.create({
        name: userData.name ? userData.name : userData.login, // name:null인 경우가 있음
        avatarUrl: userData.avatar_url,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    //같은 email이 있는 경우 로그인 시킴
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const startKakaoLogin = (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/authorize";
  const config = {
    client_id: process.env.KAKAO_REST_API,
    redirect_uri: process.env.KAKAO_REDIRECT,
    response_type: "code",
  };
  const params = new URLSearchParams(config).toString();
  const finishUrl = `${baseUrl}?${params}`;
  res.redirect(finishUrl);
};

export const finishKakaoLogin = async (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/token";
  const config = {
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API,
    redirect_uri: process.env.KAKAO_REDIRECT,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finishUrl = `${baseUrl}?${params}`;
  const contentType = "application/x-www-form-urlencoded;charset=utf-8";
  const tokenRequest = await (
    await fetch(finishUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const userData = await (
      await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-type": contentType,
        },
      })
    ).json();

    let user = await User.findOne({ email: userData.kakao_account.email });
    if (!user) {
      user = await User.create({
        email: userData.kakao_account.email,
        avatarUrl: userData.properties.profile_image_url,
        socialOnly: true,
        username: userData.properties.nickname,
        password: "",
        name: userData.properties.nickname,
        location: "",
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const getEdit = (req, res) => {
  return res.render("users/edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { name, email, username, location },
  } = req;

  const emailExists = await User.exists({
    $and: [
      { _id: { $ne: _id } },
      {
        email: { $in: email },
      },
    ],
  });

  if (emailExists) {
    return res.status(400).render("users/edit-profile", {
      errorMessage: "이미 존재하는 email 입니다.",
    });
  }

  const usernameExists = await User.exists({
    $and: [
      { _id: { $ne: _id } },
      {
        username: { $in: username },
      },
    ],
  });

  if (usernameExists) {
    return res.status(400).render("users/edit-profile", {
      errorMessage: "이미 존재하는 username 입니다.",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect("edit");
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const getChangePassword = (req, res) => {
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    body: { oldPassword, newPassword, newPassword2 },
    session: {
      user: { _id },
    },
  } = req;

  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);

  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "기존 비밀번호가 일치하지 않습니다.",
    });
  }

  if (oldPassword === newPassword) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "기존 비밀번호와 변경할 비밀번호가 같습니다.",
    });
  }

  if (newPassword !== newPassword2) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "변경할 비밀번호가 일치하지 않습니다.",
    });
  }

  user.password = newPassword;
  await user.save(); //미들웨어(hash화)

  req.session.destroy();
  return res.redirect("/login");
};

export const see = (req, res) => {
  return res.send("SEE USER");
};

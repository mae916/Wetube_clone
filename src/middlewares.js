export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn); // undefined 같은 값을 false로 변경해주기 위해
  res.locals.siteName = "Wetube";
  res.locals.loggedInUser = req.session.user || {}; // loggedInUser값을 불러 오지 못할때 undefined 오류 방지
  next();
};

// 로그인 하지 않은 유저가 가면 안되는 url에 접근 할 때
export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    //session에 저장 되어있기 때문에 어디서든 쓸 수 있음.
    return next();
  } else {
    return res.redirect("/login");
  }
};

// 로그인을 한 유저가 가면 안되는 url에 접근 할 때
export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    return res.redirect("/");
  }
};

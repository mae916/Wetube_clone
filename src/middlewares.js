export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn); //undefined 같은 값을 false로 변경해주기 위해
  res.locals.loggedInUser = req.session.user;
  res.locals.siteName = "Wetube";
  next();
};

export default function authMiddleware(req, res, next) {
  // verify JWT / session
  req.user = { id: "someUserId" };
  next();
}

import session from "express-session";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

class Middleware {
  constructor() {
    this.sessionMiddleware = session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", // set to true if using https
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    });
  }
  getSessionMiddleware() {
    return this.sessionMiddleware;
  }
  authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        req.user = {
          id: decoded.id,
          userId: decoded.id, // Ensure userId is set
          email: decoded.email
        };
        next();
      });
    } else if (req.session && req.session.user) {
      req.user = {
        ...req.session.user,
        userId: req.session.user.id // Ensure userId is set
      };
      next();
    } else {
      return res.status(401).json({ error: "No token or session provided" });
    }
  }
}

const middleware = new Middleware();
const sessionMiddleware = middleware.getSessionMiddleware();
const authenticateToken = middleware.authenticateToken.bind(middleware);

export { sessionMiddleware, authenticateToken }
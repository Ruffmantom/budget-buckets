import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export default function(passport) {
  // Local strategy
  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return done(null, false, { message: "Incorrect email or password." });

        if (!user.password) {
          return done(null, false, { message: "Account registered via Google. Please sign in with Google." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: "Incorrect email or password." });

        if (user.user_status !== "active") {
          return done(null, false, { message: "User is not active." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // JWT strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
      },
      async (jwtPayload, done) => {
        try {
          const user = await User.findById(jwtPayload.id).select("-password");
          if (user) return done(null, user);
          return done(null, false);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (email) {
              const existingUser = await User.findOne({ email });
              if (existingUser) {
                existingUser.googleId = profile.id;
                await existingUser.save();
                return done(null, existingUser);
              }
            }

            user = new User({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || `no-email-${profile.id}@google.com`,
              full_name: profile.displayName || "No Name",
              user_status: "active",
              user_role: "user"
            });
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

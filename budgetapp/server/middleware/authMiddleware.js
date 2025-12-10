import passport from "passport";

// protect user route access
export const protect = passport.authenticate("jwt", { session: false });

// export const twoFactorAuthEmailCheckUserAttempts = asyncHandler(async (req, res) => {
//     // FUTURE
// })
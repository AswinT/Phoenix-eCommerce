const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
require('dotenv').config();

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        if (user.isBlocked) {
            return done(null, false, { message: 'Your account has been blocked' });
        }
        
        if (!user.isVerified) {
            return done(null, false, { message: 'Please verify your email first' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Google OAuth Strategy - Only initialize if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                if (user.isBlocked) {
                    return done(null, false, { message: "User is blocked" });
                }
                return done(null, user);
            } else {
                const existingUser = profile.emails && profile.emails[0] ? 
                    await User.findOne({ email: profile.emails[0].value }) : null;
                    
                if (existingUser) {
                    existingUser.googleId = profile.id;
                    await existingUser.save();
                    return done(null, existingUser);
                }
                
                if (profile.emails && profile.emails[0]) {
                    user = new User({
                        fullname: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        isVerified: true
                    });
                    await user.save();
                    return done(null, user);
                } else {
                    return done(null, false, { message: "Email not provided by Google" });
                }
            }
        } catch (error) {
            console.error('Error in Google Strategy:', error);
            return done(error, null);
        }
    }));
    console.log('✅ Google OAuth strategy initialized successfully');
} else {
    console.log('⚠️ Google OAuth credentials not found. Google login will be disabled.');
}

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

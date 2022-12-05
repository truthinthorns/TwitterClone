//const {campgroundSchema,reviewSchema} = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const User = require('./models/user');
const Tweet = require('./models/tweet');
const catchAsync = require('./utils/CatchAsync');

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must be logged in');
        return res.redirect('/login');
    }
    next();
}

module.exports.isTweetAuthor = catchAsync(async(req,res,next)=>{
    const {id,tweetID} = req.params;
    const tweet = await Tweet.findById(tweetID).populate('author');
    if(!tweet.author.equals(req.user._id)){
        console.log('You do not have permission to do that!');
        req.flash('error','You do not have permission to do that!');
        return res.redirect(`/profile/${id}`);
    }
    next();
})

module.exports.isOwnProfile = catchAsync(async(req,res,next)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    if(!user._id.equals(req.user._id)){
        req.flash('error','You do not have permission to do that!');
        return res.redirect(`/profile/${id}`);
    }
    next();
})
const express = require('express');
const path = require('path');
const app = express();
const ejsMate = require('ejs-mate');
const session = require('express-session');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Tweet = require('./models/tweet');
const Following = require('./models/following');
const Followers = require('./models/followers');
const moment = require('moment');
const catchAsync = require('./utils/CatchAsync');
const { isLoggedIn, isTweetAuthor,isOwnProfile } = require('./middleware');
const followers = require('./models/followers');

mongoose.connect('mongodb://localhost:27017/portfolio', { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error'));
db.once('open', () => {
    console.log("Database Connected");
})

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.set('public', path.join(__dirname, '/public'));

//this is required to be able to see contents of req.body
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7),
        maxAge: (1000 * 60 * 60 * 24 * 7)
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// first makes sure you're logged in
// then gets ALL tweets (temporary), and renders the homepage.
app.get('/', isLoggedIn, catchAsync(async (req, res) => {
    const tweets = await Tweet.find({}).populate('author');
    res.render('home.ejs',{title: 'Home',tweets});
}))

// renders the sign up page.
app.get('/signup', (req, res) => {
    res.render('signup.ejs',{title: 'Sign Up'});
})

// gets the info from the sign up page, then creates a new user with that info, logs them in, and redirects to the homepage.
app.post('/signup', catchAsync(async (req, res) => {
    try {
        const {username,name,dob,email,password}=req.body;
        const user = new User({username,name,dob,email,joinDate: new Date()});
        const registeredUser = await User.register(user, password);
        const followers = new Followers({owner: registeredUser._id});
        const following = new Following({owner: registeredUser._id});
        const savedFollowers = await followers.save();
        const savedFollowing = await following.save();
        user.followers = savedFollowers._id;
        user.following = savedFollowing._id;
        await user.save();
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Kiwi Beans!');
            res.redirect('/');
        })
    } catch (e) {
        console.log(e);
        req.flash('error', e.message);
        res.redirect('/signup');
    }
}))

// renders the login page.
app.get('/login', (req, res) => {
    res.render('login.ejs',{title: 'Login'});
})

// this looks for a username and password by default.
// redirects to either the home page or the page requested before being logged in.
// ALERT: I don't think the redirect works correctly. Always goes to homepage.
app.post('/login',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),(req, res) => {
    req.flash('success', 'Welcome Back!');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

// first makes sure you're logged in
// then logs you out and redirects to the login page since you must be logged in to use this app.
app.get('/logout',isLoggedIn,(req, res) => {
    req.logout((err) => {
        if (err) { return next(err) }
    })
    req.flash('success', 'Goodbye!');
    res.redirect('/login');
})

// first makes sure you're logged in
// gets the tweet content and creates a new Tweet with that info, then redirects to the homepage.
app.post('/posttweet', isLoggedIn, catchAsync(async (req,res)=>{
    const {content} = req.body;
    const formattedTimestamp = moment(new Date()).utc().format("ddd, MMM Do YYYY, h:mm A");
    const tweet = new Tweet({author: req.user._id, content,timestamp: new Date(),formattedTimestamp,likes: 0});
    await tweet.save();
    req.flash('success','Successfully Composed Tweet');
    res.redirect('/');
}))

// first makes sure you're logged in
// then looks for a user, and gets the join and birth month, the user's tweets, following & follower counts, then renders that user's profile page.
app.get('/profile/:id', isLoggedIn, catchAsync(async(req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    //get the count of followers and following
    let followerCount = await Followers.aggregate([{$match: {owner: user._id}}, {$project: {users: {$size: '$users'}}}])
    let followingCount = await Following.aggregate([{$match: {owner: user._id}}, {$project: {users: {$size: '$users'}}}])
    followerCount = followerCount[0].users;
    followingCount = followingCount[0].users;
    const followerList = await Followers.findById(user.followers).select('users -_id');
    const followingList = await Following.findById(user.following).select('users -_id');
    const followers = [];
    const following = [];
    for(let follower of followerList.users){
        followers.push(await User.findById(follower))
    }
    for(let followed of followingList.users){
        following.push(await User.findById(followed))
    }
    const joinDate = moment(user.joinDate).utc().format('MMMM YYYY')
    const birthDate = moment(user.dob).utc().format('MMMM Do, YYYY')
    const tweets = await Tweet.find({"author" : user._id}).populate('author');
    res.render('profile',{title: 'Profile',user,joinDate,birthDate,tweets,followerList,followerCount,followingCount,followers,following});
}))

// first makes sure you're logged in
// then finds a user with the requested id. if found, updates it with the entered info and redirects to the profile page. if not, redirects to the home page.
// user gets logged out if they change their username, so that needs to be solved. They can change everything else without having to log back in, though.
app.put('/profile/:id',isLoggedIn, catchAsync(async(req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    if(!user){
        req.flash('error',"Can't find that profile!");
        return res.redirect('/');
    }
    const newInfo = {...req.body.profile};
    const profile = await User.findByIdAndUpdate(id,newInfo);
    req.flash('success','Successfully updated profile!');
    res.redirect(`/profile/${user._id}`);
}))

// first makes sure you're logged in and it's your profile.
// then finds a user, and renders an edit form with the fields filled out with the user's saved info.
app.get('/profile/:id/edit', isLoggedIn,isOwnProfile, catchAsync(async(req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    const dob = moment(user.dob).utc().format("YYYY-MM-DD");
    res.render('editprofile',{user,dob,title:'Edit Profile'});
}))

// first makes sure you're logged in.
// then checks the following and follower lists to make sure the user is not already following the other user,
// then finds the followers record and adds the followed user to the list of following,
// then adds the following user to the followed user's follower list
app.put('/follow/:followingid/:followerid', isLoggedIn, catchAsync(async(req,res)=>{
    const {followingid,followerid} = req.params;

    //get the User object representing the user to be followed (followee: A)
    const userToBeFollowed = await User.findById(followingid);
    //get the User object representing the user that is doing the following (follower: B)
    const userFollowing = await User.findById(followerid);

    //use following id from B as the id to get the Following object representing the list of users they follow
    const followingList = await Following.findById(userFollowing.following);
    //use follower id from A as the id to get the Follower object representing the list of users that follow them
    const followerList = await Followers.findById(userToBeFollowed.followers);

    //check if B is already following A
    const followingListIndex = followingList.users.indexOf(userToBeFollowed._id)

    //probably unnecessary. if followingListIndex returns -1, it should be fine. but better safe than sorry? maybe?
    //check if A is already followed by B
    const followerListIndex = followerList.users.indexOf(userFollowing._id)

    //if they both equal -1, B is not following A, and A is not in B's follower list
    if(followingListIndex ===-1 && followerListIndex === -1){
        //add A to the list of users B follows
        await followingList.users.push(userToBeFollowed._id);
        //add B to the list of users that follow A
        await followerList.users.push(userFollowing._id);

        //save the updated lists
        await followingList.save();
        await followerList.save();
    }

    req.flash('success','Followed User!');
    res.redirect(`/profile/${followingid}`);
}))

// first makes sure you're logged in.
// then finds the followers record and removes the unfollowed user from the list of following,
// then removes the unfollowing user from the unfollowed user's list of followers
app.put('/unfollow/:followingid/:followerid', isLoggedIn, catchAsync(async(req,res)=>{
    const {followingid,followerid} = req.params;

    //get the User object representing the user to be unfollowed (unfollowee: A)
    const userToBeUnfollowed = await User.findById(followingid);
    //get the User object representing the user that is doing the unfollowing (unfollower: B)
    const userUnfollowing = await User.findById(followerid);

    //use following id from B as the id to get the Following object representing the list of users they follow
    const followingList = await Following.findById(userUnfollowing.following);
    //use follower id from A as the id to get the Follower object representing the list of users that follow them
    const followerList = await Followers.findById(userToBeUnfollowed.followers);

    //check to make sure A._id is found in the list of users that are followed
    const followingListIndex = followingList.users.indexOf(userToBeUnfollowed._id)

    //check to make sure B._id is found in the list of users that are followed
    const followerListIndex = followerList.users.indexOf(userUnfollowing._id)

    //if they both not equal to -1, B is following A, and A is in B's follower list
    if(followingListIndex !==-1 && followerListIndex !==-1){
        //remove A from the list of users B follows
        await followingList.users.splice(followingListIndex,1);
        //remove the A from the list of users that follow A
        await followerList.users.splice(followerListIndex,1);

        //save the updated lists
        await followingList.save();
        await followerList.save();
    }   

    req.flash('success','Unfollowed User!');
    res.redirect(`/profile/${followingid}`);
}))

// first makes sure you're logged in and you're the tweet author
// then looks for a tweet to make sure it's valid. if so, deletes it and reloads the profile page. if not, reloads the profile page without deleting anything.
app.delete('/deletetweet/:id/:tweetID',isLoggedIn,isTweetAuthor, catchAsync(async(req,res)=>{
    const {id,tweetID} = req.params;
    //const user = await User.findById(id);
    const tweet = await Tweet.findById(tweetID);
    if(!tweet){
        req.flash('error',"Can't find that tweet!");
        return res.redirect(`/profile/${id}`);
    }
    await Tweet.findByIdAndDelete(tweetID);
    req.flash('success','Deleted Tweet!');
    res.redirect(`/profile/${id}`);
}))

app.get('/search', isLoggedIn, catchAsync(async(req,res)=>{
    const {userSearch} = req.query;
    if(!userSearch || userSearch.length < 3){
        console.log('invalid')
        return;
    }
    const regexSearch1 = new RegExp(`${userSearch}*`);
    const regexSearch2 = new RegExp(`${userSearch}`);
    const users = await User.find();
    const results = []
    for(let user of users){
        if(regexSearch1.test(user.username) || regexSearch2.test(user.username) || regexSearch1.test(user.name) || regexSearch2.test(user.name)){
            results.push(user)
        }
    }
    console.log('\n\n')
    res.render('searchResults',{title:'Search Results', results});
}))

//to access the app, must open localhost:3000
app.listen(3000, () => {
    console.log('Server Open on Port 3000');
})
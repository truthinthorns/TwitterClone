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

app.get('/', (req, res) => {
    res.render('home.ejs');
})

// app.get('/signup', (req, res) => {
//     res.render('signup.ejs');
// })

// app.post('/signup', async (req, res) => {
//     try {
//         console.log(req.body.name);
//         const {fullname, username, email, password, dob, ssn } = req.body;
//         const student = new Student({ name: fullname ,email, username, dob, ssn });
//         const registeredStudent = await Student.register(student, password);
//         console.log(registeredStudent);
//         req.login(registeredStudent, err => {
//             if (err) return next(err);
//             req.flash('success', 'Welcome to YelpCamp!');
//             res.redirect('/coursehistory');
//         })
//     } catch (e) {
//         console.log(e)
//         req.flash('error', e.message);
//         res.redirect('/signup');
//     }
// })

// app.get('/login', (req, res) => {
//     res.render('login.ejs');
// })

// //this looks for a username and password by default.
// app.post('/login',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),(req, res) => {
//     req.flash('success', 'Welcome Back!');
//     const redirectUrl = req.session.returnTo || '/coursehistory';
//     delete req.session.returnTo;
//     res.redirect(redirectUrl);
// })

// app.get('/coursehistory', async(req, res) => {
//     const student = await Student.findById(req.user._id).populate('courseHistory');
//     res.render('academics/mycoursehistory.ejs', { student });
// })

// app.get('/viewgrades', async(req, res) => {
//     const student = await Student.findById(req.user._id).populate('courseHistory');
//     const termSet = new Set();
//     for(let c of student.courseHistory){
//         termSet.add(c.term);
//     }
//     res.render('academics/viewmygrades.ejs',{termSet});
// })
// app.get('/viewgrades/:term', async(req, res) => {
//     const {term} = req.params;
//     const student = await Student.findById(req.user._id).populate('courseHistory');
//     const courses = [];
//     for(let course of student.courseHistory){
//         if(course.term==term)
//             courses.push(course);
//     }
//     res.render('academics/viewsemestergrades.ejs',{courses,term});
// })

// app.get('/courseinfo/:courseID/:courseTerm',async(req,res)=>{
//     let {courseID,courseTerm} = req.params;
//     courseTerm = courseTerm.replace(' ','');
//     const student = await Student.findById(req.user._id).populate('courseHistory');
//     for(let course of student.courseHistory){
//         if(course.term===courseTerm && course.number===courseID){
//             console.log(course);
//             return res.render('/meetingInfo',{course});
//         }
//     }
//     console.log()
//     res.render()
// })

app.listen(3000, () => {
    console.log('Server open on port 3000');
})
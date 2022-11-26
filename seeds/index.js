const mongoose=require('mongoose');
const CourseHistory = require('../models/CourseHistory');
const Student = require('../models/Student');
const courses = require('./courses');

mongoose.connect('mongodb://localhost:27017/portfolio',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error',console.error.bind(console,'Connection Error'));
db.once('open',()=>{
    console.log("Database Connected");
})

const seedDB = async()=>{
    await CourseHistory.deleteMany({});
    for(let course of courses){
        const c = new CourseHistory({
            number: course.number,
            name: course.name,
            term: course.term,
            grade: course.grade,
            points: course.points,
            status: course.status,
            meetingInfo: {
                startDate: course.meetingInfo.startDate,
                endDate: course.meetingInfo.endDate,
                days: course.meetingInfo.days,
                times: course.meetingInfo.times,
                room: course.meetingInfo.room,
                instructor: course.meetingInfo.instructor
            },
            studentRef: course.studentRef
        })
        await c.save();
        const student = await Student.findByIdAndUpdate(
            course.studentRef,
            {"$push": {"courseHistory": c._id}}
        );
    }
}
seedDB()
.then(()=>{
    mongoose.connection.close();
});
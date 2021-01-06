require('dotenv').config()
const express = require('express')
const session = require('express-session')
const app = express()
const ejs =require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const passport = require('passport')
const Emitter = require('events')
const PORT = process.env.PORT || 3000

app.use(expressLayout)
app.set('views',path.join(__dirname,'/resources/views'))
app.set('view engine','ejs')

const mongoose = require('mongoose')

const flash = require('express-flash')
const { Store } = require('express-session')
const MongoDbstore = require('connect-mongo')(session)

// database connection
const url = 'mongodb://localhost/pizza';
mongoose.connect(url,{ useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: true});
const connection = mongoose.connection;
connection.once('open', ()=>{
    console.log('database connected...');

}).catch(err => {
    console.log('connection failed...');
});



// session Store
let mongoStore = new MongoDbstore({
    mongooseConnection: connection,
    collection: 'sessions'
})

//Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

// express session config 
app.use(session ({
   secret: process.env.COOKIE_SECRET,
   resave: false,
   store: mongoStore,
   saveUninitialized: false,
   cookie: {maxAge: 1000 * 60 * 60 * 24}
}))

//Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

// global middleware
app.use( (req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
  })


app.use(flash())

//Assets
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

require('./routes/web')(app)

// global middleware
// app.use( (req, res, next) => {
//   res.locals.session = req.session
//   next()
// })

//set template engin


const server = app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})

// Socket
const io = require('socket.io')(server)
io.on('connection', (socket) => {
    //join
  socket.on('join', (orderId) => {
      socket.join(orderId)
  })

})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})
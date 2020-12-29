require('dotenv').config();
const express= require("express");
const ejs= require("ejs");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
// const encrypt= require("mongoose-encryption");
// const md5= require("md5");
// const bcrypt= require("bcryptjs");
// const saltRounds=10;
const session = require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const GoogleStrategy= require('passport-google-oauth20').Strategy;
const findOrCreate= require("mongoose-findorcreate");

console.log(process.env.GOOGLE_CLIENT_ID);
const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret: "My little secret!",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema= mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret="Thisismylittlesecret."
// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:['password']});

const User= mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"https//www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/register',(req,res)=>{
    res.render("register");
})

app.get('/login',(req,res)=>{
    res.render("login");
})

// app.get('/secrets',(req,res)=>{
//     if(req.isAuthenticated()){
//         res.render("secrets");
//     }else{
//         res.redirect("/login");
//     }
// })

app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit",(req,res)=>{
    const submittedSecret=req.body.secret;
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(()=>{
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.post('/register',(req,res)=>{
    // bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
    //     newUser= new User({
    //         email:req.body.username,
    //         password:hash
    //     })
    //     newUser.save((err)=>{
    //         if(!err){
    //             console.log("Successfully registered!");
    //             res.render('secrets');
    //         }else
    //         console.log(err);
    //     })
    // })
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })
})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
});

app.get("/secrets",(req,res)=>{
    User.find({"secret":{$exists:true}},(err,foundUsers)=>{
        if(err)
        console.log(err);
        else{
            if(foundUsers){
                console.log(foundUsers);
                res.render("secrets",{usersWithSecrets:foundUsers});
            }
        }
    });
});

app.post('/login',(req,res)=>{
    // username= req.body.username;
    // password= req.body.password;
    // User.findOne({email:username},(err,foundUser)=>{
    //     if(err){
    //         console.log(err);
    //     }else{
    //         if(foundUser){
    //             // if(foundUser.password===password) 
    //             bcrypt.compare(password,foundUser.password,(err,result)=>{
    //                 if(result==true){
    //                     res.render("secrets");
    //                 }
    //             })
                
    //         }
    //     }
    // })
    const user= new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })

})








app.listen(3000,()=>{
    console.log("Successfully started server at port 3000.");
})
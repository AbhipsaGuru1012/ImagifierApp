require('dotenv').config();

const express=require('express');
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const passportLocalMongoose=require("passport-local-mongoose");
const methodOverride=require("method-override");
const User=require("./models/user.js");
dbUrl=process.env.DB_URL;


// mongoose.connect('mongodb://localhost/image_app', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
mongoose.connect(dbUrl, {
	useNewUrlParser: true,
	 useCreateIndex: true,
   useUnifiedTopology: true,
	 useFindAndModify: false
});

const db=mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
	console.log("Database connected!");
})

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));


app.use(require("express-session")({
	secret:"You should not take the name of 'You know who'",
	resave:false,
	saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());

passport.use('local',new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



const imageSchema=new mongoose.Schema({
	title:String,
	desc:String,
	url:String,
	author:{
		type:mongoose.Types.ObjectId,
		ref:'User'
			
	}
	
})

const Image=new mongoose.model("Image", imageSchema);

app.use((req, res, next)=>{
	res.locals.currentUser=req.user;
	next();
})

const isLoggedIn=(req, res, next)=>{
	console.log(req.user);
	if(!req.isAuthenticated()){
		return res.redirect("/login");
	}
	return next();
}


app.get("/", async (req, res)=>{
	await Image.find({}).populate('author').exec(function(err, images){
		if(err){
			console.log(err);
		}else{
			res.render("index", {images})
		} 
	})
})


app.get("/new", isLoggedIn, (req, res)=>{
	res.render("new");
})

app.post("/", isLoggedIn, (req, res)=>{
	
	Image.create(req.body.image, (err, image)=>{
		if(err){
			res.render("new");
		}else{
			res.redirect("/");
		}
	})
})
// app.get("/:image_id", async (req, res)=>{
	
// 	await Image.findById(req.params.image_id).populate('author').exec(async function(err, foundImage){
// 		if(err){
// 			console.log(err);
// 		}else{
// 			res.render("show", {image:foundImage});
// 		}
// 	})
// })
app.get("/:image_id/edit", isLoggedIn, async function(req, res){
	await Image.findById(req.params.image_id, function(err, image){//only writing this to check if the id of campground is right, or else our app could crash
		if(err){

			return res.redirect("/");
		}else{
			res.render("edit", {image});
		}
	 	
	})
	
	
})
app.put("/:image_id", isLoggedIn, function(req, res){
	 Image.findByIdAndUpdate(req.params.image_id, req.body.image, function(err, updatedImage){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/");
		}
	})
})
app.delete("/:image_id", isLoggedIn, function(req, res){
	Image.findByIdAndRemove(req.params.image_id, function(err){
		if(err){
			res.redirect("back");
		}else{
			
			res.redirect("/");
		}
	})
})
app.get("/login", (req, res)=>{
	res.render("login");
})
app.get("/register", (req, res)=>{
	res.render("register");
})
app.post("/register", async(req, res, next)=>{
	const newUser=new User({username:req.body.username});
	const registeredUser=await User.register(newUser, req.body.password)
	
	req.login(registeredUser, err=>{
		if(err) return next(err);
		res.redirect("/");
	})
	res.redirect("/");
})
app.post("/login", passport.authenticate('local',
	{
		successRedirect:"/",
		failureRedirect:"/login",
		failureFlash:true
	
	}), function(req, res){
	res.redirect("/");
})
app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/")
})



const port=process.env.PORT || 3000;

app.listen(port,() => {
	console.log(`Server listening on ${port}`);
})
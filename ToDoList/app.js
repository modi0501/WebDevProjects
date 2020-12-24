//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose= require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});
const itemSchema={
  name:String
};

const Item= mongoose.model("Item",itemSchema);

const item1=new Item({
  name:"Welcome to your ToDoList!"
})
const item2=new Item({
  name:"Hit the + button to add a new item."
})
const item3=new Item({
  name:"<--- Hit this to delete an item"
})

const defaultItems= [item1,item2,item3];



app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({},(err,foundItems)=>{
    if(err)
    console.log(err);
    else{
      if(foundItems.length===0){
        Item.insertMany(defaultItems,(err)=>{
          if(err){
            console.log(err);
          }else{
            console.log("Successfully add items to db.");
          }
        })
        res.redirect('/');
      }else
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })



});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const dbitem= new Item({
    name:item
  })
  // Item.insertOne(dbitem,(err)=>{
  //   if(err){
  //     console.log(err);
  //   }else{
  //     console.log("Successfully add items to db.");
  //   }
  // })
  dbitem.save();
  res.redirect("/");
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   defaultItems.push(dbitem);
  //   res.redirect("/");
  // }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  Item.findByIdAndRemove(checkedItemId,(err)=>{
    if(err){
      console.log(err);
    }else{
      console.log("Successfully deleted");
      res.redirect("/");
    }
  })
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

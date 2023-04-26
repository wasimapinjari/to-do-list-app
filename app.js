require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const year = new Date().getFullYear();

mongoose.connect(process.env.DB_URI).then(() => console.log("DB connected"));

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listsSchema);

const welcome = new Item({
  name: "Welcome to your todolist!",
});

const add = new Item({
  name: "Hit the + button to add new item.",
});

const remove = new Item({
  name: "<-- Hit this to delete an item.",
});

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("./public"));

app.get("/", function (req, res) {
  Item.find().then((results) => {
    if (results.length === 0) {
      Item.insertMany([welcome, add, remove]).then((results) =>
        console.log(results)
      );
      res.redirect("/");
    } else {
      res.render("day", { day: "Today", lists: results, year: year });
    }
  });
});

app.post("/redirect", function (req, res) {
  const listName = req.body.listName;
  res.redirect("/lists/" + listName);
});

app.post("/", function (req, res) {
  const newListItem = req.body.listText;
  const listName = req.body.listName;
  const newItem = new Item({
    name: newListItem,
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((results) => {
      results.items.push(newItem);
      results.save();
      res.redirect("/lists/" + listName);
    });
  }
});

app.post("/newList", function (req, res) {
  console.log(req.body);
  const newlistText = req.body.newlistText;
  const listName = req.body.listName;
  if (newlistText) {
    res.redirect("/lists/" + newlistText);
  } else {
    if (listName === "All To-Do Lists") {
      res.redirect("/lists");
    } else if (listName === "Today") {
      res.redirect("/");
    } else {
      res.redirect("/lists/" + listName);
    }
  }
});

app.get("/lists", function (req, res) {
  List.find().then((results) => {
    res.render("lists", { day: "All To-Do Lists", lists: results, year: year });
  });
});

app.post("/lists", function (req, res) {
  List.find().then((results) => {
    res.render("lists", { day: "All To-Do Lists", lists: results, year: year });
  });
});

app.get("/lists/:newListName", function (req, res) {
  const newListName = _.capitalize(req.params.newListName);

  List.findOne({ name: newListName }).then((results) => {
    if (!results) {
      const listName = new List({
        name: newListName,
        items: [welcome, add, remove],
      });
      listName.save();
      res.redirect("/lists/" + newListName);
    } else {
      res.render("day", {
        day: results.name,
        lists: results.items,
        year: year,
      });
    }
  });
  // res.render("day", {day: "Work", lists: workList});
});

app.post("/delete", function (req, res) {
  const deletedItemId = req.body.checked;
  const listName = req.body.listName;
  if (listName === "Today") {
    console.log(deletedItemId);
    Item.findByIdAndDelete(deletedItemId).then((result) => console.log(result));
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deletedItemId } } }
    ).then((results) => {
      console.log(results);
      res.redirect("/lists/" + listName);
    });
  }
});

app.post("/deleteList", function (req, res) {
  const deletedItemId = req.body.checked;
  List.deleteOne({ _id: deletedItemId }).then((results) => {
    console.log(results);
    res.redirect("/lists");
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

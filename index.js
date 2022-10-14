// required packages.

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const supervillains = require("supervillains");
const superheroes = require("superheroes");
const cors = require("cors");
require("dotenv").config();
const app = express();

// cors

app.use(cors());

// app.use((req, res, next) => {
//   res.header({
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
//   });
//   next();
// });

// json parser

app.use(bodyParser.json());

// mongoose

mongoose.connect(`${process.env.DB_URL}`);

// DB Schema

const POST_SCHEMA = new mongoose.Schema({
  title: String,
  message: String,
  ip: String,
  username: String,
  userid: String,
  category: String,
  issecret: Boolean,
  secretKey: String,
  timestamp: String,
  imgsrc: String,
  browserdetails: String,
  like: [String],
  dislike: [String],
  comments: [
    { commenter: String, comment: String, timestamp: String, userid: String },
  ],
});

const Post = new mongoose.model("post", POST_SCHEMA);

// homepage

app.get("/", (req, res) => {
  res.status(200).json({
    message: "active",
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
  });
});

// create user

app.get(`/${process.env.SECRET_KEY}/create-user`, (req, res) => {
  const userid = v4();
  const username =
    parseInt(Math.random() * 10) % 2
      ? superheroes.random() + `-${userid.split("-")[1]}`
      : supervillains.random() + `-${userid.split("-")[1]}`;
  res.status(200).json({ username: username, userid: userid });
});

// post route

app
  .route(`/${process.env.SECRET_KEY}/posts`)
  // get posts
  .get((req, res) => {
    Post.find((error, posts) => {
      if (error) {
        res.status(500).json({ message: "not ok" });
      } else {
        res.status(200).send(posts);
      }
    });
  })
  // post a message
  .post((req, res) => {
    // json request data.

    const title = req.body.title;
    const message = req.body.message;
    const IP = req.body.ip;
    const userName = req.body.username;
    const userID = req.body.userid;
    const category = req.body.category;
    const isSecret = req.body.secret;
    const secretKey = req.body.secretKey;
    const timeStamp = req.body.timestamp;
    const browserDetails = req.body.browserdetails;
    const imgsrc = req.body.imgsrc;

    // check point.

    if (
      title === "" ||
      title === undefined ||
      message === "" ||
      message === undefined ||
      userName === "" ||
      userName === undefined ||
      isSecret === undefined ||
      userID === "" ||
      userID === undefined
    ) {
      res.status(404).json({ message: "not ok" });
    } else {
      const post = new Post({
        title: title,
        message: message,
        ip: IP,
        userid: userID,
        username: userName,
        issecret: isSecret,
        category: category,
        secretkey: secretKey,
        timestamp: timeStamp,
        imgsrc: imgsrc,
        browserdetails: browserDetails,
      });

      // save the post

      post.save((error) => {
        if (error) {
          res.status(500).json({ message: "not ok" });
        } else {
          res.status(200).json({ message: "ok" });
        }
      });
    }
  })
  // delete a post.
  .delete((req, res) => {
    const ID = req.body.id;
    const userID = req.body.userid;
    const adminKey = req.body.adminkey; // optional. for admins.
    if (adminKey === process.env.ADMIN_KEY) {
      Post.deleteOne({ _id: ID }, (err) => {
        if (err) {
          res.status(404).json({ message: "not ok", error: err });
        } else {
          res.status(200).json({ message: "ok" });
        }
      });
    } else {
      Post.deleteOne({ _id: ID, userid: userID }, (err) => {
        if (err) {
          res.status(404).json({ message: "not ok", error: err });
        } else {
          res.status(200).json({ message: "ok" });
        }
      });
    }
  });

// comments route

app
  .route(`/${process.env.SECRET_KEY}/comments`)
  .post((req, res) => {
    const username = req.body.username;
    const userID = req.body.userid;
    const comment = req.body.comment;
    const timestamp = req.body.timestamp;
    const ID = req.body.id;
    if (
      username === "" ||
      username === undefined ||
      userID === "" ||
      userID === undefined ||
      timestamp === "" ||
      timestamp === undefined
    ) {
      res
        .status(404)
        .json({ message: "not ok", error: "some filed is empty." });
      return;
    }
    Post.updateOne(
      { _id: ID },
      {
        $push: {
          comments: {
            commenter: username,
            comment: comment,
            timestamp: timestamp,
            userid: userID,
          },
        },
      },
      (err) => {
        if (err) {
          res.status(404).json({ message: "not ok", error: err });
        } else {
          res.status(200).json({ message: "ok" });
        }
      }
    );
  })
  // delete comment
  .delete((req, res) => {
    const ID = req.body.id;
    const timestamp = req.body.timestamp;
    const userID = req.body.userid;
    if (
      ID === "" ||
      ID === undefined ||
      timestamp === "" ||
      timestamp === undefined ||
      userID === "" ||
      userID === undefined
    ) {
      res
        .status(404)
        .json({ message: "not ok", error: "some filed is empty." });
      return;
    }
    Post.updateOne(
      { _id: ID },
      { $pull: { comments: { timestamp: timestamp, userid: userID } } },
      (err) => {
        if (err) {
          res.status(404).json({ message: "not ok", error: err });
        } else {
          res.status(200).json({ message: "ok" });
        }
      }
    );
  });

// only for admins

app.get(
  `/admin/delete/${process.env.ADMIN_KEY}/${process.env.SECRET_KEY}/:_id`,
  (req, res) => {
    const ID = req.params._id;
    Post.deleteOne({ _id: ID }, (err) => {
      if (err) {
        res.status(404).json({ message: "not ok", error: err });
      } else {
        res.status(200).json({ message: "ok" });
      }
    });
  }
);

// server port.

app.listen(process.env.PORT || 4000, () => {
  console.log("Active on PORT 4000");
});

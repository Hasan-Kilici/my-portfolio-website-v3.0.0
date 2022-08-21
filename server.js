const http = require("http");
const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const server = http.createServer(app);
const path = require("path");
const fetch = require("node-fetch");

const cookieParser = require("cookie-parser");
const axios = require("axios");
app.use(cookieParser());
const port = 8080;

//Socket
const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Kullanıcı Giriş yaptı");
  socket.on("disconnect", () => {
    console.log("Kullanıcı Çıkış yaptı");
  });
});
//Generate token
function generate_token(length) {
  var a =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_".split("");
  var b = [];
  for (var i = 0; i < length; i++) {
    var j = (Math.random() * (a.length - 1)).toFixed(0);
    b[i] = a[j];
  }
  return b.join("");
}
//Upload file
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/data");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});
const upload = multer({ storage: storage });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
  console.log(req.file, req.body);
});
//Body Parser
app.use(bodyParser.json()).use(
  bodyParser.urlencoded({
    extended: true,
  })
);
//Statik
app.use(express.static("public"));
app.set("src", "path/to/views");
app.use("/uploads", express.static("public/data"));
//MongoDB
const dbURL = process.env.db;
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    server.listen(port, () => {
      console.log("mongoDB Bağlantı kuruldu");
    });
  })
  .catch((err) => console.log(err));
//Collections
let Projects = require("./models/projects.js");
let Users = require("./models/users.js");
let Blogs = require("./models/blogs.js");
let BlogsParts = require("./models/blogsPart.js");
let Stats = require("./models/stats.js");
let Page = require("./models/page.js");
let Themes = require("./models/theme.js");
//Pages
//Home
app.get("/", (req, res) => {
  let token = req.cookies.token;
  Projects.find()
    .sort({ cratedAt: -1 })
    .then((projectResult) => {
      Blogs.find()
        .sort({ createdAt: -1 })
        .then((blogResult) => {
          Stats.find()
            .sort()
            .then((statsResult) => {
              Page.findById(process.env.pageId).then((pageResult) => {
                if (token != null) {
                  Users.findOne({ token: token })
                    .then((userResult) => {
                      res.render(`${__dirname}/src/user/index.ejs`, {
                        title: "Merhaba Ben Kawethra",
                        user: userResult,
                        projects: projectResult,
                        blog: blogResult,
                        stats: statsResult,
                        tags: "Kawethra, Developer, Web Developer, Kawethra.js, Kawethra.css, JS Developer, Front-end Developer, Back-end Developer",
                        description: `Hi, I'm Hasan. I'm a Web Developer.
                       I've this Know And I Use: HTML, CSS, JS , PHP, Node.js, Express, EJS.
                       I'm student in a SMTAL Web Desing & Graphic Design.`,
                        page: pageResult,
                      });
                    })
                    .catch((err) => {
                      res.clearCookie("token");
                      res.redirect("/");
                    });
                } else {
                  res.render(`${__dirname}/src/pages/index.ejs`, {
                    title: "Merhaba Ben Kawethra",
                    projects: projectResult,
                    blog: blogResult,
                    stats: statsResult,
                    tags: "Kawethra, Developer, Web Developer, Kawethra.js, Kawethra.css, JS Developer, Front-end Developer, Back-end Developer",
                    description: `Hi, I'm Hasan. I'm a Web Developer.
                   I've this Know And I Use: HTML, CSS, JS , PHP, Node.js, Express, EJS.
                   I'm student in a SMTAL Web Desing & Graphic Design.`,
                    page: pageResult,
                  });
                }
              });
            });
        });
    });
});
//Admin Home
app.get("/admin/home", (req, res) => {
  let token = req.cookies.token;
  Projects.find()
    .sort({ createdAt: -1 })
    .then((projectResult) => {
      Users.findOne({ token: token }).then((userResult) => {
        Blogs.find()
          .sort({ createdAt: -1 })
          .then((blogResult) => {
            Stats.find()
              .sort()
              .then((statsResult) => {
                Page.findById(process.env.pageId)
                  .then((pageResult) => {
                    if (userResult.admin == "true") {
                      res.render(`${__dirname}/src/admin/index.ejs`, {
                        title: "Merhaba Ben Kawethra",
                        user: userResult,
                        projects: projectResult,
                        blog: blogResult,
                        stats: statsResult,
                        page: pageResult,
                      });
                    } else {
                      res.redirect("/");
                    }
                  })
                  .catch((err) => {
                    res.redirect("/");
                  });
              });
          });
      });
    });
});
//Login
app.get("/login", (req, res) => {
  res.render(`${__dirname}/src/pages/login.ejs`, {
    title: "Giriş yap",
  });
});
//Dashboard
app.get("/admin/dashboard/", (req, res) => {
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Projects.find()
        .sort({ createdAt: -1 })
        .then((projectResult) => {
          Blogs.find()
            .sort({ createdAt: -1 })
            .then((blogResult) => {
              Stats.find()
                .sort()
                .then((statsResult) => {
                Themes.find()
                .sort()
                .then((themeResult)=>{
                  res.render(`${__dirname}/src/admin/dashboard.ejs`, {
                    title: "Kawethra Dashboard",
                    user: userResult,
                    projects: projectResult,
                    blog: blogResult,
                    stats: statsResult,
                    theme: themeResult,
                    pageId: process.env.pageId
                  });
                });
              });
            });
        })
        .catch((err) => {
          res.redirect("/");
        });
    } else {
      res.redirect("/");
    }
  });
});
//Forms
app.post("/add/project/", upload.single("uploaded_file"), (req, res) => {
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      let project = new Projects({
        title: req.body.title,
        description: req.body.description,
        photo: `/uploads/${req.file.filename}`,
        url: req.body.url,
        token: generate_token(12),
      });
      project.save().then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
app.post("/remove/project/:token", (req, res) => {
  let userToken = req.cookies.token;
  let projectToken = req.params.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      Projects.findOneAndDelete({ token: projectToken }).then(
        (projectResult) => {
          res.redirect("/admin/dashboard");
        }
      );
    } else {
      res.redirect("/");
    }
  });
});
//Login
app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  Users.findOne({ username: username, password: password }).then(
    (userResult) => {
      res.cookie("token", userResult.token);
      res.redirect("/");
    }
  );
});
//Blog
//Page
app.get("/s/:url/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Blogs.findOne({ token: blogToken }).then((blogResult) => {
    BlogsParts.find({ blogToken: blogToken })
      .sort()
      .then((partsResult) => {
        if (userToken != null) {
          Users.findOne({ token: userToken }).then((userResult) => {
            res.render(`${__dirname}/src/user/blog.ejs`, {
              blog: blogResult,
              parts: partsResult,
              user: userResult,
              title: blogResult.title,
            });
          });
        } else {
          res.render(`${__dirname}/src/pages/blog.ejs`, {
            title: blogResult.title,
            blog: blogResult,
            parts: partsResult,
          });
        }
      });
  });
});
//Admin blog page
app.get("/admin/:url/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      Blogs.findOne({ token: blogToken }).then((blogResult) => {
        BlogsParts.find({ blogToken: blogToken })
          .sort()
          .then((partsResult) => {
            res.render(`${__dirname}/src/admin/blog.ejs`, {
              blog: blogResult,
              parts: "partsResult",
              user: userResult,
              title: blogResult.title,
            });
          });
      });
    } else {
      res.redirect("/");
    }
  });
});
//Add Blog
app.post("/add/blog", upload.single("uploaded_file"), (req, res) => {
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      let blog = new Blogs({
        token: generate_token(8),
        title: req.body.title,
        description: req.body.description,
        photo: `/uploads/${req.file.filename}`,
        url: req.body.url,
        short: req.body.short,
      });
      blog.save().then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Remove Blog
app.post("/remove/blog/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      Blogs.findOneAndDelete({ token: blogToken }).then((blogResult) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Edit Blog
//Page
app.get("/edit/blog/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      Blogs.findOne({ token: blogToken }).then((blogResult) => {
        BlogsParts.find({ blogToken: blogToken })
          .sort()
          .then((partResult) => {
            BlogsParts.find({ blogToken: blogToken })
              .count()
              .then((partCount) => {
                res.render(`${__dirname}/src/admin/editBlog.ejs`, {
                  title: blogResult.title,
                  part: partResult,
                  blog: blogResult,
                  partCount: partCount,
                });
              });
          });
      });
    } else {
      res.redirect("/");
    }
  });
});
//Form
app.post("/edit/blog/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      Blogs.findOneAndUpdate(
        { token: blogToken },
        {
          title: req.body.title,
          description: req.body.description,
          short: req.body.short,
        }
      ).then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
    }
  });
});
//Add BlogPart
app.post("/add/blogPart/:token", (req, res) => {
  let blogToken = req.params.token;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      let blog = new BlogsParts({
        title: req.body.title,
        description: req.body.description,
        short: req.body.short,
        blogToken: blogToken,
      });
      blog.save().then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Remove BlogPart
app.post("/remove/part/:id", (req, res) => {
  let id = req.params.id;
  let userToken = req.cookies.token;
  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin == "true") {
      BlogsParts.findByIdAndDelete(id).then((result) => {
        res.redirect(`/edit/blog/${result.blogToken}`);
      });
    } else {
      res.redirect("/");
    }
  });
});
//Add Lang Stat
app.post("/add/stats", upload.single("uploaded_file"), (req, res) => {
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      let stat = new Stats({
        lang: req.body.lang,
        level: req.body.level,
        color: req.body.color,
        logo: req.file.filename,
      });
      stat.save().then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Remove Stat
app.post("/remove/stats/:id", (req, res) => {
  let id = req.params.id;
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Stats.findByIdAndDelete(id).then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Edit Stat
//Page
app.get("/edit/stats/:id", (req, res) => {
  let id = req.params.id;
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Stats.findById(id).then((statsResult) => {
        res.render(`${__dirname}/src/admin/editStats.ejs`, {
          title: statsResult.lang,
          stats: statsResult,
          user: userResult,
        });
      });
    } else {
      res.redirect("/");
    }
  });
});
//Form
app.post("/edit/stats/:id", (req, res) => {
  let id = req.params.id;
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Stats.findByIdAndUpdate(id, {
        lang: req.body.lang,
        level: req.body.level,
        color: req.body.color,
      }).then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Add Theme
app.post("/add/theme", (req, res) => {
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      let theme = new Themes({
        name: req.body.name,
        background: req.body.background,
        textcolor: req.body.textcolor,
        bannerbg: req.body.bannerbg,
      });
      theme.save().then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Delete Theme
app.post("/remove/theme/:id", (req, res) => {
  let token = req.cookies.token;
  let id = req.params.id;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Themes.findByIdAndDelete(id).then((result) => {
        res.redirect("/admin/dashboard");
      });
    } else {
      res.redirect("/");
    }
  });
});
//Use Theme
app.post("/use/theme/:id/:pageId", (req, res) => {
  let pageId = req.params.pageId;
  let id = req.params.id;
  let token = req.cookies.token;
  Users.findOne({ token: token }).then((userResult) => {
    if (userResult.admin == "true") {
      Themes.findById(id).then((themeResult) => {
        Page.findByIdAndUpdate(pageId, {
          themename: themeResult.name,
          background: themeResult.background,
          textcolor: themeResult.textcolor,
          bannerbg: themeResult.bannerbg,
        }).then((result) => {
          res.redirect("/admin/dashboard");
        });
      });
    } else {
      res.redirect("/");
    }
  });
});

const express = require("express");
const mysqlmodule = require("mysql");
const bcrypt = require("bcrypt");
const saltRounds = 6;
const session = require("express-session");
const dbconn = mysqlmodule.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "shipping",
});
dbconn.connect((connErr) => {
  if (connErr) {
    console.log("Database connection error!");
  } else {
    console.log("Database connected successfully!");
  }
});

const app = express();
app.use(
  session({
    secret: "secret word",
    resave: false,
    saveUnnitialized: false,
  })
);
app.use(express.static("public")); // pointing our app to find all static files within public directory
app.use(express.urlencoded({ extended: false })); //a middleware to read the request and fill req.body object with form data
app.get("/", (req, res) => {
  //root route --landing/home page route
  if (req.session.client) {
    if (req.session.client.email === "biwottcollins456@gmail.com") {
      res.render("admin.ejs");
    } else {
      res.render("home.ejs", { user: req.session.client });
    }
  } else {
    res.render("home.ejs");
  }
});
// getting the login form
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
//submitting login form
app.post("/login", (req, res) => {
  //console.log(req.body);
  //find the email sent in the db
  //compare the password sent with what is in the db
  dbconn.query(
    "SELECT *FROM clients WHERE email = ?",
    [req.body.email],
    (sqlerr, result) => {
      if (result.length > 0) {
        // if (result[0].Password === req.body.pass
        if (bcrypt.compareSync(req.body.pass, result[0].Password)) {
          //sessions & cookies ---assignment
          // find out about sessions and cookies in server side dev as an assignment for the weekend.Also,go ahead and research how to use express-session middleware to handle sessions in our express application
          req.session.client = result[0]; //create a session
          req.session.cookie.expires = new Date(Date.now() + 1000000); //16 minutes --- 1000 seconds
          res.redirect("/");
        } else {
          res.send("Password is incorrect");
        }
      } else {
        res.send("Email not registered");
      }
    }
  );
});
app.get("/register", (req, res) => {
  res.render("signup.ejs");
});
app.post("/register", (req, res) => {
  //receive data from client--req.body
  // check if email already exists
  //if not insert data to db
  const hashedPassword = bcrypt.hashSync(req.body.pass, saltRounds);
  //console.log(req.body);
  dbconn.query(
    "SELECT email FROM clients WHERE email =?",
    [req.body.email],
    (sqlerr, emaildata) => {
      if (emaildata.length > 0) {
        res.render("signup.ejs", { errorMessage: "Email is already in use" });
      } else {
        //proceed
        dbconn.query(
          "INSERT INTO clients(client_name,email,phone,address,password) VALUES(?,?,?,?,?)",
          [
            req.body.name,
            req.body.email,
            req.body.phone,
            req.body.address,
            hashedPassword,
          ],
          (sqlerr2) => {
            if (sqlerr2) {
              console.log(sqlerr2);
              res.render("signup.ejs", { errorMessage: "Server Error !!!" });
            } else {
              res.redirect("/login");
            }
          }
        );
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//starting the app
app.listen(3000, () => console.log("App started and listening on port 3000"));

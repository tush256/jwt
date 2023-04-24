const express = require("express");
const auth = require("./routes/auth");
const post = require("./routes/post");

const app = express();
app.use(express.json());

//Router
app.use("/auth", auth);
app.use("/posts", post);

app.get("/", (req, res) => {
  res.send("  Hi im working");
});

app.listen(5000, () => {
  console.log("now running on port 5000");
});

const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const { users } = require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

router.post(
  //sign up
  "/signup",
  [
    check("email", "Please provide valid email") //for user validation we use express validator package
      .isEmail(), // methods for validation
    check("password", "Please provide proper password").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    //validate the input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    //validated user doenst already exist

    let user = users.find((user) => {
      return user.email === email;
    });

    if (user) {
      return res.status(400).json({
        errors: [
          {
            msg: "This user already exists",
          },
        ],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      email,
      password: hashedPassword,
    });

    //Generated token
    const token = await JWT.sign(
      {
        email,
      },
      "GJhjgffhkhlkdkbfdnbdlhrhdfglsjhhdfb",
      {
        expiresIn: 360000,
      }
    );

    res.json({
      token,
    });
  }
);

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = users.find((user) => {
    return user.email === email;
  });

  if (!user) {
    return res.status(400).json({
      errors: [
        {
          msg: "Invalid Credentials",
        },
      ],
    });
  }

  // comapre bcrypt passwrd
  let isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      errors: [
        {
          msg: "Invalid Credentials",
        },
      ],
    });
  }

  //access token
  const accesstoken = await JWT.sign(
    {
      email,
    },
    "GJhjgffhkhlkdkbfdnbdlhrhdfglsjhhdfb",
    {
      expiresIn: "30s",
    }
  );

  //refresh token
  const refreshtoke = await JWT.sign(
    {
      email,
    },
    "hgaiurrkdfdnnffhraghfjfhlsjhgslkhgksj",
    {
      expiresIn: "1m",
    }
  );

  //set refresh token in refreshtokens array
  refreshtokens.push(refreshtoke);

  res.json({
    accesstoken,
    refreshtoke,
  });
});

let refreshtokens = [];

//create new access token using a refresh token
router.post("/token", async (req, res) => {
  const refreshtoken = req.header("x-auth-token");

  // if token is not provided send error msg
  if (!refreshtoken) {
    res.status(401).json({
      errors: [
        {
          msg: "token not found",
        },
      ],
    });
  }

  //if token is doens not exist, send err msg
  if (!refreshtoken.includes(refreshtoken)) {
    res.status(403).json({
      errors: [
        {
          msg: "invalid refresh token",
        },
      ],
    });
  }

  try {
    const user = await JWT.verify(
      refreshtoken,
      "hgaiurrkdfdnnffhraghfjfhlsjhgslkhgksj"
    );

    const { email } = user;
    const accesstoken = await JWT.sign(
      { email },
      "GJhjgffhkhlkdkbfdnbdlhrhdfglsjhhdfb",
      {
        expiresIn: "30s",
      }
    );
    res.json({ accesstoken });
  } catch (error) {
    res.status(403).json({
      errors: [
        {
          msg: "invalid token",
        },
      ],
    });
  }
});

router.get("/all", (req, res) => {
  res.json(users);
});

module.exports = router;

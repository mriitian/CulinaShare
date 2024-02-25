import express from "express";
import axios from "axios";
import ejs from "ejs";
import session from "express-session";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const Port = 10000;
const api_key = "4abc3ddb8bmsh06ceb7832ec39afp1ceedejsn05f582e49a23";
app.use(express.json());
// Set up session middleware
app.use(
  session({
    secret: "AshPika18",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/signin");
  }
};

// Function to read user data from JSON file
const readUsersFromFile = () => {
  try {
    const usersData = fs.readFileSync("users.json");
    return JSON.parse(usersData);
  } catch (error) {
    return [];
  }
};

// Function to write user data to JSON file
const writeUsersToFile = (users) => {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
};

// Function to add a new user to the database
const addUser = (username, password) => {
  const users = readUsersFromFile();
  const newUser = { username, password, favorites: [], contributions: [] }; // Initialize favorites array
  users.push(newUser);
  writeUsersToFile(users);
};

// Function to authenticate a user
const authenticateUserCredentials = (username, password) => {
  const users = readUsersFromFile();
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
// Function to extract YouTube video ID from a YouTube link

const getYouTubeEmbedLink = (youtubeLink) => {
  // Replace youtu.be with www.youtube.com/embed
  let embedLink = youtubeLink.replace("youtu.be", "www.youtube.com/embed");

  // If the additional query string is not needed for embedding, you can remove it
  const queryStringIndex = embedLink.indexOf("?si=");
  if (queryStringIndex !== -1) {
    embedLink = embedLink.substring(0, queryStringIndex);
  }

  return embedLink;
};

app.get("/contribute", authenticateUser, (req, res) => {
  try {
    // Retrieve user data from the database
    const users = readUsersFromFile();

    // Find the authenticated user
    const authenticatedUser = users.find(
      (user) => user.username === req.session.username
    );

    if (!authenticatedUser) {
      return res.status(404).send("User not found"); // User not found in database
    }

    // Ensure that the authenticated user has contributions
    const userContributions = authenticatedUser.contributions || [];

    // Create a new array with modified YouTube links
    const modifiedContributions = userContributions.map((contribution) => {
      const embeddedYoutubeLink = getYouTubeEmbedLink(contribution.strYoutube);
      return { ...contribution, embeddedYoutubeLink };
    });

    res.render("contributions.ejs", {
      contributions: modifiedContributions,
    });
  } catch (error) {
    console.error("Error rendering contributions:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/favorites", authenticateUser, async (req, res) => {
  try {
    const users = readUsersFromFile();

    // Find the authenticated user
    const authenticatedUser = users.find(
      (user) => user.username === req.session.username
    );
    if (!authenticatedUser) {
      return res.status(404).send("User not found"); // User not found in database
    }

    // Modify YouTube links and extract video IDs
    const userFav = authenticatedUser.favorites;

    // Array to store all the promises from axios.get requests
    const promises = userFav.map((favId) => {
      return axios.get(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${favId}&apiKey=${api_key}`
      );
    });

    // Wait for all promises to resolve
    const responses = await Promise.all(promises);

    // Extract meal data from the responses
    const fav = responses.map((response) => response.data.meals[0]);

    // Render the favorites.ejs template with the meal data
    res.render("favorites.ejs", {
      userFav: fav,
    });
  } catch (error) {
    console.error("Error rendering contributions:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", async (req, res) => {
  try {
    let authenticatedUser = null; // Initialize authenticatedUser to null

    // Check if session username is set
    if (req.session.username) {
      const users = readUsersFromFile();

      // Find the authenticated user
      authenticatedUser = users.find(
        (user) => user.username === req.session.username
      );

      // Handle case where user is not found
      if (!authenticatedUser) {
        console.error("User not found in database");
        // You may redirect to a login page or handle the error as needed
      }
    }

    const result = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?f=p&apiKey=${api_key}`
    );

    const categoryList = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/list.php?c=list&apiKey=${api_key}`
    );

    const authenticated = req.session.authenticated || false;
    const category = categoryList.data.meals;
    const meals = result.data.meals;

    const vegetarian = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian&apiKey=${api_key}`
    );

    const vegetarianList = vegetarian.data.meals;
    const regions = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/list.php?a=list&apiKey=${api_key}`
    );

    const categorisedCarouselPromises = category.map(async (cat) => {
      const categorisedCarousel = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat.strCategory}&apiKey=${api_key}`
      );
      return categorisedCarousel.data.meals;
    });

    const categorisedCarousel = await Promise.all(categorisedCarouselPromises);

    // Initialize contributions array to empty if user is not authenticated or if contributions are not available
    const contributions =
      authenticatedUser && authenticatedUser.contributions
        ? authenticatedUser.contributions.map((contribution) => {
            const embeddedYoutubeLink = getYouTubeEmbedLink(
              contribution.strYoutube
            );
            return { ...contribution, embeddedYoutubeLink };
          })
        : [];

    res.render("index.ejs", {
      recipe: meals,
      categories: category,
      vegetarianList: vegetarianList,
      categorisedCarousel: categorisedCarousel,
      authenticated: authenticated,
      username: req.session.username,
      contributions: contributions,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/contri/:strMeal", async (req, res) => {
  try {
    // Decode the meal name from the URL parameter
    const mealName = decodeURIComponent(req.params.strMeal);

    // Retrieve user data from the database
    const users = readUsersFromFile();

    // Find the authenticated user
    const authenticatedUser = users.find(
      (user) => user.username === req.session.username
    );

    if (!authenticatedUser) {
      return res.status(404).send("User not found"); // User not found in database
    }

    // Find the contribution with the matching meal name
    const contribution = authenticatedUser.contributions.find(
      (item) => item.strMeal === mealName
    );

    if (!contribution) {
      return res.status(404).send("Contribution not found");
    }

    // Modify YouTube links and extract video IDs
    const embeddedYoutubeLink = getYouTubeEmbedLink(contribution.strYoutube);
    const modifiedContribution = { ...contribution, embeddedYoutubeLink };

    // Render the contriRecipe.ejs template with the contribution details
    res.render("contriRecipe.ejs", {
      contribution: modifiedContribution,
    });
  } catch (error) {
    console.error("Error rendering contribution:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/about", async (req, res) => {
  res.render("AboutUs.ejs");
});

app.get("/recipe/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const result = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}&apiKey=${api_key}`
    );
    const recipeDetails = result.data.meals[0];
    res.render("recipe.ejs", {
      recipe: recipeDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Assuming you have imported required packages and set up your server

app.post("/add-contribution", (req, res) => {
  try {
    // Extract contribution data from the request body
    const { strMeal, strCategory, strIngredient, strInstructions, strYoutube } =
      req.body;

    // Check if the user is authenticated
    if (!req.session.authenticated) {
      return res.status(401).send("Unauthorized"); // User is not authenticated
    }

    // Retrieve user data from the database
    const users = readUsersFromFile();

    // Find the user by their username (assuming you have username in session)
    const userIndex = users.findIndex(
      (user) => user.username === req.session.username
    );

    if (userIndex === -1) {
      return res.status(404).send("User not found"); // User not found in database
    }

    // Add the contribution to the user's contributions array
    const newContribution = {
      strMeal,
      strCategory,
      strIngredient,
      strInstructions,
      strYoutube,
    };

    users[userIndex].contributions.push(newContribution);

    // Write updated user data back to the file
    writeUsersToFile(users);
    console.log("Updated User Data:", users[userIndex]);

    // Redirect the user to /contribute with user's contributions
    res.redirect("/contribute");
  } catch (error) {
    console.error("Error adding contribution:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/Search", async (req, res) => {
  try {
    if (req.body.Search !== "") {
      const searchQuery = req.body.Search;
      console.log(req.body);
      const result = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}&apiKey=${api_key}`
      );
      const authenticated = req.session.authenticated || false;
      const meals = result.data.meals;
      if (req.body.category === "initial") {
        res.render("searchResult.ejs", {
          recipe: meals,
        });
      } else {
        const filteredMeals = meals.filter(
          (meal) => meal.strCategory === req.body.category
        );
        res.render("searchResult.ejs", {
          recipe: filteredMeals,
          authenticated: authenticated,
        });
      }
    } else {
      const cat = req.body.category;
      const authenticated = req.session.authenticated || false;
      const result = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}&apiKey=${api_key}`
      );
      const filteredMeals = result.data.meals;
      res.render("searchResult.ejs", {
        recipe: filteredMeals,
        authenticated: authenticated,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Assuming you have already imported required packages and set up your server

// POST route to handle adding a recipe to favorites
app.post("/add-to-favorites", (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.authenticated) {
      return res.status(401).send("Unauthorized"); // User is not authenticated
    }

    // Extract mealId from the request body
    const { mealId } = req.body;
    console.log("Received mealId:", mealId);

    // Retrieve user data from the database
    const users = readUsersFromFile();

    // Find the user by their username (assuming you have username in session)
    const userIndex = users.findIndex(
      (user) => user.username === req.session.username
    );

    if (userIndex === -1) {
      return res.status(404).send("User not found"); // User not found in database
    }

    // Check if the mealId is already in the user's favorites
    if (!users[userIndex].favorites.includes(mealId)) {
      // Add the mealId to the user's favorites
      users[userIndex].favorites.push(mealId);

      // Write updated user data back to the file
      writeUsersToFile(users);
      console.log("Updated User Data:", users[userIndex]);

      // Send a success response
      res.sendStatus(200); // Send a success response
    } else {
      // If mealId already exists in favorites, send a response indicating that
      res.status(400).send("Meal already in favorites");
    }
  } catch (error) {
    console.error("Error adding recipe to favorites:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/signin", async (req, res) => {
  try {
    res.render("signin.ejs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/signup", async (req, res) => {
  res.render("signup.ejs");
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (authenticateUserCredentials(username, password)) {
      req.session.authenticated = true;
      req.session.username = username; // Set the username in the session
      res.redirect("/");
    } else {
      res.redirect("/signin");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username or password is empty
    if (!username || !password) {
      return res.status(400).send("Username and password are required.");
    }
    console.log("New User Data:", { username, password });
    // Add user to the database
    addUser(username, password);

    res.redirect("/signin");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      // Redirect the user to the login page, or any other relevant page
      res.redirect("/signin");
    }
  });
});

app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});

# Recipe Sharing Web Application

This repository contains the source code for a recipe sharing web application built using Node.js, Express.js, EJS, and the MealDB API. Users can sign up, log in, contribute recipes, add recipes to their favorites, search for recipes, and explore various categories of recipes.

## Repository

[Live Link](https://culinashare-2.onrender.com/)

## Features

- **User Authentication**: Users can sign up with a username and password, and then log in to access the application's features.
- **Contribute Recipes**: Authenticated users can contribute their recipes to the platform, including details such as recipe name, category, ingredients, instructions, and a YouTube link for video demonstration.
- **Favorite Recipes**: Users can add recipes to their favorites for quick access later.
- **Search Functionality**: Users can search for recipes by name or category.
- **Explore Categories**: Users can explore recipes by various categories such as vegetarian, regions, and more.
- **View Recipe Details**: Users can view detailed information about each recipe, including ingredients, instructions, and a video demonstration if available.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mriitian/CulinaShare.git

2. Install the dependencies
   ```
   npm install

## Usage

- Upon accessing the application, users can sign up for a new account or log in if they already have an account.
- Once logged in, users can contribute recipes, add recipes to favorites, search for recipes, and explore different categories.
- Users can log out of the application by clicking on the logout button.

## Dependencies

- Express.js: Web application framework for Node.js
- EJS: Embedded JavaScript templating
- Axios: Promise-based HTTP client for making requests to external APIs
- Express Session: Session middleware for Express.js
- Body Parser: Node.js body parsing middleware

## Contribution Guidelines

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository's master branch for review.

## Credits

This application utilizes the MealDB API for fetching recipe data.

/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    try {
      const response = await axios.post(`${BASE_URL}/signup`, {
        user: {
          username,
          password,
          name
        }
      });  
      // build a new User instance from the API response
      const newUser = new User(response.data.user);
  
      // attach the token to the newUser instance for convenience
      newUser.loginToken = response.data.token;
  
      return newUser;
    } catch (error) {
      axiosErrorHandler(error);
      if (error.response.status === 409){
        alert("Sorry, this username already exists!")
      }
    }
    return null;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        user: {
          username,
          password
        }
      });

      // build a new User instance from the API response
      const existingUser = new User(response.data.user);

      // instantiate Story instances for the user's favorites and ownStories
      existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
      existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

      // attach the token to the newUser instance for convenience
      existingUser.loginToken = response.data.token;

      return existingUser;      
    } catch (error) {
      axiosErrorHandler(error);
      if (error.response.status === 401){
        alert("Username and password do not match!")
      }
    }

  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  /**
   * Method to make a POST request to /user/<username>/favorites/<storyId>
   *  and add story to the favorite list
   * - storyId - a string representing story ID
   *
   * Returns the story object added
   */

  async addFavoriteStory(storyId) {
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    try {
      const response = await axios.post(
        `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
        {token: this.loginToken}
      );
      // check for duplicates; response returns a set
      // (alternatively, we could check ids in this.favorites prior to request)
      if (response.data.user.favorites.length > this.favorites.length) {
        const storyObj = new Story(response.data.user.favorites.pop());
        this.favorites.push(storyObj);
        return storyObj;
      }
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null;
  }

  /**
   * Method to make a DELETE request to /user/<username>/favorites/<storyId>
   *  and remove the story from list
   * - storyId - a string representing story ID
   *
   */

  async removeFavoriteStory(storyId) {
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    // remove story from list

    try {
      const response = await axios.delete(
        `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
        { data: {token: this.loginToken} }
      );
      this.favorites.splice(
        this.favorites.findIndex((item) => item.storyId == storyId), 1
      );
    } catch (error) {
      axiosErrorHandler(error);
    }
  }

  async updateUser(name, password){
    try {
      const response = await axios.patch(`${BASE_URL}/users/${this.username}`, {
        token: this.loginToken,
        user: {
          username: this.username,
          name,
          password
        }
      });
      // build a new User instance from the API response
      const newUser = new User(response.data.user);

      // attach the token to the newUser instance for convenience
      newUser.loginToken = response.data.token;
      // update name
      this.name = name;

      return newUser;
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null;
  }
}
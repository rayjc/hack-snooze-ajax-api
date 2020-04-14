const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?
  // A class/static method would be preferrably since this factory method is functional
  // or without side effect; ie. it doesn't save or modify any states of an instance.
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  async addStory(user, newStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    try {
      const response = await axios.post(`${BASE_URL}/stories`, {
        token: user.loginToken,
        story: {
          author: newStory.author,
          title: newStory.title,
          url: newStory.url
        }
      });
      const storyObj = new Story(response.data.story);
      this.stories.push(storyObj);
      return storyObj;
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null;
  }

  /**
   * Method to make a DELETE request to /stories/<storyId> and remove story from list
   * - user - the current instance of User who will remove the story
   * - storyId - id of story to be deleted
   *
   */

  async removeStory(user, storyId) {
    const userStoryInd = user.ownStories.findIndex((item) => item.storyId == storyId);
    if (userStoryInd === -1)  return;   // exit early if user does not own the story

    // remove story from ownStories
    user.ownStories.splice(userStoryInd, 1);
    // remove story from storyList
    this.stories.splice(
      this.stories.findIndex((item) => item.storyId == storyId), 1
    );

    try {
      const response = await axios.delete(
        `${BASE_URL}/stories/${storyId}`,
        { data: { token: user.loginToken } }
      );
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null;
  }
}


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
    this.favorites.splice(
      this.favorites.findIndex((item) => item.storyId == storyId), 1
    );
    try {
      const response = await axios.delete(
        `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
        { data: {token: this.loginToken} }
      );
    } catch (error) {
      axiosErrorHandler(error);
    }
  }
}

/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}

function axiosErrorHandler(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  console.log(error.config);
}
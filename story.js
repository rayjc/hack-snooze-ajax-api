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
    try {
      // query the /stories endpoint (no auth required)
      const response = await axios.get(`${BASE_URL}/stories`);
      // turn the plain old story objects from the API into instances of the Story class
      const stories = response.data.stories.map(story => new Story(story));
      // build an instance of our own class using the new array of stories
      const storyList = new StoryList(stories);
      return storyList;
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null
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

    try {
      const response = await axios.delete(
        `${BASE_URL}/stories/${storyId}`,
        { data: { token: user.loginToken } }
      );
      // remove story from ownStories
      user.ownStories.splice(userStoryInd, 1);
      // remove story from storyList
      this.stories.splice(
        this.stories.findIndex((item) => item.storyId == storyId), 1
      );
    } catch (error) {
      axiosErrorHandler(error);
    }

  }

  /**
   * Method to make a PATCH request to /stories/<storyId> and update story from list
   * - user - the current instance of User who will remove the story
   * - storyId - id of story to be deleted
   *
   * Returns the updated story object
   */

  async updateStory(user, storyId, author, title, url) {
    const userStoryInd = user.ownStories.findIndex((item) => item.storyId == storyId);
    if (userStoryInd === -1)  return;   // exit early if user does not own the story

    try {
      const response = await axios.patch(
        `${BASE_URL}/stories/${storyId}`, {
        token: user.loginToken,
        story: {
          author,
          title,
          url,
        }
      });
      // remove story from ownStories
      user.ownStories.splice(userStoryInd, 1);
      // remove story from storyList
      this.stories.splice(
        this.stories.findIndex((item) => item.storyId == storyId), 1
      );
      const storyObj = new Story(response.data.story);
      this.stories.push(storyObj);
      return storyObj;
    } catch (error) {
      axiosErrorHandler(error);
    }
    return null;
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
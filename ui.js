$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navToggles = $('.nav-link.toggle');
  const $navUser = $('#nav-user-profile');
  const $createStoryForm = $("#create-story-form");
  const $favoritedArticles = $("#favorited-articles");
  const $userProfile = $('#user-profile');
  const $profileName = $('#profile-name');
  const $profileUsername = $('#profile-username');
  const $profileDate = $('#profile-account-date');

  // icons
  const starIcon = '<i class="far fa-star"></i>';
  const starInvIcon = '<i class="fas fa-star"></i>';
  const trashIcon = '<i class="fas fa-trash-alt"></i>';
  // suffixes
  const ownSuffix = '-own';
  const favSuffix = '-fav';

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    if (userInstance){
      // set the global user to the user instance
      currentUser = userInstance;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
      updateUserProfile();
    }
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    if (newUser) {
      currentUser = newUser;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
      updateUserProfile();
    }
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event Handler for Clicking nav toggle links
   */

  $navToggles.on("click", function() {
    // hide all toggles;
    $navToggles.each((index, el) => $($(el).data('toggle')).hide());
    if (this.id === "nav-post") {
      $allStoriesList.show();
    } else {
      $allStoriesList.hide();
    }
    // toggle clicked
    const $toggleTarget = $($(this).data('toggle'));
    $toggleTarget.slideToggle();
    // show empty message if there are no articles
    if ($toggleTarget.find('.article-link').length) {
      $toggleTarget.find('.empty-li').hide();
    } else {
      $toggleTarget.find('.empty-li').show();
    }
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    
    await checkIfLoggedIn();
    $allStoriesList.show();
  });

  /**
   * Event Handler for Submitting story form
   */

  $createStoryForm.on("submit", async function (event) {
    event.preventDefault();

    // extract story inputs
    const author = $('#create-story-author').val();
    const title = $('#create-story-title').val();
    const url = $('#create-story-url').val();
    // create story via POST request
    const newStory = await storyList.addStory(currentUser, {author, title, url});
    // add story to memory
    currentUser.ownStories.push(newStory);
    // append story to HTML main page
    $allStoriesList.prepend(generateStoryHTML(newStory, starIcon));
    // append story to HTML own story page
    $ownStories.append(generateStoryHTML(newStory, trashIcon, ownSuffix));
    // clear input fields
    $('#create-story-author, #create-story-title, #create-story-url').val('');
  });

  /**
   * Event Handler for clicking on star (favorite/un-favorite)
   */

  $allStoriesList.on("click", ".fa-star", async function () {
    if (this.classList.contains('far')) {
      // add favorite story via POST request
      const story = await currentUser.addFavoriteStory(this.parentElement.id);
      $(`#${this.parentElement.id} .fa-star`).replaceWith($(starInvIcon));
      // append favorite story to HTML
      if (story) {
        $favoritedArticles.append(generateStoryHTML(story, starInvIcon, favSuffix));
      }
    } else {
      // remove favorite story via DELETE request
      await currentUser.removeFavoriteStory(this.parentElement.id);
      // remove favorite story from favorite page
      $(`#${this.parentElement.id}${favSuffix}`).remove();
      // replace star icon in main article list
      $(`#${this.parentElement.id} .fa-star`).replaceWith($(starIcon));
    }
  });

  /**
   * Event Handler for clicking on trash bin under favorites (un-favorite)
   */

  $favoritedArticles.on("click", ".fa-star", async function () {
    // remove favorite story via DELETE request
    await currentUser.removeFavoriteStory(this.parentElement.id.replace(favSuffix, ''));
    // replace star icon in main article list
    $(`#${this.parentElement.id.replace(favSuffix, '')} .fa-star`).replaceWith($(starIcon));
    // remove favorite story to HTML
    this.parentElement.remove();
    // show empty message if no articles
    if ($favoritedArticles.find('.article-link').length === 0)
      $favoritedArticles.find('.empty-li').show();
  });

  /**
   * Event Handler for clicking on trash bin under own stories (remove story)
   */

  $ownStories.on("click", ".fa-trash-alt", async function () {
    // remove story via DELETE request
    await storyList.removeStory(currentUser, this.parentElement.id.replace(ownSuffix, ''));
    // remove story from main page
    $(`#${this.parentElement.id.replace(ownSuffix, '')}`).remove()
    // remove story from fav page
    $(`#${this.parentElement.id.replace(ownSuffix, favSuffix)}`).remove()
    // remove story from own stories
    this.parentElement.remove();
    // show empty message if no articles
    if ($ownStories.find('.article-link').length === 0)
      $ownStories.find('.empty-li').show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    // to get an instance of User with the right details
    // this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    // update our global variable
    storyList = await StoryList.getStories();
    generateStories(storyList.stories, $allStoriesList);

    if (currentUser) {
      loginInit();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    loginInit();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  function generateStories(stories, $listSelector, icon = '', suffix = '') {
    // empty out that part of the page
    if (stories.length !== 0){
      $listSelector.empty();
    }

    // loop through all of our stories and generate HTML for them
    for (let story of stories) {
      const result = generateStoryHTML(story, icon, suffix);
      $listSelector.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, icon = '', suffix = '') {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}${suffix}">
        ${icon}
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
      $favoritedArticles,
      $ownStories
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navUser.text(`${currentUser.name}`);
    $navUser.parent().show();
    $('#nav-post, #nav-stories, #nav-fav').show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  function updateUserProfile() {
    $profileName.html(`Name: <b>${currentUser.name}</b>`);
    $profileUsername.html(`Username: <b>${currentUser.username}</b>`);
    $profileDate.html(`Account Created: <b>${currentUser.createdAt}</b>`);
  }

  function loginInit() {
    generateStories(currentUser.favorites, $favoritedArticles, starInvIcon, favSuffix);
    generateStories(currentUser.ownStories, $ownStories, trashIcon, ownSuffix);
    showNavForLoggedInUser();
    updateUserProfile();
    // append star icons to articles
    $allStoriesList.find('li').prepend($(starIcon));
    // overwrite star icons for favorited stories
    currentUser.favorites
      .map((story) => story.storyId)
      .forEach((storyId) => $(`#${storyId} .fa-star`).replaceWith($(starInvIcon)));
  }
});

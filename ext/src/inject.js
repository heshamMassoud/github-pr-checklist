"use strict";

(() =>{
  var comments = null;
  var token = null;
  var privateRepos = null;

  function createAnchorElement(repo, base, compare, text) {
    var innerText = `<a href="/${repo}/compare/${base}...${compare}" class="select-menu-item js-navigation-item js-navigation-open navigation-focus" role="menuitem" rel="nofollow">
            <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5z"></path></svg>
            <div class="select-menu-item-text js-select-button-text">${text}</div>
          </a>`;
    var div = document.createElement('div');
    div.innerHTML = innerText;

    return div.firstChild;
  }

  function getInfo() {
    var [, owner, repoName,, prNumber] = location.pathname.split('/');
    var repoTitle = `${owner}/${repoName}`;
    return {repoTitle, prNumber};
  }

  function getHeaders() {
    var headers = new Headers();

    if (token) {
      headers.append("Authorization", `token ${token}`);
    }

    return headers;
  }

  async function getComments() {
    var info = getInfo();

    if (comments === null) {
      const headers = getHeaders();
      const response = await fetch(`//api.github.com/repos/${info.repoTitle}/pulls/${info.prNumber}/comments`, { headers });
      if (response.ok) {
        const json = await response.json();
        comments = json.map(function(comment) {return comment.body;});
      } else {
        // Error Handling
        const text = await response.text();
        /* eslint-disable no-console */
        console.group("Github PR Checklist extension error");
        console.log("Status: ", response.status);
        console.log("Response: ", text);
        console.log("Options page: ", `chrome://extensions/?options=${chrome.runtime.id}`);
        console.groupEnd();
        /* eslint-enable no-console */

        comments = [];
      }
    }
  }

  function isOpenPrPage() {
    if(location.href.includes("/pull/")) {
        console.log('yes its a PR page!');
        return true;
    }
    return false;
  }

  function setup() {
    if (isOpenPrPage()) {
        getComments().then(function() {
            comments.forEach(function(comment) {
                console.log(comment);
            });
        });
    }
}

  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['token', 'private'], function(items) {
      token = items.token;
      privateRepos = items.private;

      setup();
    });
  });

  document.addEventListener('pjax:success', () => {
    setup();
  });
})();


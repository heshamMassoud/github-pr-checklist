"use strict";

(() =>{
  var comments = null;
  var token = null;
  var privateRepos = null;

  function createChecklist(comments) {
    var todos = comments.map(comment => createChecklistElement(comment));
    var innerText = `<h4>Todo</h4><ul class="contains-task-list">${todos}</ul>`;
    var div = document.createElement('div');
    div.innerHTML = innerText;
    return div;
}

function createChecklistElement(comment) {
  var innerText = `<li class="task-list-item enabled"><input class="task-list-item-checkbox" id="" type="checkbox">${comment.body}</li>`;
  var converter = new showdown.Converter();
  var markDownFormattedComment = converter.makeHtml(comment.body)
  return innerText;
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
      const prResponse = await fetch(`//api.github.com/repos/${info.repoTitle}/pulls/${info.prNumber}`, { headers });
      const commentsResponse = await fetch(`//api.github.com/repos/${info.repoTitle}/pulls/${info.prNumber}/comments`, { headers });
      if (prResponse.ok && commentsResponse.ok) {
        const prJson = await prResponse.json();
        const prOpener = prJson.user.login;
        console.log(`This PR was openned by ${prOpener}.`);
        const commentsJson = await commentsResponse.json();
        comments = commentsJson.filter(comment =>
                                        comment.user.login != prOpener)
                               .map(comment => comment);
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
            var [prDescription] = document.querySelectorAll(".d-block.comment-body.markdown-body.js-comment-body");
            prDescription.append(`There are ${comments.length} comments on this PR.`);
            prDescription.append(createChecklist(comments));
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


"use strict";

(() =>{
  var comments = null;
  var token = null;
  var privateRepos = null;

  function createChecklist(comments) {
    var todosHTMLElements = comments.map(comment => createChecklistCommentLayout(comment));
    todosHTMLElements = todosHTMLElements.join(""); // strip commas
    var innerText = `<h4>You still have ${comments.length} unaddressed comments</h4><ul class="contains-task-list">${todosHTMLElements}</ul>`;
    var div = document.createElement('div');
    div.innerHTML = innerText;
    return div;
}

function formatMarkDown(comment) {
  var converter = new showdown.Converter();
  var markDownFormattedComment = converter.makeHtml(comment.body);
  return markDownFormattedComment;
}

function createChecklistCommentLayout(comment) {
    var markDownFormattedComment = formatMarkDown(comment);
    var commentUrl = comment._links.html.href;
    var commentCreatedAt = comment.created_at;
    var commenter = comment.user;
    var commenterLogin = commenter.login;
    var commenterAvatarUrl = commenter.avatar_url;
    var commenterAvatarHtmlElement = `<a class="float-left mt-" href="${commenterLogin}"><img alt="@${commenterLogin}" class="avatar" height="28" src="${commenterAvatarUrl}" width="28"></a>`;
    var commenterNameHtmlElement = `<strong><a href="${commenterLogin}" class="author link-gray-dark">${commenterLogin}</a></strong> `;
    var commentDateHtmlElement = `<span class="text-gray"><a href="${commentUrl}" class="timestamp"><relative-time datetime="${commentCreatedAt}" title="No title yet">${commentCreatedAt}</relative-time></a></span>`;
    var commentTitleHtmlElement = `<h4 class="f5 text-normal d-inline">${commenterNameHtmlElement}${commentDateHtmlElement}</h4>`;
    var commentBodyHtmlElement = `<div class="comment-body markdown-body  js-comment-body">${markDownFormattedComment}</div>`;
    var entireCommentHtmlElement = `<div class="edit-comment-hide">${commenterAvatarHtmlElement}<div class="review-comment-contents">${commentTitleHtmlElement}${commentBodyHtmlElement}</div></div>`;

    var checklistedCommentHtmlElement = `<li class="task-list-item enabled"><input class="task-list-item-checkbox" style="float:right" id="" type="checkbox">${entireCommentHtmlElement}</li>`
    return checklistedCommentHtmlElement;
}

function onSideBar(comments) {
    var sideBarItem =
    `<div class="discussion-sidebar-item sidebar-milestone js-discussion-sidebar-item">
        <form accept-charset="UTF-8" action="/commercetools/commercetools-sync-java/issues/59/set_milestone?partial=issues%2Fsidebar%2Fshow%2Fmilestone" class="js-issue-sidebar-form" data-remote="true" method="post">
            <div class="select-menu js-menu-container js-select-menu js-load-contents " data-contents-url="/commercetools/commercetools-sync-java/issues/59/show_partial?partial=issues%2Fsidebar%2Fmilestone_menu_content">
                <button type="button" class="discussion-sidebar-heading discussion-sidebar-toggle js-menu-target" aria-label="Set milestone" aria-haspopup="true" aria-expanded="false" data-hotkey="m">
                    Milestone
                </button>
            </div>
            ${comments}
        </form>
    </div>`;
    var div = document.createElement('div');
    div.innerHTML = sideBarItem;
    return div;
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
            var [sideBar] = document.querySelectorAll("#partial-discussion-sidebar");
            prDescription.append(createChecklist(comments));
            //sideBar.append(onSideBar(createChecklist(comments).innerHTML));
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


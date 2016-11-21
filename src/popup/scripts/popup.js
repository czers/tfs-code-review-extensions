$(() => {
  let createLink = (selector, url) => {
    $(selector).click(() => {
      chrome.tabs.create({
        url: url,
        active: true
      });

      window.close();
    });
  };

  createLink('.open-options', 'options/options.html');
});  
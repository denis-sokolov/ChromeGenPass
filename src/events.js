chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	/* global storage */

	// Returning true from this function keeps the message channel
	// open for a response to be sent asynchronously.
	// https://developer.chrome.com/extensions/runtime#event-onMessage

	// Get all configured passwords
	if (message === 'passwords') {
		storage.passwords.list().then(sendResponse);
		return true;
	}

	// Begin a page script
	if (message[0] === 'init') {
		var domain = message[1];
		storage.whitelist.get().then(function(whitelists){
			if (whitelists.some(function(whitelist){
				return whitelist === domain ||
					domain.substr(-(whitelist.length+1)) === '.'+whitelist;
			})) {
				sendResponse({});
				return;
			}

			var tabId = sender.tab && sender.tab.id;
			chrome.tabs.executeScript(tabId, {file: '3rd/jquery.min.js', allFrames: true});
			chrome.tabs.executeScript(tabId, {file: 'src/lib/i18n.js', allFrames: true});
			chrome.tabs.executeScript(tabId, {file: 'src/page/script.js', allFrames: true});
			chrome.tabs.insertCSS(tabId, {file: 'src/page/styles.css', allFrames: true});
			sendResponse({});
		});
		return true;
	}

	// Generate a password
	if (message[0] === 'password') {
		if (!message[2]) throw new Error('Include password array and the domain.');

		// sendResponse can only take a JSON-ifiable object, so we can not
		// send the promise itself
		storage.passwords.get(message[1], message[2]).then(function(generated){
			sendResponse({ success: true, generated: generated });
		}, function(err){
			sendResponse({ success: false, err: err });
		});
		return true;
	}
});

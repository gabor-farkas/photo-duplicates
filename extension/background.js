chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.data) {
            chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
                chrome.storage.local.set({"data": request.data});
                chrome.tabs.update( tabs[0].id, { url: request.data[0].productUrl} ); 
            });
        }
    }
);

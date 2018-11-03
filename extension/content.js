let data = null;
chrome.storage.local.get(["data"], result => data = result.data);
setTimeout(() => {
    if (window.location.href.indexOf('photos.google.com') != -1) {
        console.log('loaded data', data);
        let retryCountDown = 5;
        function processWithInformationPanelPresent() {
            if (retryCountDown -- <= 0) {
                return; // something went wrong
            }
            let content = document.body.innerHTML;
            let matches = content.indexOf('data-width="' + data[0].mediaMetadata.width + '"') != -1
                    && content.indexOf('data-height="' + data[0].mediaMetadata.height  + '"') != -1
                    && content.indexOf(data[0].filename) != -1;
            console.log('matches: ', matches);
            if (matches) {
                $('div[data-tooltip="Törlés"]').click();
                setTimeout(() => {
                    $('div[data-id=EBS5u]').click();
                    // continue
                    data = data.slice(1);
                    chrome.runtime.sendMessage({data : data});
                }, 500);
            } else {
                // the content of the information panel might not have been loaded
                setTimeout(processWithInformationPanelPresent, 500);
            }
        }
        if ($(".IMbeAf")) {
            processWithInformationPanelPresent();
        } else {
            $('div[data-tooltip="Információ"]').click()
            setTimeout(processWithInformationPanelPresent, 1000);
        }
    } else {
        // assume localhost
        let btn = $("<button>start</button>");
        $(document.body).prepend(btn);
        btn.click(() => {
            let data = $("#pre").text().split(';').filter(json => !!json && json.length > 0).map(json => JSON.parse(json));
            chrome.runtime.sendMessage({data : data});
        });
    }
}, 2000);
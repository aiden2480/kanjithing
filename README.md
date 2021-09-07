
# :u5408: kanjithing
<div align="center">
    <a href="https://github.com/aiden2480/kanjithing/commits"><img src="https://img.shields.io/github/last-commit/aiden2480/kanjithing?color=red" title="GitHub commit history" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab/reviews"><img src="https://img.shields.io/chrome-web-store/rating/nccfelhkfpbnefflolffkclhenplhiab?color=orange" title="Google chrome store rating" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab"><img src="https://img.shields.io/chrome-web-store/v/nccfelhkfpbnefflolffkclhenplhiab?color=yellow" title="Last version published on chrome web store" /></a>
    <a href="https://github.com/aiden2480/kanjithing/actions/workflows/updatewebstore.yml"><img src="https://img.shields.io/github/workflow/status/aiden2480/kanjithing/Publish%20to%20chrome%20webstore?label=Publish%20workflow&color=green" title="Webstore publish workflow status" /></a>
</div>

## :shrug: A google chrome extension for practising kanji
You can practise drawing kanji featured in the Wakatta units. That's pretty much it right now.
> [Install on the google chrome webstore](https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab)

## :gear: Installation
> The extension is available in the [google chrome store](https://chrome.google.com/webstore/detail/nccfelhkfpbnefflolffkclhenplhiab), though it can be installed from source with the following instructions

1. [Download the repository as a zip](https://github.com/aiden2480/kanjithing/zipball/main) and extract
2. Navigate to [`chrome://extensions`](chrome://extensions)
3. Ensure that the `Developer mode` switch is enabled in the top right of your screen
4. Click `Load unpacked` in the top left corner of the screen
5. Select the folder containing the extension in the popup modal

## :recycle: Update
Google chrome will automatically update the extension as I publish new updates if you install from the chrome store.
If installing from this repository, `git clone` this repository and then run `git pull origin master` yourself.
You'll need to go back into the [chrome extension settings](chrome://extensions) and press the refresh icon next to the extension to reload.

I'm using a [custom GitHub action](.github\workflows\updatewebstore.yml) to automatically publish new versions of the extension to the chrome store every time I change the `version` parameter in the `manifest.json` file.

## :file_cabinet: API
The kanji drawing guide videos are sourced from [KanjiAlive](https://app.kanjialive.com/api/docs), and cached using a [middleman I created](https://replit.com/@chocolatejade42/kanjithing-backend) (as RapidAPI limits requests). 
Requests can be made at the `/kanji/:kanji` endpoint, like so.

```bash
$ curl -L http://kanjithing-backend.chocolatejade42.repl.co/kanji/車
```
```json
{"status": 200,"video": "https://media.kanjialive.com/kanji_animations/kanji_mp4/kuruma_00.mp4"}
```

## :memo: Future features
- [ ] Make the user guess readings of kanji in words
- [ ] Scoreboard somehow
- [ ] Update indicator
- [ ] Offline cache/compatability
    * might not be possible with the small amount of storage space allowed to chrome extensions
- [ ] Buttons to select the next/previous/random kanji in set
- [ ] Auto create and publish releases on GitHub when manifest version changes
- [ ] Load custom kanji sets
- [ ] Clean up and potentially seperate the css into separate files
- [ ] Cache responses returned from the server in local storage
- [ ] How-to-use page that opens on first install to display instructions
- [x] Fix dependency on RapidAPI
    - [kanjialive-backend on repl.it](https://replit.com/@chocolatejade42/kanjithing-backend)
- [x] Select a kanji grade to learn or a wakatta unit
    - Added wakatta unit selection in version [`d35a6bc`](https://github.com/aiden2480/kanjithing/commit/d35a6bc)

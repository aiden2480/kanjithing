# :u5408: kanjithing
A google chrome extension for practising kanji

## :gear: Installation
1. [Download the repository as a zip](https://github.com/aiden2480/kanjithing/zipball/main) and extract
2. Navigate to [chrome://extensions](chrome://extensions)
3. Ensure that the `Developer mode` switch is enabled in the top right of your screen
4. Click `Load unpacked` in the top left corner of the screen
5. Select the folder containing the extension in the popup modal

## :recycle: Update
I haven't yet bothered to make the extension automatically update, so the easiest way to keep the extension up to date
is to `git clone` this repository rather than download the zip file and you can just run `git pull origin master` yourself.
You'll need to go back into the [chrome extension settings](chrome://extensions) and press the refresh icon next to the extension to reload.

## :file_cabinet: API
The kanji drawing guide videos are sourced from [KanjiAlive](https://app.kanjialive.com/api/docs), and cached using a [middleman I created](https://replit.com/@chocolatejade42/kanjithing-backend) (as RapidAPI limits requests). 
Requests can be made at the `/kanji/:kanji` endpoint, like so.

```bash
$ curl http://kanjithing-backend.chocolatejade42.repl.co/kanji/車 --location
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
- [x] Fix dependency on RapidAPI
    - [kanjialive-backend on repl.it](https://replit.com/@chocolatejade42/kanjithing-backend)
- [x] Select a kanji grade to learn or a wakatta unit
    - Added wakatta unit selection in version [`d35a6bc`](https://github.com/aiden2480/kanjithing/commit/d35a6bc)

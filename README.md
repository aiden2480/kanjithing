
# :u5408: kanjithing
<div align="center">
    <a href="https://github.com/aiden2480/kanjithing/commits"><img src="https://img.shields.io/github/last-commit/aiden2480/kanjithing?color=red" title="GitHub commit history" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab/reviews"><img src="https://img.shields.io/chrome-web-store/rating/nccfelhkfpbnefflolffkclhenplhiab?color=orange" title="Google chrome store rating" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab"><img src="https://img.shields.io/chrome-web-store/v/nccfelhkfpbnefflolffkclhenplhiab?color=yellow" title="Last version published on chrome web store" /></a>
    <a href="https://github.com/aiden2480/kanjithing/actions/workflows/updatewebstore.yml"><img src="https://img.shields.io/github/workflow/status/aiden2480/kanjithing/Publish%20to%20chrome%20webstore?label=Publish%20workflow&color=green" title="Webstore publish workflow status" /></a>
    <a href="https://github.com/aiden2480/kanjithing/blob/main/LICENCE"><img src="https://img.shields.io/github/license/aiden2480/kanjithing?color=blue" /></a>
    <a href="https://aiden2480.github.io/kanjithing/"><img src="https://img.shields.io/badge/GitHub%20Pages-active-af6eeb" /></a>
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

I'm using a [custom GitHub action](.github/workflows/updatewebstore.yml) to automatically publish new versions of the extension to the chrome store every time I change the `version` parameter in the `manifest.json` file.

## :file_cabinet: API
The kanji drawing guide videos are sourced from [KanjiAlive](https://app.kanjialive.com/api/docs), and cached using a [middleman I created](https://replit.com/@chocolatejade42/kanjithing-backend) (as RapidAPI limits requests).
It also collates some data about the kanji which is used in the extension, such as readings, and example words.
Requests can be made at the `/kanji/:kanji` endpoint, like so.

```bash
$ curl -L http://kanjithing-backend.chocolatejade42.repl.co/kanji/車
```
```json
{
    "status": 200,
    "kanji": "車",
    "kstroke": 7,
    "kmeaning": "vehicle, wheel, car",
    "kgrade": 1,
    "kunyomi_ja": "くるま",
    "onyomi_ja": "シャ",
    "video": "https://media.kanjialive.com/kanji_animations/kanji_mp4/kuruma_00.mp4",
    "examples": [
        ["車（くるま）", "car"],
        ["電車（でんしゃ）", "train"],
        ["自転車（じてんしゃ）", "bicycle"],
        ["自動車（じどうしゃ）", "automobile"],
        ["車いす（くるまいす）", "wheel chair"],
        ["駐車する（ちゅうしゃする）", "park a car"],
        ["停車する（ていしゃする）", "stop a car or train"]
    ]
}
```

## :memo: Future features
- [ ] Able to star/favourite kanji to add them quickly to a custom set.
- [ ] Make the user guess readings of kanji in words
- [ ] Help page
    - How to use the extention, info about tooltips, etc
    - Open on the first install
- [ ] Flashcard thing where you get the meaning of the kanji and sample words and have to draw it
- [ ] Custom flashcards to remember kanji/words
    - Import from quizlet
- [ ] Show an extra sample word when the readings string doesn't cross over to the next line
    - Compress space between two lines if it crosses over
- [ ] Grade stroke order of drawing
    - [Available on GitHub](https://github.com/kanjialive/kanji-data-media/blob/master/kanji-animations/stroke_timings) with timestamps
- [ ] Grey loading screen should only appear after a certain amount of time to account for cached requests that resolve quickly
    - To prevent grey/white flashes that occur when the next character loads quickly
- [ ] Right click to remove drawing (all connected strokes)
- [ ] Add tooltip banner when extension updates
    - Potentially as a small subtext badge?
- [x] Keybinds to navigate the application via keyboard
    - Up/down arrow to navigate between kanji sets
    - Left/right arrow to navigate between kanji in the currently selected set
    - R to select a random kanji in the currently selected set
    - Enter to grade kanji drawing
    - Space to play/pause/replay video guide
    - Backspace to clear drawing
    - S to star/unstar selected kanji
    - Keybinds visible in tooltips
- [ ] Use static assets for the emojis to keep design consistent between operating systems
- [ ] Event listener on the popup script to determine when the set storage has changed
- [ ] Use data from the KanjiAlive API to do pronuncation/sounds
- [ ] Make CSS for buttons/inputs be consistent throughout the popup/settings/index pages
- [ ] Fix overlap interaction with especially long word descriptions (同 kanji)
- [x] Use a RapidAPI key in the application to fetch data (Replit downtime)
- [ ] Unspaghettify everything
- [ ] Display notification when a custom set has been created successfully
    - Potentially a small badge text?
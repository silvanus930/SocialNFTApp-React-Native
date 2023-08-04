# Persona

## Setup

Assumes OS X

Run `sudo xcode-select --switch /Applications/Xcode.app` before attempting to launch the apps.

#### Dependencies & Requirements:

- homebrew (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- Ruby 2.7.6
- coreutils (`brew install coreutils`)
- Cocoapoads (`sudo gem install cocoapods`, or `arch -x86_64 brew install cocoapods`)

## Node version management

```
sudo brew install nvm
nvm install v16
nvm use v16
nvm alias default 16
```

## Configuration

```
cp .babelrc.template .babelrc
```

`console.log` output is stripped by default in `.babelrc.template`:
edit your local `.babelrc` and remove the `transform-remove-console` line to bring back logs.

## Bootstrap

```
  cd Persona
  yarn install
  make clean
  make iosdev
```

## Launch Simulators Directly

```
  yarn ios
  yarn android
```

## Architecture notes

- All functional code is in `./src/`
- Project config is in package.json
- Android release build notes in android/notes

## Android

- Requires installation of Android studio & java jdk (easiest to use oracle's https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html)
- Be sure to export add the following to your ENV:

```
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## IOS

To refresh build, run `make clean`.

This removes 'Pods/', 'Podfile.lock', 'yourappname.xcworkspace' and reinstalls pods:

```
pod deintegrate
pod install
```

### Gotchas

Missing font error? `SF Pro Display Semibold` comes by default with OS X 12, but may be missing on previous versions. Try `npx react-native asset` or installing the font globally (the TTF is available in the Persona/assets/fonts directory).

### Push Notifications

Simulate a push notification in code:

```
import EventEmitter from "utils/EventEmitter"

const anAction = () => {
  const notification = {
      personaId: 'beb7a91b',
      title: '⚡️ Mention in discussion on "SECOND POST"',
      commentId: 'cQ3yw33SxIbcjYYhPPnP',
      personaName: "aroth2's channel",
      eventType: 'comment_mention',
      eventId: 'zWv4BD4YCksG8usboVQv',
      personaProfileImgUrl: '',
      fcm_options: {
          image: 'https://d15rrhm2u3m386.cloudfront.net/eyJidWNrZXQiOiJwZXJzb25hLWNvbnRlbnQtc3RvcmUiLCJrZXkiOiJkZWZhdWx0VXNlci5qcGVnIiwiZWRpdHMiOnsicmVzaXplIjp7ImZpdCI6ImNvdmVyIiwid2lkdGgiOjQwMCwiaGVpZ2h0Ijo0MDB9LCJyb3RhdGUiOm51bGx9fQ==',
      },
      body: 'aroth2: aroth is in a chat, adding a comment to a post: @aroth',
      postId: '53ac660f',
  };

  EventEmitter.emit('notification', {data: notification});
}

```

### Running Scripts from the /scripts folder

Prereq: Download a service account file from firebase and place it in the /scripts folder. Title it service-account.json. Make sure to change the name to `service-account.json` as it is in .gitignore and be sure to not commit the original file.

You can use the scriptTemplate.js file and create a new script based on that. Run it using node:

```
node scriptTemplate.js
```


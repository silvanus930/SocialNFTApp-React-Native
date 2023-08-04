# Setup

`brew install npm nvm`

Then be sure to add the following

```
export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
export PATH=$PATH:/usr/local/opt
export PATH=$PATH:/usr/local/bin
```

to your `~/.zshrc`.

Then run

```
nvm install 16
nvm use 16
npm install
```

# Node version

Firestore functions uses a different node version than our main project. You'll need to switch
versions before running any scripts in this project.

```
nvm use 16
```

After you want to go back to the Persona app, run

```
nvm use 15
```

# Setting up deployment of firestore cloud functions

Run

```
firebase login:ci
```

and output the result into

```
firebase functions:config:set fb.token="<token>"
```

# Deploying

*YOU ARE HANDLING FIREBASE FUNCTIONS IN PROD, DEPLOY WITH CAUTION!*

Never deploy every cloud function at once. Only deploy the cloud functinos you're modifying. To deploy, run:

```
firebase deploy --only functions:$FUNCTION_NAME_1,functions:$FUNCTION_NAME_2,...
```

If you run into any issues deploying (or if the console is asking you to `firebase init`), make sure you're running these commands from the existing persona-client/functions folder level. 

If you want to see any changes that you made in WORKERS / tasks, you may have to deploy 'TaskRunner' (which is also a function) instead.

You can check whether the functions have changes deployed and propagated by logging into console, clicking into the functions, and downloading the zip files to check for your code changes. 


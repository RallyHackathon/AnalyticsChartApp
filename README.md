This is a burndown chart that was created during the 2012 RallyOn Hackathon. It requires the Lookback API to function.



Since this app was created as part of the hackathon it is not guaranteed to work. Inorder to get the charts to display we used some unsupported early release components. In the near future the SDK will have first class support for charting.

This Rakefile can be used to create a skeleton Rally app for use with Rally's App SDK and the Analytics API.  You must have Ruby and the rake gem installed.

Available tasks are:

    rake build                      # Build a deployable app which includes all JavaScript and CSS resources inline
    rake clean                      # Clean all generated output
    rake debug                      # Build a debug version of the app, useful for local development
    rake jslint                     # Run jslint on all JavaScript files used by this app
    rake new[app_name,sdk_version]  # Create an app with the provided name (and optional SDK version)
    
You can find more information on installing Ruby and using rake tasks to simplify app development here: https://rally1.rallydev.com/apps/2.0p/doc/#!/guide/appsdk_20_starter_kit

To launch chrome with cross-origin checks and file access checks disabled, on windows it will look something like:

    %LOCALAPPDATA%\Google\Chrome\Application\chrome.exe --disable-web-security --allow-file-access-from-files --allow-cross-origin-auth-prompt

On mac:

    cd /Applications
    open Google\ Chrome.app --args --disable-web-security --allow-file-access-from-files --allow-cross-origin-auth-prompt

The first time you run the app you'll be prompted with a browser auth window from rally1.rallydev.com for the 'Rally ALM' security realm.
Also, the first time you search you'll get another auth prompt, this time for the 'Rally Analytics API' realm.
You should only need to do these once and then the browser will cache it for the rest of your session (until the browser is closed).
This is only a temporary limitation, which will be resolved in the final version of the analytics API, when we have integrated authentication with Rally ALM.

Due to lumenize adding in a require() function that JSLint doesn't detect, you'll need to turn off JSLint when you want to run 'rake build', or JSLint will fail the build.
You can accomplish this by setting the following environment variable

    export DISABLE_JSLINT="true"

Live JSFiddle Example:
http://jsfiddle.net/markmsmith/WUxMA/
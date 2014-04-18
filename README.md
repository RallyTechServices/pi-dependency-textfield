#Portfolio Item Dependency Linker Summary

## Description
App to enable definition of predecessor and successor links for portfolio items.  The app uses custom text fields on the Portfolio Item to store the predecessor and successor relationships.   

###Usage
<ul>
<li>Create custom text fields for portfolio items to store predecessor and successor links in.  
To use:  
<li>In the App, specify the predecessor and successor text fields in the App Settings window (click the settings icon in the upper right corner and select Edit App Settings...).  
To use:  
<li>Select a portfolio item and add\remove predecessors or successors.  Changes will be applied to the object immediately.
</ul>  

###Known Limitations
<ul>
<li>If the app user doesn't have Editor (or higher) permissions on linked objects for a portfolio item, then the changes will not be applied.  
<li>If the selected portfolio item has successor or predecessor linkages to other portfolio items that are not visible to the current user, those linkages may be removed from the selected portfolio item.  
<li>If a user removes the linkages from a portfolio item itself outside of the app (in the portfolio item window), the linkage will not be automatically removed from the related item.  
</ul>

View the <a href="https://github.com/kcorkan/pi-dependency-textfield/blob/master/pi-dependency-textfield-demo.swf">pi-dependency-textfield-demo.swf</a> video for a demonstration.  

## Development Notes

### First Load

If you've just downloaded this from github and you want to do development, 
you're going to need to have these installed:

 * node.js
 * grunt-cli
 * grunt-init

If you have those three installed, just type this in the root directory here
to get set up to develop:

  npm install

### Structure

  * src/javascript:  All the JS files saved here will be compiled into the 
  target html file
  * src/style: All of the stylesheets saved here will be compiled into the 
  target html file
  * test/fast: Fast jasmine tests go here.  There should also be a helper 
  file that is loaded first for creating mocks and doing other shortcuts
  (fastHelper.js) **Tests should be in a file named <something>-spec.js**
  * test/slow: Slow jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts 
  (slowHelper.js) **Tests should be in a file named <something>-spec.js**
  * templates: This is where templates that are used to create the production
  and debug html files live.  The advantage of using these templates is that
  you can configure the behavior of the html around the JS.
  * config.json: This file contains the configuration settings necessary to
  create the debug and production html files.  Server is only used for debug,
  name, className and sdk are used for both.
  * package.json: This file lists the dependencies for grunt
  * auth.json: This file should NOT be checked in.  Create this to run the
  slow test specs.  It should look like:
    {
        "username":"you@company.com",
        "password":"secret"
    }
  
### Usage of the grunt file
####Tasks
    
##### grunt debug

Use grunt debug to create the debug html file.  You only need to run this when you have added new files to
the src directories.

##### grunt build

Use grunt build to create the production html file.  We still have to copy the html file to a panel to test.

##### grunt test-fast

Use grunt test-fast to run the Jasmine tests in the fast directory.  Typically, the tests in the fast 
directory are more pure unit tests and do not need to connect to Rally.

##### grunt test-slow

Use grunt test-slow to run the Jasmine tests in the slow directory.  Typically, the tests in the slow
directory are more like integration tests in that they require connecting to Rally and interacting with
data.


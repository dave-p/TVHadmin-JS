# TVHadmin-JS
A web front-end for TVHeadend, inspired by VDRadmin.

This project provides a simple web-based front-end for TVHeadend. It is inspired by VDRadmin-am, written by Andreas Mair (http://andreas.vdr-developer.org/vdradmin-am/index.html). It was written for UK Freeview and has been tested with UK Freesat but should also work with any TV provider supported by TVHeadend.

Sample screenshots can be found [here](/screenshots/).

For an alternative version which requires a PHP-enabled web server see https://github.com/dave-p/TVHadmin

### Requirements
- A recent version of TVHeadend (the latest development version preferred).
- TVHeadend must be set up to use 'Basic' or 'Basic+Digest' authentication.
- An up-to-date web browser on your client device. TVHadmin has been tested with Firefox and Chromium under Linux and Chromium on Android; IE will not work.

### Installation
- Log in to your TVHeadend server and navigate to /usr/share/tvheadend/src/webui/static (your distribution may have used a different directory for this).
- Create a directory 'tvhadmin'.
- Copy the TVHadmin repository into the new tvhadmin directory.
- If necessary create a TVHeadend user. The user must have the 'Web Interface' box ticked, and for full fuctionality should have all the 'Streaming' and 'Video Recorder' boxes ticked. The Status screen requires that the user have 'Admin' privilege. If you are using Kodi with the 'TVHeadend HTSP' plugin, you should make use of the same user for both TVHadmin and Kodi.
- Browse to http://your.web.server:9981/static/tvhadmin/TVHadmin.html. Enter the username and password of the TVHeadend user. Make any changes to the settings then click the 'save' button.
- TVHadmin should now be working.

### Security
TVHadmin uses the same security controls as the standard TVHeadend user interface. For use over the open internet you may wish to use a proxy server for additional security.

TVHadmin stores user preferences in a 'cookie' on the client, and uses Session Storage to maintain state. Login credentials are only stored if your browser is configured to store them.


# TVHadmin-JS
A web front-end for TVHeadend, inspired by VDRadmin.

This project provides a simple web-based front-end for TVHeadend. It is inspired by VDRadmin-am, written by Andreas Mair (http://andreas.vdr-developer.org/vdradmin-am/index.html). It was written for UK Freeview and has been tested with UK Freesat but should also work with any TV provider supported by TVHeadend.

### Requirements
- A recent version of TVHeadend (at least v4.2 - the latest development version preferred).
- An up-to-date web browser on your client device. TVHadmin has been tested with Firefox and Chromium; IE is unlikely to work.

### Installation
- Log in to your TVHeadend server and navigate to /usr/share/tvheadend/src/webui/static (your distribution may have used a different directory for this).
- Create a directory 'tvhadmin'.
- Copy the TVHadmin repository into the new tvhadmin directory.
- If necessary create a TVHeadend user. The user must have the 'Web Interface' box ticked, and for full fuctionality should have all the 'Streaming' and 'Video Recorder' boxes ticked. If you are using Kodi with the 'TVHeadend HTSP' plugin, you should make use of the same user for both TVHadmin and Kodi.
- Browse to http://your.web.server/path/tvhadmin.html. Enter the username and password of the TVHeadend user. Make any changes to the settings then click the 'save' button.
- TVHadmin should now be working.

### Security
TVHadmin uses the same security controls as the standard TVHeadend user interface. For use over the open internet you may wish to use a proxy server for additional security.


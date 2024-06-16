# TVHadmin-JS
A web front-end for TVHeadend, inspired by VDRadmin.

This project provides a simple web-based front-end for TVHeadend. It is inspired by VDRadmin-am, written by Andreas Mair (http://andreas.vdr-developer.org/vdradmin-am/index.html). It was written for UK Freeview and has been tested with UK Freesat but should also work with any TV provider supported by TVHeadend.

Sample screenshots can be found [here](/screenshots/).

For an alternative version which requires a PHP-enabled web server see https://github.com/dave-p/TVHadmin

### Requirements
- A recent version of TVHeadend (the latest version 4.3 preferred).
- TVHeadend must be set up to use 'Basic' or 'Basic+Digest' authentication.
- An up-to-date web browser on your client device. TVHadmin has been tested with Firefox, Brave and Chromium under Linux and Chromium on Android; IE will not work.

### Installation
- Log in to your TVHeadend server and `cd /usr/share/tvheadend/src/webui/static` (your distribution may have used a different directory for this).
- `git clone https://github.com/dave-p/TVHadmin-JS.git`. Alternatively, copy the file `https://github.com/dave-p/TVHadmin-JS/archive/master.zip` into this location, unzip it, then rename the directory `TVHadmin-JS-master` to `TVHadmin-JS`.
- If necessary create a TVHeadend user. The user must have the 'Web Interface' box ticked, and for full fuctionality should have all the 'Streaming' and 'Video Recorder' boxes ticked. The Status screen and multi-tuner clash detection require that the user have 'Admin' privilege. If you are using Kodi with the 'TVHeadend HTSP' plugin, you should make use of the same user for both TVHadmin and Kodi.
- Browse to http://your.tvh.server:9981/static/TVHadmin-JS/TVHadmin.html. Enter the username and password of the TVHeadend user. Make any changes to the settings then click the 'save' button.
- TVHadmin should now be working.

### Timer Clashes
TVHadmin can optionally detect and warn about timer clashes (where there is no free source to make a recording). Clash detection is set up using the Configuration screen.

Clash detection has not been fully tested with IPTV and other non-tuner sources.

#### Single Tuner
TVHadmin shows a timer clash by displaying a red 'tick' against any conflicting timers. Below the main display is shown any alternative broadcasts of the same programme. These alternatives are in turn checked to see if they clash with any other timers.

The alternatives display depends on the broadcasters providing 'series link' information; it has been tested on UK Freeview and Freesat.

A yellow 'tick' mark is shown if overlapping timers are from the same network and mux - tuners will normally allow multiple channels on the same mux to be recorded.

#### Multiple Tuners
TVHadmin checks the allocation of sources to timers using the same algorithm as TVHeadend. However in order for the check to work correctly it is important that each source for a channel should have a different priority set - if TVHeadend has two or more sources with the same priority to make a recording it will choose one at random, so the clash detection will not be accurate.

The priority for a recording source is the sum of the service priority and the tuner priority (network priority for IPTV). If not using IPTV the simplest approach is to set each TV tuner to a different priority and leave the service priorities as default. If TVHadmin detects that there are multiple 'best' sources for a recording with the same priority, the 'tick' mark against the recording will show grey.

The Tvheadend user must have 'Admin' privilege for clash detection to work.

### Security
TVHadmin uses the same security controls as the standard TVHeadend user interface. For use over the open internet you may wish to use a VPN or proxy server for additional security.

TVHadmin stores user preferences in a 'cookie' on the client, and uses Session Storage to maintain state. Login credentials are only stored if your browser is configured to store them.

### Issues
- All timers created by TVHadmin use the same recording profile (the one set in the Config screen).
- Some screens supply extra information as hover text. This is not accessible from mobile clients.
- No internationalisation (I18n)

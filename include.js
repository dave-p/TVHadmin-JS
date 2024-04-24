function get_cookies() {
  const n = "TVHadmin";
  try {
    var b = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    var c = b ? b.pop() : '';
    return JSON.parse(decodeURIComponent(c));
  }
  catch {
    var empty = {"Tag_All": "All", "Rec_All": "All", "Now_All": "All", "Tim_All": "All", "selected_channels": [],
      "SORT": "1", "CSORT": "0", "TIMESPAN": "2", "EPGSTART": "0", "THEME": "0", "UUID": "None", "CLASHDET": "0"};
    return empty;
  }
}

var cookies = get_cookies();
var head = document.getElementsByTagName('HEAD')[0];
var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
if (cookies.THEME == 1) link.href = 'style.dark.css';
else if (cookies.THEME == 2) link.href = 'style.blue.css';
else link.href = 'style.css';
head.appendChild(link);

window.addEventListener('load',function() {
  var mytop=document.getElementById("mobmenu");
  mytop.addEventListener('click', function() {
    var mynav=document.getElementById("navigation");
    if (mynav.classList.contains('focus'))
      mynav.classList.remove('focus');
    else mynav.classList.add('focus');
  });
  const titles = [ "What's On Now", "Timeline", "Channels", "Favourite Channels", "Timers",
        "Recordings", "Series Links", "Status", "Configuration" ];
  const links = [ "now.html", "timeline.html", "channels.html", "favourites.html", "timers.html",
        "recordings.html", "links.html", "status.html", "config.html" ];
  let menu = document.getElementsByClassName("nav_bar");
  for (let i = 0; i < titles.length; i++) {
    let div = document.createElement("div");
    div.className = "navi";
    div.innerHTML = `<a href="${links[i]}">${titles[i]}</a>`;
    menu[0].appendChild(div);
  }
  let div = document.createElement("div");
  div.className = "navi";
  div.innerHTML = "<form action='search.html' method='GET' name='search' class='search' onsubmit='return checkForm()'> \
        <input type='text' name='find'><br> \
        <input type='submit' name='submit' value='Search'> \
        </form>";
  menu[0].appendChild(div);
},false);

function checkForm() {
  var x = document.forms["search"]["find"].value;
  if (x == "") return false;
  return true;
}

function create_by_event(event, event_id, element) {
  event.preventDefault();
  const profile_uuid = cookies.UUID;
  fetch(`/api/dvr/entry/create_by_event?event_id=${event_id}&config_uuid=${profile_uuid}`).then(function(response) {
    if (response.ok) {
      var outer = element.parentNode;
      outer.removeChild(outer.childNodes[0]);
      var img = document.createElement("img");
      img.src = "images/rec.png";
      outer.appendChild(img);
    }
  });
}

function create_by_series(event, event_id, element) {
  event.preventDefault();
  const profile_uuid = cookies.UUID;
  fetch(`/api/dvr/autorec/create_by_series?event_id=${event_id}&config_uuid=${profile_uuid}`).then(function(response) {
    if (response.ok) {
      var outer = element.parentNode;
      outer.removeChild(outer.childNodes[0]);
      outer.previousSibling.removeChild(outer.previousSibling.childNodes[0]);
      var img = document.createElement("img");
      img.src = "images/rec.png";
      outer.appendChild(img);
    }
  });
}

async function get_epg(channel, start, to) {
  var url = "/api/epg/events/grid?limit=9999";
  if (to > 0) {
    const filter = `[{"field":"stop","type":"numeric","value":"${start}","comparison":"gt"},{"field":"start","type":"numeric","value":"${to}","comparison":"lt"}]`;
    url += `&filter=${filter}`;
  }
  if (channel) {
    const prog = encodeURIComponent(channel);
    url += `&channel=${prog}`;
  }
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function get_epg_now(channel) {
  var url = "/api/epg/events/grid?mode=now&limit=9999";
  if (channel) {
    const prog = encodeURIComponent(channel);
    url += `&channel=${prog}`;
  }
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function search_epg(channel, needle) {
  const reg = encodeURIComponent(escapeRegExp(needle));
  const url = `/api/epg/events/grid?limit=9999&title=${reg}`;
  if (channel != "") {
    const prog = encodeURIComponent(channel);
    url += `&channel=${prog}`;
  }
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function get_timers() {
  const response = await fetch("/api/dvr/entry/grid_upcoming?sort=start");
  const timers = await response.json();
  return timers.entries;
}

async function get_profiles() {
  const response = await fetch("/api/dvr/config/grid");
  const profiles = await response.json();
  return profiles.entries;
}

async function get_channeltags() {
  const response = await fetch("/api/channeltag/list");
  const tags = await response.json();
  let ret = {"All":"All"};
  tags.entries.forEach(function(tag) {
    ret[tag.val] = tag.key;
  });
  return ret;
}

async function get_links() {
  const response = await fetch("/api/dvr/autorec/grid");
  const json = await response.json();
  const links = json.entries;
  links.sort(function(a, b) {
    return sort_title(a.title, b.title);
  });
  return links;
}

async function get_recordings(sort) {
  const response = await fetch("/api/dvr/entry/grid?limit=9999");
  const json = await response.json();
  const recordings = json.entries;
  switch(sort) {
    case "0":
      recordings.sort(function(a, b) {
	return (a.start - b.start);
      });
      break;
    case "1":
      recordings.sort(function(a, b) {
	return (b.start - a.start);
      });
      break;
    case "2":
      recordings.sort(function(a, b) {
	var ret = sort_title(a.disp_title, b.disp_title);
	if (ret == 0) return (a.start - b.start);
	return ret;
      });
  }
  return recordings;
}

async function get_channels(sort) {
  const response = await fetch("/api/channel/grid?limit=9999");
  const json = await response.json();
  const channels = json.entries;
  if (sort == 0) {
    channels.sort(strcasecmp);
  }
  else {
    channels.sort(function(a,b) {
      let ret = a.number - b.number;
      if (ret == 0) return strcasecmp(a,b); 
      else return ret;
    });
  }
  return channels;
}

function sort_title(x, y) {
  if (!x || !y) return 0;
  if (x.startsWith('New:')) {
    if (x[4] == ' ') x = x.substring(5);
    else x = x.substring(4);
  }
  if (y.startsWith('New:')) {
    if (y[4] == ' ') y = y.substring(5); 
    else y = y.substring(4); 
  }
  if (x.endsWith('...')) {
    x = x.substring(0, x.length - 3);
  }
  if (y.endsWith('...')) {
    y = y.substring(0, y.length - 3);
  }
  let n = Math.min(x.length, y.length);
  return strncmp(x, y, n);
}

function strcasecmp(a, b) {
  let s1 = (a.name + '').toLowerCase()
  let s2 = (b.name + '').toLowerCase()
  if (s1 > s2) return 1;
  else if (s1 === s2) return 0;
  return -1;
}

function strncmp(str1, str2, n) {
  str1 = str1.substring(0, n);
  str2 = str2.substring(0, n);
  return ( ( str1 == str2 ) ? 0 : (( str1 > str2 ) ? 1 : -1 ));
}

function intersect(tags, media) {
  for (var t in tags) {
    if (media[tags[t]]) return 1
  }
  return 0;
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/* Port of strftime() by T. H. Doan (https://thdoan.github.io/strftime/)
 *
 * Un-needed features removed. Accepts Unix timestamp.
 */
function strftime(sFormat, udate) {
  date = new Date(udate*1000);
  var nDay = date.getDay(),
    nDate = date.getDate(),
    nMonth = date.getMonth(),
    nYear = date.getFullYear(),
    nHour = date.getHours(),
    aDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    zeroPad = function(nNum, nPad) {
      return ('00000000' + nNum).slice(-nPad);
    };
  return sFormat.replace(/%[a-z]/gi, function(sMatch) {
    return (({
      '%a': aDays[nDay].slice(0,3),
      '%A': aDays[nDay],
      '%b': aMonths[nMonth].slice(0,3),
      '%B': aMonths[nMonth],
      '%c': date.toUTCString(),
      '%d': zeroPad(nDate, 2),
      '%e': nDate,
      '%F': date.toISOString().slice(0,10),
      '%H': zeroPad(nHour, 2),
      '%I': zeroPad((nHour+11)%12 + 1, 2),
      '%k': nHour,
      '%l': (nHour+11)%12 + 1,
      '%m': zeroPad(nMonth + 1, 2),
      '%n': nMonth + 1,
      '%M': zeroPad(date.getMinutes(), 2),
      '%p': (nHour<12) ? 'AM' : 'PM',
      '%P': (nHour<12) ? 'am' : 'pm',
      '%s': Math.round(date.getTime()/1000),
      '%S': zeroPad(date.getSeconds(), 2),
      '%u': nDay || 7,
      '%w': nDay,
      '%x': date.toLocaleDateString(),
      '%X': date.toLocaleTimeString(),
      '%y': (nYear + '').slice(2),
      '%Y': nYear,
      '%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
      '%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1')
    }[sMatch] || '') + '') || sMatch;
  });
}

// https://medium.com/@Charles_Stover/phps-htmlspecialchars-implemented-in-javascript-3da9ac36d481
var htmlspecialchars = function(string) {
  
  var escapedString = string;

  // For each of the special characters,
  var len = htmlspecialchars.specialchars.length;
  for (var x = 0; x < len; x++) {

    // Replace all instances of the special character with its entity.
    escapedString = escapedString.replace(
      new RegExp(htmlspecialchars.specialchars[x][0], 'g'),
      htmlspecialchars.specialchars[x][1]
    );
  }

  return escapedString;
};

// A collection of special characters and their entities.
htmlspecialchars.specialchars = [
  [ '&', '&amp;' ],
  [ '<', '&lt;' ],
  [ '>', '&gt;' ],
  [ '"', '&quot;' ],
  [ "'", '&apos;' ]
];

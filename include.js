async function get_epg(channel, start, to) {
  var f = start/1000; var t = to/1000;
  const prog = encodeURIComponent(channel);
  if (t == 0) {
    var url = `/api/epg/events/grid?channel=${prog}&limit=9999`;
  }
  else {
    const filter = `[{"field":"stop","type":"numeric","value":"${f}","comparison":"gt"},{"field":"start","type":"numeric","value":"${t}","comparison":"lt"}]`;
    var url = `/api/epg/events/grid?channel=${prog}&filter=${filter}&limit=9999`;
  }
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function get_epg_now(channel) {
  const prog = encodeURIComponent(channel);
  const url = "/api/epg/events/grid?channel=" + prog + "&mode=now";
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function search_epg(channel, needle) {
  const prog = encodeURIComponent(channel);
  const reg = encodeURIComponent(escapeRegExp(needle));
  const url = `/api/epg/events/grid?limit=9999&title=${reg}`;
  if (channel != "") url += `&channel=${prog}`;
  const response = await fetch(url);
  const epg = await response.json();
  return epg.entries;
}

async function get_timers() {
  const url = "/api/dvr/entry/grid_upcoming?sort=start";
  const response = await fetch(url);
  const timers = await response.json();
  return timers.entries;
}

async function get_profiles() {
  const url = "/api/dvr/config/grid";
  const response = await fetch(url);
  const profiles = await response.json();
  return profiles.entries;
}

async function get_channeltags() {
  const url = "/api/channeltag/list"
  const response = await fetch(url);
  const tags = await response.json();
  let ret = {"All":"All"};
  tags.entries.forEach(function(tag) {
    ret[tag.val] = tag.key;
  });
  return ret;
}

async function get_links() {
  const url = "/api/dvr/autorec/grid"
  const response = await fetch(url);
  const json = await response.json();
  const links = json.entries;
  links.sort(sort_links);
  return links;
}

async function get_recordings(sort) {
  const url = "/api/dvr/entry/grid?limit=99999"
  const response = await fetch(url);
  const json = await response.json();
  const recordings = json.entries;
  switch(sort) {
    case "0":
      recordings.sort(sort_recordings);
      break;
    case "1":
      recordings.sort(sort_recordings_desc);
      break;
    case "2":
      recordings.sort(sort_recordings_title);
  }
  return recordings;
}

async function get_channels(sort) {
  const url = "/api/channel/grid?limit=9999";
  const response = await fetch(url);
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

function sort_links(a, b) {
  return sort_title(a.title, b.title);
}
  
function sort_title(x, y) {
  if (x.startsWith('New:')) {
    if (x[4] == ' ') x = x.substring(5);
    else x = x.substring(4);
  }
  if (y.startsWith('New:')) {
    if (y[4] == ' ') y = y.substring(5); 
    else y = y.substring(4); 
  }
  let n = Math.min(x.length, y.length);
  return strncmp(x, y);
}

function sort_recordings(a, b) {
  return (a.start - b.start);
}

function sort_recordings_desc(a, b) {
  return (b.start - a.start);
}

function sort_recordings_title(a,b) {
  var ret = sort_title(a.disp_title, b.disp_title);
  if (ret == 0) return (a.start - b.start);
  return ret;
}

function strcasecmp(a, b) {
  var s1 = (a.name + '').toLowerCase()
  var s2 = (b.name + '').toLowerCase()

  if (s1 > s2) {
    return 1
  } else if (s1 === s2) {
    return 0
  }
  return -1
}

function strncmp(str1, str2, n) {
  str1 = str1.substring(0, n);
  str2 = str2.substring(0, n);
  return ( ( str1 == str2 ) ? 0 : (( str1 > str2 ) ? 1 : -1 ));
}

function get_cookies() {
  const n = "TVHadmin";
  try {
    var b = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    var c = b ? b.pop() : '';
    return JSON.parse(decodeURIComponent(c));
  }
  catch {
    var empty = {"Tag_All": "All", "Rec_All": "All", "Now_All": "All", "Tim_All": "All", "SORT": "1", "CSORT": "0", "TIMESPAN": "2", "EPGSTART": "0"};
    return empty;
  }
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
  [ '"', '&quot;' ]
];

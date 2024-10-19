function check_timer(timers, t) {
  if (timers.length < 2) return 0;
  if (!t.enabled) return 4;
  let tstart = t.start_real;
  let tstop = t.stop_real;
  let ret = 0;
  for (m of timers) {
    if (!m.enabled) continue;
    if (m.channel === t.channel) continue;
    if (m.uuid === t.uuid) continue;
    if ((tstart >= m.start_real && tstart < m.stop_real)
        ||(m.start_real >= tstart && m.start_real < tstop)) {
    if (get_mux_for_timer(m) === get_mux_for_timer(t)) ret = Math.max(ret,1);
    else ret = Math.max(ret,2);
    }
  }
  return ret;
}

function check_event(timers, e) {
  let estart = e.start;
  let estop = e.stop;
  let ret = 0;
  for (t of timers) {
    if (!t.enabled) continue;
    if((estart >= t.start_real && estart < t.stop_real)
        ||(t.start_real >= estart && t.start_real < estop)) {
      if (get_mux_for_event(e) === get_mux_for_timer(t)) ret = Math.max(ret,1);
      else ret = Math.max(ret,2);
    }
  }
  return ret;
}

function get_mux_for_event(evt) {
  var id = evt.channelUuid;
  var r = get_mux_for_channel(id);
  return r;
}

function get_mux_for_timer(timer) {
  var id = timer.channel;
  var r = get_mux_for_channel(id);
  return r;
}

function get_mux_for_channel(ch) {
  let i = channels.findIndex(c => c["uuid"] === ch);
  if (channels[i].mux) return channels[i].mux;
  let svc = channels[i].services[0];
  let name = muxes[svc];
  let mux = name.substr(0, name.lastIndexOf('/'));
  channels[i].mux = mux;
  return mux;
}

async function get_muxes() {
  const response = await fetch("/api/service/list?enum=1");
  const muxes = await response.json();
  let ret = {};
  muxes.entries.forEach(function(r) {
    ret[r.key] = r.val;
  });
  return ret;
}

async function main() {
  var images = ['images/tick_green.png','images/tick_yellow.png','images/tick_red.png','images/rec.png', 'images/spacer.gif'];
  var clashes = [];
  var timers, autorecs;
  [ timers, autorecs, channels, muxes ] = await Promise.all([get_timers(), get_autorecs(), get_channels(), get_muxes()]);
  var now = new Date() / 1000;
  var table = document.getElementById("list");
  for await (const t of timers) {
    let start = strftime("%H:%M", t.start);
    let d = strftime("%a %d/%n", t.start);
    if (t.uri && t.uri.includes("#")) {
      let s = await get_ms_stop(t);
      var stop = strftime("%H:%M", s);
    }
    else {
      var stop = strftime("%H:%M", t.stop);
    }
    if(t.start_real < now) {
      var status = 3;
      var running = true;
    }
    else {
      var status = check_timer(timers, t);
      if (status == 2) clashes.push(t);
      var running = false;
    }
    if (t.autorec != "") {
      var type = "Autorec", type2 = "Autorec";
      if (autorecs[t.autorec] != "") {
        type = "Series Link", type2 = "Series";
      }
    }
    else if (t.timerec != "") {
      var type = "Timed Recording", type2 = "Timer";
    }
    else {
      var type = "", type2 = "";
    }
    if (t.enabled == true) {
      var en = "checked";
    }
    else {
      var en = "";
    }
    let row = table.insertRow(-1);
    row.className = 'row_alt';
    row.title = t.disp_extratext;
    let s = `<td class='col_info'><img src='${images[status]}'></td><td class='col_channel'>${t.channelname}</td>` +
      `<td class='col_date'>${d}<span class='thinonly'><br />${start}-${stop}</span></td>` +
      `<td class='wideonly col_start'>${start}</td><td class='wideonly col_stop'>${stop}</td>` +
      `<td class='col_name'>${t.disp_title}</td>` +
      `<td class='col_channel'><span class='wideonly'>${type}</span><span class='thinonly'>${type2}</span></td>` +
      `<td class='col_delete'><input type='checkbox' class='smaller' oninput='toggle(event,"${t.uuid}",${t.enabled})' ${en}></td>` +
      `<td class='col_delete'><a href='timers.html' onclick='delete_timer(this,"${t.uuid}",${running})'><img src='images/delete.png' title='Delete Timer'></a></td>`;
    row.innerHTML = s;
  }
  var s = '';
  for await (const c of clashes) {
    if (!c.uri) continue;
    var title = c.disp_title;
    var str = title.match(/^(.*?)\.\.\./);
    if (str) title = str[1];
    if (str = title.match(/^New: *(.*)/)) {
      var ts = str[1];
    }
    else {
      var ts = title;
    }
    var alts = await search_epg("", ts);
    if (alts.length > 1) {
      var s2 = "";
      alts.forEach(function(a) {
        if (a.dvrUuid && (a.dvrUuid == c.uuid)) return;
        var sl = "";
        if (a.deafsigned) sl = '[SL]';
        if (a.episodeUri && (c.uri === a.episodeUri)) {
          var when = strftime("%a %e/%n %H:%M", a.start);
          if (!check_event(timers, a)) {
            s2 += `<li>${when} ${a.channelName} ${a.title} ${sl}</li>`;
          }
          else {
            s2 += `<li>${when} ${a.channelName} ${a.title} ${sl} (CLASH)</li>`;
          }
        }
      });
      if (s2.length) {
        let dt = strftime("%a %e/%n at %H:%M", c.start);
        s += `<p>Alternatives for \"${ts}\" on ${dt}</p><ul>` + s2 + "</ul>";
      }
    }
  }
  var notice = document.getElementById("clash");
  notice.innerHTML = s;
}

var channels = {}, muxes = {};
main();


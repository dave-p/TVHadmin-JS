
/*
    Allocate a source (tuner or IPTV network) to a timer following TVH rules:
      - If "Preferred service video type" is set, prefer service with the same service type.
      - If a tuner is already set to the same mux as a service providing the channel, use that.
      - Otherwise use the source / service combination with the highest aggregate priority.
      - FIXME - Untested - IPTV muxes with multiple services, SAT>IP
*/
  function find_tuner(timer) {
    var best = { "tuner": '', "mux": '', "priority": -999, "dup": 0, "ret": 0 };
    var ch = channels.findIndex(c => c["uuid"] === timer.channel);
    for (const s of channels[ch].services) {
      const [net, mux, svc] = services[s].name.split('/');
      if (svc.startsWith('---')) continue;
      let n = networks[net];
      if (!n.enabled) continue;
      let svtype = 0;
      if (services[s].type < 0x21) svtype = svtypes[services[s].type];
      if ('priority' in n) {	// IPTV (or SAT>IP?)
        const prio = services[s].priority + n.priority;
        if (prio > best.priority) {
          best.priority = prio;
          best.tuner = n.networkname;
          best.mux = mux;
          best.dup = 0;
        }
        else if (prio == best.priority) {
          best.dup++;
        }
      }
      else {
        for (const u in tuners) {
          if (tuners[u].network != net) continue;
          if ((timer.start_real <= tuners[u].alloc) && (tuners[u].mux != mux)) continue;   // Busy
          let prio = services[s].priority + tuners[u].priority;
          if (profile.svfilter == svtype) prio += 100;	// Preferred service type
          let ret = 0;
          if ((timer.start_real <= tuners[u].alloc) && (tuners[u].mux == mux)) {
            prio += 50;
            ret = 1;
          }
          if (prio > best.priority) {
            best.priority = prio;
            best.tuner = u;
            best.mux = mux;
            best.dup = 0;
            best.ret = ret;
          }
          else if (prio == best.priority) {
            best.dup++;
          }
        }
      }
    }
    if (best.tuner != '') {
      if (best.dup == 0) {
        debug += `\n${best.tuner} service ${best.mux}`;
        alloc_tuner(best.tuner, timer, best.mux);
        return best.ret;
      }
      else {
        debug += `\n${best.tuner} has duplicate priority`;
        return 5;
      }
    }
    debug += "\nNo tuner available";
    for (const t in tuners) {
      let exp = strftime("%d/%e:%H.%M", tuners[t].alloc);
      debug += `\n${t}: exp: ${exp} mux: ${tuners[t].mux}`;
    }
    return 2;
  }

  function alloc_tuner(tuner, timer, mux) {
    tuners[tuner].alloc = timer.stop_real;
    tuners[tuner].mux = mux;
  }

  async function get_services() {
    const response = await fetch("/api/service/list?list=priority,dvb_servicetype");
    const services = await response.json();
    let ret = {};
    services.entries.forEach(function(r) {
      if (r.text.includes('---')) return;
      ret[r.uuid] = { "name": r.text, "priority": r.params[0].value, "type": r.params[1].value };
    });
    return ret;
  }

  async function get_networks() {
    const response = await fetch("/api/mpegts/network/grid");
    const networks = await response.json();
    let ret = {};
    networks.entries.forEach(function(r) {
      ret[r.networkname] = r;
    });
    return ret;
  }

  async function get_profile() {
    const rec_prof = await get_raw(cookies.UUID);
    const stream_prof = await get_raw(rec_prof[0].profile);
    return stream_prof[0];
  }

  async function get_raw(uuid) {
    const response = await fetch(`/api/raw/export?uuid=${uuid}`);
    const raw = await response.json();
    return raw;
  }

  async function get_tuners() {
    const response = await fetch("/api/hardware/tree?uuid=root");
    const rootlist = await response.json();
    let ret = {};
    await Promise.all(rootlist.map(async(l) => {
      let r2 = await fetch(`/api/hardware/tree?uuid=${l.uuid}`);
      let dev = await r2.json();
      for (const d of dev) {
        for (const t of d.params) {
          if ((t.id == "enabled") && !t.value) break;
          if (t.id == "priority") {
            let r3 = await fetch(`/api/mpegts/input/network_list?uuid=${d.uuid}`);
            let tuner = await r3.json();
            ret[d.text] = { "network": tuner.entries[0].val, "priority": t.value, "alloc": 0, "mux": "" };
            break;
	  }
        }
      }
    }));
    return ret;
  }

  async function main() {
    var images = ['images/tick_green.png','images/tick_yellow.png','images/tick_red.png','images/rec.png', 'images/spacer.gif', 'images/tick_gray.png'];
    var autorecs, status, running, run_time = 0;
    [ timers, autorecs ] = await Promise.all([get_timers(), get_autorecs()]);
    if (cookies.CLASHDET != "0") {
      [ channels, services, networks, tuners, profile ] = await Promise.all([get_channels(), get_services(), get_networks(), get_tuners(), get_profile()]);
    }
    var now = new Date() / 1000;
    var table = document.getElementById("list");
    for (const t of timers) {
      debug = '';
      let start = strftime("%H:%M", t.start);
      let d = strftime("%a %d/%n", t.start);
      if (t.uri && t.uri.includes("#")) {
        let s = await get_ms_stop(t);
	var stop = strftime("%H:%M", s);
      }
      else {
	var stop = strftime("%H:%M", t.stop);
      }
      if (!t.enabled) {
        status = 4;
      }
      else {
        if(t.start_real < now) {
          running = true;
          status = 3;
          run_time = Math.max(run_time, t.stop_real);
        }
        else {
          running = false;
          if (run_time > t.start_real) {      // timer overlaps with one currently running
            status = 5;
            run_time = Math.max(run_time, t.stop_real);
          }
          else {
            if (cookies.CLASHDET != "0") status = find_tuner(t);
            else status = 5;
          }
        }
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
      row.title = t.disp_extratext + debug;
      let s = `<td class='col_info'><img src='${images[status]}'></td><td class='col_channel'>${t.channelname}</td>` +
	`<td class='col_date'>${d}<span class='thinonly'><br />${start}-${stop}</span></td>` +
	`<td class='wideonly col_start'>${start}</td><td class='wideonly col_stop'>${stop}</td>` +
	`<td class='col_name'>${t.disp_title}</td>` +
	`<td class='col_channel'><span class='wideonly'>${type}</span><span class='thinonly'>${type2}</span></td>` +
        `<td class='col_delete'><input type='checkbox' class='smaller' oninput='toggle(event,"${t.uuid}",${t.enabled})' ${en}></td>` +
        `<td class='col_delete'><a href='timers.html' onclick='delete_timer(this,"${t.uuid}",${running})'><img src='images/delete.png' title='Delete Timer'></a></td>`;
      row.innerHTML = s;
    }
  }

  var channels = {}, services = {}, timers = {}, tuners = {}, networks = {}, profile = {}, debug = '';
  const svtypes = [ 0, 1, 0, 0, 1, 1, 0, 0,	// 0x00 - 0x07
		0, 0, 0, 0, 0, 0, 0, 0,		// 0x08 - 0x0F
		0, 2, 0, 0, 0, 0, 1, 1,		// 0x10 - 0x17
		1, 2, 2, 2, 2, 2, 2, 2, 3 ];	// 0x18 - 0x20

  main();
